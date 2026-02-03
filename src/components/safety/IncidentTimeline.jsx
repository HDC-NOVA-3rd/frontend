/**
 * IncidentTimeline - 사건 타임라인 컴포넌트
 * 
 *  개별 이벤트 나열이 아닌 "Incident" 단위로 묶어서 맥락 제공
 * - 어떤 센서들이 어떤 순서로 트리거됐는지
 * - 인접 구역 확산 여부
 * - 조치 이력 (인지/해제/메모)
 */

import { useState } from 'react';
import { 
  Clock, 
  ChevronDown, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wind,
  ThermometerSun,
  User,
  MessageSquare,
  ArrowRight,
  MapPin
} from 'lucide-react';
import './IncidentTimeline.css';

// 시간 포맷팅
const formatTime = (isoString) => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleTimeString('ko-KR', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
};

const formatDate = (isoString) => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  
  if (isToday) return '오늘';
  
  return date.toLocaleDateString('ko-KR', { 
    month: 'short', 
    day: 'numeric' 
  });
};

// 이벤트를 Incident로 그룹핑 (동일 구역 + 5분 이내 연속 이벤트)
const groupEventsToIncidents = (events) => {
  if (!events || events.length === 0) return [];

  const sorted = [...events].sort(
    (a, b) => new Date(b.eventAt).getTime() - new Date(a.eventAt).getTime()
  );

  const incidents = [];
  let currentIncident = null;

  sorted.forEach((event) => {
    const eventTime = new Date(event.eventAt).getTime();
    const zoneName = event.dongNo || event.facilityName || 'unknown';

    // 새 Incident 시작 조건:
    // 1) 첫 이벤트
    // 2) 이전 이벤트와 5분 이상 차이
    // 3) 다른 구역
    const shouldStartNew =
      !currentIncident ||
      eventTime < currentIncident.startTime - 5 * 60 * 1000 ||
      currentIncident.zone !== zoneName;

    if (shouldStartNew) {
      if (currentIncident) {
        incidents.push(currentIncident);
      }
      currentIncident = {
        id: `incident-${event.id || eventTime}`,
        zone: zoneName,
        startTime: eventTime,
        endTime: eventTime,
        events: [event],
        status: event.statusTo,
        severity: event.statusTo === 'DANGER' ? 'high' : 'medium',
        acknowledged: event.acknowledged || false,
      };
    } else {
      currentIncident.events.push(event);
      currentIncident.endTime = eventTime;
      // 가장 심각한 상태로 업데이트
      if (event.statusTo === 'DANGER') {
        currentIncident.status = 'DANGER';
        currentIncident.severity = 'high';
      }
    }
  });

  if (currentIncident) {
    incidents.push(currentIncident);
  }

  return incidents;
};

// 이벤트 아이콘
const getEventIcon = (event) => {
  if (event.sensorType === 'SMOKE') return <Wind size={14} />;
  if (event.sensorType === 'HEAT') return <ThermometerSun size={14} />;
  if (event.manual) return <User size={14} />;
  return <AlertTriangle size={14} />;
};

// 상태 변화 라벨
const getStatusChangeLabel = (statusTo) => {
  const labels = {
    'DANGER': '위험 감지',
    'SAFE': '정상 복귀',
    'WARNING': '주의 발생',
  };
  return labels[statusTo] || statusTo;
};

export function IncidentTimeline({ 
  events = [], 
  maxIncidents = 10,
  onIncidentSelect,
  selectedIncidentId
}) {
  const [expandedIncidentId, setExpandedIncidentId] = useState(null);

  const incidents = groupEventsToIncidents(events).slice(0, maxIncidents);

  const handleToggleExpand = (incidentId) => {
    setExpandedIncidentId(expandedIncidentId === incidentId ? null : incidentId);
  };

  if (incidents.length === 0) {
    return (
      <div className="incident-timeline incident-timeline--empty">
        <div className="incident-timeline__header">
          <Clock size={18} />
          <h3>사건 타임라인</h3>
        </div>
        <div className="incident-timeline__empty-state">
          <CheckCircle2 size={32} />
          <p>기록된 사건이 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="incident-timeline">
      {/* 헤더 */}
      <div className="incident-timeline__header">
        <Clock size={18} />
        <h3>사건 타임라인</h3>
        <span className="incident-timeline__count">{incidents.length}건</span>
      </div>

      {/* 타임라인 */}
      <div className="incident-timeline__list">
        {incidents.map((incident, idx) => {
          const isExpanded = expandedIncidentId === incident.id;
          const isSelected = selectedIncidentId === incident.id;
          const eventCount = incident.events.length;
          const isResolved = incident.status === 'SAFE';

          return (
            <div 
              key={incident.id}
              className={`
                incident-item 
                incident-item--${incident.severity}
                ${isResolved ? 'incident-item--resolved' : ''}
                ${isSelected ? 'incident-item--selected' : ''}
              `}
            >
              {/* 타임라인 커넥터 */}
              <div className="incident-item__connector">
                <div className={`incident-item__dot incident-item__dot--${incident.severity}`}>
                  {isResolved ? (
                    <CheckCircle2 size={12} />
                  ) : (
                    <AlertTriangle size={12} />
                  )}
                </div>
                {idx < incidents.length - 1 && (
                  <div className="incident-item__line" />
                )}
              </div>

              {/* 사건 카드 */}
              <div 
                className="incident-item__card"
                onClick={() => {
                  handleToggleExpand(incident.id);
                  onIncidentSelect && onIncidentSelect(incident);
                }}
              >
                {/* 카드 헤더 */}
                <div className="incident-item__header">
                  <div className="incident-item__meta">
                    <span className="incident-item__date">
                      {formatDate(incident.events[0]?.eventAt)}
                    </span>
                    <span className="incident-item__time">
                      {formatTime(incident.events[0]?.eventAt)}
                    </span>
                  </div>
                  <button className="incident-item__expand-btn">
                    <ChevronDown 
                      size={16} 
                      className={isExpanded ? 'rotated' : ''} 
                    />
                  </button>
                </div>

                {/* 카드 본문 */}
                <div className="incident-item__body">
                  <div className="incident-item__zone">
                    <MapPin size={14} />
                    <span>{incident.zone}</span>
                  </div>
                  <div className="incident-item__summary">
                    <span className={`incident-item__status incident-item__status--${incident.status.toLowerCase()}`}>
                      {getStatusChangeLabel(incident.status)}
                    </span>
                    {eventCount > 1 && (
                      <span className="incident-item__event-count">
                        +{eventCount - 1}개 이벤트
                      </span>
                    )}
                  </div>
                </div>

                {/* 확장 영역: 세부 이벤트 */}
                {isExpanded && (
                  <div className="incident-item__events">
                    {incident.events.map((event, eventIdx) => (
                      <div key={event.id || eventIdx} className="event-detail">
                        <div className="event-detail__time">
                          {formatTime(event.eventAt)}
                        </div>
                        <div className="event-detail__icon">
                          {getEventIcon(event)}
                        </div>
                        <div className="event-detail__content">
                          <span className="event-detail__type">
                            {event.manual ? '수동 조작' : event.sensorType || '감지'}
                          </span>
                          {event.value && (
                            <span className="event-detail__value">
                              {event.value}{event.unit}
                            </span>
                          )}
                          <span className={`event-detail__status event-detail__status--${event.statusTo.toLowerCase()}`}>
                            <ArrowRight size={10} />
                            {event.statusTo}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
