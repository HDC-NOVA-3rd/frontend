import { useEffect, useState, useMemo, useCallback } from "react";
import { 
  getComplaintsByApartment, 
  changeComplaintStatus,
  assignAdmin,
  createComplaintAnswer       
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
    hour: "2-digit", minute: "2-digit", second: "2-digit",
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
  const [selected, setSelected] = useState(null);
  const [currentAdminId, setCurrentAdminId] = useState(null);
  
  // 새 상태: 탭 필터
  const [currentTab, setCurrentTab] = useState("ALL");

  // Drawer 제어: 'ANSWER'(답변) | 'LOG'(전체로그) | null
  const [drawerType, setDrawerType] = useState(null); 
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

  /** --- 인라인 처리 핸들러 --- */
  const handleAssignMe = async (e, complaintId) => {
    e.stopPropagation(); // 행 클릭(상세보기) 방지
    if (!currentAdminId) return alert("관리자 정보를 확인 중입니다.");
    try {
      await assignAdmin(complaintId, currentAdminId, currentAdminId);
      alert("담당자로 배정되었습니다.");
      loadData();
    } catch (err) { alert("배정 처리 실패"); }
  };

  // 다음 상태로 변경 핸들러
  const handleNextStatus = async (e, item) => {
    e.stopPropagation();
    const nextStatus = STATUS_MAP[item.status]?.next;
    if (!nextStatus) return;

    try {
      if (nextStatus === "ASSIGNED") {
        // 배정 단계일 때는 배정 API 호출
        await assignAdmin(item.complaintId, currentAdminId, currentAdminId);
      } else {
        await changeComplaintStatus(item.complaintId, nextStatus);
      }
      loadData();
    } catch (err) {
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  const handleOpenAnswer = (e, item) => {
    e.stopPropagation();
    setSelected(item);
    setDrawerType('ANSWER');
  };

  /** --- 답변 제출 --- */
  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!answer.trim()) return alert("답변 내용을 입력하세요.");
    try {
      await createComplaintAnswer(selected.complaintId, { resultContent: answer });
      if (window.confirm("답변이 등록되었습니다. 상태를 '완료'로 변경하시겠습니까?")) {
        await changeComplaintStatus(selected.complaintId, "COMPLETED");
      }
      setDrawerType(null);
      setAnswer("");
      setSelected(null);
      loadData();
    } catch (err) { alert("답변 등록 중 오류가 발생했습니다."); }
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

  // 탭별 건수 계산
  const counts = useMemo(() => ({
    ALL: complaints.length,
    RECEIVED: complaints.filter(c => c.status === "RECEIVED").length,
    ASSIGNED: complaints.filter(c => c.status === "ASSIGNED").length,
    IN_PROGRESS: complaints.filter(c => c.status === "IN_PROGRESS").length,
    COMPLETED: complaints.filter(c => c.status === "COMPLETED").length,
  }), [complaints]);

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

      {/* 2. 헤더 */}
      <div className="notices-header">
        <div className="notices-header-text">
          <h2 className="notices-title">민원 통합 관리</h2>
          <p className="notices-subtitle">민원 접수부터 처리 이력까지 한눈에 관리합니다.</p>
        </div>
        <button className="notices-btn log-btn" onClick={() => setDrawerType('LOG')}>📊 전체 변경 내역</button>
      </div>

      {/* 3. 리스트 카드 */}
      <div className="notices-card">
        {/* 상태 필터 탭 추가 */}
        <div className="filter-tabs">
          <button className={`tab-item ${currentTab === "ALL" ? "active" : ""}`} onClick={() => setCurrentTab("ALL")}>
            전체 <span className="tab-count">{counts.ALL}</span>
          </button>
          <div className="tab-divider" />
          {Object.entries(STATUS_MAP).map(([key, info]) => (
            <button 
              key={key} 
              className={`tab-item ${currentTab === key ? "active" : ""}`} 
              onClick={() => setCurrentTab(key)}
            >
              {info.label} <span className="tab-count">{counts[key]}</span>
            </button>
          ))}
        </div>

        <div className="notices-filter-bar">
          <input 
            className="notices-search-input" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="민원 번호 또는 제목으로 검색..." 
          />
          <button className="notices-btn" onClick={loadData}>🔄 새로고침</button>
        </div>

        <div className="notices-table-wrap">
          <table className="notices-table">
            <thead>
              <tr>
                <th style={{ width: "80px" }}>번호</th>
                <th style={{ width: "100px" }}>민원 상태</th>
                <th>민원 제목</th>
                <th style={{ width: "120px" }}>접수 일시</th>
                <th style={{ width: "200px" }}>민원 관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const statusInfo = STATUS_MAP[item.status];
                return (
                  <tr key={item.complaintId} onClick={() => setSelected(item)} className="row-hover">
                    <td>{item.complaintId}</td>
                    <td>
                      <span className={`status-badge ${statusInfo?.class}`}>
                        {statusInfo?.label}
                      </span>
                    </td>
                    <td className="text-left">{item.title}</td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>
                      {/* 인라인 관리 영역: 버튼식으로 변경 */}
                      <div className="inline-actions" onClick={(e) => e.stopPropagation()}>
                        {statusInfo?.next ? (
                          <div className="action-group">
                            <button className="notices-btn sm primary-outline" onClick={(e) => handleNextStatus(e, item)}>
                              {statusInfo.nextLabel}
                            </button>
                            {(item.status === "ASSIGNED" || item.status === "IN_PROGRESS") && (
                              <button className="notices-btn sm" onClick={(e) => handleOpenAnswer(e, item)}>
                                ✏️ 답변
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-done">처리 완료</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="empty-state">해당하는 민원 내역이 없습니다.</div>}
        </div>
      </div>

      {/* 4. 사이드 Drawer */}
      <div className={`side-drawer ${drawerType ? "open" : ""}`}>
        <div className="drawer-header">
          <h3>{drawerType === 'ANSWER' ? "✏️ 민원 답변 등록" : "📊 시스템 변경 내역"}</h3>
          <button className="drawer-close" onClick={() => { setDrawerType(null); setSelected(null); }}>✕</button>
        </div>
        <div className="drawer-body">
          {drawerType === 'ANSWER' ? (
            <div className="drawer-content">
              <div className="info-summary">
                <p><strong>민원 제목:</strong> {selected?.title}</p>
                <p className="summary-content">{selected?.content}</p>
              </div>
              <textarea 
                className="answer-textarea" 
                value={answer} 
                onChange={(e) => setAnswer(e.target.value)} 
                placeholder="공식 답변을 작성하세요..."
              />
              <button className="notices-btn primary full-width" onClick={handleAnswerSubmit}>답변 저장 및 완료</button>
            </div>
          ) : (
            <div className="log-timeline">
              {complaints.map((log, index) => (
                <div key={log.complaintId || index} className="log-item">
                  <div className="log-marker">
                    <div className="log-dot" />
                    {index !== complaints.length - 1 && <div className="log-line" />}
                  </div>
                  <div className="log-content">
                    <div className="log-header">
                      <span className={`status-badge ${STATUS_MAP[log.status]?.class}`}>{log.status}</span>
                      <span className="log-time">{formatFullDate(log.createdAt)}</span>
                    </div>
                    <div className="log-body">
                      <p className="log-message"><strong>[{log.complaintId}]</strong>번 민원이 업데이트되었습니다.</p>
                      <span className="log-id">#{log.status} #{log.type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. 상세 정보 모달 (행 클릭 시) */}
      {selected && !drawerType && (
        <div className="notices-modal-overlay" onClick={() => setSelected(null)}>
          <div className="notices-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notices-modal-header">
              <h3 className="notices-modal-title">{selected.title}</h3>
              <button className="notices-modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="notices-modal-content">
              <div className="modal-inner-info">
                <span><strong>접수 일시:</strong> {formatFullDate(selected.createdAt)}</span>
              </div>
              <div className="content-box" style={{background: '#f8fafc', padding: '15px', borderRadius: '8px', minHeight: '100px'}}>
                {selected.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}