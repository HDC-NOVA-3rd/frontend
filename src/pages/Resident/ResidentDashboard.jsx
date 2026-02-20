import React, { useState, useEffect } from "react";
import { getResidentsByApartment } from "../../services/residentApi"; 
import "./ResidentDashboard.css";

const ResidentDashboard = () => {
  const [stats, setStats] = useState({
    totalResidents: 0,
    totalHouseholds: 0,
    recentResidents: [],
  });

  const fetchStats = async () => {
    try {
      const data = await getResidentsByApartment();
      
      // 1. 전체 인원수
      const totalResidents = data.length;

      // 2. 전체 세대수 (중복 제거된 hoId 개수)
      const uniqueHo = new Set(data.map(res => res.hoId));
      const totalHouseholds = uniqueHo.size;

      // 3. 최근 등록된 5명 (id 역순 혹은 최신순 가공)
      const recent = [...data].reverse().slice(0, 5);

      setStats({ totalResidents, totalHouseholds, recentResidents: recent });
    } catch (error) {
      console.error("통계 로드 실패", error);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  return (
    <div className="dashboard-container">
      {/* 상단 요약 카드 */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="label">전체 입주민</span>
          <span className="value blue">{stats.totalResidents}<span>명</span></span>
        </div>
        <div className="stat-card">
          <span className="label">입주 세대수</span>
          <span className="value green">{stats.totalHouseholds}<span>세대</span></span>
        </div>
        <div className="stat-card">
          <span className="label">평균 거주인원</span>
          <span className="value orange">
            {stats.totalHouseholds > 0 
              ? (stats.totalResidents / stats.totalHouseholds).toFixed(1) 
              : 0}<span>명</span>
          </span>
        </div>
      </div>

      {/* 하단 최근 등록 현황 */}
      <div className="recent-list-section">
        <h3>최근 등록 입주민</h3>
        <ul className="recent-list">
          {stats.recentResidents.map((res, index) => (
            <li key={index} className="recent-item">
              <span className="res-info">{res.dong}동 {res.ho}호 - <strong>{res.name}</strong></span>
              <span className="res-date">{res.phone}</span>
            </li>
          ))}
          {stats.recentResidents.length === 0 && <p className="empty">등록된 데이터가 없습니다.</p>}
        </ul>
      </div>
    </div>
  );
};

export default ResidentDashboard;