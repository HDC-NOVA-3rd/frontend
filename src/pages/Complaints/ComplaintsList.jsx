import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getComplaintsByApartment, 
  changeComplaintStatus,
  assignAdmin,
  getComplaintDetailForAdmin, 
  createComplaintAnswer       
} from "../../services/complaintApi"; 
import { getMyAdminInfo } from '../../services/adminApi'; 
import "./ComplaintsList.css";

// 날짜 포맷팅 함수 (기존 로직 유지)
function formatDate(raw) {
  if (!raw) return "-";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const now = new Date();
  const isToday = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  return isToday 
    ? new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit" }).format(d)
    : new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

const STATUS_MAP = {
  RECEIVED: { label: "접수", class: "status-received" },
  ASSIGNED: { label: "배정", class: "status-assigned" },
  IN_PROGRESS: { label: "처리중", class: "status-processing" },
  COMPLETED: { label: "완료", class: "status-completed" },
};

export default function ComplaintsList() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [currentAdminId, setCurrentAdminId] = useState(null);

  // --- Drawer 관련 상태 ---
  const [drawerType, setDrawerType] = useState(null); // 'ANSWER' | 'LOG' | null
  const [answer, setAnswer] = useState(""); // 답변 입력값

  // 데이터 통합 로드 (기존 로직 유지)
  const loadData = async () => {
    setError(null);
    setLoading(true);
    try {
      const adminRes = await getMyAdminInfo();
      const myId = adminRes?.id || adminRes?.data?.id;
      setCurrentAdminId(myId);

      const res = await getComplaintsByApartment();
      const data = Array.isArray(res) ? res : (res?.data || []); 
      setComplaints(data);
    } catch (err) {
      setError(err?.message || "데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // 통계 계산 (기존 useMemo 유지)
  const stats = useMemo(() => {
    const byStatus = { RECEIVED: 0, ASSIGNED: 0, IN_PROGRESS: 0, COMPLETED: 0 };
    let totalProcessMs = 0;
    let completedCount = 0;
    complaints.forEach((c) => {
      if (byStatus[c.status] !== undefined) byStatus[c.status]++;
      if (c.status === "COMPLETED" && c.createdAt && c.updatedAt) {
        const ms = new Date(c.updatedAt) - new Date(c.createdAt);
        if (ms >= 0) { totalProcessMs += ms; completedCount++; }
      }
    });
    const avgHours = completedCount > 0 ? (totalProcessMs / completedCount / (1000 * 60 * 60)) : 0;
    return { total: complaints.length, byStatus, avgHours };
  }, [complaints]);

  // 검색 필터 (기존 useMemo 유지)
  const filtered = useMemo(() => {
    if (!search.trim()) return complaints;
    const q = search.toLowerCase();
    return complaints.filter((c) =>
        (c.title ?? "").toLowerCase().includes(q) ||
        (c.memberName ?? "").toLowerCase().includes(q) ||
        (c.content ?? "").toLowerCase().includes(q)
    );
  }, [complaints, search]);

  /* ================= 배정 처리 핸들러 ================= */
  const handleAssign = async (complaintId, targetAdminId, isReassign = false) => {
    if (!currentAdminId) { alert("관리자 정보를 불러오는 중입니다."); return; }
    try {
      await assignAdmin(complaintId, currentAdminId, targetAdminId);
      alert(isReassign ? "재배정이 완료되었습니다." : "배정이 완료되었습니다.");
      loadData();
      setSelected(null);
    } catch (err) { alert("배정 실패: " + (err.response?.data?.message || err.message)); }
  };

  /* ================= 상태 직접 변경 핸들러 ================= */
  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      await changeComplaintStatus(complaintId, newStatus);
      alert("상태가 변경되었습니다.");
      loadData();
      setSelected(null);
    } catch (err) { alert("상태 변경 실패: " + (err.response?.data?.message || err.message)); }
  };

  /* ================= 답변 등록 핸들러 (Drawer 내 사용) ================= */
  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!answer.trim()) return alert("답변 내용을 입력해주세요.");
    setLoading(true);
    try {
      await createComplaintAnswer(selected.complaintId, { resultContent: answer });
      if (window.confirm("답변이 등록되었습니다. 상태를 '완료'로 변경하시겠습니까?")) {
        await changeComplaintStatus(selected.complaintId, "COMPLETED");
      }
      alert("성공적으로 처리되었습니다.");
      setDrawerType(null);
      setAnswer("");
      loadData();
    } catch (err) { alert(err?.message || "오류 발생"); } finally { setLoading(false); }
  };

  return (
    <div className="notices-page">
      {/* 상단 통계 대시보드 */}
      <div className="stats-dashboard">
        <div className="stat-card total"><div className="stat-title">전체</div><div className="stat-value">{stats.total}</div></div>
        <div className="stat-card received"><div className="stat-title">접수</div><div className="stat-value">{stats.byStatus.RECEIVED}</div></div>
        <div className="stat-card assigned"><div className="stat-title">배정</div><div className="stat-value">{stats.byStatus.ASSIGNED}</div></div>
        <div className="stat-card processing"><div className="stat-title">처리중</div><div className="stat-value">{stats.byStatus.IN_PROGRESS}</div></div>
        <div className="stat-card completed"><div className="stat-title">완료</div><div className="stat-value">{stats.byStatus.COMPLETED}</div></div>
        <div className="stat-card avg"><div className="stat-title">평균시간</div><div className="stat-value">{stats.avgHours.toFixed(1)}h</div></div>
      </div>

      <div className="notices-header">
        <div className="notices-header-text">
          <h2 className="notices-title">민원 관리</h2>
        </div>
        <button className="notices-btn" onClick={() => setDrawerType('LOG')}>📊 변경 내역</button>
      </div>

      <div className="notices-card">
        <div className="notices-filter-bar">
          <input className="notices-search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="검색..." />
          <button className="notices-btn" onClick={loadData}>🔄 새로고침</button>
        </div>

        <div className="notices-table-wrap">
          <table className="notices-table">
            <thead>
              <tr><th>상태</th><th>제목</th><th>민원인</th><th>등록일</th></tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.complaintId} onClick={() => setSelected(item)} style={{cursor: 'pointer'}}>
                  <td><span className={`status-badge ${(STATUS_MAP[item.status] || {}).class}`}>{(STATUS_MAP[item.status] || {}).label}</span></td>
                  <td>{item.title}</td>
                  <td>{item.memberName}</td>
                  <td>{formatDate(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- 통합 사이드 Drawer --- */}
      <div className={`side-drawer ${drawerType ? "open" : ""}`}>
        <div className="drawer-header">
          <h3>{drawerType === 'ANSWER' ? "✏️ 답변 등록" : "📊 전체 변경 내역"}</h3>
          <button className="drawer-close" onClick={() => setDrawerType(null)}>✕</button>
        </div>
        <div className="drawer-body">
          {drawerType === 'ANSWER' && selected && (
            <div className="complaint-answer-form">
                <div className="info-summary">
                    <p><strong>제목:</strong> {selected.title}</p>
                    <p><strong>내용:</strong> {selected.content}</p>
                </div>
                <hr />
                <textarea 
                    className="answer-textarea" 
                    rows="10" 
                    value={answer} 
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="공식 답변을 입력하세요..."
                />
                <div className="drawer-footer">
                    <button className="notices-btn primary" onClick={handleAnswerSubmit}>답변 등록 완료</button>
                </div>
            </div>
          )}
          {drawerType === 'LOG' && (
            <div className="log-timeline">
               {complaints.map((log, idx) => (
                 <div key={idx} className="log-item">
                    <div className="log-time">{formatDate(log.createdAt)}</div>
                    <div className="log-msg"><strong>{log.memberName}</strong>: {log.title} ({log.status})</div>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>

      {/* 민원 상세 모달 */}
      {selected && !drawerType && (
        <div className="notices-modal-overlay" onClick={() => setSelected(null)}>
          <div className="notices-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notices-modal-header">
              <h3 className="notices-modal-title">{selected.title}</h3>
              <button className="notices-modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="notices-modal-content">{selected.content}</div>
            <div className="modal-controls">
              <div className="notices-modal-actions">
                {selected.status === "RECEIVED" && (
                   <button className="notices-btn" onClick={() => handleAssign(selected.complaintId, currentAdminId)}>🙋 나에게 배정</button>
                )}
                <select className="notices-search-input" value={selected.status} onChange={(e) => handleStatusChange(selected.complaintId, e.target.value)}>
                   {Object.keys(STATUS_MAP).map(k => <option key={k} value={k}>{STATUS_MAP[k].label}</option>)}
                </select>
                {(selected.status === "ASSIGNED" || selected.status === "IN_PROGRESS") && (
                   <button className="notices-btn primary" onClick={() => setDrawerType('ANSWER')}>✏️ 답변 작성(Drawer)</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}