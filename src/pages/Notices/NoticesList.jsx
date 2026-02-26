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
  const [tab, setTab] = useState("list");
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [drawerMode, setDrawerMode] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [formValues, setFormValues] = useState({ title: "", content: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState([]);
  const [logLoading, setLogLoading] = useState(false);
  const [logSearch, setLogSearch] = useState("");

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") closeDrawer(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [saving]);

  const loadNotices = async () => {
    setLoading(true);
    try {
      const res = await getNoticeList();
      setNotices(Array.isArray(res) ? res : []);
    } catch (err) {
      setError("공지 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    setLogLoading(true);
    try {
      const res = await getNoticeLogs();
      setLogs(Array.isArray(res) ? res : []);
    } catch (err) {
      alert("로그를 불러오지 못했습니다.");
    } finally {
      setLogLoading(false);
    }
  };

  useEffect(() => { loadNotices(); }, []);
  useEffect(() => { if (tab === "log") loadLogs(); }, [tab]);

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
        setFormValues({ title: data.title ?? "", content: data.content ?? "" });
      } catch (err) {
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

  const handleSave = async () => {
    if (!formValues.title.trim() || !formValues.content.trim()) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }
    try {
      setSaving(true);
      if (drawerMode === "create") await createNotice(formValues);
      else await updateNotice(selectedNotice.noticeId, formValues);
      await loadNotices();
      closeDrawer();
      alert("저장되었습니다.");
    } catch (err) {
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNotice || !window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      setSaving(true);
      await deleteNotice(selectedNotice.noticeId);
      await loadNotices();
      closeDrawer();
      alert("삭제되었습니다.");
    } catch (err) {
      setError("삭제 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const filteredNotices = useMemo(() => {
    const q = search.toLowerCase();
    return notices.filter(n => (n.title ?? "").toLowerCase().includes(q) || (n.content ?? "").toLowerCase().includes(q));
  }, [notices, search]);

  const filteredLogs = useMemo(() => {
    const q = logSearch.toLowerCase();
    return logs.filter(it => String(it.id).includes(q) || (it.title ?? "").toLowerCase().includes(q) || String(it.recipientId ?? "").includes(q));
  }, [logs, logSearch]);

  return (
    <div className={`safety-dashboard ${drawerMode ? "drawer-open" : ""}`}>

      {/* KPI 카드 섹션 (통계) */}
      <div className="kpi-section">
        <div className="kpi-card kpi-card--primary">
          <span className="kpi-label">전체 공지</span>
          <div className="kpi-data">
            <span className="kpi-value">{notices.length}</span>
            <span className="kpi-sub">건</span>
          </div>
        </div>
        <div className="kpi-card kpi-card--success">
          <span className="kpi-label">누적 발송</span>
          <div className="kpi-data">
            <span className="kpi-value">{logs.length}</span>
            <span className="kpi-sub">회</span>
          </div>
        </div>
      </div>

      <div className="section-header">
        <h3>
          <span>📢</span> {tab === "list" ? "공지사항 관리" : "알림 발송 내역"}
        </h3>
        <div className="header-actions">
          <span className="last-updated">실시간 업데이트 중</span>
          <button className="refresh-btn" onClick={tab === "list" ? loadNotices : loadLogs}>
            🔄
          </button>
        </div>
      </div>
      
      {/* 탭 메뉴 */}
      <div className="notices-tab-bar">
        <button className={tab === "list" ? "active" : ""} onClick={() => setTab("list")}>공지 관리</button>
        <button className={tab === "log" ? "active" : ""} onClick={() => setTab("log")}>발송 내역</button>
      </div>

      {/* 필터 및 검색 바 */}
      <div className="filter-bar">
        <div className="filter-group">
          <div className="search-input-wrapper">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              placeholder={tab === "list" ? "공지 제목, 내용 검색..." : "ID, 제목, 수신자 검색..."}
              value={tab === "list" ? search : logSearch}
              onChange={(e) => tab === "list" ? setSearch(e.target.value) : setLogSearch(e.target.value)}
            />
          </div>
          {tab === "list" && (
            <button className="action-btn" style={{width: 'auto', padding: '8px 20px', backgroundColor: '#3b82f6', color: '#fff'}} onClick={() => openDrawer("create")}>
              + 새 공지 등록
            </button>
          )}
        </div>
      </div>

      {/* 메인 리스트 카드 */}
      <div className="notices-card">
        {loading || logLoading ? (
          <div className="safety-dashboard--loading">
            <div className="spin">⌛</div>
            <p>데이터를 불러오고 있습니다...</p>
          </div>
        ) : (
          <table className="notices-table">
            <thead>
              {tab === "list" ? (
                <tr>
                  <th style={{ width: 80 }}>번호</th>
                  <th>제목</th>
                  <th style={{ width: 180 }}>등록일</th>
                </tr>
              ) : (
                <tr>
                  <th style={{ width: 80 }}>ID</th>
                  <th style={{ width: 180 }}>발송일</th>
                  <th style={{ width: 120 }}>수신자</th>
                  <th>제목</th>
                  <th style={{ width: 100 }}>상태</th>
                </tr>
              )}
            </thead>
            <tbody>
              {tab === "list" ? (
                filteredNotices.map((n, idx) => (
                  <tr key={n.noticeId} className="clickable-row" onClick={() => openDrawer("view", n.noticeId)}>
                    <td>{notices.length - idx}</td>
                    <td className="font-bold">{n.title}</td>
                    <td>{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : "-"}</td>
                  </tr>
                ))
              ) : (
                filteredLogs.map((it) => (
                  <tr key={it.id}>
                    <td>{it.id}</td>
                    <td>{formatDateTime(it.sentAt)}</td>
                    <td><span className="resident-chip">{it.recipientId ?? "-"}</span></td>
                    <td>{it.title}</td>
                    <td>
                      <span className={`status-text ${it.read ? "success" : ""}`}>
                        {it.read ? "✓ 읽음" : "— 미읽음"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer */}
      {drawerMode && (
        <>
          <div className="drawer-overlay" onClick={closeDrawer} />
          <div className="notices-drawer">
            <div className="drawer-header">
              <h3>{drawerMode === "view" ? "공지 상세" : drawerMode === "edit" ? "공지 수정" : "새 공지 등록"}</h3>
              <button className="close-drawer-btn" onClick={closeDrawer}>✕</button>
            </div>
            <div className="drawer-body">
              {error && <div className="error-msg">{error}</div>}
              {drawerLoading ? (
                <div className="spin">⌛</div>
              ) : drawerMode === "view" ? (
                <div className="view-mode">
                  <h4 className="view-title">{selectedNotice?.title}</h4>
                  <p className="last-updated">{selectedNotice?.createdAt && new Date(selectedNotice.createdAt).toLocaleString()}</p>
                  <div className="content-box">{selectedNotice?.content}</div>
                  <div className="drawer-actions">
                    <button onClick={() => setDrawerMode("edit")} className="action-btn">수정하기</button>
                    <button onClick={handleDelete} className="action-btn action-btn--danger" disabled={saving}>삭제</button>
                  </div>
                </div>
              ) : (
                <div className="edit-mode">
                  <div className="field">
                    <label>제목 ({formValues.title.length}/{TITLE_MAX})</label>
                    <input value={formValues.title} maxLength={TITLE_MAX} onChange={(e) => setFormValues({...formValues, title: e.target.value})} placeholder="제목을 입력하세요" />
                  </div>
                  <div className="field">
                    <label>내용 ({formValues.content.length}/{CONTENT_MAX})</label>
                    <textarea rows={12} value={formValues.content} maxLength={CONTENT_MAX} onChange={(e) => setFormValues({...formValues, content: e.target.value})} placeholder="공지 내용을 입력하세요" />
                  </div>
                  <div className="drawer-actions">
                    <button onClick={handleSave} className="action-btn" style={{backgroundColor: '#3b82f6', color: '#fff'}} disabled={saving}>{saving ? "저장 중..." : "저장"}</button>
                    <button onClick={() => drawerMode === "edit" ? setDrawerMode("view") : closeDrawer()} className="action-btn" disabled={saving}>취소</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}