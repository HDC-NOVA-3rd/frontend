import { useEffect, useState, useMemo } from "react";
import {
  getNoticeList,
  getNotice,
  createNotice,
  updateNotice,
  deleteNotice,
  getNoticeLogs,
} from "../../services/noticeApi";
import "./NoticesList.css";

const TITLE_MAX = 100;
const CONTENT_MAX = 2000;

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

export default function NoticesList() {
  const [tab, setTab] = useState("list"); // list | log

  /* =========================
     공지 목록 상태
  ========================== */
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [drawerMode, setDrawerMode] = useState(null); // view | edit | create
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const [formValues, setFormValues] = useState({
    title: "",
    content: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* =========================
     로그 상태
  ========================== */
  const [logs, setLogs] = useState([]);
  const [logLoading, setLogLoading] = useState(false);
  const [logSearch, setLogSearch] = useState("");

  /* =========================
     ESC로 Drawer 닫기
  ========================== */
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [saving]);

  /* =========================
     공지 목록 로드
  ========================== */
  const loadNotices = async () => {
    setLoading(true);
    try {
      const res = await getNoticeList();
      setNotices(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      setError("공지 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     로그 로드
  ========================== */
  const loadLogs = async () => {
    setLogLoading(true);
    try {
      const res = await getNoticeLogs();
      setLogs(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      alert("로그를 불러오지 못했습니다.");
    } finally {
      setLogLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  useEffect(() => {
    if (tab === "log") loadLogs();
  }, [tab]);

  /* =========================
     Drawer 열기
  ========================== */
  const openDrawer = async (mode, noticeId = null) => {
    setError("");
    setDrawerMode(mode);

    if (mode === "create") {
      setSelectedNotice(null);
      setFormValues({ title: "", content: "" });
      return;
    }

    if (noticeId) {
      try {
        setDrawerLoading(true);
        const data = await getNotice(noticeId);
        setSelectedNotice(data);
        setFormValues({
          title: data.title ?? "",
          content: data.content ?? "",
        });
      } catch (err) {
        console.error(err);
        setError("공지 정보를 불러오지 못했습니다.");
      } finally {
        setDrawerLoading(false);
      }
    }
  };

  const closeDrawer = () => {
    if (saving) return;
    setDrawerMode(null);
    setSelectedNotice(null);
    setError("");
  };

  /* =========================
     저장
  ========================== */
  const handleSave = async () => {
    if (!formValues.title.trim() || !formValues.content.trim()) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }

    try {
      setSaving(true);

      if (drawerMode === "create") {
        await createNotice(formValues);
      } else {
        await updateNotice(selectedNotice.noticeId, formValues);
      }

      await loadNotices();
      closeDrawer();
      alert("저장되었습니다.");
    } catch (err) {
      console.error(err);
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     삭제
  ========================== */
  const handleDelete = async () => {
    if (!selectedNotice) return;
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      setSaving(true);
      await deleteNotice(selectedNotice.noticeId);
      await loadNotices();
      closeDrawer();
      alert("삭제되었습니다.");
    } catch (err) {
      console.error(err);
      setError("삭제 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     검색 필터
  ========================== */
  const filteredNotices = useMemo(() => {
    if (!search.trim()) return notices;
    const q = search.toLowerCase();
    return notices.filter(
      (n) =>
        (n.title ?? "").toLowerCase().includes(q) ||
        (n.content ?? "").toLowerCase().includes(q)
    );
  }, [notices, search]);

  const filteredLogs = useMemo(() => {
    if (!logSearch.trim()) return logs;
    const q = logSearch.toLowerCase();
    return logs.filter(
      (it) =>
        String(it.id).includes(q) ||
        (it.title ?? "").toLowerCase().includes(q) ||
        String(it.recipientId ?? "").includes(q)
    );
  }, [logs, logSearch]);

  return (
    <div className={`notices-page ${drawerMode ? "drawer-open" : ""}`}>

      {/* =========================
          탭 버튼
      ========================== */}
      <div className="notices-tab-bar">
        <button
          className={tab === "list" ? "active" : ""}
          onClick={() => setTab("list")}
        >
          공지 관리
        </button>
        <button
          className={tab === "log" ? "active" : ""}
          onClick={() => setTab("log")}
        >
          발송 내역
        </button>
      </div>

      {/* =========================
          공지 관리 화면
      ========================== */}
      {tab === "list" && (
        <>
          <div className="notices-header">
            <h2>공지사항 관리</h2>
            <button
              className="notices-btn primary"
              onClick={() => openDrawer("create")}
            >
              + 새 공지 등록
            </button>
          </div>

          <div className="notices-card">
            <input
              className="notices-search-input"
              placeholder="검색어 입력..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {loading ? (
              <div className="notices-empty-visual">불러오는 중...</div>
            ) : (
              <table className="notices-table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>번호</th>
                    <th>제목</th>
                    <th style={{ width: 140 }}>등록일</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotices.map((n, idx) => (
                    <tr
                      key={n.noticeId}
                      className="clickable-row"
                      onClick={() => openDrawer("view", n.noticeId)}
                    >
                      <td>{filteredNotices.length - idx}</td>
                      <td>{n.title}</td>
                      <td>
                        {n.createdAt
                          ? new Date(n.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {filteredNotices.length === 0 && !loading && (
              <div className="notices-empty-visual">
                검색 결과가 없습니다.
              </div>
            )}
          </div>
        </>
      )}

      {/* =========================
          발송 로그 화면
      ========================== */}
      {tab === "log" && (
        <div className="notices-card">
          <input
            className="notices-search-input"
            placeholder="ID, 제목, 수신자 검색..."
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
          />

          {logLoading ? (
            <div className="notices-empty-visual">불러오는 중...</div>
          ) : (
            <table className="notices-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>발송일</th>
                  <th>수신자</th>
                  <th>제목</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((it) => {
                  const isRead = it.read === true || it.read === "true";
                  return (
                    <tr key={it.id}>
                      <td>{it.id}</td>
                      <td>{formatDateTime(it.sentAt)}</td>
                      <td>{it.recipientId ?? "-"}</td>
                      <td>{it.title}</td>
                      <td>{isRead ? "✓ 읽음" : "— 미읽음"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {filteredLogs.length === 0 && !logLoading && (
            <div className="notices-empty-visual">
              발송 기록이 없습니다.
            </div>
          )}
        </div>
      )}

      {/* =========================
          Drawer (공지 상세/수정/생성)
      ========================== */}
      {drawerMode && (
        <>
          <div className="drawer-overlay" onClick={closeDrawer} />
          <div className="notices-drawer">
            <div className="drawer-header">
              <h3>
                {drawerMode === "view" && "공지 상세"}
                {drawerMode === "edit" && "공지 수정"}
                {drawerMode === "create" && "새 공지 등록"}
              </h3>
              <button onClick={closeDrawer}>✕</button>
            </div>

            <div className="drawer-body">
              {error && <div className="error-msg">{error}</div>}

              {drawerLoading ? (
                <div>불러오는 중...</div>
              ) : (
                <>
                  {drawerMode === "view" && (
                    <>
                      <h4>{selectedNotice?.title}</h4>
                      <p className="meta">
                        {selectedNotice?.createdAt &&
                          new Date(
                            selectedNotice.createdAt
                          ).toLocaleString()}
                      </p>
                      <div className="content-box">
                        {selectedNotice?.content}
                      </div>

                      <div className="drawer-actions">
                        <button
                          onClick={() => setDrawerMode("edit")}
                          className="notices-btn"
                        >
                          수정
                        </button>
                        <button
                          onClick={handleDelete}
                          className="notices-btn danger"
                          disabled={saving}
                        >
                          삭제
                        </button>
                      </div>
                    </>
                  )}

                  {(drawerMode === "edit" ||
                    drawerMode === "create") && (
                    <>
                      <div className="field">
                        <label>
                          제목 ({formValues.title.length}/{TITLE_MAX})
                        </label>
                        <input
                          value={formValues.title}
                          maxLength={TITLE_MAX}
                          onChange={(e) =>
                            setFormValues({
                              ...formValues,
                              title: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="field">
                        <label>
                          내용 ({formValues.content.length}/{CONTENT_MAX})
                        </label>
                        <textarea
                          rows={10}
                          maxLength={CONTENT_MAX}
                          value={formValues.content}
                          onChange={(e) =>
                            setFormValues({
                              ...formValues,
                              content: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="drawer-actions">
                        <button
                          onClick={handleSave}
                          className="notices-btn primary"
                          disabled={saving}
                        >
                          {saving ? "저장 중..." : "저장"}
                        </button>
                        <button
                          onClick={() =>
                            drawerMode === "edit"
                              ? setDrawerMode("view")
                              : closeDrawer()
                          }
                          disabled={saving}
                        >
                          취소
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}