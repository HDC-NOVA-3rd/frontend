/**
 * 화재감시 관제 대시보드 - 지도 기반 UI
 */

import { useState, useEffect } from 'react';
import { 
  Flame, 
  Map as MapIcon, 
  ShieldAlert, 
  Settings, 
  Navigation,
  Building2,
  Activity,
  ChevronRight,
  CalendarX,
  CalendarCheck,
  Power
} from 'lucide-react';
import './FireMonitoringDashboard.css';

// Mock 센서 데이터
const initialSensors = [
  { id: 1, building: '101동', location: '502호', type: 'APT', value: 120, status: 'normal', isLocked: false },
  { id: 2, building: '101동', location: '1201호', type: 'APT', value: 450, status: 'warning', isLocked: false },
  { id: 3, building: '커뮤니티', location: '피트니스 센터', type: 'COMMUNITY', value: 820, status: 'danger', isLocked: true },
  { id: 4, building: '102동', location: '301호', type: 'APT', value: 95, status: 'normal', isLocked: false },
  { id: 5, building: '102동', location: '1504호', type: 'APT', value: 110, status: 'normal', isLocked: false },
  { id: 6, building: '주차장', location: 'B1 주차구역', type: 'COMMUNITY', value: 310, status: 'warning', isLocked: false },
  { id: 7, building: '103동', location: '702호', type: 'APT', value: 85, status: 'normal', isLocked: false },
  { id: 8, building: '104동', location: '202호', type: 'APT', value: 680, status: 'danger', isLocked: true },
];

// 건물 배치 데이터
const buildings = [
  { id: 'b101', name: '101동', x: '25%', y: '25%', type: 'APT' },
  { id: 'b102', name: '102동', x: '65%', y: '20%', type: 'APT' },
  { id: 'b103', name: '103동', x: '25%', y: '70%', type: 'APT' },
  { id: 'b104', name: '104동', x: '65%', y: '70%', type: 'APT' },
  { id: 'bcomm', name: '커뮤니티', x: '45%', y: '45%', type: 'COMMUNITY' },
  { id: 'bpark', name: '주차장', x: '80%', y: '45%', type: 'COMMUNITY' },
];

export function FireMonitoringDashboard() {
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [sensors, setSensors] = useState(initialSensors);
  const [activeNav, setActiveNav] = useState('map');

  // 예약 차단/해제 핸들러
  const toggleReservationLock = (sensorId) => {
    setSensors(prev => prev.map(s => 
      s.id === sensorId ? { ...s, isLocked: !s.isLocked } : s
    ));
  };

  // 건물 상태 계산
  const getBuildingStatus = (buildingName) => {
    const bSensors = sensors.filter(s => s.building === buildingName);
    if (bSensors.some(s => s.status === 'danger')) return 'danger';
    if (bSensors.some(s => s.status === 'warning')) return 'warning';
    return 'normal';
  };

  // 잠긴 시설 확인
  const hasLockedFacility = (buildingName) => {
    return sensors.filter(s => s.building === buildingName).some(s => s.isLocked);
  };

  // 실시간 데이터 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      setSensors(prev => prev.map(s => {
        const delta = s.status === 'danger' ? (Math.random() * 4 - 2) : (Math.random() * 8 - 4);
        const newValue = Math.max(50, s.value + delta);
        let lockedState = s.isLocked;
        if (newValue > 750 && s.type === 'COMMUNITY') lockedState = true;
        return { ...s, value: newValue, isLocked: lockedState };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 알림 개수
  const alarmCount = sensors.filter(s => s.status === 'danger').length;
  const lockedCount = sensors.filter(s => s.isLocked).length;

  return (
    <div className="dashboard">
      {/* 사이드바 */}
      <aside className="sidebar">
        <div className="sidebar__logo">
          <Flame size={24} />
        </div>
        <nav className="sidebar__nav">
          <button 
            className={`sidebar__nav-btn ${activeNav === 'map' ? 'sidebar__nav-btn--active' : ''}`}
            onClick={() => setActiveNav('map')}
          >
            <MapIcon size={24} />
          </button>
          <button 
            className={`sidebar__nav-btn ${activeNav === 'alerts' ? 'sidebar__nav-btn--active' : ''}`}
            onClick={() => setActiveNav('alerts')}
          >
            <ShieldAlert size={24} />
          </button>
          <button 
            className={`sidebar__nav-btn ${activeNav === 'settings' ? 'sidebar__nav-btn--active' : ''}`}
            onClick={() => setActiveNav('settings')}
          >
            <Settings size={24} />
          </button>
        </nav>
      </aside>

      {/* 메인 영역 */}
      <main className="main">
        {/* 헤더 */}
        <header className="header">
          <div className="header__left">
            <div className="header__title-box">
              <h1 className="header__title">
                <Navigation size={18} />
                관제 시스템
              </h1>
              <p className="header__subtitle">화재감시 대시보드</p>
            </div>
          </div>

          <div className="header__right">
            {alarmCount > 0 && (
              <div className="header__alarm">
                <div className="header__alarm-dot" />
                <span className="header__alarm-text">ALARM {String(alarmCount).padStart(2, '0')}</span>
              </div>
            )}
            {lockedCount > 0 && (
              <div className="header__locked">
                <CalendarX size={14} />
                <span>시설 예약 중단 {lockedCount}건</span>
              </div>
            )}
          </div>
        </header>

        {/* 지도 영역 */}
        <div className="map-area">
          <div className="map-area__grid" />
          
          <div className="map-container">
            {/* 배경 도로 */}
            <svg className="map-roads" viewBox="0 0 1000 560">
              <path d="M0 280 Q 500 250 1000 300" stroke="#cbd5e1" strokeWidth="40" fill="none" />
              <path d="M500 0 Q 520 280 480 560" stroke="#cbd5e1" strokeWidth="40" fill="none" />
            </svg>

            {/* 건물들 */}
            {buildings.map((b) => {
              const status = getBuildingStatus(b.name);
              const isSelected = selectedBuilding?.name === b.name;
              const isLocked = hasLockedFacility(b.name);
              
              return (
                <div 
                  key={b.id}
                  className={`building ${status !== 'normal' ? `building--${status}` : ''} ${isSelected ? 'building--selected' : ''}`}
                  style={{ left: b.x, top: b.y }}
                  onClick={() => setSelectedBuilding({ ...b, status })}
                >
                  {status !== 'normal' && (
                    <div className={`building__ping building__ping--${status}`} />
                  )}
                  
                  {isLocked && (
                    <div className="building__lock-badge">
                      <CalendarX size={14} />
                    </div>
                  )}
                  
                  <div className="building__icon">
                    {b.type === 'APT' ? <Building2 size={32} /> : <Activity size={32} />}
                  </div>
                  <span className="building__name">{b.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 좌측 하단 로그 패널 */}
        <div className="log-panel">
          <div className="log-panel__header">
            <h2 className="log-panel__title">
              <ShieldAlert size={18} />
              예약 시스템 연동 로그
            </h2>
          </div>
          <div className="log-panel__content">
            {sensors.filter(s => s.status !== 'normal' || s.isLocked).map(s => (
              <div key={s.id} className={`log-item ${s.isLocked ? 'log-item--locked' : 'log-item--warning'}`}>
                <div className="log-item__header">
                  <span className="log-item__location">{s.building} | {s.location}</span>
                  {s.isLocked && (
                    <span className="log-item__badge">BLOCKED</span>
                  )}
                </div>
                <p className="log-item__message">
                  {s.isLocked 
                    ? "앱 내 예약 기능이 자동으로 제한되었습니다." 
                    : "주의: 수치가 상승하고 있습니다."}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 우측 상세 패널 */}
        {selectedBuilding && (
          <div className="detail-panel">
            <div className="detail-panel__header">
              <div>
                <h3 className="detail-panel__title">{selectedBuilding.name}</h3>
                <p className="detail-panel__subtitle">앱 예약 기능 활성/비활성 제어</p>
              </div>
              <button 
                className="detail-panel__close"
                onClick={() => setSelectedBuilding(null)}
              >
                <ChevronRight size={24} />
              </button>
            </div>

            <div className="detail-panel__sensors">
              {sensors.filter(s => s.building === selectedBuilding.name).map(sensor => (
                <div key={sensor.id} className={`sensor-card ${sensor.isLocked ? 'sensor-card--locked' : ''}`}>
                  <div className="sensor-card__header">
                    <div>
                      <p className="sensor-card__location">{sensor.location}</p>
                      <div className="sensor-card__status">
                        <span className={`sensor-card__dot sensor-card__dot--${sensor.status}`} />
                        <span className="sensor-card__value">현재 수치: {Math.round(sensor.value)} PPM</span>
                      </div>
                    </div>
                    <div className={`sensor-card__icon ${sensor.isLocked ? 'sensor-card__icon--locked' : 'sensor-card__icon--normal'}`}>
                      {sensor.isLocked ? <CalendarX size={20} /> : <CalendarCheck size={20} />}
                    </div>
                  </div>
                  
                  <div className="sensor-card__actions">
                    <button 
                      className={`sensor-card__btn ${sensor.isLocked ? 'sensor-card__btn--unlock' : 'sensor-card__btn--lock'}`}
                      onClick={() => toggleReservationLock(sensor.id)}
                    >
                      <Power size={14} />
                      {sensor.isLocked ? '입주민 앱 예약 재개' : '입주민 앱 예약 중단'}
                    </button>
                    <p className="sensor-card__hint">
                      {sensor.isLocked 
                        ? "* 현재 입주민 앱에서 예약이 불가한 상태입니다." 
                        : "* 정상 상태: 모든 예약 기능이 활성화되어 있습니다."}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button className="detail-panel__log-btn">
              <CalendarCheck size={16} />
              전체 화재감지 로그 확인
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
