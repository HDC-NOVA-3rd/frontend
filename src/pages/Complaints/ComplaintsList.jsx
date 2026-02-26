import { useEffect, useState, useMemo, useCallback } from "react";
import { 
  getComplaintsByApartment, 
  changeComplaintStatus,
  assignAdmin,
  createComplaintAnswer,
  getComplaintDetailForAdmin 
} from "../../services/complaintApi"; 
import { getMyAdminInfo } from '../../services/adminApi'; 
import "./ComplaintsList.css";

/** --- Lucide 스타일 인라인 SVG 아이콘 --- */
const Icons = {
  Refresh: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
  ),
  Chart: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  ),
  User: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  ),
  CheckCircle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  ),
  Star: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  )
};

const formatDate = (raw) => {
  if (!raw) return "-";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  const now = new Date();
  const isToday = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  return isToday 
    ? new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit" }).format(d)
    : new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
};

const formatFullDate = (raw) => {
  if (!raw) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(raw));
};

const STATUS_MAP = {
  RECEIVED: { label: "접수", class: "status-received", next: "ASSIGNED", nextLabel: "담당 배정" },
  ASSIGNED: { label: "배정", class: "status-assigned", next: "IN_PROGRESS", nextLabel: "처리 시작" },
  IN_PROGRESS: { label: "처리중", class: "status-processing", next: "COMPLETED", nextLabel: "처리 완료" },
  COMPLETED: { label: "완료", class: "status-completed", next: null, nextLabel: null },
};

export default function ComplaintsList() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [currentAdminId, setCurrentAdminId] = useState(null);
  const [currentTab, setCurrentTab] = useState("ALL");
  const [drawerType, setDrawerType] = useState(null); 
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [answer, setAnswer] = useState("");

  const loadData = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [adminRes, complaintRes] = await Promise.all([
        getMyAdminInfo(),
        getComplaintsByApartment()
      ]);
      const myId = adminRes?.id || adminRes?.data?.id;
      setCurrentAdminId(myId);
      const data = Array.isArray(complaintRes) ? complaintRes : (complaintRes?.data || []);
      setComplaints(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      setError("데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleShowDetail = async (complaintId) => {
    try {
      const res = await getComplaintDetailForAdmin(complaintId);
      const detail = res?.data || res;
      setSelectedDetail(detail);
      setDrawerType('DETAIL');
      setAnswer(detail.answer?.resultContent || ""); 
    } catch (err) {
      alert("상세 정보를 가져오는 데 실패했습니다.");
    }
  };

  const handleNextStatus = async (e, item) => {
    e.stopPropagation();
    const nextStatus = STATUS_MAP[item.status]?.next;
    if (!nextStatus) return;
    try {
      if (nextStatus === "ASSIGNED") {
        await assignAdmin(item.complaintId, currentAdminId);
      } else {
        await changeComplaintStatus(item.complaintId, nextStatus);
      }
      loadData();
      if (selectedDetail?.complaintId === item.complaintId) handleShowDetail(item.complaintId);
    } catch (err) {
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  const handleAnswerSubmit = async () => {
    if (!answer.trim()) return alert("답변 내용을 입력하세요.");
    try {
      await createComplaintAnswer(selectedDetail.complaintId, { resultContent: answer });
      alert("답변이 성공적으로 저장되었습니다.");
      handleShowDetail(selectedDetail.complaintId);
    } catch (err) { 
      alert("답변 등록 중 오류가 발생했습니다."); 
    }
  };

  const handleCompleteComplaint = async () => {
    if (!window.confirm("민원 처리를 확정 완료하시겠습니까? 완료 후에는 상태 변경이 어렵습니다.")) return;
    try {
      await changeComplaintStatus(selectedDetail.complaintId, "COMPLETED");
      alert("완료 처리되었습니다.");
      loadData();
      handleShowDetail(selectedDetail.complaintId);
    } catch (err) {
      alert("완료 처리 중 오류가 발생했습니다.");
    }
  };

  const stats = useMemo(() => {
    const byStatus = { RECEIVED: 0, ASSIGNED: 0, IN_PROGRESS: 0, COMPLETED: 0 };
    let totalMs = 0; let doneCnt = 0;
    complaints.forEach(c => {
      if (byStatus[c.status] !== undefined) byStatus[c.status]++;
      if (c.status === "COMPLETED" && c.updatedAt) {
        const diff = new Date(c.updatedAt) - new Date(c.createdAt);
        if (diff > 0) { totalMs += diff; doneCnt++; }
      }
    });
    return { total: complaints.length, byStatus, avgHours: doneCnt > 0 ? (totalMs / doneCnt / 3600000) : 0 };
  }, [complaints]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return complaints.filter(c => {
      const matchesTab = currentTab === "ALL" || c.status === currentTab;
      const matchesSearch = (c.title || "").toLowerCase().includes(q) || String(c.complaintId).includes(q);
      return matchesTab && matchesSearch;
    });
  }, [complaints, search, currentTab]);

  return (
    <div className="notices-page">
      {/* 1. 통계 대시보드 */}
      <div className="stats-dashboard">
        <div className="stat-card total"><div className="stat-title">전체 민원</div><div className="stat-value">{stats.total}</div></div>
        {Object.entries(STATUS_MAP).map(([key, info]) => (
          <div key={key} className={`stat-card ${info.class}`}>
            <div className="stat-title">{info.label}</div>
            <div className="stat-value">{stats.byStatus[key]}</div>
          </div>
        ))}
        <div className="stat-card avg"><div className="stat-title">평균 처리</div><div className="stat-value">{stats.avgHours.toFixed(1)}h</div></div>
      </div>

      {/* 2. 메인 리스트 카드 */}
      <div className="notices-card">
        {/* 상단 탭 */}
        <div className="filter-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #f3f4f6' }}>
          <button className={`tab-item ${currentTab === "ALL" ? "active" : ""}`} onClick={() => setCurrentTab("ALL")}>
            전체 <span className="tab-count">{complaints.length}</span>
          </button>
          {Object.entries(STATUS_MAP).map(([key, info]) => (
            <button key={key} className={`tab-item ${currentTab === key ? "active" : ""}`} onClick={() => setCurrentTab(key)}>
              {info.label} <span className="tab-count">{stats.byStatus[key]}</span>
            </button>
          ))}
        </div>

        {/* 필터 바: 검색창(좌) + 버튼들(우) 배치를 위해 클래스 유지 */}
        <div className="notices-filter-bar">
          <div className="search-input-wrapper">
            <Icons.Search />
            <input 
              className="notices-search-input" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="민원 번호 또는 제목 검색" 
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="notices-btn" onClick={loadData}>
              <Icons.Refresh /> 새로고침
            </button>
            <button className="notices-btn log-btn" onClick={() => setDrawerType('LOG')}>
              <Icons.Chart /> 통계 요약
            </button>
          </div>
        </div>

        {/* 테이블 영역 */}
        <div className="notices-table-wrap">
          <table className="notices-table">
            <thead>
              <tr>
                <th style={{ width: "70px" }}>번호</th>
                <th style={{ width: "90px" }}>상태</th>
                <th style={{ width: "200px" }}>민원 제목</th>
                <th>민원 내용</th>
                <th style={{ width: "120px" }}>접수 일시</th>
                <th style={{ width: "130px" }}>상태 관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const statusInfo = STATUS_MAP[item.status];
                return (
                  <tr key={item.complaintId} onClick={() => handleShowDetail(item.complaintId)} className="row-hover">
                    <td>{item.complaintId}</td>
                    <td><span className={`status-badge ${statusInfo?.class}`}>{statusInfo?.label}</span></td>
                    <td className="text-left"><strong>{item.title}</strong></td>
                    <td className="text-left text-ellipsis">{item.content}</td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>
                      <div className="inline-actions" onClick={(e) => e.stopPropagation()}>
                        {statusInfo?.next ? (
                          <button className="notices-btn sm primary-outline" onClick={(e) => handleNextStatus(e, item)}>
                            {statusInfo.nextLabel}
                          </button>
                        ) : <span className="text-done">처리 완료</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. 사이드 Drawer (상세/로그) */}
      <div className={`side-drawer ${drawerType ? "open" : ""}`} style={{ width: drawerType === 'DETAIL' ? '520px' : '450px' }}>
        <div className="drawer-header">
          <h3>
            {drawerType === 'DETAIL' ? <Icons.Search /> : <Icons.Chart />}
            <span style={{ marginLeft: '10px' }}>
              {drawerType === 'DETAIL' ? "민원 상세 관리" : "최근 처리 내역"}
            </span>
          </h3>
          <button className="drawer-close" onClick={() => { setDrawerType(null); setSelectedDetail(null); }}>✕</button>
        </div>
        
        <div className="drawer-body">
          {drawerType === 'DETAIL' && selectedDetail ? (
            <div className="detail-container">
              <section className="detail-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className="badge-type" style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{selectedDetail.type}</span>
                  <span className={`status-badge ${STATUS_MAP[selectedDetail.status]?.class}`}>
                    {STATUS_MAP[selectedDetail.status]?.label}
                  </span>
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 8px 0' }}>{selectedDetail.title}</h2>
                <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>
                  ID: {selectedDetail.complaintId} | {formatFullDate(selectedDetail.createdAt)}
                </div>
                <div className="info-summary" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {selectedDetail.content}
                </div>
              </section>

              <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #eee' }} />

              <section className="detail-section">
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <Icons.User /> 관리자 답변
                </h4>
                {selectedDetail.answer && (
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                      {selectedDetail.adminName} · {formatFullDate(selectedDetail.answer.createdAt)}
                    </div>
                    <div style={{ fontSize: '14px', color: '#1e293b' }}>{selectedDetail.answer.resultContent}</div>
                  </div>
                )}

                {selectedDetail.status !== 'COMPLETED' ? (
                  <div className="answer-form">
                    <textarea 
                      className="answer-textarea" 
                      rows="4"
                      value={answer} 
                      onChange={(e) => setAnswer(e.target.value)} 
                      placeholder="입주민에게 전달할 답변을 입력하세요..."
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '12px' }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="notices-btn primary-outline" style={{ flex: 1 }} onClick={handleAnswerSubmit}>
                        {selectedDetail.answer ? "답변 수정" : "답변 등록"}
                      </button>
                      <button className="notices-btn primary" style={{ flex: 1 }} onClick={handleCompleteComplaint}>
                        최종 완료 확정
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: '600', padding: '12px', background: '#ecfdf5', borderRadius: '8px' }}>
                    <Icons.CheckCircle /> 처리가 완료된 민원입니다.
                  </div>
                )}
              </section>
            </div>
          ) : (
            <div className="log-timeline">
              {complaints.slice(0, 10).map((log, index) => (
                <div key={index} className="log-item" style={{ marginBottom: '20px', borderBottom: '1px dashed #eee', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className={`status-badge ${STATUS_MAP[log.status]?.class}`}>{STATUS_MAP[log.status]?.label}</span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{formatDate(log.createdAt)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>{log.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}