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
  RECEIVED: { label: "접수", class: "status-received" },
  ASSIGNED: { label: "배정", class: "status-assigned" },
  IN_PROGRESS: { label: "처리중", class: "status-processing" },
  COMPLETED: { label: "완료", class: "status-completed" },
};

export default function ComplaintsList() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [currentAdminId, setCurrentAdminId] = useState(null);

  // Drawer 제어: 'ANSWER'(답변) | 'LOG'(전체로그) | null
  const [drawerType, setDrawerType] = useState(null); 
  const [answer, setAnswer] = useState("");

  /** --- 데이터 로드 (API 통합) --- */
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
      // 최신 접수순으로 정렬
      setComplaints(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      setError("데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /** --- 통계 계산 --- */
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
    return { 
      total: complaints.length, 
      byStatus, 
      avgHours: doneCnt > 0 ? (totalMs / doneCnt / 3600000) : 0 
    };
  }, [complaints]);

  /** --- 검색 필터 --- */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return complaints.filter(c => 
      (c.title || "").toLowerCase().includes(q) || 
      (c.memberName || "").toLowerCase().includes(q)
    );
  }, [complaints, search]);

  /** --- 민원 처리 핸들러 --- */
  const handleAssignMe = async (complaintId) => {
    if (!currentAdminId) return alert("관리자 정보를 확인 중입니다.");
    try {
      await assignAdmin(complaintId, currentAdminId, currentAdminId);
      alert("담당자로 배정되었습니다.");
      loadData();
      setSelected(null);
    } catch (err) { alert("배정 처리 실패"); }
  };

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
      loadData();
    } catch (err) { alert("답변 등록 중 오류가 발생했습니다."); }
  };

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

      {/* 2. 헤더 및 컨트롤 */}
      <div className="notices-header">
        <div className="notices-header-text">
          <h2 className="notices-title">민원 통합 관리</h2>
          <p className="notices-subtitle">민원 접수부터 처리 이력까지 한눈에 관리합니다.</p>
        </div>
        <button className="notices-btn log-btn" onClick={() => setDrawerType('LOG')}>
          📊 전체 변경 내역 확인
        </button>
      </div>

      {/* 3. 리스트 테이블 */}
      <div className="notices-card">
        <div className="notices-filter-bar">
          <input 
            className="notices-search-input" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="민원인 성함 또는 제목으로 검색..." 
          />
          <button className="notices-btn" onClick={loadData}>🔄 새로고침</button>
        </div>

        <div className="notices-table-wrap">
          <table className="notices-table">
            <thead>
              <tr><th>상태</th><th>제목</th><th>민원인</th><th>접수 일시</th></tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.complaintId} onClick={() => setSelected(item)} className="row-hover">
                  <td>
                    <span className={`status-badge ${STATUS_MAP[item.status]?.class}`}>
                      {STATUS_MAP[item.status]?.label || item.status}
                    </span>
                  </td>
                  <td className="text-left">{item.title}</td>
                  <td>{item.memberName}</td>
                  <td>{formatDate(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="empty-state">해당하는 민원 내역이 없습니다.</div>}
        </div>
      </div>

      {/* 4. 통합 사이드 Drawer (답변 작성 & 변경 로그) */}
      <div className={`side-drawer ${drawerType ? "open" : ""}`}>
        <div className="drawer-header">
          <h3>{drawerType === 'ANSWER' ? "✏️ 민원 답변 등록" : "📊 시스템 변경 내역"}</h3>
          <button className="drawer-close" onClick={() => setDrawerType(null)}>✕</button>
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
                placeholder="공식 답변을 작성하세요. 작성 시 민원인에게 알림이 전송됩니다..."
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
                      <p className="log-message">
                        <strong>[{log.memberName}]</strong> 님의 민원이 <strong>"{log.title}"</strong> 상태로 기록되었습니다.
                      </p>
                      <span className="log-id">ID: #{log.complaintId}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. 상세 정보 모달 */}
      {selected && !drawerType && (
        <div className="notices-modal-overlay" onClick={() => setSelected(null)}>
          <div className="notices-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notices-modal-header">
              <h3 className="notices-modal-title">{selected.title}</h3>
              <button className="notices-modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="notices-modal-content">
              <div className="modal-inner-info">
                <span><strong>민원인:</strong> {selected.memberName}</span>
                <span><strong>접수:</strong> {formatFullDate(selected.createdAt)}</span>
              </div>
              <div className="content-box">{selected.content}</div>
            </div>
            <div className="notices-modal-actions">
              {selected.status === "RECEIVED" && (
                <button className="notices-btn" onClick={() => handleAssignMe(selected.complaintId)}>🙋 본인 배정</button>
              )}
              <select 
                className="status-select" 
                value={selected.status} 
                onChange={(e) => {
                  changeComplaintStatus(selected.complaintId, e.target.value).then(() => {
                    loadData();
                    setSelected(null);
                  });
                }}
              >
                {Object.keys(STATUS_MAP).map(k => <option key={k} value={k}>{STATUS_MAP[k].label}</option>)}
              </select>
              {(selected.status === "ASSIGNED" || selected.status === "IN_PROGRESS") && (
                <button className="notices-btn primary" onClick={() => setDrawerType('ANSWER')}>✏️ 답변 작성하기</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}