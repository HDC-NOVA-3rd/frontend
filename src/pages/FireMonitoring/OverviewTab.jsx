/**
 * 개요 탭 - 센서 상태 카드 + 시스템 로그
 */

import { StatusCard, SystemLogPanel } from '../../components/safety';
import { LoadingSpinner, ErrorMessage } from '../../components/common';
import './OverviewTab.css';

export function OverviewTab({ 
  safetyStatus, 
  eventLog, 
  loading, 
  error,
  onRefresh 
}) {
  if (loading && !safetyStatus) {
    return <LoadingSpinner message="안전 상태를 불러오는 중..." />;
  }

  if (error && !safetyStatus) {
    return <ErrorMessage error={error} onRetry={onRefresh} />;
  }

  // 안전 상태 데이터에서 센서 카드 정보 추출
  const sensorCards = [
    {
      type: 'electric',
      title: '전기 상태',
      status: safetyStatus?.electricStatus || 'unknown',
      value: safetyStatus?.electricValue,
      unit: 'kW',
      description: safetyStatus?.electricDescription,
    },
    {
      type: 'gas',
      title: '가스 상태',
      status: safetyStatus?.gasStatus || 'unknown',
      value: safetyStatus?.gasValue,
      unit: 'ppm',
      description: safetyStatus?.gasDescription,
    },
    {
      type: 'temperature',
      title: '온도 상태',
      status: safetyStatus?.temperatureStatus || 'unknown',
      value: safetyStatus?.temperatureValue,
      unit: '°C',
      description: safetyStatus?.temperatureDescription,
    },
    {
      type: 'fire',
      title: '화재 감지',
      status: safetyStatus?.fireStatus || 'unknown',
      description: safetyStatus?.fireDescription,
    },
  ];

  // 이벤트 로그에서 시스템 로그 형태로 변환
  const systemLogs = (eventLog?.logs || []).map((log) => ({
    id: log.id,
    status: log.status,
    message: log.description || log.eventType,
    timestamp: log.timestamp,
  }));

  return (
    <div className="overview-tab">
      <section className="overview-tab__section">
        <h2 className="overview-tab__section-title">센서 상태</h2>
        <div className="overview-tab__cards">
          {sensorCards.map((card) => (
            <StatusCard
              key={card.type}
              type={card.type}
              title={card.title}
              status={card.status}
              value={card.value}
              unit={card.unit}
              description={card.description}
            />
          ))}
        </div>
      </section>

      <section className="overview-tab__section">
        <SystemLogPanel 
          title="최근 이벤트" 
          logs={systemLogs} 
          maxItems={5} 
        />
      </section>
    </div>
  );
}
