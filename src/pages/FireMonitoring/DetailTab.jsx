/**
 * 상세 로그 탭 - 이벤트 로그 + 센서 로그 테이블
 */

import { useState } from 'react';
import { EventLogTable, SensorLogTable } from '../../components/safety';
import { LoadingSpinner, ErrorMessage } from '../../components/common';
import './DetailTab.css';

export function DetailTab({ 
  eventLog, 
  sensorLog, 
  eventLoading,
  sensorLoading,
  eventError,
  sensorError,
  onRefresh 
}) {
  const [activeSubTab, setActiveSubTab] = useState('event');

  return (
    <div className="detail-tab">
      <div className="detail-tab__sub-tabs">
        <button
          className={`detail-tab__sub-tab ${activeSubTab === 'event' ? 'detail-tab__sub-tab--active' : ''}`}
          onClick={() => setActiveSubTab('event')}
        >
          📋 이벤트 로그
        </button>
        <button
          className={`detail-tab__sub-tab ${activeSubTab === 'sensor' ? 'detail-tab__sub-tab--active' : ''}`}
          onClick={() => setActiveSubTab('sensor')}
        >
          🔌 센서 로그
        </button>
      </div>

      <div className="detail-tab__content">
        {activeSubTab === 'event' && (
          <>
            {eventError ? (
              <ErrorMessage error={eventError} onRetry={onRefresh} />
            ) : (
              <EventLogTable 
                logs={eventLog?.logs || []} 
                loading={eventLoading} 
              />
            )}
          </>
        )}

        {activeSubTab === 'sensor' && (
          <>
            {sensorError ? (
              <ErrorMessage error={sensorError} onRetry={onRefresh} />
            ) : (
              <SensorLogTable 
                logs={sensorLog?.logs || []} 
                loading={sensorLoading} 
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
