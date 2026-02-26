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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [formData, setFormData] = useState({ name: "", phone: "", dong: "", ho: "" });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDong, setSelectedDong] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

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
        searchTerm: searchTerm.trim() || null,
        dongNo: selectedDong === "all" ? null : selectedDong,
        page: currentPage,
        size: 10
      };
      const response = await getResidentsByApartment(params);
      
      setResidents(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (error) {
      console.error("데이터 로드 실패", error);
    }
  }, [searchTerm, selectedDong, currentPage]);

  useEffect(() => { setCurrentPage(0); }, [searchTerm, selectedDong]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  /** 3. 상단 대시보드용 데이터 계산 */
  const stats = useMemo(() => {
    const recent = [...residents].slice(0, 5);
    const dongList = ["all", ...new Set(residents.map(res => res.dongNo))].sort();
    
    // 가상의 통계 데이터 (필요 시 API 응답값으로 대체)
    const householdCount = new Set(residents.map(r => `${r.dongNo}-${r.hoNo}`)).size;
    const avgRes = totalElements > 0 ? (totalElements / (householdCount || 1)).toFixed(1) : 0;

    return { recent, dongList, householdCount, avgRes };
  }, [residents, totalElements]);

  /** 4. CSV 다운로드 */
  const handleDownloadExcel = () => {
    if (residents.length === 0) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }
    const headers = ["동", "호", "성명", "연락처"];
    const csvRows = [
      headers.join(","),
      ...residents.map(r => [`${r.dongNo}동`, `${r.hoNo}호`, r.name, r.phone].join(","))
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
  const openModal = (resident = null) => {
    if (resident) {
      setEditingResident(resident);
      setFormData({ name: resident.name, phone: resident.phone, dong: resident.dongNo, ho: resident.hoNo });
    } else {
      setEditingResident(null);
      setFormData({ name: "", phone: "", dong: "", ho: "" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const refinedData = {
      ...formData,
      dong: formData.dong.replace(/[동\s]/g, ""), 
      ho: formData.ho.replace(/[호\s]/g, "")
    };

    try {
      if (editingResident) {
        await updateResident(editingResident.residentId, refinedData);
      } else {
        await createResident(refinedData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert("저장 실패");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
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
            <span className="value">{totalElements}<span>명</span></span>
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
          <div className="list-info-text">
        <div className="header-btns">
          <button className="btn-outline" onClick={handleDownloadExcel}>엑셀 다운로드</button>
          <button className="btn-add" onClick={() => openModal()}>+ 신규 등록</button>
        </div>
          </div>
        </div>

        <div className="table-container">
          <table className="main-table">
            <thead>
              <tr><th>동</th><th>호</th><th>성명</th><th>연락처</th><th>관리</th></tr>
            </thead>
            <tbody>
              {residents.map((r) => (
                <tr key={r.residentId}>
                  <td>{r.dongNo}동</td>
                  <td>{r.hoNo}호</td>
                  <td className="bold">{r.name}</td>
                  <td>{r.phone}</td>
                  <td className="actions">
                    <button className="btn-edit-sm" onClick={() => openModal(r)}>수정</button>
                    <button className="btn-delete-sm" onClick={() => handleDelete(r.residentId)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && (
          <div className="pagination-wrapper">
            <button disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)}>이전</button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} className={currentPage === i ? "active" : ""} onClick={() => setCurrentPage(i)}>
                {i + 1}
              </button>
            ))}
            <button disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(p => p + 1)}>다음</button>
          </div>
        )}
      </section>

      {/* 모달 */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>{editingResident ? "정보 수정" : "신규 등록"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>성명</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required placeholder="성명 입력" />
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
                <div className="form-group"><label>동</label><input type="text" value={formData.dong} onChange={(e) => setFormData({...formData, dong: e.target.value})} required placeholder="예: 101" /></div>
                <div className="form-group"><label>호</label><input type="text" value={formData.ho} onChange={(e) => setFormData({...formData, ho: e.target.value})} required placeholder="예: 1201" /></div>
              </div>
              <div className="modal-btns">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>취소</button>
                <button type="submit" className="btn-primary">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentManagePage;