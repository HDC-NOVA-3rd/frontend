/**
 * 이벤트 로그 테이블 (상세 목록)
 */

import { formatDateTime } from '../../utils/dateFormat';
import { StatusIndicator } from './StatusIndicator';
import './EventLogTable.css';

export function EventLogTable({ logs = [], loading = false }) {
  if (loading) {
    return (
      <div className="event-log-table">
        <div className="event-log-table__loading">
          로그를 불러오는 중...
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="event-log-table">
        <div className="event-log-table__empty">
          <span className="event-log-table__empty-icon">📋</span>
          <p>이벤트 기록이 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="event-log-table">
      <table className="event-log-table__table">
        <thead>
          <tr>
            <th>상태</th>
            <th>이벤트 타입</th>
            <th>설명</th>
            <th>위치</th>
            <th>발생 시간</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <tr key={log.id || index} className="event-log-table__row">
              <td>
                <StatusIndicator status={log.status} />
              </td>
              <td className="event-log-table__type">{log.eventType}</td>
              <td className="event-log-table__description">{log.description}</td>
              <td className="event-log-table__location">{log.location || '-'}</td>
              <td className="event-log-table__time">
                {formatDateTime(log.timestamp)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
