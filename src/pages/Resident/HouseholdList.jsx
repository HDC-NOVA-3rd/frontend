import React, { useState, useEffect } from "react";
import { getResidentsByApartment, deleteResidentsByHo } from "../../services/residentApi"; 
import "./HouseholdList.css";

const HouseholdList = () => {
  const [groupedData, setGroupedData] = useState({}); // { "101": [ {hoId: 1, ho: "101", residents: [...]} ] }

  const fetchAndGroupData = async () => {
    try {
      const allResidents = await getResidentsByApartment();
      
      // 데이터를 동/호수별로 그룹화 (백엔드에서 세대 목록 API가 따로 없다면 목록을 가공)
      const groups = allResidents.reduce((acc, res) => {
        const { dong, ho, hoId, name } = res;
        if (!acc[dong]) acc[dong] = {};
        if (!acc[dong][ho]) acc[dong][ho] = { hoId, residents: [] };
        acc[dong][ho].residents.push(name);
        return acc;
      }, {});
      
      setGroupedData(groups);
    } catch (error) {
      alert("세대 정보를 불러오는데 실패했습니다.");
    }
  };

  useEffect(() => { fetchAndGroupData(); }, []);

  // 특정 세대 전체 삭제 (퇴거 처리)
  const handleDeleteHo = async (hoId, dong, ho) => {
    if (window.confirm(`${dong}동 ${ho}호의 모든 입주민 정보를 삭제하시겠습니까?`)) {
      try {
        await deleteResidentsByHo(hoId);
        alert("처리가 완료되었습니다.");
        fetchAndGroupData(); // 목록 갱신
      } catch (error) {
        alert("삭제 작업 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="household-container">
      <header className="page-header">
        <h2>세대(호) 관리</h2>
        <p>세대 단위로 입주민 퇴거 처리를 관리합니다.</p>
      </header>

      {Object.keys(groupedData).sort().map(dong => (
        <div key={dong} className="dong-section">
          <h3>{dong}동</h3>
          <div className="ho-grid">
            {Object.keys(groupedData[dong]).sort().map(ho => {
              const item = groupedData[dong][ho];
              return (
                <div key={ho} className="ho-card">
                  <div className="ho-info">
                    <span className="ho-number">{ho}호</span>
                    <span className="resident-count">
                      ({item.residents.length}명 거주)
                    </span>
                  </div>
                  <div className="resident-names">
                    {item.residents.join(", ")}
                  </div>
                  <button 
                    className="btn-clear" 
                    onClick={() => handleDeleteHo(item.hoId, dong, ho)}
                  >
                    세대 비우기
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default HouseholdList;