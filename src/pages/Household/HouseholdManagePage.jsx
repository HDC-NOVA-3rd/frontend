import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users, Search, Building2, MapPin, UserMinus, RefreshCw,
  Loader2, LayoutGrid, Home
} from "lucide-react";

import { getResidentsByApartment, deleteResidentsByHo } from "../../services/residentApi";
import { getMyApartmentInfo } from "../../services/adminApi";
import { getDongList, getHoList } from "../../services/apartmentApi";

import "./HouseholdManagePage.css";

const HouseholdManagePage = () => {
  const [residents, setResidents] = useState([]);
  const [allStructure, setAllStructure] = useState([]); 
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDong, setSelectedDong] = useState("all");
  const [loading, setLoading] = useState(true);
  const [apartment, setApartment] = useState(null);

  /** ===============================
   * 데이터 로드 (뼈대 + 입주민)
   * =============================== */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. 아파트 정보 로드 (테스터 결과: apartmentId 확인됨)
      const aptInfo = await getMyApartmentInfo();
      setApartment(aptInfo);

      // 2. 아파트 구조(동/호수) 로드
      const targetId = aptInfo?.apartmentId || aptInfo?.id;
      if (targetId) {
        const dongData = await getDongList(targetId);
        
        if (dongData && dongData.length > 0) {
          const structure = await Promise.all(
            dongData.map(async (dong) => {
              const hoData = await getHoList(dong.id);
              return {
                dongId: dong.id,
                dongNo: String(dong.dongNo),
                hos: hoData || []
              };
            })
          );
          setAllStructure(structure);
        }
      }

      // 3. 입주민 데이터 로드
      const pageData = await getResidentsByApartment({ size: 2000 });
      setResidents(pageData?.content || []);

    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** ===============================
   * 동 → 호 그룹화 (빈 세대 포함)
   * =============================== */
  const groupedHouseholds = useMemo(() => {
    const groups = {};

    // 1. 뼈대(전체 구조) 먼저 생성 (공실 포함)
    allStructure.forEach((dongObj) => {
      const dNo = dongObj.dongNo;
      if (selectedDong !== "all" && dNo !== selectedDong) return;

      if (!groups[dNo]) groups[dNo] = {};

      dongObj.hos.forEach((hoObj) => {
        const hNo = String(hoObj.hoNo);
        const matchesHoSearch = !searchTerm || hNo.includes(searchTerm);

        groups[dNo][hNo] = {
          hoId: hoObj.id,
          residents: [],
          isVisible: matchesHoSearch
        };
      });
    });

    // 2. 입주민 데이터를 호수에 매칭
    residents.forEach((res) => {
      const dNo = String(res.dongNo);
      const hNo = String(res.hoNo);
      
      if (groups[dNo] && groups[dNo][hNo]) {
        groups[dNo][hNo].residents.push({
          id: res.residentId,
          name: res.name
        });

        // 이름 검색 필터링
        if (searchTerm && res.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
          groups[dNo][hNo].isVisible = true;
        }
      }
    });

    // 검색 시 결과 없는 항목 제거
    if (searchTerm) {
      Object.keys(groups).forEach(d => {
        Object.keys(groups[d]).forEach(h => {
          if (!groups[d][h].isVisible) delete groups[d][h];
        });
        if (Object.keys(groups[d]).length === 0) delete groups[d];
      });
    }

    return groups;
  }, [allStructure, residents, searchTerm, selectedDong]);

  /** ===============================
   * 통계 계산
   * =============================== */
  const stats = useMemo(() => {
    const dongList = ["all", ...allStructure.map(d => d.dongNo)].sort();
    const totalHo = allStructure.reduce((acc, d) => acc + d.hos.length, 0);
    const dongHoCount = {};
    allStructure.forEach(d => {
      dongHoCount[d.dongNo] = d.hos.length;
    });

    return { dongList, totalHo, dongHoCount };
  }, [allStructure]);

  /** ===============================
   * 세대 비우기
   * =============================== */
  const handleClearHo = async (hoId, dongNo, hoNo) => {
    if (!hoId) {
      alert("세대 ID 정보가 없습니다.");
      return;
    }
    if (!window.confirm(`${dongNo}동 ${hoNo}호의 모든 입주민을 퇴거 처리하시겠습니까?`)) return;

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

  if (loading && allStructure.length === 0) {
    return (
      <div className="safety-dashboard--loading">
        <Loader2 className="loading-spinner spin" size={40} />
        <p>단지 구조 및 세대 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="safety-dashboard">

      <section className="kpi-section">
        <div className="kpi-card kpi-card--primary">
          <div className="kpi-icon"><Building2 size={20} /></div>
          <span className="kpi-label">단지명</span>
          <div className="kpi-data"><span className="kpi-value">{apartment?.apartmentName || "-"}</span></div>
          <div className="kpi-sub"><MapPin size={12} /> {apartment?.address}</div>
        </div>

        <div className="kpi-card kpi-card--info">
          <div className="kpi-icon"><LayoutGrid size={20} /></div>
          <span className="kpi-label">전체 세대 수</span>
          <div className="kpi-data">
            <span className="kpi-value">{stats.totalHo}</span>
            <span className="kpi-sub">세대</span>
          </div>
        </div>

        <div className="kpi-card kpi-card--success">
          <div className="kpi-icon"><Users size={20} /></div>
          <span className="kpi-label">전체입주민 수</span>
          <div className="kpi-data">
            <span className="kpi-value">{residents.length}</span>
            <span className="kpi-sub">명</span>
          </div>
        </div>

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

      <section className="filter-bar">
        <div className="filter-group">
          <select value={selectedDong} onChange={(e) => setSelectedDong(e.target.value)}>
            {stats.dongList.map((d) => (
              <option key={d} value={d}>{d === "all" ? "전체 동" : `${d}동`}</option>
            ))}
          </select>
          <div className="search-input-wrapper">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="호수 또는 이름 검색..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      <main className="zone-grid">
        {Object.keys(groupedHouseholds).sort((a,b) => a.localeCompare(b, undefined, {numeric: true})).map((dong) => (
          <div key={dong} className="zone-group">
            <h3 className="zone-group__title"><Home size={16} /> {dong}동 세대 현황</h3>
            <div className="zone-group__cards">
              {Object.keys(groupedHouseholds[dong]).sort((a,b) => a.localeCompare(b, undefined, {numeric: true})).map((ho) => {
                const item = groupedHouseholds[dong][ho];
                const hasResidents = item.residents.length > 0;
                return (
                  <div key={ho} className={`zone-card ${!hasResidents ? "zone-card--empty" : ""}`}>
                    <div className="zone-card__header">
                      <span className="zone-card__name">{ho}호</span>
                      <span className="status-text">{hasResidents ? `${item.residents.length}명 거주` : "거주자 없음"}</span>
                    </div>
                    <div className="zone-card__sensors">
                      {hasResidents ? item.residents.map((r) => (
                        <span key={r.id} className="resident-chip">{r.name}</span>
                      )) : <span className="no-sensor">빈 세대</span>}
                    </div>
                    <button 
                      className="action-btn action-btn--danger" 
                      onClick={() => handleClearHo(item.hoId, dong, ho)}
                      disabled={loading || !hasResidents}
                    >
                      <UserMinus size={14} /> 세대 비우기
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default HouseholdManagePage;