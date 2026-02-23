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

  // 검색, 필터링, 페이징 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDong, setSelectedDong] = useState("all");
  const [currentPage, setCurrentPage] = useState(0); // 백엔드 0부터 시작
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  /** 1. 데이터 로드 함수 (API 연동) */
  const fetchData = useCallback(async () => {
    try {
      const params = {
        searchTerm: searchTerm.trim() || null,
        dongNo: selectedDong === "all" ? null : selectedDong,
        page: currentPage,
        size: 10 // 한 페이지당 출력 개수
      };

      // 백엔드에서 Page<ResidentResponse>를 반환하므로 구조 분해 할당
      const response = await getResidentsByApartment(params);
      
      setResidents(response.content || []); // 데이터 리스트
      setTotalPages(response.totalPages || 0); // 전체 페이지 수
      setTotalElements(response.totalElements || 0); // 전체 검색 결과 수
    } catch (error) {
      console.error("데이터 로드 실패", error);
    }
  }, [searchTerm, selectedDong, currentPage]);

  /** 2. 검색 및 필터 변경 시 페이지 초기화 */
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, selectedDong]);

  /** 3. Debounce 적용된 데이터 Fetch */
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  /** 4. 통계 데이터 계산 (현재 페이지 응답 데이터 기준) */
  const stats = useMemo(() => {
    // 최근 등록 5명 (현재 페이지 상단 배치용)
    const recent = [...residents].slice(0, 5);

    // 동 선택 드롭다운용 목록 (검색과 상관없이 모든 동을 보여주려면 별도 API가 좋으나 현재는 리스트 기반)
    const dongList = ["all", ...new Set(residents.map(res => res.dongNo))].sort();

    return { recent, dongList };
  }, [residents]);

  /** 5. CRUD 로직 */
  const openModal = (resident = null) => {
    if (resident) {
      setEditingResident(resident);
      setFormData({ 
        name: resident.name, 
        phone: resident.phone, 
        dong: resident.dongNo, 
        ho: resident.hoNo 
      });
    } else {
      setEditingResident(null);
      setFormData({ name: "", phone: "", dong: "", ho: "" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingResident) {
        await updateResident(editingResident.residentId, formData);
        alert("수정되었습니다.");
      } else {
        await createResident(formData);
        alert("등록되었습니다.");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert(error.data?.message || "저장에 실패했습니다.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      try {
        await deleteResident(id);
        fetchData();
      } catch (error) {
        alert("삭제 실패");
      }
    }
  };

  return (
    <div className="manager-container">
      {/* 요약 대시보드 */}
      <div className="dashboard-top">
        <section className="stats-grid">
          <div className="stat-card blue-border">
            <span className="label">검색 결과 총원</span>
            <span className="value blue-text">{totalElements}<span>명</span></span>
          </div>
          <div className="stat-card green-border">
            <span className="label">현재 페이지</span>
            <span className="value green-text">{currentPage + 1}<span> / {totalPages || 1}</span></span>
          </div>
          <div className="stat-card orange-border">
            <span className="label">한 페이지당</span>
            <span className="value orange-text">10<span>명</span></span>
          </div>
        </section>

        <section className="recent-list-section">
          <h3>최근 등록 현황 (현재 페이지)</h3>
          <ul className="recent-list">
            {stats.recent.map((res, index) => (
              <li key={index} className="recent-item">
                <span className="res-info">{res.dongNo}동 {res.hoNo}호 - <strong>{res.name}</strong></span>
                <span className="res-phone">{res.phone}</span>
              </li>
            ))}
            {stats.recent.length === 0 && <p className="empty-small">데이터가 없습니다.</p>}
          </ul>
        </section>
      </div>

      {/* 검색 및 필터 컨트롤 */}
      <section className="filter-bar">
        <div className="filter-group">
          <select value={selectedDong} onChange={(e) => setSelectedDong(e.target.value)}>
            <option value="all">전체 동</option>
            {stats.dongList.filter(d => d !== "all").map(dong => (
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
        <button className="btn-primary" onClick={() => openModal()}>+ 신규 입주민 등록</button>
      </section>

      {/* 리스트 테이블 */}
      <section className="list-section">
        <div className="table-wrapper">
          <table className="resident-table">
            <thead>
              <tr>
                <th>동</th><th>호</th><th>이름</th><th>연락처</th><th>관리</th>
              </tr>
            </thead>
            <tbody>
              {residents.map((r) => (
                <tr key={r.residentId}>
                  <td>{r.dongNo}동</td><td>{r.hoNo}호</td><td><strong>{r.name}</strong></td>
                  <td>{r.phone}</td>
                  <td>
                    <button className="btn-edit" onClick={() => openModal(r)}>수정</button>
                    <button className="btn-delete" onClick={() => handleDelete(r.residentId)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {residents.length === 0 && (
            <div className="empty-msg"><p>검색 결과가 없습니다.</p></div>
          )}
        </div>

        {/* 페이지네이션 컨트롤 */}
        {totalPages > 0 && (
          <div className="pagination">
            <button 
              disabled={currentPage === 0} 
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              이전
            </button>
            
            {[...Array(totalPages)].map((_, i) => (
              <button 
                key={i} 
                className={currentPage === i ? "active" : ""} 
                onClick={() => setCurrentPage(i)}
              >
                {i + 1}
              </button>
            ))}

            <button 
              disabled={currentPage >= totalPages - 1} 
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              다음
            </button>
          </div>
        )}
      </section>

      {/* 모달 창 */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingResident ? "입주민 정보 수정" : "신규 입주민 등록"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>성명</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>연락처</label>
                <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
              </div>
              <div className="form-row">
                <div className="input-group">
                  <label>동</label>
                  <input type="text" value={formData.dong} onChange={(e) => setFormData({...formData, dong: e.target.value})} required />
                </div>
                <div className="input-group">
                  <label>호</label>
                  <input type="text" value={formData.ho} onChange={(e) => setFormData({...formData, ho: e.target.value})} required />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>취소</button>
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