import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createNotice, getDongListByApartment, sendNoticeAlert } from "../../services/noticeApi";
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

export default function NoticeCreate() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dongs, setDongs] = useState([]);
  const [selectedDongIds, setSelectedDongIds] = useState([]);
  const [dongLoading, setDongLoading] = useState(false);
  const [apartmentId, setApartmentId] = useState(null);

  const [createdNoticeId, setCreatedNoticeId] = useState(null);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [loading, setLoading] = useState(false);
  const targetDongIds = useMemo(() => selectedDongIds, [selectedDongIds]);

  useEffect(() => {
    const tokenApartmentId = readApartmentIdFromToken();
    setApartmentId(tokenApartmentId);

    if (!tokenApartmentId) {
      setStatus({
        type: "info",
        message: "토큰에 아파트 정보가 없습니다. 전체 허용 동 대상으로 발송됩니다.",
      });
      return;
    }

    const loadDongs = async () => {
      setDongLoading(true);
      try {
        const data = await getDongListByApartment(tokenApartmentId);
        const parsed = Array.isArray(data) ? data : [];
        setDongs(parsed);
      } catch {
        setStatus({
          type: "warning",
          message: "동 목록을 불러오지 못했습니다. 전체 동 대상으로 발송됩니다.",
        });
      } finally {
        setDongLoading(false);
      }
    };

    loadDongs();
  }, []);

  const toggleDong = (dongId) => {
    setSelectedDongIds((prev) =>
      prev.includes(dongId) ? prev.filter((id) => id !== dongId) : [...prev, dongId],
    );
  };

  const selectAllDongs = () => setSelectedDongIds(dongs.map((d) => d.id));
  const clearAllDongs = () => setSelectedDongIds([]);

  const onCreate = async (e) => {
    e.preventDefault();
    setStatus({ type: "idle", message: "" });
    setLoading(true);
    try {
      const payload = {
        title,
        content,
        dongIds: targetDongIds.length ? targetDongIds : undefined,
      };
      const res = await createNotice(payload);
      setCreatedNoticeId(res?.noticeId ?? null);
      setStatus({
        type: "success",
        message: `공지가 성공적으로 등록되었습니다. (ID: ${res?.noticeId})`,
      });
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "공지 등록에 실패했습니다." });
    } finally {
      setLoading(false);
    }
  };

  const onSendNow = async () => {
    if (!createdNoticeId) return;
    setStatus({ type: "idle", message: "" });
    setLoading(true);
    try {
      const payload = targetDongIds.length ? { dongIds: targetDongIds } : {};
      const res = await sendNoticeAlert(createdNoticeId, payload);
      setStatus({
        type: "success",
        message: res?.message || `알림 발송 완료 (${res?.sentCount ?? 0}건)`,
      });
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "알림 발송에 실패했습니다." });
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => {
    setTitle("");
    setContent("");
    setSelectedDongIds([]);
    setCreatedNoticeId(null);
    setStatus({ type: "idle", message: "" });
  };

  /* ── 등록 성공 화면 ── */
  if (createdNoticeId && status.type === "success") {
    return (
      <div className="notices-page">
        <NoticeTabNav />
        <div className="notices-card">
          <div className="notices-success-card">
            <div className="notices-success-icon">✓</div>
            <div className="notices-success-title">공지 등록 완료!</div>
            <div className="notices-success-desc">
              공지가 성공적으로 등록되었습니다.
              {createdNoticeId && (
                <>
                  <br />
                  공지 ID: <strong>{createdNoticeId}</strong>
                </>
              )}
            </div>
            <div className="notices-success-actions">
              <button className="notices-btn success" onClick={onSendNow} disabled={loading}>
                {loading ? (
                  <>
                    <span className="btn-spinner" /> 발송 중...
                  </>
                ) : (
                  <>🔔 지금 알림 발송</>
                )}
              </button>
              <button className="notices-btn" onClick={onReset}>
                ✏️ 새 공지 작성
              </button>
              <button className="notices-btn" onClick={() => navigate("/admin/notices/log")}>
                📊 발송 내역
              </button>
            </div>
          </div>

          {status.message && status.type === "success" && (
            <div className={`notices-status ${status.type}`}>
              <span className="notices-status-icon">✅</span>
              {status.message}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── 등록 폼 ── */
  return (
    <div className="notices-page">
      <NoticeTabNav />

      <div className="notices-header">
        <div className="notices-header-icon">✏️</div>
        <div className="notices-header-text">
          <h2 className="notices-title">공지사항 등록</h2>
          <p className="notices-subtitle">
            새로운 공지사항을 작성하고 입주민에게 알림을 보낼 수 있습니다.
          </p>
        </div>
      </div>

      <form className="notices-card" onSubmit={onCreate}>
        {/* 제목 */}
        <div className="notices-field">
          <label className="notices-label" htmlFor="notice-title">
            제목 <span className="required">*</span>
          </label>
          <input
            id="notice-title"
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
          <label className="notices-label" htmlFor="notice-content">
            내용 <span className="required">*</span>
          </label>
          <textarea
            id="notice-content"
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

        {/* 대상 동 선택 */}
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
                <span className="btn-spinner" /> 등록 중...
              </>
            ) : (
              <>📝 공지 등록</>
            )}
          </button>
          <button className="notices-btn danger" type="button" onClick={onReset} disabled={loading}>
            초기화
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
