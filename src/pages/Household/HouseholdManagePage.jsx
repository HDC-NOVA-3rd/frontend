import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  Search,
  Building2,
  MapPin,
  UserMinus,
  RefreshCw,
  Loader2,
  LayoutGrid,
  Home
} from "lucide-react";

import { getResidentsByApartment, deleteResidentsByHo } from "../../services/residentApi";
import { getMyApartmentInfo } from "../../services/adminApi";

import "./HouseholdManagePage.css";

const HouseholdManagePage = () => {
  const [residents, setResidents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDong, setSelectedDong] = useState("all");
  const [loading, setLoading] = useState(true);
  const [apartment, setApartment] = useState(null);

  /** ===============================
   * 데이터 로드
   * =============================== */
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
    const init = async () => {
      try {
        const response = await getMyApartmentInfo();
        setApartment(response);
        await fetchData();
      } catch (error) {
        console.error("초기 데이터 로드 실패:", error);
      }
    };
    init();
  }, [fetchData]);

  /** ===============================
   * 동 → 호 그룹화 + 필터
   * =============================== */
  const groupedHouseholds = useMemo(() => {
    const groups = {};

    residents.forEach((res) => {
      const { dongNo, hoNo, hoId, name, residentId } = res;
      if (!dongNo || !hoNo) return;

      const matchesSearch =
        !searchTerm ||
        name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hoNo.includes(searchTerm);

      const matchesDong =
        selectedDong === "all" || dongNo === selectedDong;

      if (!matchesSearch || !matchesDong) return;

      if (!groups[dongNo]) groups[dongNo] = {};
      if (!groups[dongNo][hoNo]) {
        groups[dongNo][hoNo] = { hoId, residents: [] };
      }

      groups[dongNo][hoNo].residents.push({
        id: residentId,
        name
      });
    });

    return groups;
  }, [residents, searchTerm, selectedDong]);

  /** ===============================
   * 통계 계산 (🔥 동별 세대수 포함)
   * =============================== */
  const stats = useMemo(() => {
    const dongList = [
      "all",
      ...new Set(residents.map((r) => r.dongNo).filter(Boolean))
    ].sort();

    const totalHo = Object.values(groupedHouseholds).reduce(
      (acc, hoMap) => acc + Object.keys(hoMap).length,
      0
    );

    // 🔥 동별 세대수 계산
    const dongHoCount = {};
    Object.keys(groupedHouseholds).forEach((dong) => {
      dongHoCount[dong] = Object.keys(groupedHouseholds[dong]).length;
    });

    return { dongList, totalHo, dongHoCount };
  }, [residents, groupedHouseholds]);

  /** ===============================
   * 세대 비우기
   * =============================== */
  const handleClearHo = async (hoId, dongNo, hoNo) => {
    if (!hoId) {
      alert("세대 ID 정보가 없어 삭제할 수 없습니다.");
      return;
    }

    if (!window.confirm(`${dongNo}동 ${hoNo}호의 모든 입주민을 퇴거 처리하시겠습니까?`))
      return;

    try {
      setLoading(true);
      await deleteResidentsByHo(hoId);
      alert("퇴거 처리가 완료되었습니다.");
      await fetchData();
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("처리에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && residents.length === 0) {
    return (
      <div className="safety-dashboard--loading">
        <Loader2 className="loading-spinner spin" size={40} />
        <p>세대 및 입주민 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="safety-dashboard">

      {/* ===============================
         헤더
      =============================== */}
      <header className="section-header">
        <h3><Users size={22} /> 입주민 및 세대 관리</h3>
        <div className="header-actions">
          <span className="last-updated">
            {apartment?.apartmentName || "단지 정보 로딩 중"}
          </span>
          <button
            className="refresh-btn"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
          </button>
        </div>
      </header>

      {/* ===============================
         KPI 영역
      =============================== */}
      <section className="kpi-section">

        {/* 단지 정보 */}
        <div className="kpi-card kpi-card--primary">
          <div className="kpi-icon"><Building2 size={20} /></div>
          <span className="kpi-label">단지명</span>
          <div className="kpi-data">
            <span className="kpi-value">{apartment?.apartmentName || "-"}</span>
          </div>
          <div className="kpi-sub">
            <MapPin size={12} /> {apartment?.address || "주소 정보 없음"}
          </div>
        </div>

        {/* 전체 세대 수 */}
        <div className="kpi-card kpi-card--info">
          <div className="kpi-icon"><LayoutGrid size={20} /></div>
          <span className="kpi-label">관리 중인 세대 수</span>
          <div className="kpi-data">
            <span className="kpi-value">{stats.totalHo}</span>
            <span className="kpi-sub">세대</span>
          </div>
        </div>

        {/* 전체 입주민 */}
        <div className="kpi-card kpi-card--success">
          <div className="kpi-icon"><Users size={20} /></div>
          <span className="kpi-label">등록된 총 입주민</span>
          <div className="kpi-data">
            <span className="kpi-value">{residents.length}</span>
            <span className="kpi-sub">명</span>
          </div>
        </div>

        {/* 🔥 동별 세대 수 */}
        <div className="kpi-card kpi-card--dong">
          <span className="kpi-label">동별 세대 수</span>
          <div className="dong-grid">
            {Object.entries(stats.dongHoCount).map(([dong, count]) => (
              <div key={dong} className="dong-item">
                <span className="dong-name">{dong}동</span>
                <span className="dong-count">{count}세대</span>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* ===============================
         필터 영역
      =============================== */}
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

          <div className="search-input-wrapper">
            <Search size={18} />
            <input
              type="text"
              placeholder="세대 번호 또는 이름 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* ===============================
         세대 목록
      =============================== */}
      <main className="zone-grid">
        {Object.keys(groupedHouseholds).sort().map((dong) => (
          <div key={dong} className="zone-group">
            <h3 className="zone-group__title">
              <Home size={16} /> {dong}동 세대 현황
            </h3>

            <div className="zone-group__cards">
              {Object.keys(groupedHouseholds[dong]).sort().map((ho) => {
                const item = groupedHouseholds[dong][ho];

                return (
                  <div key={ho} className="zone-card">
                    <div className="zone-card__header">
                      <span className="zone-card__name">{ho}호</span>
                      <span className="status-text">
                        {item.residents.length}명 거주
                      </span>
                    </div>

                    <div className="zone-card__sensors">
                      {item.residents.length > 0 ? (
                        item.residents.map((r) => (
                          <span key={r.id} className="resident-chip">
                            {r.name}
                          </span>
                        ))
                      ) : (
                        <span className="no-sensor">거주자 없음</span>
                      )}
                    </div>

                    <button
                      className="action-btn action-btn--danger"
                      onClick={() => handleClearHo(item.hoId, dong, ho)}
                      disabled={loading}
                    >
                      <UserMinus size={14} /> 세대 비우기
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {Object.keys(groupedHouseholds).length === 0 && (
          <div className="empty-msg">
            <p>검색 조건에 맞는 세대 정보가 없습니다.</p>
          </div>
        )}
      </main>

    </div>
  );
};

export default HouseholdManagePage;