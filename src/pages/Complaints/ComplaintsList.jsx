import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getComplaintsByApartment, 
  changeComplaintStatus,
  assignAdmin 
} from "../../services/complaintApi"; 
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

// 백엔드 Enum 기준 상태 맵핑
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

  // 현재 로그인한 관리자 정보 (인증 로직에 따라 변경 가능)
  const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || '{"id": 1, "role": "ADMIN"}');
  const currentAdminId = adminInfo.id;

  // 민원 목록 로드
  const loadComplaints = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await getComplaintsByApartment();
      const data = Array.isArray(res) ? res : (res?.data || []); 
      setComplaints(data);
    } catch (err) {
      setError(err?.message || "민원 목록을 불러오지 못했습니다.");
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadComplaints();
  }, []);

  // 통계 집계 로직
  const stats = useMemo(() => {
    const byStatus = { RECEIVED: 0, ASSIGNED: 0, IN_PROGRESS: 0, COMPLETED: 0 };
    let totalProcessMs = 0;
    let completedCount = 0;

    complaints.forEach((c) => {
      if (byStatus[c.status] !== undefined) byStatus[c.status]++;
      if (c.status === "COMPLETED" && c.createdAt && c.updatedAt) {
        const ms = new Date(c.updatedAt) - new Date(c.createdAt);
        if (ms >= 0) {
          totalProcessMs += ms;
          completedCount++;
        }
      }
    });

    const avgHours = completedCount > 0 ? (totalProcessMs / completedCount / (1000 * 60 * 60)) : 0;
    return { total: complaints.length, byStatus, avgHours };
  }, [complaints]);

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

  /* ================= 배정 처리 핸들러 ================= */
  const handleAssign = async (complaintId, targetAdminId, isReassign = false) => {
    try {
      // API 호출: assignAdmin(민원ID, 내ID, 대상ID)
      // 백엔드 로직상 내 ID(adminId)와 대상 ID(targetAdminId)가 같으면 본인 배정임
      await assignAdmin(complaintId, currentAdminId, targetAdminId);
      alert(isReassign ? "재배정이 완료되었습니다." : "배정이 완료되었습니다.");
      loadComplaints();
      setSelected(null);
    } catch (err) {
      alert("배정 실패: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="notices-page">
      <ComplaintTabNav />

      {/* --- 상단 통계 대시보드 --- */}
      <div className="stats-dashboard">
        <div className="stat-card total">
          <div className="stat-title">전체 민원</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card received">
          <div className="stat-title">신규 접수</div>
          <div className="stat-value">{stats.byStatus.RECEIVED}</div>
        </div>
        <div className="stat-card assigned">
          <div className="stat-title">담당 배정</div>
          <div className="stat-value">{stats.byStatus.ASSIGNED}</div>
        </div>
        <div className="stat-card processing">
          <div className="stat-title">처리 중</div>
          <div className="stat-value">{stats.byStatus.IN_PROGRESS}</div>
        </div>
        <div className="stat-card completed">
          <div className="stat-title">해결 완료</div>
          <div className="stat-value">{stats.byStatus.COMPLETED}</div>
        </div>
        <div className="stat-card avg">
          <div className="stat-title">평균 처리 시간</div>
          <div className="stat-value">{stats.avgHours.toFixed(1)}h</div>
        </div>
      </div>

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
              {selected.adminName && <span>👷 담당자: {selected.adminName}</span>}
            </div>
            <hr className="notices-divider" />
            <div className="notices-modal-content" style={{ whiteSpace: "pre-wrap" }}>
              {selected.content}
            </div>
            
            <hr className="notices-divider" />
            
            {/* 상태별 조건부 액션 버튼 */}
            <div className="notices-modal-actions" style={{ gap: "10px", flexWrap: "wrap" }}>
              
              {/* 1. 접수 단계: 나에게 배정 혹은 직접 배정 */}
              {selected.status === "RECEIVED" && (
                <>
                  <button 
                    className="notices-btn" 
                    style={{ backgroundColor: "#4caf50", color: "#fff" }}
                    onClick={() => handleAssign(selected.id, currentAdminId)}
                  >
                    🙋 나에게 배정
                  </button>
                  <button 
                    className="notices-btn" 
                    onClick={() => {
                      const tid = window.prompt("배정할 관리자 ID를 입력하세요.");
                      if(tid) handleAssign(selected.id, tid);
                    }}
                  >
                    👤 직접 배정
                  </button>
                </>
              )}

              {/* 2. 배정됨/처리중 단계: 재배정 혹은 답변 등록 */}
              {(selected.status === "ASSIGNED" || selected.status === "IN_PROGRESS") && (
                <>
                  <button 
                    className="notices-btn" 
                    style={{ backgroundColor: "#ff9800", color: "#fff" }}
                    onClick={() => {
                      const tid = window.prompt("재배정할 관리자 ID를 입력하세요.");
                      if(tid) handleAssign(selected.id, tid, true);
                    }}
                  >
                    🔄 담당 재배정
                  </button>
                  <button
                    className="notices-btn primary"
                    onClick={() => navigate(`/admin/complaints/answer?id=${selected.id}`)}
                  >
                    ✏️ 답변 등록
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}