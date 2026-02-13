import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  getComplaintDetailForAdmin, 
  createComplaintAnswer, 
  changeComplaintStatus 
} from "../../services/complaintApi";
import ComplaintTabNav from "./ComplaintTabNav";
import "./Complaints.css";

export default function ComplaintAnswer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const complaintId = searchParams.get("id"); // URL에서 ?id=... 추출

  const [complaint, setComplaint] = useState(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. 민원 상세 정보 불러오기
  useEffect(() => {
    if (!complaintId) return;

    const fetchDetail = async () => {
      try {
        const data = await getComplaintDetailForAdmin(complaintId);
        setComplaint(data);
      } catch (err) {
        setError("민원 정보를 불러오는데 실패했습니다.");
      }
    };
    void fetchDetail();
  }, [complaintId]);

  // 2. 답변 등록 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!complaintId) {
      alert("대상 민원이 선택되지 않았습니다.");
      return;
    }
    if (!answer.trim()) {
      alert("답변 내용을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      // 답변 등록 API 호출
      await createComplaintAnswer(complaintId, { content: answer });
      
      // 답변 등록 후 상태를 '완료(COMPLETED)'로 변경할지 선택 (기획에 따라 조절)
      if (window.confirm("답변이 등록되었습니다. 민원 상태를 '완료'로 변경하시겠습니까?")) {
        await changeComplaintStatus(complaintId, "COMPLETED");
      }

      alert("성공적으로 처리되었습니다.");
      navigate("/admin/complaints/list"); // 목록으로 이동
    } catch (err) {
      alert(err?.message || "답변 등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notices-page">
      <ComplaintTabNav />

      <div className="notices-header">
        <div className="notices-header-icon">✏️</div>
        <div className="notices-header-text">
          <h2 className="notices-title">민원 답변 등록</h2>
          <p className="notices-subtitle">접수된 민원에 대해 공식 답변을 작성합니다.</p>
        </div>
      </div>

      <div className="notices-card">
        {complaint ? (
          <form className="complaint-answer-form" onSubmit={handleSubmit}>
            {/* 민원 원문 정보 (Read Only) */}
            <div className="complaint-info-section">
              <div className="info-row">
                <span className="info-label">민원 제목</span>
                <span className="info-value">{complaint.title}</span>
              </div>
              <div className="info-row">
                <span className="info-label">작성자</span>
                <span className="info-value">{complaint.memberName} ({complaint.unitName})</span>
              </div>
              <div className="info-content-box">
                {complaint.content}
              </div>
            </div>

            <hr className="notices-divider" />

            {/* 답변 작성 영역 */}
            <div className="answer-input-section">
              <label className="answer-label">공식 답변 작성</label>
              <textarea
                className="notices-search-input answer-textarea"
                rows="8"
                placeholder="입주민에게 전달될 답변 내용을 입력하세요..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="notices-modal-actions">
              <button 
                type="button" 
                className="notices-btn" 
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                취소
              </button>
              <button 
                type="submit" 
                className="notices-btn primary"
                disabled={loading}
              >
                {loading ? "등록 중..." : "답변 등록 완료"}
              </button>
            </div>
          </form>
        ) : (
          <div className="notices-empty-visual">
            <div className="notices-empty-icon">🔍</div>
            <div className="notices-empty-title">
              {complaintId ? "민원 정보를 불러오는 중입니다..." : "선택된 민원이 없습니다."}
            </div>
            {!complaintId && (
              <button className="notices-btn primary" onClick={() => navigate("/admin/complaints/list")}>
                목록에서 민원 선택하기
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}