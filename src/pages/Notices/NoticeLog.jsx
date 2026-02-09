import { useEffect, useState, useMemo } from "react";
import { getNoticeLogs } from "../../services/noticeApi";
import NoticeTabNav from "./NoticeTabNav";
import "./Notices.css";

function formatDateTime(raw) {
  if (!raw) return "-";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function NoticeLog() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (it) =>
        String(it.id).includes(q) ||
        (it.title ?? "").toLowerCase().includes(q) ||
        String(it.recipientId ?? "").includes(q),
    );
  }, [items, search]);

  const load = async () => {
    setStatus({ type: "idle", message: "" });
    setLoading(true);
    try {
      const res = await getNoticeLogs();
      setItems(Array.isArray(res) ? res : []);
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "로그를 불러오지 못했습니다." });
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const readCount = items.filter((it) => it.read === true || it.read === "true").length;
  const unreadCount = items.length - readCount;

  return (
    <div className="notices-page">
      <NoticeTabNav />

      <div className="notices-header">
        <div className="notices-header-icon">📊</div>
        <div className="notices-header-text">
          <h2 className="notices-title">발송 내역</h2>
          <p className="notices-subtitle">공지 알림 발송 기록과 수신 상태를 확인할 수 있습니다.</p>
        </div>
      </div>

      <div className="notices-card">
        {/* 필터 바 */}
        <div className="notices-filter-bar">
          <input
            className="notices-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ID, 제목, 수신자 검색..."
            disabled={loading}
          />
          <button className="notices-btn" type="button" onClick={load} disabled={loading}>
            {loading ? (
              <>
                <span className="btn-spinner" /> 로딩 중
              </>
            ) : (
              <>🔄 새로고침</>
            )}
          </button>
          <div className="notices-meta">
            총 <strong>{filteredItems.length}</strong>건
            {items.length > 0 && (
              <>
                &nbsp;·&nbsp;읽음 {readCount}&nbsp;·&nbsp;미읽음 {unreadCount}
              </>
            )}
          </div>
        </div>

        {status.type !== "idle" && (
          <div className={`notices-status ${status.type}`}>
            <span className="notices-status-icon">{status.type === "error" ? "❌" : "ℹ️"}</span>
            {status.message}
          </div>
        )}

        {/* 로딩 스켈레톤 */}
        {loading && items.length === 0 && (
          <div style={{ marginTop: 16 }}>
            {[...Array(5)].map((_, i) => (
              <div className="notices-skeleton-row" key={i}>
                <div className="notices-skeleton-cell" />
                <div className="notices-skeleton-cell" />
                <div className="notices-skeleton-cell" />
                <div className="notices-skeleton-cell" />
                <div className="notices-skeleton-cell" />
              </div>
            ))}
          </div>
        )}

        {/* 테이블 */}
        {(!loading || items.length > 0) && (
          <div className="notices-table-wrap">
            <table className="notices-table">
              <thead>
                <tr>
                  <th style={{ width: 64 }}>ID</th>
                  <th style={{ width: 160 }}>발송 일시</th>
                  <th style={{ width: 100 }}>수신자 ID</th>
                  <th>제목</th>
                  <th style={{ width: 90 }}>상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((it) => {
                  const isRead = it.read === true || it.read === "true";
                  return (
                    <tr key={it.id}>
                      <td className="mono">{it.id}</td>
                      <td>{formatDateTime(it.sentAt)}</td>
                      <td className="mono">{it.recipientId ?? "-"}</td>
                      <td className="truncate" title={it.title}>
                        {it.title}
                      </td>
                      <td>
                        <span className={`notices-badge ${isRead ? "read" : "unread"}`}>
                          {isRead ? "✓ 읽음" : "— 미읽음"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredItems.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5}>
                      <div className="notices-empty-visual">
                        <div className="notices-empty-icon">📭</div>
                        <div className="notices-empty-title">
                          {search ? "검색 결과가 없습니다" : "발송 기록이 없습니다"}
                        </div>
                        <div className="notices-empty-desc">
                          {search
                            ? "다른 검색어를 입력해 보세요."
                            : "공지를 등록하고 알림을 발송하면 이곳에 기록됩니다."}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
