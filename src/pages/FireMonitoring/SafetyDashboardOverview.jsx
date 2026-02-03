/**
 * SafetyDashboardOverview - 화재감시 대시보드 홈 (철학 기반 재설계)
 * 
 * 
 * 1. 즉시성: "지금 위험한가?"를 1초 안에 답하게 한다
 * 2. 신뢰성: 데이터 신선도, 센서 상태, 근거를 항상 함께 제시
 * 3. 행동 유도: 경보를 "보는 것"에서 끝내지 않고 조치까지 연결
 * 
 * 레이아웃:
 * - 상단: KPI 3개만 (Active Alarms, Unacknowledged, Offline Sensors)
 * - 좌측: 우선순위 경보 패널 (ActiveAlertsPanel)
 * - 중앙: 구역별 상태 (Zone Grid)
 * - 우측: 사건 타임라인 (IncidentTimeline)
 * - 하단: 데이터 신선도 표시
 */

import { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  AlertCircle, 
  WifiOff,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { ActiveAlertsPanel } from '../../components/safety/ActiveAlertsPanel';
import { IncidentTimeline } from '../../components/safety/IncidentTimeline';
import { DataFreshnessIndicator } from '../../components/safety/DataFreshnessIndicator';
import './SafetyDashboardOverview.css';

// KPI 카드 컴포넌트
function KpiCard({ icon: Icon, label, value, status, subText, onClick }) {
  return (
    <div 
      className={`kpi-card-v2 kpi-card-v2--${status}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="kpi-card-v2__icon">
        <Icon size={20} />
      </div>
      <div className="kpi-card-v2__content">
        <span className="kpi-card-v2__value">{value}</span>
        <span className="kpi-card-v2__label">{label}</span>
      </div>
      {subText && (
        <span className="kpi-card-v2__sub">{subText}</span>
      )}
      {onClick && (
        <ChevronRight size={16} className="kpi-card-v2__arrow" />
      )}
    </div>
  );
}

// 가장 위험한 구역 카드
function TopRiskZone({ zone, rank, onClick }) {
  const statusClass = zone.status === 'DANGER' ? 'danger' : 'warning';
  const zoneName = zone.dongNo || zone.facilityName || '알 수 없음';
  
  return (
    <div 
      className={`top-risk-zone top-risk-zone--${statusClass}`}
      onClick={() => onClick && onClick(zone)}
    >
      <span className="top-risk-zone__rank">#{rank}</span>
      <div className="top-risk-zone__content">
        <span className="top-risk-zone__name">{zoneName}</span>
        <span className="top-risk-zone__reason">
          {zone.reason === 'FIRE_SMOKE' ? '연기 감지' : 
           zone.reason === 'HEAT' ? '고온 감지' : 
           zone.reason || '-'}
        </span>
      </div>
      <span className={`top-risk-zone__status top-risk-zone__status--${statusClass}`}>
        {zone.status === 'DANGER' ? '위험' : '주의'}
      </span>
    </div>
  );
}

export function SafetyDashboardOverview({
  safetyStatus = [],
  eventLogs = [],
  sensorLogs = [],
  lastUpdated,
  isRefreshing = false,
  isOnline = true,
  onRefresh,
  onZoneSelect,
  onAlertAcknowledge,
}) {
  const [selectedAlertId, setSelectedAlertId] = useState(null);

  // KPI 계산
  const kpis = useMemo(() => {
    const dangerZones = safetyStatus.filter(s => s.status === 'DANGER');
    const warningZones = safetyStatus.filter(s => s.status === 'WARNING');
    
    // 미인지 경보 (acknowledged 플래그가 없거나 false인 DANGER 상태)
    const unacknowledged = [...dangerZones, ...warningZones].filter(
      s => !s.acknowledged
    );

    // 오프라인 센서 (실제로는 센서 상태 API가 필요하지만, 여기서는 시뮬레이션)
    const offlineSensors = sensorLogs.filter(s => s.status === 'OFFLINE').length;

    return {
      activeAlarms: dangerZones.length + warningZones.length,
      unacknowledged: unacknowledged.length,
      offlineSensors: offlineSensors,
    };
  }, [safetyStatus, sensorLogs]);

  // 가장 위험한 구역 TOP 3
  const topRiskZones = useMemo(() => {
    return safetyStatus
      .filter(s => s.status === 'DANGER' || s.status === 'WARNING')
      .sort((a, b) => {
        // DANGER > WARNING
        if (a.status !== b.status) {
          return a.status === 'DANGER' ? -1 : 1;
        }
        // 같은 상태면 updatedAt 최신순
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      })
      .slice(0, 3);
  }, [safetyStatus]);

  // 경보용 데이터 (safetyStatus를 alert 형태로 변환)
  const alertsData = useMemo(() => {
    return safetyStatus
      .filter(s => s.status === 'DANGER' || s.status === 'WARNING')
      .map(s => ({
        ...s,
        id: s.id || `${s.dongNo || s.facilityName}-${s.updatedAt}`,
        eventAt: s.updatedAt,
      }));
  }, [safetyStatus]);

  return (
    <div className="safety-overview">
      {/* ===== 상단: KPI 영역 ===== */}
      <section className="safety-overview__kpi">
        <KpiCard
          icon={ShieldAlert}
          label="활성 경보"
          value={kpis.activeAlarms}
          status={kpis.activeAlarms > 0 ? 'danger' : 'success'}
          subText={kpis.activeAlarms > 0 ? '즉시 확인 필요' : '모두 정상'}
        />
        <KpiCard
          icon={AlertCircle}
          label="미확인"
          value={kpis.unacknowledged}
          status={kpis.unacknowledged > 0 ? 'warning' : 'neutral'}
          subText={kpis.unacknowledged > 0 ? '인지 대기 중' : '모두 확인됨'}
        />
        <KpiCard
          icon={WifiOff}
          label="오프라인 센서"
          value={kpis.offlineSensors}
          status={kpis.offlineSensors > 0 ? 'offline' : 'neutral'}
          subText={kpis.offlineSensors > 0 ? '연결 확인 필요' : '모두 정상'}
        />
      </section>

      {/* ===== 메인 그리드 ===== */}
      <div className="safety-overview__main">
        {/* 좌측: 우선순위 경보 패널 */}
        <aside className="safety-overview__alerts">
          <ActiveAlertsPanel
            alerts={alertsData}
            onAcknowledge={onAlertAcknowledge}
            onSelect={(alert) => {
              setSelectedAlertId(alert.id);
              onZoneSelect && onZoneSelect(alert);
            }}
            selectedAlertId={selectedAlertId}
          />

          {/* 가장 위험한 구역 */}
          {topRiskZones.length > 0 && (
            <div className="top-risk-section">
              <h4>
                <TrendingUp size={16} />
                위험 구역 TOP {topRiskZones.length}
              </h4>
              <div className="top-risk-list">
                {topRiskZones.map((zone, idx) => (
                  <TopRiskZone
                    key={zone.id || idx}
                    zone={zone}
                    rank={idx + 1}
                    onClick={onZoneSelect}
                  />
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* 우측: 사건 타임라인 */}
        <section className="safety-overview__timeline">
          <IncidentTimeline
            events={eventLogs}
            maxIncidents={8}
            onIncidentSelect={(incident) => {
              // 인시던트의 첫 이벤트 구역 선택
              if (incident.events.length > 0) {
                onZoneSelect && onZoneSelect(incident.events[0]);
              }
            }}
          />
        </section>
      </div>

      {/* ===== 하단: 데이터 신선도 ===== */}
      <footer className="safety-overview__footer">
        <DataFreshnessIndicator
          lastUpdated={lastUpdated}
          isOnline={isOnline}
          isRefreshing={isRefreshing}
          onRefresh={onRefresh}
          showDetails={true}
        />
      </footer>
    </div>
  );
}
