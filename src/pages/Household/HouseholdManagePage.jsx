import React, { useState, useEffect, useMemo, useCallback } from "react";
import { getResidentsByApartment, deleteResidentsByHo } from "../../services/residentApi";
import { getMyApartmentInfo } from '../../services/adminApi';

import "./HouseholdManagePage.css";

const HouseholdManagePage = () => {
  const [residents, setResidents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDong, setSelectedDong] = useState("all");
  const [loading, setLoading] = useState(true);
  const [apartment, setApartment] = useState(null);

  /** 데이터 로드 */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const pageData = await getResidentsByApartment({ size: 2000 });
      setResidents(pageData?.content || []);
    } catch (error) {
      console.error("세대 데이터 로드 실패", error);
      setResidents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchApartment = async () => {
      try {
        const response = await getMyApartmentInfo();
        setApartment(response);
      } catch (error) {
        console.error("아파트 정보 불러오기 실패:", error);
      } finally {
        // fetchData와 함께 관리되도록 여기서는 loading 해제 보류 가능
      }
    };
    fetchApartment();
    fetchData();
  }, [fetchData]);

  /** 동 → 호 그룹화 */
  const groupedHouseholds = useMemo(() => {
    const groups = {};

    residents.forEach((res) => {
      // DTO 수정으로 이제 hoId가 정상적으로 들어옵니다.
      const { dongNo, hoNo, hoId, name, residentId } = res;

      if (!dongNo || !hoNo) return;

      // 검색 필터
      if (
        searchTerm &&
        !name.includes(searchTerm) &&
        !hoNo.includes(searchTerm)
      )
        return;

      // 동 필터
      if (selectedDong !== "all" && dongNo !== selectedDong) return;

      if (!groups[dongNo]) groups[dongNo] = {};
      if (!groups[dongNo][hoNo]) {
        // 여기서 hoId를 저장하여 삭제 시 사용합니다.
        groups[dongNo][hoNo] = { hoId, residents: [] };
      }

      groups[dongNo][hoNo].residents.push({
        id: residentId,
        name,
      });
    });

    return groups;
  }, [residents, searchTerm, selectedDong]);

  /** 통계 */
  const stats = useMemo(() => {
    const dongList = [
      "all",
      ...new Set(residents.map((res) => res.dongNo).filter(Boolean)),
    ].sort();

    const totalHo = Object.values(groupedHouseholds).reduce(
      (acc, hoMap) => acc + Object.keys(hoMap).length,
      0
    );

    return { dongList, totalHo };
  }, [residents, groupedHouseholds]);

  /** 세대 비우기 */
  const handleClearHo = async (hoId, dongNo, hoNo) => {
    // 1. hoId 값 존재 여부 체크
    if (!hoId) {
      console.error("hoId가 누락되었습니다. 백엔드 DTO를 확인하세요.");
      alert("삭제를 위한 세대 ID 정보가 없습니다.");
      return;
    }

    if (!window.confirm(`${dongNo}동 ${hoNo}호의 모든 입주민 정보를 삭제하시겠습니까?`))
      return;

    try {
      setLoading(true); // 로딩 시작
      
      // 2. 삭제 API 호출 (백엔드 경로: /api/resident/ho/{hoId})
      await deleteResidentsByHo(hoId);
      
      alert("해당 세대가 비워졌습니다.");
      
      // 3. 목록 새로고침
      await fetchData(); 
    } catch (error) {
      console.error("삭제 요청 에러:", error);
      alert(error.message || "처리에 실패했습니다.");
    } finally {
      setLoading(false); // 로딩 종료
    }
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="manager-container">
      {/* 📊 통계 영역 */}
      <div className="info-container">
        <div className="info-header">
          <h2>담당 아파트 정보</h2>
        </div>

        <div className="info-card apartment-card">
          <div className="apartment-main">
            <h3>{apartment?.apartmentName}</h3>
            <p className="address">{apartment?.address}</p>
          </div>

          <hr />

          <div className="info-grid">
            <div className="grid-item">

            <h3>{apartment?.apartmentName}</h3>
            <p className="address">{apartment?.address}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-top">
        <section className="stats-grid">
          <div className="stat-card blue-border">
            <span className="label">관리 중인 세대 수</span>
            <span className="value blue-text">
              {stats.totalHo}
              <span>세대</span>
            </span>
          </div>

          <div className="stat-card orange-border">
            <span className="label">등록된 총 입주민</span>
            <span className="value orange-text">
              {residents.length}
              <span>명</span>
            </span>
          </div>
        </section>
      </div>

      {/* 🔍 필터 영역 */}
      <section className="filter-bar">
        <div className="filter-group">
          <select
            value={selectedDong}
            onChange={(e) => setSelectedDong(e.target.value)}
          >
            <option value="all">전체 동</option>
            {stats.dongList
              .filter((d) => d !== "all")
              .map((d) => (
                <option key={d} value={d}>
                  {d}동
                </option>
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

      {/* 🏢 세대 목록 */}
      <section className="list-section">
        {Object.keys(groupedHouseholds)
          .sort()
          .map((dong) => (
            <div key={dong} className="dong-group-section" style={{ marginBottom: "40px" }}>
              <h3 className="dong-title">{dong}동 현황</h3>

              <div
                className="household-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                  gap: "20px",
                  marginTop: "15px",
                }}
              >
                {Object.keys(groupedHouseholds[dong])
                  .sort()
                  .map((ho) => {
                    const item = groupedHouseholds[dong][ho];

                    return (
                      <div
                        key={ho}
                        className="ho-card"
                        style={{
                          padding: "20px",
                          borderRadius: "12px",
                          backgroundColor: "#fff",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          border: "1px solid #eee",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "10px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "1.2rem",
                              fontWeight: "bold",
                              color: "#333",
                            }}
                          >
                            {ho}호
                          </span>

                          <span
                            style={{
                              color: "#666",
                              fontSize: "0.9rem",
                            }}
                          >
                            {item.residents.length}명 거주
                          </span>
                        </div>

                        <div style={{ marginBottom: "15px", minHeight: "40px" }}>
                          {item.residents.map((r) => (
                            <span
                              key={r.id}
                              style={{
                                display: "inline-block",
                                padding: "4px 8px",
                                backgroundColor: "#f0f4ff",
                                color: "#4a6cf7",
                                borderRadius: "4px",
                                marginRight: "6px",
                                fontSize: "0.85rem",
                                marginBottom: "4px"
                              }}
                            >
                              {r.name}
                            </span>
                          ))}
                        </div>

                        <button
                          className="btn-delete"
                          style={{
                            width: "100%",
                            padding: "8px",
                            fontSize: "0.8rem",
                            cursor: "pointer"
                          }}
                          onClick={() =>
                            handleClearHo(item.hoId, dong, ho)
                          }
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
          <div className="empty-msg">
            <p>해당하는 세대 정보가 없습니다.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default HouseholdManagePage;