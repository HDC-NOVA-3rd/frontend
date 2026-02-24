import React, { useState, useEffect, useMemo, useCallback } from "react";
import { getResidentsByApartment, deleteResidentsByHo } from "../../services/residentApi"; 
import "./ResidentManagePage.css"; // 기존 CSS 활용

const HouseholdManagePage = () => {
  const [residents, setResidents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDong, setSelectedDong] = useState("all");

  /** 1. 데이터 로드 (세대 관리는 전체를 가져와서 클라이언트에서 그룹화하는 것이 효율적) */
  const fetchData = useCallback(async () => {
    try {
      // 세대 관리는 페이징 없이 전체 목록을 기반으로 그룹화하는 경우가 많음
      // 만약 데이터가 너무 많다면 백엔드에서 GroupBy 쿼리를 별도로 만들어야 합니다.
      const response = await getResidentsByApartment({ size: 2000 }); 
      setResidents(response.content || []);
    } catch (error) {
      console.error("세대 데이터 로드 실패", error);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /** 2. 데이터를 동 -> 호 순으로 그룹화 */
  const groupedHouseholds = useMemo(() => {
    const groups = {};

    residents.forEach(res => {
      const { dongNo, hoNo, hoId, name, residentId } = res;
      
      // 검색어 필터링 (이름 또는 호수)
      if (searchTerm && !name.includes(searchTerm) && !hoNo.includes(searchTerm)) return;
      // 동 필터링
      if (selectedDong !== "all" && dongNo !== selectedDong) return;

      if (!groups[dongNo]) groups[dongNo] = {};
      if (!groups[dongNo][hoNo]) {
        groups[dongNo][hoNo] = { hoId, residents: [] };
      }
      groups[dongNo][hoNo].residents.push({ id: residentId, name });
    });

    return groups;
  }, [residents, searchTerm, selectedDong]);

  /** 3. 통계 및 필터 정보 */
  const stats = useMemo(() => {
    const dongList = ["all", ...new Set(residents.map(res => res.dongNo))].sort();
    const totalHo = Object.values(groupedHouseholds).reduce((acc, hoMap) => acc + Object.keys(hoMap).length, 0);
    return { dongList, totalHo };
  }, [residents, groupedHouseholds]);

  /** 4. 세대 비우기 (해당 호의 모든 입주민 삭제) */
  const handleClearHo = async (hoId, dongNo, hoNo) => {
    if (window.confirm(`${dongNo}동 ${hoNo}호의 모든 입주민 정보를 삭제하시겠습니까?`)) {
      try {
        await deleteResidentsByHo(hoId);
        alert("해당 세대가 비워졌습니다.");
        fetchData();
      } catch (error) {
        alert("처리에 실패했습니다.");
      }
    };
  };

  return (
    <div className="manager-container">
      {/* 요약 대시보드 */}
      <div className="dashboard-top">
        <section className="stats-grid">
          <div className="stat-card blue-border">
            <span className="label">관리 중인 세대 수</span>
            <span className="value blue-text">{stats.totalHo}<span>세대</span></span>
          </div>
          <div className="stat-card orange-border">
            <span className="label">등록된 총 입주민</span>
            <span className="value orange-text">{residents.length}<span>명</span></span>
          </div>
        </section>
      </div>

      {/* 검색 및 필터 */}
      <section className="filter-bar">
        <div className="filter-group">
          <select value={selectedDong} onChange={(e) => setSelectedDong(e.target.value)}>
            <option value="all">전체 동</option>
            {stats.dongList.filter(d => d !== "all").map(d => (
              <option key={d} value={d}>{d}동</option>
            ))}
          </select>
          <input 
            type="text" 
            placeholder="세대 번호 또는 이름 검색..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      {/* 세대 그리드 리스트 */}
      <section className="list-section">
        {Object.keys(groupedHouseholds).sort().map(dong => (
          <div key={dong} className="dong-group-section" style={{ marginBottom: '40px' }}>
            <h3 className="dong-title">{dong}동 현황</h3>
            <div className="household-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
              gap: '20px',
              marginTop: '15px' 
            }}>
              {Object.keys(groupedHouseholds[dong]).sort().map(ho => {
                const item = groupedHouseholds[dong][ho];
                return (
                  <div key={ho} className="ho-card" style={{
                    padding: '20px',
                    borderRadius: '12px',
                    backgroundColor: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid #eee'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>{ho}호</span>
                      <span className="resident-count" style={{ color: '#666', fontSize: '0.9rem' }}>
                        {item.residents.length}명 거주
                      </span>
                    </div>
                    
                    <div className="resident-tags" style={{ marginBottom: '15px', minHeight: '40px' }}>
                      {item.residents.map(r => (
                        <span key={r.id} style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          backgroundColor: '#f0f4ff',
                          color: '#4a6cf7',
                          borderRadius: '4px',
                          marginRight: '6px',
                          fontSize: '0.85rem'
                        }}>{r.name}</span>
                      ))}
                    </div>

                    <button 
                      className="btn-delete" 
                      style={{ width: '100%', padding: '8px', fontSize: '0.8rem' }}
                      onClick={() => handleClearHo(item.hoId, dong, ho)}
                    >
                      세대 비우기(퇴거)
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {Object.keys(groupedHouseholds).length === 0 && (
          <div className="empty-msg"><p>해당하는 세대 정보가 없습니다.</p></div>
        )}
      </section>
    </div>
  );
};

export default HouseholdManagePage;