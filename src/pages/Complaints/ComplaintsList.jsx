import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getComplaintsByApartment, deleteComplaint } from "../../services/complaintApi"; // API 임포트
import ComplaintTabNav from "./ComplaintTabNav";
import "./Complaints.css";

// 날짜 포맷팅 함수
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

// 상태별 배지 컬러 설정
const STATUS_MAP = {
  RECEIVED: { label: "접수", class: "status-received" },
  PROCESSING: { label: "처리중", class: "status-processing" },
  COMPLETED: { label: "완료", class: "status-completed" },
  CANCELLED: { label: "취소", class: "status-cancelled" },
};

export default function ComplaintsList() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  // 민원 목록 로드
  // ComplaintsList.jsx 수정
  const loadComplaints = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await getComplaintsByApartment();
      // axios를 사용한다면 실제 데이터는 res.data에 담겨서 옵니다.
      // 만약 api.js에서 이미 res.data를 반환하게 처리했다면 res가 배열일 것입니다.
      const data = Array.isArray(res) ? res : (res?.data || []); 
      
      console.log("받은 데이터:", data); // 데이터가 들어오는지 콘솔로 꼭 확인하세요!
      setComplaints(data);
    } catch (err) {
      setError(err?.message || "민원 목록을 불러오지 못했습니다.");
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };
  // const loadComplaints = async () => {
  //   setError(null);
  //   setLoading(true);
  //   try {
  //     // active 파라미터는 필요에 따라 true/false 전달 (전체 조시는 undefined)
  //     const res = await getComplaintsByApartment(); 
  //     setComplaints(Array.isArray(res) ? res : []);
  //   } catch (err) {
  //     setError(err?.message || "민원 목록을 불러오지 못했습니다.");
  //     setComplaints([]);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  useEffect(() => {
    void loadComplaints();
  }, []);

  // 검색 필터링
  const filtered = useMemo(() => {
    if (!search.trim()) return complaints;
    const q = search.toLowerCase();
    return complaints.filter(
      (c) =>
        (c.title ?? "").toLowerCase().includes(q) ||
        (c.memberName ?? "").toLowerCase().includes(q) ||
        (c.content ?? "").toLowerCase().includes(q)
    );
  }, [complaints, search]);

  return (
    <div className="notices-page">
      <ComplaintTabNav />

      <div className="notices-header">
        <div className="notices-header-icon">🛠️</div>
        <div className="notices-header-text">
          <h2 className="notices-title">민원 관리</h2>
          <p className="notices-subtitle">아파트 입주민들의 민원 현황을 관리합니다.</p>
        </div>
      </div>

      <div className="notices-card">
        <div className="notices-filter-bar">
          <input
            className="notices-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제목, 민원인, 내용 검색..."
            disabled={loading}
          />
          <button className="notices-btn" type="button" onClick={loadComplaints} disabled={loading}>
            {loading ? <><span className="btn-spinner" /> 로딩</> : <>🔄 새로고침</>}
          </button>
          <div className="notices-meta">
            총 <strong>{filtered.length}</strong>건
          </div>
        </div>

        {error && <div className="notices-status error">❌ {error}</div>}

        <div className="notices-table-wrap">
          <table className="notices-table notices-board-table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>상태</th>
                <th>민원 제목</th>
                <th style={{ width: 100 }}>민원인</th>
                <th style={{ width: 120 }}>등록일</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                //<tr key={item.complaintId} className="notices-board-row" onClick={() => setSelected(item)}>
                <tr key={item.id} className="notices-board-row" onClick={() => setSelected(item)}>
                  <td>
                    <span className={`status-badge ${(STATUS_MAP[item.status] || {}).class}`}>
                      {(STATUS_MAP[item.status] || { label: item.status }).label}
                    </span>
                  </td>
                  <td className="notices-board-title-cell">
                    <span className="notices-board-title-text">{item.title}</span>
                  </td>
                  <td className="notices-board-author">{item.memberName ?? "입주민"}</td>
                  <td className="notices-board-date">{formatDate(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filtered.length === 0 && !loading && (
            <div className="notices-empty-visual">
              <div className="notices-empty-title">민원 내역이 없습니다.</div>
            </div>
          )}
        </div>
      </div>

      {/* 민원 상세 모달 */}
      {selected && (
        <div className="notices-modal-overlay" onClick={() => setSelected(null)}>
          <div className="notices-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notices-modal-header">
              <h3 className="notices-modal-title">{selected.title}</h3>
              <button className="notices-modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="notices-modal-meta">
              <span>👤 민원인: {selected.memberName}</span>
              <span>📅 {formatDate(selected.createdAt)}</span>
              <span>📍 상태: {(STATUS_MAP[selected.status] || {}).label}</span>
            </div>
            <hr className="notices-divider" />
            <div className="notices-modal-content" style={{ whiteSpace: "pre-wrap" }}>
              {selected.content}
            </div>
            <div className="notices-modal-actions">
              <button
                className="notices-btn primary"
                onClick={() => navigate(`/admin/complaints/answer?id=${selected.id}`)}
              >
                ✏️ 답변 등록
              </button>
              <button
                className="notices-btn danger"
                onClick={async () => {
                  if (!window.confirm("정말 이 민원을 삭제하시겠습니까?")) return;
                  try {
                    await deleteComplaint(selected.id);
                    setSelected(null);
                    loadComplaints();
                  } catch (err) { alert("삭제 실패: " + err.message); }
                }}
              >
                🗑️ 삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}