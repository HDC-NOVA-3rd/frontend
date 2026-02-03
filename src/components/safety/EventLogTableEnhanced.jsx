/**
 * EventLogTable (개선 버전) - 이벤트 로그 테이블
 * 
 * 
 * - 그룹핑: 동일 센서·동일 코드 반복은 접어서 표시
 * - 필터: 심각도, 미인지 여부, 구역 필터
 * - 정렬: 최신 + 심각도 우선 (미확인 우선 옵션)
 * - 노이즈 제어: 반복 이벤트 카운트 표시
 */

import { useState, useMemo } from 'react';
import { 
  Filter, 
  ChevronDown, 
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Layers,
  X
} from 'lucide-react';
import { formatDateTime } from '../../utils/dateFormat';
import { StatusIndicator } from './StatusIndicator';
import './EventLogTableEnhanced.css';

// 이벤트를 그룹핑하는 함수 (동일 구역 + 동일 타입 + 5분 이내)
const groupEvents = (logs) => {
  if (!logs || logs.length === 0) return [];

  const sorted = [...logs].sort(
    (a, b) => new Date(b.timestamp || b.eventAt).getTime() - new Date(a.timestamp || a.eventAt).getTime()
  );

  const groups = [];
  let currentGroup = null;

  sorted.forEach((log) => {
    const logTime = new Date(log.timestamp || log.eventAt).getTime();
    const logKey = `${log.location || log.dongNo || log.facilityName}-${log.eventType || log.sensorType}-${log.status || log.statusTo}`;

    const shouldStartNew =
      !currentGroup ||
      currentGroup.key !== logKey ||
      logTime < currentGroup.latestTime - 5 * 60 * 1000;

    if (shouldStartNew) {
      if (currentGroup) {
        groups.push(currentGroup);
      }
      currentGroup = {
        id: log.id || `group-${logTime}`,
        key: logKey,
        latestTime: logTime,
        logs: [log],
        representative: log, // 대표 이벤트
      };
    } else {
      currentGroup.logs.push(log);
    }
  });

  if (currentGroup) {
    groups.push(currentGroup);
  }

  return groups;
};

// 필터 옵션
const FILTER_OPTIONS = {
  severity: [
    { value: 'all', label: '전체' },
    { value: 'danger', label: '위험' },
    { value: 'warning', label: '주의' },
    { value: 'normal', label: '정상' },
  ],
  acknowledged: [
    { value: 'all', label: '전체' },
    { value: 'unacknowledged', label: '미확인만' },
    { value: 'acknowledged', label: '확인됨' },
  ],
};

export function EventLogTableEnhanced({ 
  logs = [], 
  loading = false,
  onAcknowledge,
  showFilters = true,
  enableGrouping = true,
  maxItems
}) {
  // 필터 상태
  const [filters, setFilters] = useState({
    severity: 'all',
    acknowledged: 'all',
    zone: '',
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [expandedGroupIds, setExpandedGroupIds] = useState(new Set());

  // 필터링된 로그
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // 심각도 필터
    if (filters.severity !== 'all') {
      result = result.filter((log) => {
        const status = (log.status || log.statusTo || '').toLowerCase();
        return status === filters.severity;
      });
    }

    // 미인지 필터
    if (filters.acknowledged === 'unacknowledged') {
      result = result.filter((log) => !log.acknowledged);
    } else if (filters.acknowledged === 'acknowledged') {
      result = result.filter((log) => log.acknowledged);
    }

    // 구역 필터
    if (filters.zone) {
      const zoneQuery = filters.zone.toLowerCase();
      result = result.filter((log) => {
        const location = (log.location || log.dongNo || log.facilityName || '').toLowerCase();
        return location.includes(zoneQuery);
      });
    }

    return result;
  }, [logs, filters]);

  // 그룹핑된 로그
  const groupedLogs = useMemo(() => {
    if (!enableGrouping) {
      return filteredLogs.map((log) => ({
        id: log.id,
        key: log.id,
        logs: [log],
        representative: log,
      }));
    }
    return groupEvents(filteredLogs);
  }, [filteredLogs, enableGrouping]);

  // 표시할 로그 (maxItems 적용)
  const displayLogs = maxItems ? groupedLogs.slice(0, maxItems) : groupedLogs;

  // 그룹 토글
  const toggleGroup = (groupId) => {
    setExpandedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      severity: 'all',
      acknowledged: 'all',
      zone: '',
    });
  };

  // 활성 필터 개수
  const activeFilterCount = [
    filters.severity !== 'all',
    filters.acknowledged !== 'all',
    filters.zone !== '',
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className="event-log-enhanced">
        <div className="event-log-enhanced__loading">
          <div className="loading-spinner" />
          <p>로그를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="event-log-enhanced">
      {/* 헤더 */}
      <div className="event-log-enhanced__header">
        <div className="event-log-enhanced__title">
          <Layers size={18} />
          <h3>이벤트 로그</h3>
          <span className="event-log-enhanced__count">{filteredLogs.length}건</span>
        </div>

        {showFilters && (
          <div className="event-log-enhanced__actions">
            <button
              className={`filter-toggle-btn ${showFilterPanel ? 'active' : ''}`}
              onClick={() => setShowFilterPanel(!showFilterPanel)}
            >
              <Filter size={14} />
              필터
              {activeFilterCount > 0 && (
                <span className="filter-badge">{activeFilterCount}</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 필터 패널 */}
      {showFilterPanel && (
        <div className="event-log-enhanced__filters">
          <div className="filter-group">
            <label>심각도</label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            >
              {FILTER_OPTIONS.severity.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>확인 상태</label>
            <select
              value={filters.acknowledged}
              onChange={(e) => setFilters({ ...filters, acknowledged: e.target.value })}
            >
              {FILTER_OPTIONS.acknowledged.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>구역 검색</label>
            <input
              type="text"
              placeholder="동/시설명 입력..."
              value={filters.zone}
              onChange={(e) => setFilters({ ...filters, zone: e.target.value })}
            />
          </div>

          {activeFilterCount > 0 && (
            <button className="filter-reset-btn" onClick={resetFilters}>
              <X size={12} />
              필터 초기화
            </button>
          )}
        </div>
      )}

      {/* 로그 없음 */}
      {displayLogs.length === 0 ? (
        <div className="event-log-enhanced__empty">
          <span className="event-log-enhanced__empty-icon">📋</span>
          <p>
            {activeFilterCount > 0
              ? '필터 조건에 맞는 이벤트가 없습니다.'
              : '이벤트 기록이 없습니다.'}
          </p>
        </div>
      ) : (
        /* 테이블 */
        <div className="event-log-enhanced__table-wrapper">
          <table className="event-log-enhanced__table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>상태</th>
                <th>이벤트</th>
                <th>위치</th>
                <th>발생 시간</th>
                <th>확인</th>
              </tr>
            </thead>
            <tbody>
              {displayLogs.map((group) => {
                const isExpanded = expandedGroupIds.has(group.id);
                const hasMultiple = group.logs.length > 1;
                const rep = group.representative;

                return (
                  <>
                    {/* 대표 행 */}
                    <tr
                      key={group.id}
                      className={`event-row event-row--${(rep.status || rep.statusTo || 'normal').toLowerCase()} ${
                        hasMultiple ? 'event-row--grouped' : ''
                      } ${!rep.acknowledged ? 'event-row--unacknowledged' : ''}`}
                    >
                      {/* 확장 버튼 */}
                      <td className="event-row__expand-cell">
                        {hasMultiple && (
                          <button
                            className="expand-btn"
                            onClick={() => toggleGroup(group.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown size={14} />
                            ) : (
                              <ChevronRight size={14} />
                            )}
                          </button>
                        )}
                      </td>

                      {/* 상태 */}
                      <td>
                        <StatusIndicator status={rep.status || rep.statusTo?.toLowerCase()} />
                      </td>

                      {/* 이벤트 타입 */}
                      <td className="event-row__type">
                        <span>{rep.eventType || rep.sensorType || '-'}</span>
                        {hasMultiple && (
                          <span className="repeat-badge">+{group.logs.length - 1}</span>
                        )}
                      </td>

                      {/* 위치 */}
                      <td className="event-row__location">
                        <MapPin size={12} />
                        <span>{rep.location || rep.dongNo || rep.facilityName || '-'}</span>
                      </td>

                      {/* 시간 */}
                      <td className="event-row__time">
                        <Clock size={12} />
                        <span>{formatDateTime(rep.timestamp || rep.eventAt)}</span>
                      </td>

                      {/* 인지 버튼 */}
                      <td className="event-row__action">
                        {rep.acknowledged ? (
                          <span className="acknowledged-badge">
                            <CheckCircle2 size={12} />
                            확인됨
                          </span>
                        ) : onAcknowledge ? (
                          <button
                            className="acknowledge-btn"
                            onClick={() => onAcknowledge(rep)}
                          >
                            인지
                          </button>
                        ) : (
                          <span className="unacknowledged-badge">
                            <AlertTriangle size={12} />
                            미확인
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* 확장된 하위 이벤트들 */}
                    {isExpanded &&
                      group.logs.slice(1).map((log, idx) => (
                        <tr
                          key={`${group.id}-${idx}`}
                          className={`event-row event-row--child event-row--${(log.status || log.statusTo || 'normal').toLowerCase()}`}
                        >
                          <td></td>
                          <td>
                            <StatusIndicator status={log.status || log.statusTo?.toLowerCase()} />
                          </td>
                          <td className="event-row__type">
                            {log.eventType || log.sensorType || '-'}
                          </td>
                          <td className="event-row__location">
                            <MapPin size={12} />
                            <span>{log.location || log.dongNo || log.facilityName || '-'}</span>
                          </td>
                          <td className="event-row__time">
                            <Clock size={12} />
                            <span>{formatDateTime(log.timestamp || log.eventAt)}</span>
                          </td>
                          <td className="event-row__action">
                            {log.acknowledged ? (
                              <span className="acknowledged-badge">
                                <CheckCircle2 size={12} />
                              </span>
                            ) : (
                              <span className="unacknowledged-badge">
                                <AlertTriangle size={12} />
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// 기존 EventLogTable 호환을 위한 export
export { EventLogTableEnhanced as EventLogTable };
