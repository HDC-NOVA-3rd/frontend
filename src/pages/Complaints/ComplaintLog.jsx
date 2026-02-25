import { useEffect, useState } from "react";
import { getComplaintsByApartment } from "../../services/complaintApi";
import "./Complaints.css";

// 날짜와 시간을 상세하게 표시하는 함수
function formatFullDate(raw) {
  if (!raw) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(raw));
}

export default function ComplaintLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {

      const res = await getComplaintsByApartment();
      const sortedData = Array.isArray(res) 
        ? res.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) 
        : [];
      setLogs(sortedData);
    } catch (err) {
      setError("변경 내역을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, []);

  return (
    <div className="notices-page">


      <div className="notices-header">
        <div className="notices-header-icon">📊</div>
        <div className="notices-header-text">
          <h2 className="notices-title">변경 내역</h2>
          <p className="notices-subtitle">민원 처리 상태 및 시스템 변경 이력을 확인합니다.</p>
        </div>
      </div>

      <div className="notices-card">
        {loading ? (
          <div className="notices-status">로딩 중...</div>
        ) : error ? (
          <div className="notices-status error">❌ {error}</div>
        ) : (
          <div className="log-timeline">
            {logs.map((log, index) => (
              <div key={log.complaintId || index} className="log-item">
                <div className="log-marker">
                  <div className="log-dot" />
                  {index !== logs.length - 1 && <div className="log-line" />}
                </div>
                <div className="log-content">
                  <div className="log-header">
                    <span className={`status-badge status-${log.status?.toLowerCase()}`}>
                      {log.status}
                    </span>
                    <span className="log-time">{formatFullDate(log.createdAt)}</span>
                  </div>
                  <div className="log-body">
                    <p className="log-message">
                      <strong>[{log.memberName}]</strong> 님의 민원이 <strong>"{log.title}"</strong> 상태로 기록되었습니다.
                    </p>
                    <span className="log-id">민원 번호: #{log.complaintId}</span>
                  </div>
                </div>
              </div>
            ))}

            {logs.length === 0 && (
              <div className="notices-empty-visual">
                <div className="notices-empty-title">표시할 내역이 없습니다.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}