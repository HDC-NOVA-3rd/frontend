import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  getComplaintDetailForAdmin, 
  assignAdmin, 
  changeComplaintStatus 
} from "../../services/complaintApi";
import ComplaintTabNav from "./ComplaintTabNav";
import "./Complaints.css";

// 상태 옵션 정의
const STATUS_OPTIONS = [
  { value: "RECEIVED", label: "접수" },
  { value: "IN_PROGRESS", label: "처리중" },
  { value: "COMPLETED", label: "해결 완료" },
  { value: "CANCELLED", label: "취소" },
];

//민원 상태 관리 페이지
export default function ComplaintStatus() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const complaintId = searchParams.get("id");

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  // 1. 민원 상세 정보 로드
  const loadDetail = async () => {
    if (!complaintId) return;
    setLoading(true);
    try {
      const data = await getComplaintDetailForAdmin(complaintId);
      setComplaint(data);
    } catch (err) {
      alert("민원 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [complaintId]);

  // 2. 담당자 배정 처리
  const handleAssign = async (adminId) => {
    if (!adminId) return;
    setUpdating(true);
    try {
      await assignAdmin(complaintId, adminId);
      alert("담당 관리자가 배정되었습니다.");
      loadDetail(); // 새로고침
    } catch (err) {
      alert("배정 실패: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  // 3. 상태 변경 처리
  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await changeComplaintStatus(complaintId, newStatus);
      alert("민원 상태가 변경되었습니다.");
      loadDetail(); // 새로고침
    } catch (err) {
      alert("상태 변경 실패: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="notices-page">
      <ComplaintTabNav />

      <div className="notices-header">
        <div className="notices-header-icon">⚙️</div>
        <div className="notices-header-text">
          <h2 className="notices-title">민원 상태 관리</h2>
          <p className="notices-subtitle">민원의 담당자를 지정하고 진행 상태를 업데이트합니다.</p>
        </div>
      </div>

      <div className="notices-card">
        {!complaintId ? (
          <div className="notices-empty-visual">
            <p>상태를 변경할 민원을 목록에서 선택해 주세요.</p>
            <button className="notices-btn primary" onClick={() => navigate("/admin/complaints/list")}>
              목록으로 가기
            </button>
          </div>
        ) : loading ? (
          <div className="notices-status">정보를 불러오는 중...</div>
        ) : (
          <div className="status-management-container">
            {/* 상단 민원 요약 */}
            <div className="complaint-summary-box">
              <h3>{complaint?.title}</h3>
              <p>{complaint?.content}</p>
              <div className="meta-info">
                <span>작성자: {complaint?.memberName}</span>
                <span>등록일: {complaint?.createdAt}</span>
              </div>
            </div>

            <div className="management-controls">
              {/* 담당자 배정 섹션 */}
              <div className="control-group">
                <label>👤 담당 관리자 배정</label>
                <div className="input-with-btn">
                  <select 
                    className="notices-search-input"
                    defaultValue={complaint?.adminId || ""}
                    onChange={(e) => handleAssign(e.target.value)}
                    disabled={updating}
                  >
                    <option value="" disabled>관리자 선택</option>
                    <option value="1">관리자 A (기전실)</option>
                    <option value="2">관리자 B (보안실)</option>
                    <option value="3">관리자 C (관리사무소)</option>
                  </select>
                </div>
                <small>배정 시 담당자에게 알림이 전송됩니다.</small>
              </div>

              {/* 상태 변경 섹션 */}
              <div className="control-group">
                <label>📈 진행 상태 변경</label>
                <div className="status-button-group">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={`status-toggle-btn ${complaint?.status === opt.value ? 'active' : ''}`}
                      onClick={() => handleStatusChange(opt.value)}
                      disabled={updating}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="notices-modal-actions" style={{ marginTop: '40px' }}>
              <button className="notices-btn" onClick={() => navigate("/admin/complaints/list")}>
                목록으로 돌아가기
              </button>
              <button className="notices-btn primary" onClick={() => navigate(`/admin/complaints/answer?id=${complaintId}`)}>
                답변 등록하러 가기 ✏️
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}