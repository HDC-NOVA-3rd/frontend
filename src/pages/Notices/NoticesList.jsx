import { useEffect, useState, useMemo } from "react";
import {
  getNoticeList,
  getNotice,
  createNotice,
  updateNotice,
  deleteNotice,
  getNoticeLogs,
} from "../../services/noticeApi";
import { 
  Bell, 
  Search, 
  Plus, 
  RotateCcw, 
  ChevronRight, 
  X, 
  FileText, 
  Send,
  History,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import "./NoticesList.css";

const TITLE_MAX = 100;
const CONTENT_MAX = 2000;

export default function NoticesList() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  
  // KPI 통계 상태
  const [stats, setStats] = useState({ totalSent: 0, readCount: 0, unreadCount: 0 });

  // Drawer 관련 상태
  const [drawerMode, setDrawerMode] = useState(null); 
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [drawerTab, setDrawerTab] = useState("content"); 
  const [drawerLoading, setDrawerLoading] = useState(false);
  
  const [formValues, setFormValues] = useState({ title: "", content: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  const [logs, setLogs] = useState([]);
  const [logLoading, setLogLoading] = useState(false);

  // 데이터 로드 및 통계 계산
  const loadData = async () => {
    setLoading(true);
    try {
      const [noticeRes, logRes] = await Promise.all([
        getNoticeList(),
        getNoticeLogs()
      ]);
      
      const noticeList = Array.isArray(noticeRes) ? noticeRes : [];
      const logList = Array.isArray(logRes) ? logRes : [];
      
      setNotices(noticeList);
      
      // 통계 계산
      const read = logList.filter(l => l.read).length;
      setStats({
        totalSent: logList.length,
        readCount: read,
        unreadCount: logList.length - read
      });
    } catch (err) {
      setError("데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const loadNoticeLogs = async (noticeId) => {
    setLogLoading(true);
    try {
      const allLogs = await getNoticeLogs();
      const filtered = allLogs.filter(log => log.noticeId === noticeId || log.title === selectedNotice?.title);
      setLogs(filtered);
    } catch (err) {
      console.error("로그 로드 실패");
    } finally {
      setLogLoading(false);
    }
  };

  useEffect(() => {
    if (drawerTab === "logs" && selectedNotice?.noticeId) {
      loadNoticeLogs(selectedNotice.noticeId);
    }
  }, [drawerTab, selectedNotice]);

  const openDrawer = async (mode, noticeId = null) => {
    setError("");
    setDrawerMode(mode);
    setDrawerTab("content");
    
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
    setLogs([]);
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
      await loadData();
      closeDrawer();
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
      await loadData();
      closeDrawer();
    } catch (err) {
      setError("삭제 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const filteredNotices = useMemo(() => {
    const q = search.toLowerCase();
    return notices.filter(n => 
      (n.title ?? "").toLowerCase().includes(q) || 
      (n.content ?? "").toLowerCase().includes(q)
    );
  }, [notices, search]);

  return (
    <div className="bill-dashboard">
      
      {/* KPI 섹션 - 확인/미확인 추가 */}
      <div className="bill-kpi-section">
        <div className="bill-kpi-card">
          <FileText className="icon-blue" size={24} style={{color: '#3b82f6'}} />
          <div>
            <div className="kpi-label">전체 공지</div>
            <div className="kpi-value">{notices.length}건</div>
          </div>
        </div>
        <div className="bill-kpi-card">
          <Send className="icon-green" size={24} style={{color: '#10b981'}} />
          <div>
            <div className="kpi-label">총 발송</div>
            <div className="kpi-value">{stats.totalSent}회</div>
          </div>
        </div>
        <div className="bill-kpi-card">
          <CheckCircle size={24} style={{color: '#22c55e'}} />
          <div>
            <div className="kpi-label">확인 수</div>
            <div className="kpi-value">{stats.readCount}건</div>
          </div>
        </div>
        <div className="bill-kpi-card danger">
          <AlertCircle size={24} style={{color: '#ef4444'}} />
          <div>
            <div className="kpi-label">미확인 수</div>
            <div className="kpi-value">{stats.unreadCount}건</div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 바 */}
      <div className="bill-filter-card">
        <div className="bill-filter-form">
          <div className="input-group">
            <div className="search-wrapper" style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
              <Search size={18} style={{position: 'absolute', left: '12px', color: '#64748b'}} />
              <input 
                type="text" 
                placeholder="공지 제목 또는 내용 검색..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                style={{paddingLeft: '40px', width: '300px'}}
              />
            </div>
          </div>
          <div className="button-group">
            <button className="reset-btn" onClick={loadData}><RotateCcw size={16} /> 새로고침</button>
            <button className="btn-add" onClick={() => openDrawer("create")}><Plus size={16} /> 새 공지 등록</button>
          </div>
        </div>
      </div>

      {/* 리스트 테이블 */}
      <div className="bill-table-card">
        <div className="table-responsive">
          <table className="bill-table">
            <thead>
              <tr>
                <th style={{width: '80px'}}>번호</th>
                <th>제목</th>
                <th style={{width: '200px'}}>등록일</th>
                <th style={{width: '120px'}}>관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="no-data">로딩 중...</td></tr>
              ) : filteredNotices.length > 0 ? (
                filteredNotices.map((n, idx) => (
                  <tr key={n.noticeId} className="row-hover" onClick={() => openDrawer("view", n.noticeId)}>
                    <td>{notices.length - idx}</td>
                    <td style={{textAlign: 'left', fontWeight: '600'}}>{n.title}</td>
                    <td>{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : "-"}</td>
                    <td><button className="sm-detail-btn">상세보기</button></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="no-data">등록된 공지가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer 영역 (이전과 동일) */}
      <div className={`side-drawer ${drawerMode ? "open" : ""}`}>
        <div className="drawer-header">
          <h3>{drawerMode === "create" ? "새 공지 작성" : "공지사항 상세"}</h3>
          <button className="drawer-close" onClick={closeDrawer}><X size={24} /></button>
        </div>

        {drawerMode !== "create" && (
          <div className="drawer-tabs">
            <button className={drawerTab === "content" ? "active" : ""} onClick={() => setDrawerTab("content")}>
              <FileText size={16} /> 내용 보기
            </button>
            <button className={drawerTab === "logs" ? "active" : ""} onClick={() => setDrawerTab("logs")}>
              <History size={16} /> 발송 내역
            </button>
          </div>
        )}

        <div className="drawer-body">
          {drawerLoading ? (
            <div className="loading-box">로딩 중...</div>
          ) : drawerTab === "content" ? (
            <div className="drawer-content">
              <div className="field">
                <label>제목 ({formValues.title.length}/{TITLE_MAX})</label>
                <input 
                  disabled={drawerMode === "view"}
                  value={formValues.title} 
                  onChange={(e) => setFormValues({...formValues, title: e.target.value})}
                  placeholder="제목을 입력하세요" 
                />
              </div>
              <div className="field" style={{marginTop: '20px'}}>
                <label>내용 ({formValues.content.length}/{CONTENT_MAX})</label>
                <textarea 
                  disabled={drawerMode === "view"}
                  rows={15}
                  value={formValues.content} 
                  onChange={(e) => setFormValues({...formValues, content: e.target.value})}
                  placeholder="공지 내용을 입력하세요" 
                />
              </div>
              <div className="drawer-actions" style={{marginTop: '30px'}}>
                {drawerMode === "view" ? (
                  <>
                    <button className="btn-primary" onClick={() => setDrawerMode("edit")}>수정하기</button>
                    <button className="btn-delete-sm" onClick={handleDelete}>삭제</button>
                  </>
                ) : (
                  <>
                    <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? "저장 중..." : "저장 완료"}</button>
                    <button className="btn-secondary" onClick={() => drawerMode === "edit" ? setDrawerMode("view") : closeDrawer()}>취소</button>
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
                  {logs.map(log => (
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