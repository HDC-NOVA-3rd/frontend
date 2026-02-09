import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getNoticeList, deleteNotice } from "../../services/noticeApi";
import NoticeTabNav from "./NoticeTabNav";
import "./Notices.css";

function formatDate(raw) {
  if (!raw) return "-";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (isToday) {
    return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit" }).format(d);
  }
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function timeAgo(raw) {
  if (!raw) return "";
  const diff = Date.now() - new Date(raw).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return "";
}

export default function NoticesList() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const loadNotices = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await getNoticeList();
      setNotices(Array.isArray(res) ? res : []);
    } catch (err) {
      setError(err?.message || "공지사항을 불러오지 못했습니다.");
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotices();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return notices;
    const q = search.toLowerCase();
    return notices.filter(
      (n) =>
        (n.title ?? "").toLowerCase().includes(q) ||
        (n.authorName ?? "").toLowerCase().includes(q) ||
        (n.content ?? "").toLowerCase().includes(q),
    );
  }, [notices, search]);

  return (
    <div className="notices-page">
      <NoticeTabNav />

      <div className="notices-header">
        <div className="notices-header-icon">📢</div>
        <div className="notices-header-text">
          <h2 className="notices-title">공지사항</h2>
          <p className="notices-subtitle">아파트 공지사항 게시판입니다.</p>
        </div>
      </div>

      <div className="notices-card">
        {/* 상단 바 */}
        <div className="notices-filter-bar">
          <input
            className="notices-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제목, 작성자, 내용 검색..."
            disabled={loading}
          />
          <button className="notices-btn" type="button" onClick={loadNotices} disabled={loading}>
            {loading ? (
              <>
                <span className="btn-spinner" /> 로딩
              </>
            ) : (
              <>🔄 새로고침</>
            )}
          </button>
          <button
            className="notices-btn primary"
            type="button"
            onClick={() => navigate("/admin/notices/create")}
          >
            ✏️ 공지 등록
          </button>
          <div className="notices-meta">
            총 <strong>{filtered.length}</strong>건
          </div>
        </div>

        {error && (
          <div className="notices-status error">
            <span className="notices-status-icon">❌</span>
            {error}
          </div>
        )}

        {/* 로딩 스켈레톤 */}
        {loading && notices.length === 0 && (
          <div className="notices-board-skeleton">
            {[...Array(6)].map((_, i) => (
              <div className="notices-board-skeleton-row" key={i}>
                <div className="notices-skeleton-cell" style={{ width: 48 }} />
                <div className="notices-skeleton-cell" style={{ flex: 1 }} />
                <div className="notices-skeleton-cell" style={{ width: 80 }} />
                <div className="notices-skeleton-cell" style={{ width: 100 }} />
              </div>
            ))}
          </div>
        )}

        {/* 게시판 테이블 */}
        {(!loading || notices.length > 0) && (
          <div className="notices-table-wrap">
            <table className="notices-table notices-board-table">
              <thead>
                <tr>
                  <th style={{ width: 64 }}>번호</th>
                  <th>제목</th>
                  <th style={{ width: 100 }}>작성자</th>
                  <th style={{ width: 120 }}>등록일</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((notice, idx) => {
                  const ago = timeAgo(notice.createdAt);
                  const isNew =
                    notice.createdAt &&
                    Date.now() - new Date(notice.createdAt).getTime() < 86400000;
                  return (
                    <tr
                      key={notice.noticeId}
                      className="notices-board-row"
                      onClick={() => setSelected(notice)}
                    >
                      <td className="notices-board-num">{filtered.length - idx}</td>
                      <td className="notices-board-title-cell">
                        <span className="notices-board-title-text">{notice.title}</span>
                        {isNew && <span className="notices-new-badge">N</span>}
                      </td>
                      <td className="notices-board-author">{notice.authorName ?? "-"}</td>
                      <td className="notices-board-date" title={notice.createdAt}>
                        {formatDate(notice.createdAt)}
                        {ago && <span className="notices-board-ago">{ago}</span>}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4}>
                      <div className="notices-empty-visual">
                        <div className="notices-empty-icon">📋</div>
                        <div className="notices-empty-title">
                          {search ? "검색 결과가 없습니다" : "등록된 공지가 없습니다"}
                        </div>
                        <div className="notices-empty-desc">
                          {search
                            ? "다른 검색어를 입력해 보세요."
                            : "새 공지를 등록하면 이곳에 표시됩니다."}
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

      {/* 공지 상세 모달 */}
      {selected && (
        <div className="notices-modal-overlay" onClick={() => setSelected(null)}>
          <div className="notices-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notices-modal-header">
              <h3 className="notices-modal-title">{selected.title}</h3>
              <button className="notices-modal-close" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>
            <div className="notices-modal-meta">
              <span>✍️ {selected.authorName ?? "관리자"}</span>
              <span>📅 {formatDate(selected.createdAt)}</span>
            </div>
            <hr className="notices-divider" />
            <div className="notices-modal-content">{selected.content}</div>
            <div className="notices-modal-actions">
              <button
                className="notices-btn primary"
                onClick={() => navigate(`/admin/notices/${selected.noticeId}/edit`)}
              >
                ✏️ 수정
              </button>
              <button
                className="notices-btn danger"
                onClick={async () => {
                  if (!window.confirm("정말 이 공지를 삭제하시겠습니까?")) return;
                  try {
                    await deleteNotice(selected.noticeId);
                    setSelected(null);
                    void loadNotices();
                  } catch (err) {
                    setError(err?.message || "삭제에 실패했습니다.");
                  }
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
