import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  getResidentsByApartment, 
  createResident, 
  updateResident, 
  deleteResident 
} from "../../services/residentApi"; 
import "./ResidentManagePage.css";

const ResidentManagePage = () => {
  const [residents, setResidents] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [formData, setFormData] = useState({ name: "", phone: "", dong: "", ho: "" });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDong, setSelectedDong] = useState("all");

  /** 1. 연락처 자동 하이픈 포맷터 */
  const formatPhone = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, ""); 
    const cpLen = phoneNumber.length;

    if (cpLen < 4) return phoneNumber;
    if (cpLen < 8) return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    if (cpLen < 11) return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7)}`;
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 11)}`;
  };

  /** 2. 데이터 로드 */
  const fetchData = useCallback(async () => {
    try {
      const params = {
        searchTerm: null, 
        dongNo: null,
        page: 0, 
        size: 1000 
      };
      const response = await getResidentsByApartment(params);
      const data = response.content || [];
      setResidents(data);
    } catch (error) {
      console.error("데이터 로드 실패", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** 2-1. 프론트엔드 필터링 로직 */
  const filteredResidents = useMemo(() => {
    return residents.filter(res => {
      const matchDong = selectedDong === "all" || String(res.dongNo) === String(selectedDong);
      const s = searchTerm.toLowerCase();
      const matchSearch = !s || 
        res.name.toLowerCase().includes(s) || 
        res.phone.includes(s) || 
        String(res.hoNo).includes(s);

      return matchDong && matchSearch;
    });
  }, [residents, selectedDong, searchTerm]);

  /** 3. 상단 대시보드 및 동 리스트 계산 */
  const stats = useMemo(() => {
    const recent = [...residents].reverse().slice(0, 5);
    const dongList = ["all", ...new Set(residents.map(res => res.dongNo))].sort();
    const householdCount = new Set(residents.map(r => `${r.dongNo}-${r.hoNo}`)).size;
    const avgRes = residents.length > 0 ? (residents.length / (householdCount || 1)).toFixed(1) : 0;

    return { recent, dongList, householdCount, avgRes };
  }, [residents]);

  /** 4. CSV 다운로드 */
  const handleDownloadExcel = () => {
    if (filteredResidents.length === 0) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }
    const headers = ["동", "호", "성명", "연락처"];
    const csvRows = [
      headers.join(","),
      ...filteredResidents.map(r => [`${r.dongNo}동`, `${r.hoNo}호`, r.name, r.phone].join(","))
    ];
    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `입주민목록_${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();
  };

  /** 5. CRUD 핸들링 */
  const openDrawer = (resident = null) => {
    if (resident) {
      setEditingResident(resident);
      setFormData({ name: resident.name, phone: resident.phone, dong: resident.dongNo, ho: resident.hoNo });
    } else {
      setEditingResident(null);
      setFormData({ name: "", phone: "", dong: "", ho: "" });
    }
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingResident(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const refinedData = {
      ...formData,
      dong: String(formData.dong).replace(/[동\s]/g, ""), 
      ho: String(formData.ho).replace(/[호\s]/g, "")
    };

    try {
      if (editingResident) {
        await updateResident(editingResident.residentId, refinedData);
      } else {
        await createResident(refinedData);
      }
      closeDrawer();
      fetchData();
    } catch (error) {
      alert("저장 실패");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("해당 입주민을 명부에서 제외하시겠습니까?")) {
      await deleteResident(id);
      fetchData();
    }
  };

  return (
    <div className="manage-page-container">
      {/* 대시보드 통계 카드 섹션 */}
      <section className="dashboard-section">
        <div className="stats-grid">
          <div className="stat-card blue">
            <span className="label">전체 입주민</span>
            <span className="value">{residents.length}<span>명</span></span>
          </div>
          <div className="stat-card green">
            <span className="label">입주 세대수</span>
            <span className="value">{stats.householdCount}<span>세대</span></span>
          </div>
          <div className="stat-card orange">
            <span className="label">평균 거주인원</span>
            <span className="value">{stats.avgRes}<span>명</span></span>
          </div>
        </div>

        <div className="recent-card">
          <h4>최근 등록 입주민</h4>
          <div className="recent-mini-list">
            {stats.recent.map((res, i) => (
              <div key={i} className="recent-mini-item">
                <span>{res.dongNo}동 {res.hoNo}호</span>
                <strong>{res.name}</strong>
              </div>
            ))}
            {stats.recent.length === 0 && <p className="empty-txt">데이터 없음</p>}
          </div>
        </div>
      </section>

      {/* 리스트 관리 섹션 */}
      <section className="main-content-card">
        <div className="control-bar">
          <div className="search-group">
            <select value={selectedDong} onChange={(e) => setSelectedDong(e.target.value)}>
              <option value="all">전체 동</option>
              {stats.dongList.filter(d => d !== "all" && d).map(dong => (
                <option key={dong} value={dong}>{dong}동</option>
              ))}
            </select>
            <input 
              type="text" 
              placeholder="이름, 연락처, 호수 검색..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="header-btns">
            <button className="btn-outline" onClick={handleDownloadExcel}>엑셀 다운로드</button>
            <button className="btn-add" onClick={() => openDrawer()}>+ 신규 등록</button>
          </div>
        </div>

        <div className="table-container">
          <table className="main-table">
            <thead>
              <tr>
                <th>동</th>
                <th>호</th>
                <th>성명</th>
                <th>연락처</th>
                <th>정보 수정</th>
                <th>명부 제외</th>
              </tr>
            </thead>
            <tbody>
              {filteredResidents.map((r) => (
                <tr key={r.residentId}>
                  <td>{r.dongNo}동</td>
                  <td>{r.hoNo}호</td>
                  <td className="bold">{r.name}</td>
                  <td>{r.phone}</td>
                  {/* 수정 버튼 컬럼 */}
                  <td>
                    <button className="btn-edit-sm" onClick={() => openDrawer(r)}>변경</button>
                  </td>
                  {/* 삭제 버튼 컬럼 */}
                  <td>
                    <button className="btn-delete-sm" onClick={() => handleDelete(r.residentId)}>제외</button>
                  </td>
                </tr>
              ))}
              {filteredResidents.length === 0 && (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* --- 오른쪽 Drawer --- */}
      <div 
        className={`drawer-overlay ${isDrawerOpen ? "show" : ""}`} 
        onClick={closeDrawer} 
      />
      <aside className={`right-drawer ${isDrawerOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <h3>{editingResident ? "입주민 정보 수정" : "신규 입주민 등록"}</h3>
          <button className="btn-close" onClick={closeDrawer}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="drawer-form">
          <div className="form-group">
            <label>성명</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              required 
              placeholder="성명 입력" 
            />
          </div>
          <div className="form-group">
            <label>연락처</label>
            <input 
              type="text" 
              value={formData.phone} 
              onChange={(e) => setFormData({...formData, phone: formatPhone(e.target.value)})} 
              required 
              placeholder="010-0000-0000"
              maxLength={13} 
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>동</label>
              <input 
                type="text" 
                value={formData.dong} 
                onChange={(e) => setFormData({...formData, dong: e.target.value})} 
                required 
                placeholder="예: 101" 
              />
            </div>
            <div className="form-group">
              <label>호</label>
              <input 
                type="text" 
                value={formData.ho} 
                onChange={(e) => setFormData({...formData, ho: e.target.value})} 
                required 
                placeholder="예: 1201" 
              />
            </div>
          </div>
          
          <div className="drawer-footer">
            <button type="button" className="btn-secondary" onClick={closeDrawer}>취소</button>
            <button type="submit" className="btn-primary">
              {editingResident ? "저장" : "등록"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
};

export default ResidentManagePage;