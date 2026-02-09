import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getNotice, updateNotice, getDongListByApartment } from "../../services/noticeApi";
import NoticeTabNav from "./NoticeTabNav";
import "./Notices.css";

const TITLE_MAX = 100;
const CONTENT_MAX = 2000;

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

function readApartmentIdFromToken() {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  try {
    const [, payloadPart] = token.split(".");
    if (!payloadPart) return null;
    const payload = JSON.parse(decodeBase64Url(payloadPart));
    const apartmentId = Number(payload?.apartmentId);
    return Number.isFinite(apartmentId) ? apartmentId : null;
  } catch {
    return null;
  }
}

export default function NoticeEdit() {
  const { noticeId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dongs, setDongs] = useState([]);
  const [selectedDongIds, setSelectedDongIds] = useState([]);
  const [dongLoading, setDongLoading] = useState(false);
  const [apartmentId, setApartmentId] = useState(null);

  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const targetDongIds = useMemo(() => selectedDongIds, [selectedDongIds]);

  /* ── 기존 공지 + 동 목록 로드 ── */
  useEffect(() => {
    const tokenApartmentId = readApartmentIdFromToken();
    setApartmentId(tokenApartmentId);

    const init = async () => {
      setPageLoading(true);
      try {
        // 공지 상세 로드
        const notice = await getNotice(noticeId);
        setTitle(notice.title ?? "");
        setContent(notice.content ?? "");
        setSelectedDongIds(Array.isArray(notice.dongIds) ? notice.dongIds : []);

        // 동 목록 로드
        if (tokenApartmentId) {
          setDongLoading(true);
          try {
            const data = await getDongListByApartment(tokenApartmentId);
            setDongs(Array.isArray(data) ? data : []);
          } catch {
            // 동 목록 실패해도 수정은 가능
          } finally {
            setDongLoading(false);
          }
        }
      } catch (err) {
        setStatus({
          type: "error",
          message: err?.message || "공지를 불러오지 못했습니다.",
        });
      } finally {
        setPageLoading(false);
      }
    };

    void init();
  }, [noticeId]);

  const toggleDong = (dongId) => {
    setSelectedDongIds((prev) =>
      prev.includes(dongId) ? prev.filter((id) => id !== dongId) : [...prev, dongId],
    );
  };

  const selectAllDongs = () => setSelectedDongIds(dongs.map((d) => d.id));
  const clearAllDongs = () => setSelectedDongIds([]);

  const onUpdate = async (e) => {
    e.preventDefault();
    setStatus({ type: "idle", message: "" });
    setLoading(true);
    try {
      const payload = {
        title,
        content,
        dongIds: targetDongIds.length ? targetDongIds : undefined,
      };
      await updateNotice(noticeId, payload);
      setStatus({
        type: "success",
        message: "공지가 성공적으로 수정되었습니다.",
      });
    } catch (err) {
      setStatus({
        type: "error",
        message: err?.message || "공지 수정에 실패했습니다.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="notices-page">
        <NoticeTabNav />
        <div className="notices-card" style={{ padding: 48, textAlign: "center" }}>
          <span className="btn-spinner" style={{ width: 24, height: 24 }} />
          <p style={{ marginTop: 12, color: "#6b7280" }}>공지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notices-page">
      <NoticeTabNav />

      <div className="notices-header">
        <div className="notices-header-icon">📝</div>
        <div className="notices-header-text">
          <h2 className="notices-title">공지사항 수정</h2>
          <p className="notices-subtitle">공지 ID: {noticeId}</p>
        </div>
      </div>

      <form className="notices-card" onSubmit={onUpdate}>
        {/* 제목 */}
        <div className="notices-field">
          <label className="notices-label" htmlFor="edit-title">
            제목 <span className="required">*</span>
          </label>
          <input
            id="edit-title"
            className="notices-input"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
            placeholder="공지 제목을 입력하세요"
            disabled={loading}
            required
            autoFocus
          />
          <div className={`notices-char-count ${title.length > TITLE_MAX * 0.9 ? "warn" : ""}`}>
            {title.length} / {TITLE_MAX}
          </div>
        </div>

        {/* 내용 */}
        <div className="notices-field">
          <label className="notices-label" htmlFor="edit-content">
            내용 <span className="required">*</span>
          </label>
          <textarea
            id="edit-content"
            className="notices-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, CONTENT_MAX))}
            placeholder="공지 내용을 상세히 입력하세요"
            disabled={loading}
            required
            rows={8}
          />
          <div className={`notices-char-count ${content.length > CONTENT_MAX * 0.9 ? "warn" : ""}`}>
            {content.length} / {CONTENT_MAX}
          </div>
        </div>

        <hr className="notices-divider" />

        {/* 대상 동 */}
        <div className="notices-field">
          <div className="notices-dong-header">
            <label className="notices-label">
              발송 대상 동 (선택)
              {apartmentId && <span className="notices-dong-count">아파트 #{apartmentId}</span>}
            </label>
            {dongs.length > 0 && (
              <div className="notices-dong-actions">
                <button type="button" className="notices-dong-toggle" onClick={selectAllDongs}>
                  전체 선택
                </button>
                <button type="button" className="notices-dong-toggle" onClick={clearAllDongs}>
                  선택 해제
                </button>
              </div>
            )}
          </div>

          {dongLoading && (
            <div className="notices-help">
              <span className="icon">⏳</span> 동 목록을 불러오는 중...
            </div>
          )}

          {!dongLoading && dongs.length > 0 && (
            <>
              <div className="notices-dong-grid">
                {dongs.map((dong) => {
                  const isSelected = selectedDongIds.includes(dong.id);
                  return (
                    <label
                      key={dong.id}
                      className={`notices-dong-item ${isSelected ? "selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleDong(dong.id)}
                        disabled={loading}
                      />
                      <span>{dong.dongNo}동</span>
                    </label>
                  );
                })}
              </div>
              {selectedDongIds.length > 0 && (
                <div className="notices-help">
                  <span className="icon">✅</span>
                  {selectedDongIds.length}개 동 선택됨
                </div>
              )}
            </>
          )}

          {!dongLoading && dongs.length === 0 && (
            <div className="notices-help">
              <span className="icon">ℹ️</span>동 목록이 없습니다. 선택하지 않으면 전체 허용 동에
              발송됩니다.
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div className="notices-actions">
          <button
            className="notices-btn primary"
            type="submit"
            disabled={loading || !title || !content}
          >
            {loading ? (
              <>
                <span className="btn-spinner" /> 수정 중...
              </>
            ) : (
              <>💾 수정 완료</>
            )}
          </button>
          <button
            className="notices-btn"
            type="button"
            onClick={() => navigate("/admin/notices")}
            disabled={loading}
          >
            ← 목록으로
          </button>
        </div>

        {/* 상태 메시지 */}
        {status.type !== "idle" && (
          <div className={`notices-status ${status.type}`}>
            <span className="notices-status-icon">
              {status.type === "success" && "✅"}
              {status.type === "error" && "❌"}
              {status.type === "info" && "ℹ️"}
              {status.type === "warning" && "⚠️"}
            </span>
            {status.message}
          </div>
        )}
      </form>
    </div>
  );
}
