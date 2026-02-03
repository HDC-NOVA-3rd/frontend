/**
 * 센서 로그 테이블
 */

import { formatDateTime } from '../../utils/dateFormat';
import { StatusIndicator } from './StatusIndicator';
import './SensorLogTable.css';

const SENSOR_TYPE_LABELS = {
  electric: '전기',
  gas: '가스',
  temperature: '온도',
  fire: '화재',
  community: '공용시설',
};

export function SensorLogTable({ logs = [], loading = false }) {
  if (loading) {
    return (
      <div className="sensor-log-table">
        <div className="sensor-log-table__loading">
          센서 로그를 불러오는 중...
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="sensor-log-table">
        <div className="sensor-log-table__empty">
          <span className="sensor-log-table__empty-icon">🔌</span>
          <p>센서 로그가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sensor-log-table">
      <table className="sensor-log-table__table">
        <thead>
          <tr>
            <th>상태</th>
            <th>센서 종류</th>
            <th>센서명</th>
            <th>측정값</th>
            <th>위치</th>
            <th>측정 시간</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <tr key={log.id || index} className="sensor-log-table__row">
              <td>
                <StatusIndicator status={log.status} showLabel={false} />
              </td>
              <td className="sensor-log-table__type">
                {SENSOR_TYPE_LABELS[log.sensorType] || log.sensorType}
              </td>
              <td className="sensor-log-table__name">{log.sensorName}</td>
              <td className="sensor-log-table__value">
                <span className="sensor-log-table__value-number">
                  {log.value}
                </span>
                {log.unit && (
                  <span className="sensor-log-table__value-unit">
                    {log.unit}
                  </span>
                )}
              </td>
              <td className="sensor-log-table__location">{log.location || '-'}</td>
              <td className="sensor-log-table__time">
                {formatDateTime(log.timestamp)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
