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

/** --- 유틸리티: 날짜 포맷 --- */
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

  /** --- 데이터 로드 --- */
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

  /** --- 상세 정보 로드 --- */
  const handleShowDetail = async (complaintId) => {
    try {
      const res = await getComplaintDetailForAdmin(complaintId);
      const detail = res?.data || res;
      setSelectedDetail(detail);
      setDrawerType('DETAIL');
      // 기존 답변이 있으면 입력란에 채워줌 (여러 번 수정 가능)
      setAnswer(detail.answer?.resultContent || ""); 
    } catch (err) {
      alert("상세 정보를 가져오는 데 실패했습니다.");
    }
  };

  /** --- 인라인 상태 변경 (목록에서 클릭 시) --- */
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

  /** --- 답변 등록/수정 전용 --- */
  const handleAnswerSubmit = async () => {
    if (!answer.trim()) return alert("답변 내용을 입력하세요.");
    try {
      await createComplaintAnswer(selectedDetail.complaintId, { resultContent: answer });
      alert("답변이 성공적으로 저장되었습니다.");
      handleShowDetail(selectedDetail.complaintId); // 최신 답변 반영을 위해 상세 재조회
    } catch (err) { 
      alert("답변 등록 중 오류가 발생했습니다."); 
    }
  };

  /** --- 민원 완료 처리 전용 --- */
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

  /** --- 통계 및 필터 --- */
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
        <div className="stat-card total"><div className="stat-title">전체</div><div className="stat-value">{stats.total}</div></div>
        {Object.entries(STATUS_MAP).map(([key, info]) => (
          <div key={key} className={`stat-card ${info.class}`}>
            <div className="stat-title">{info.label}</div>
            <div className="stat-value">{stats.byStatus[key]}</div>
          </div>
        ))}
        <div className="stat-card avg"><div className="stat-title">평균소요</div><div className="stat-value">{stats.avgHours.toFixed(1)}h</div></div>
      </div>

      {/* 2. 리스트 카드 */}
      <div className="notices-card">
        <div className="filter-tabs">
          <button className={`tab-item ${currentTab === "ALL" ? "active" : ""}`} onClick={() => setCurrentTab("ALL")}>
            전체 <span className="tab-count">{complaints.length}</span>
          </button>
          <div className="tab-divider" />
          {Object.entries(STATUS_MAP).map(([key, info]) => (
            <button key={key} className={`tab-item ${currentTab === key ? "active" : ""}`} onClick={() => setCurrentTab(key)}>
              {info.label} <span className="tab-count">{stats.byStatus[key]}</span>
            </button>
          ))}
        </div>

        <div className="notices-filter-bar">
          <input className="notices-search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="민원 번호 또는 제목으로 검색..." />
          <button className="notices-btn" onClick={loadData}>🔄 새로고침</button>
          <button className="notices-btn log-btn" onClick={() => setDrawerType('LOG')}>📊 전체 변경 내역</button>
        </div>

        <div className="notices-table-wrap">
          <table className="notices-table">
            <thead>
              <tr>
                <th style={{ width: "70px" }}>번호</th>
                <th style={{ width: "90px" }}>상태</th>
                <th style={{ width: "180px" }}>민원 제목</th>
                <th>민원 내용</th>
                <th style={{ width: "110px" }}>접수 일시</th>
                <th style={{ width: "140px" }}>상태 변경</th>
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

      {/* 3. 사이드 Drawer */}
      <div className={`side-drawer ${drawerType ? "open" : ""}`} style={{ width: drawerType === 'DETAIL' ? '550px' : '400px' }}>
        <div className="drawer-header">
          <h3>{drawerType === 'DETAIL' ? "🔍 민원 상세 및 답변 관리" : "📊 최근 민원 요약"}</h3>
          <button className="drawer-close" onClick={() => { setDrawerType(null); setSelectedDetail(null); }}>✕</button>
        </div>
        
        <div className="drawer-body">
          {drawerType === 'DETAIL' && selectedDetail ? (
            <div className="detail-container">
              <section className="detail-section">
                <div className="detail-row">
                  <span className="badge-type">{selectedDetail.type}</span>
                  <span className={`status-badge ${STATUS_MAP[selectedDetail.status]?.class}`}>
                    {STATUS_MAP[selectedDetail.status]?.label}
                  </span>
                </div>
                <h2 className="detail-title">{selectedDetail.title}</h2>
                <div className="detail-meta">No. {selectedDetail.complaintId} | {formatFullDate(selectedDetail.createdAt)}</div>
                <div className="detail-content-box">{selectedDetail.content}</div>
              </section>

              <hr className="drawer-divider" />

              <section className="detail-section">
                <h4>👨‍💼 관리자 답변 처리</h4>
                {selectedDetail.answer && (
                  <div className="answer-box">
                    <div className="answer-info">최종 작성: {selectedDetail.adminName} ({formatFullDate(selectedDetail.answer.createdAt)})</div>
                    <div className="answer-text">{selectedDetail.answer.resultContent}</div>
                  </div>
                )}

                {selectedDetail.status !== 'COMPLETED' ? (
                  <div className="answer-form">
                    <textarea 
                      className="answer-textarea" 
                      value={answer} 
                      onChange={(e) => setAnswer(e.target.value)} 
                      placeholder="입주민에게 전달할 답변을 입력하세요 (수정 가능)..."
                    />
                    <div className="drawer-actions">
                      <button className="notices-btn primary-outline flex-1" onClick={handleAnswerSubmit}>
                        {selectedDetail.answer ? "답변 수정" : "답변 등록"}
                      </button>
                      <button className="notices-btn primary flex-1" onClick={handleCompleteComplaint}>
                        처리 완료 확정
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="completion-badge">✅ 처리가 완료된 민원입니다.</div>
                )}
              </section>

              <section className="detail-section">
                <h4>⭐ 입주민 리뷰</h4>
                {selectedDetail.hasReview ? (
                  <div className="review-box">입주민이 만족도 리뷰를 남겼습니다.</div>
                ) : (
                  <div className="empty-box">등록된 리뷰가 없습니다.</div>
                )}
              </section>
            </div>
          ) : (
            <div className="log-timeline">
              {complaints.slice(0, 10).map((log, index) => (
                <div key={index} className="log-item">
                  <div className="log-marker"><div className="log-dot" /></div>
                  <div className="log-content">
                    <div className="log-header">
                      <span className={`status-badge ${STATUS_MAP[log.status]?.class}`}>{log.status}</span>
                      <span className="log-time">{formatDate(log.createdAt)}</span>
                    </div>
                    <p className="log-message">{log.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}