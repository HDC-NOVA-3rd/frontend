import { useEffect, useState, useMemo, useCallback } from "react";
import {
  getNoticeList,
  getNotice,
  createNotice,
  updateNotice,
  deleteNotice,
  getNoticeLogs,
  sendNoticeAlert,
  getDongListByApartment,
} from "../../services/noticeApi";
import { getMyApartmentInfo } from "../../services/adminApi";
import { useAuth } from "../../context/AuthContext";
import {
  Search,
  Plus,
  RotateCcw,
  X,
  FileText,
  Send,
  History,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import "./NoticesList.css";

const TITLE_MAX = 100;
const CONTENT_MAX = 2000;

export default function NoticesList() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // KPI 통계
  const [stats, setStats] = useState({ totalSent: 0, readCount: 0, unreadCount: 0 });

  // Drawer
  const [drawerMode, setDrawerMode] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [drawerTab, setDrawerTab] = useState("content");
  const [drawerLoading, setDrawerLoading] = useState(false);

  const [formValues, setFormValues] = useState({ title: "", content: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [logs, setLogs] = useState([]);
  const [logLoading, setLogLoading] = useState(false);

  // 동 선택 관련
  const [apartmentId, setApartmentId] = useState(null);
  const [dongs, setDongs] = useState([]);
  const [selectedDongIds, setSelectedDongIds] = useState([]);
  const [dongLoading, setDongLoading] = useState(false);

  // 생성 직후 즉시 발송
  const [createdNoticeId, setCreatedNoticeId] = useState(null);
  const [status, setStatus] = useState({ type: "idle", message: "" });

  const loadData = useCallback(async () => {
    setLoading(true);
    setStatus({ type: "idle", message: "" });
    try {
      const [noticeRes, logRes] = await Promise.all([getNoticeList(), getNoticeLogs()]);

      const noticeList = Array.isArray(noticeRes) ? noticeRes : [];
      const logList = Array.isArray(logRes) ? logRes : [];

      setNotices(noticeList);
      const read = logList.filter((log) => log.read).length;
      setStats({
        totalSent: logList.length,
        readCount: read,
        unreadCount: logList.length - read,
      });
    } catch {
      setStatus({ type: "error", message: "데이터를 불러오지 못했습니다." });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDongs = useCallback(async (aptId) => {
    if (!aptId) return;
    setDongLoading(true);
    try {
      const result = await getDongListByApartment(aptId);
      const dongList = Array.isArray(result) ? result : [];
      setDongs(dongList);
    } catch {
      setDongs([]);
      setSelectedDongIds([]);
      setStatus({
        type: "warning",
        message: "동 목록을 불러오지 못했습니다. 선택하지 않으면 전체 허용 동으로 발송됩니다.",
      });
    } finally {
      setDongLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let cancelled = false;

    const resolveApartmentId = async () => {
      const contextApartmentId = Number(user?.apartmentId);
      if (Number.isFinite(contextApartmentId) && contextApartmentId > 0) {
        if (cancelled) return;
        setApartmentId(contextApartmentId);
        await loadDongs(contextApartmentId);
        return;
      }

      const apartmentInfo = await getMyApartmentInfo();
      const fallbackApartmentId = Number(apartmentInfo?.apartmentId ?? apartmentInfo?.id);
      if (Number.isFinite(fallbackApartmentId) && fallbackApartmentId > 0) {
        if (cancelled) return;
        setApartmentId(fallbackApartmentId);
        await loadDongs(fallbackApartmentId);
        return;
      }

      if (cancelled) return;
      setApartmentId(null);
      setDongs([]);
      setSelectedDongIds([]);
      setStatus({
        type: "info",
        message: "아파트 정보를 확인할 수 없습니다. 선택하지 않으면 전체 허용 동으로 발송됩니다.",
      });
    };

    resolveApartmentId();
    return () => {
      cancelled = true;
    };
  }, [user?.apartmentId, loadDongs]);

  const handleRefresh = () => {
    setSearch("");
    loadData();
  };

  const toggleDong = (dongId) => {
    setSelectedDongIds((prev) =>
      prev.includes(dongId) ? prev.filter((id) => id !== dongId) : [...prev, dongId],
    );
  };

  const selectAllDongs = () => setSelectedDongIds(dongs.map((d) => d.id));
  const clearAllDongs = () => setSelectedDongIds([]);

  const loadNoticeLogs = useCallback(async (noticeId) => {
    setLogLoading(true);
    try {
      const allLogs = await getNoticeLogs();
      const parsedLogs = Array.isArray(allLogs) ? allLogs : [];
      const filtered = parsedLogs.filter(
        (log) => log.noticeId === noticeId || log.title === selectedNotice?.title,
      );
      setLogs(filtered);
    } catch {
      setLogs([]);
    } finally {
      setLogLoading(false);
    }
  }, [selectedNotice?.title]);

  useEffect(() => {
    if (drawerTab === "logs" && selectedNotice?.noticeId) {
      loadNoticeLogs(selectedNotice.noticeId);
    }
  }, [drawerTab, selectedNotice, loadNoticeLogs]);

  const openDrawer = async (mode, noticeId = null, initialTab = "content") => {
    setError("");
    setCreatedNoticeId(null);
    setSelectedNotice(null);
    setDrawerMode(mode);
    setDrawerTab(initialTab);

    if (mode === "create") {
      setFormValues({ title: "", content: "" });
      setSelectedDongIds([]);
      return;
    }

    if (noticeId) {
      try {
        setDrawerLoading(true);
        const data = await getNotice(noticeId);
        setSelectedNotice(data);
        setFormValues({ title: data.title ?? "", content: data.content ?? "" });
        setSelectedDongIds(Array.isArray(data?.dongIds) ? data.dongIds : []);
      } catch {
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
    setCreatedNoticeId(null);
    setSelectedDongIds([]);
    setLogs([]);
    setError("");
  };

  const handleSave = async () => {
    const title = formValues.title.trim();
    const content = formValues.content.trim();
    if (!title || !content) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }

    const payload = {
      title,
      content,
      dongIds: selectedDongIds.length ? selectedDongIds : undefined,
    };

    try {
      setSaving(true);
      if (drawerMode === "create") {
        const response = await createNotice(payload);
        const newNoticeId = response?.noticeId ?? null;
        setCreatedNoticeId(newNoticeId);
        setSelectedNotice({ noticeId: newNoticeId, title, content });
        setDrawerMode("created");
        setStatus({
          type: "success",
          message: `공지가 성공적으로 등록되었습니다. (ID: ${newNoticeId ?? "-"})`,
        });
      } else {
        await updateNotice(selectedNotice.noticeId, payload);
        setStatus({ type: "success", message: "공지사항이 수정되었습니다." });
        closeDrawer();
      }
      await loadData();
    } catch (err) {
      setError("저장 중 오류가 발생했습니다.");
      setStatus({ type: "error", message: err?.message || "저장 중 오류가 발생했습니다." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNotice || !window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      setSaving(true);
      await deleteNotice(selectedNotice.noticeId);
      await loadData();
      setStatus({ type: "success", message: "공지사항이 삭제되었습니다." });
      closeDrawer();
    } catch {
      setError("삭제 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendNow = async () => {
    if (!createdNoticeId) return;
    setError("");
    try {
      setSaving(true);
      const payload = selectedDongIds.length ? { dongIds: selectedDongIds } : {};
      const response = await sendNoticeAlert(createdNoticeId, payload);
      setStatus({
        type: "success",
        message: response?.message || `알림 발송 완료 (${response?.sentCount ?? 0}건)`,
      });
      await loadData();
    } catch (err) {
      setError(err?.message || "알림 발송에 실패했습니다.");
      setStatus({ type: "error", message: err?.message || "알림 발송에 실패했습니다." });
    } finally {
      setSaving(false);
    }
  };

  const openCreatedLogs = async () => {
    if (!createdNoticeId) return;
    await openDrawer("view", createdNoticeId, "logs");
  };

  const filteredNotices = useMemo(() => {
    const q = search.toLowerCase();
    return notices.filter(
      (n) =>
        (n.title ?? "").toLowerCase().includes(q) || (n.content ?? "").toLowerCase().includes(q),
    );
  }, [notices, search]);

  return (
    <div className="bill-dashboard">
      <div className="bill-kpi-section">
        <div className="bill-kpi-card">
          <FileText size={24} style={{ color: "#3b82f6" }} />
          <div>
            <div className="kpi-label">전체 공지</div>
            <div className="kpi-value">{notices.length}건</div>
          </div>
        </div>
        <div className="bill-kpi-card">
          <Send size={24} style={{ color: "#10b981" }} />
          <div>
            <div className="kpi-label">총 발송</div>
            <div className="kpi-value">{stats.totalSent}회</div>
          </div>
        </div>
        <div className="bill-kpi-card">
          <CheckCircle size={24} style={{ color: "#22c55e" }} />
          <div>
            <div className="kpi-label">확인 수</div>
            <div className="kpi-value">{stats.readCount}건</div>
          </div>
        </div>
        <div className="bill-kpi-card danger">
          <AlertCircle size={24} style={{ color: "#ef4444" }} />
          <div>
            <div className="kpi-label">미확인 수</div>
            <div className="kpi-value">{stats.unreadCount}건</div>
          </div>
        </div>
      </div>

      <div className="bill-filter-card">
        <div className="bill-filter-form">
          <div className="input-group">
            <div className="search-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="공지 제목 또는 내용 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="button-group">
            <button className="reset-btn" onClick={handleRefresh} disabled={loading}>
              <RotateCcw size={16} className={loading ? "spin" : ""} />
              {loading ? "로딩 중" : "새로고침"}
            </button>
            <button className="btn-add" onClick={() => openDrawer("create")}>
              <Plus size={16} /> 새 공지 등록
            </button>
          </div>
        </div>

        {status.type !== "idle" && (
          <div className={`drawer-status ${status.type}`}>{status.message}</div>
        )}
      </div>

      <div className="bill-table-card">
        <div className="table-responsive">
          <table className="bill-table">
            <thead>
              <tr>
                <th style={{ width: "60px" }}>번호</th>
                <th style={{ width: "200px" }}>제목</th>
                <th>공지 내용</th>
                <th style={{ width: "120px" }}>작성자</th>
                <th style={{ width: "120px" }}>등록일</th>
                <th style={{ width: "100px" }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    데이터를 불러오는 중입니다...
                  </td>
                </tr>
              ) : filteredNotices.length > 0 ? (
                filteredNotices.map((n, idx) => (
                  <tr
                    key={n.noticeId}
                    className="row-hover"
                    onClick={() => openDrawer("view", n.noticeId)}
                  >
                    <td>{filteredNotices.length - idx}</td>
                    <td className="cell-title">{n.title}</td>
                    <td className="cell-content">{n.content}</td>
                    <td>{n.authorName}</td>
                    <td>{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : "-"}</td>
                    <td>
                      <button
                        className="sm-detail-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDrawer("view", n.noticeId, "logs");
                        }}
                      >
                        확인여부
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">
                    등록된 공지가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`side-drawer ${drawerMode ? "open" : ""}`}>
        <div className="drawer-header">
          <h3>
            {drawerMode === "create" && "새 공지 작성"}
            {drawerMode === "edit" && "공지사항 수정"}
            {drawerMode === "created" && "공지 등록 완료"}
            {drawerMode === "view" && "공지사항 상세"}
          </h3>
          <button className="drawer-close" onClick={closeDrawer} disabled={saving}>
            <X size={24} />
          </button>
        </div>

        {drawerMode !== "create" && drawerMode !== "created" && (
          <div className="drawer-tabs">
            <button
              className={drawerTab === "content" ? "active" : ""}
              onClick={() => setDrawerTab("content")}
            >
              <FileText size={16} /> 내용 보기
            </button>
            <button
              className={drawerTab === "logs" ? "active" : ""}
              onClick={() => setDrawerTab("logs")}
            >
              <History size={16} /> 발송 내역
            </button>
          </div>
        )}

        <div className="drawer-body">
          {error && <div className="error-msg">{error}</div>}
          
          {drawerLoading && drawerMode !== "created" ? (
            <div className="loading-box">공지 정보를 로딩 중...</div>
          ) : drawerMode === "created" ? (
            <div className="success-panel">
              <CheckCircle size={42} className="success-icon" />
              <h4>공지 등록이 완료되었습니다.</h4>
              <p>
                {createdNoticeId ? `공지 ID: ${createdNoticeId}` : "공지 ID를 확인할 수 없습니다."}
                <br />
                선택된 동이 없으면 전체 허용 동으로 발송됩니다.
              </p>
              <div className="drawer-actions">
                <button
                  className="btn-primary"
                  onClick={handleSendNow}
                  disabled={saving || !createdNoticeId}
                >
                  {saving ? "발송 중..." : "지금 알림 발송"}
                </button>
                <button className="btn-secondary" onClick={() => openDrawer("create")} disabled={saving}>
                  새 공지 작성
                </button>
                <button className="btn-secondary" onClick={openCreatedLogs} disabled={!createdNoticeId || saving}>
                  발송 내역 보기
                </button>
              </div>
            </div>
          ) : drawerTab === "content" ? (
            <div className="drawer-content">
              <div className="field">
                <label>제목 ({formValues.title.length}/{TITLE_MAX})</label>
                <input
                  disabled={drawerMode === "view"}
                  value={formValues.title}
                  onChange={(e) =>
                    setFormValues({
                      ...formValues,
                      title: e.target.value.slice(0, TITLE_MAX),
                    })
                  }
                  placeholder="제목을 입력하세요"
                />
              </div>
              <div className="field" style={{ marginTop: "20px" }}>
                <label>내용 ({formValues.content.length}/{CONTENT_MAX})</label>
                <textarea
                  disabled={drawerMode === "view"}
                  rows={15}
                  value={formValues.content}
                  onChange={(e) =>
                    setFormValues({
                      ...formValues,
                      content: e.target.value.slice(0, CONTENT_MAX),
                    })
                  }
                  placeholder="공지 내용을 입력하세요"
                />
              </div>

              <div className="field" style={{ marginTop: "20px" }}>
                <div className="dong-header">
                  <label>
                    발송 대상 동 (선택)
                    {apartmentId && <span className="dong-helper">아파트 #{apartmentId}</span>}
                  </label>
                  {dongs.length > 0 && drawerMode !== "view" && (
                    <div className="dong-actions">
                      <button type="button" onClick={selectAllDongs}>
                        전체 선택
                      </button>
                      <button type="button" onClick={clearAllDongs}>
                        선택 해제
                      </button>
                    </div>
                  )}
                </div>

                {dongLoading && <div className="helper-text">동 목록을 불러오는 중...</div>}

                {!dongLoading && dongs.length > 0 && (
                  <>
                    <div className="dong-grid-select">
                      {dongs.map((dong) => {
                        const isSelected = selectedDongIds.includes(dong.id);
                        return (
                          <label
                            key={dong.id}
                            className={`dong-item-select ${isSelected ? "selected" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleDong(dong.id)}
                              disabled={saving || drawerMode === "view"}
                            />
                            <span>{dong.dongNo}동</span>
                          </label>
                        );
                      })}
                    </div>
                    {selectedDongIds.length > 0 && (
                      <div className="helper-text success">{selectedDongIds.length}개 동 선택됨</div>
                    )}
                  </>
                )}

                {!dongLoading && dongs.length === 0 && (
                  <div className="helper-text">
                    동 목록이 없습니다. 선택하지 않으면 전체 허용 동으로 발송됩니다.
                  </div>
                )}
              </div>

              <div className="drawer-actions" style={{ marginTop: "30px" }}>
                {drawerMode === "view" ? (
                  <>
                    <button className="btn-primary" onClick={() => setDrawerMode("edit")}>
                      편집
                    </button>
                    <button className="btn-delete-sm" onClick={handleDelete}>
                      삭제
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn-primary" onClick={handleSave} disabled={saving}>
                      {saving ? "저장 중..." : drawerMode === "create" ? "등록" : "저장"}
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => (drawerMode === "edit" ? setDrawerMode("view") : closeDrawer())}
                    >
                      취소
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="log-container">
              <h4 className="section-title">최근 발송 이력</h4>
              {logLoading ? (
                <div>로그 로딩 중...</div>
              ) : logs.length > 0 ? (
                <div className="log-list">
                  {logs.map((log) => (
                    <div key={log.id} className="log-item">
                      <div className="log-info">
                        <strong>수신: {log.recipientId}</strong>
                        <span>{new Date(log.sentAt).toLocaleString()}</span>
                      </div>
                      <span className={`status-badge ${log.read ? "status-paid" : "status-unpaid"}`}>
                        {log.read ? "읽음" : "미읽음"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">발송 내역이 없습니다.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {drawerMode && <div className="drawer-backdrop" onClick={closeDrawer} />}
    </div>
  );
}
