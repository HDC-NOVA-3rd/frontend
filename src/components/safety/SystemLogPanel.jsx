/**
 * 시스템 로그 패널 (최근 이벤트 요약)
 */

import { formatDateTime } from '../../utils/dateFormat';
import { StatusIndicator } from './StatusIndicator';
import './SystemLogPanel.css';

export function SystemLogPanel({ logs = [], maxItems = 5, title = '시스템 로그' }) {
  const displayLogs = logs.slice(0, maxItems);

  if (displayLogs.length === 0) {
    return (
      <div className="system-log-panel">
        <h3 className="system-log-panel__title">{title}</h3>
        <div className="system-log-panel__empty">
          <span className="system-log-panel__empty-icon">📋</span>
          <p>표시할 로그가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="system-log-panel">
      <h3 className="system-log-panel__title">{title}</h3>
      <ul className="system-log-panel__list">
        {displayLogs.map((log, index) => (
          <li key={log.id || index} className="system-log-panel__item">
            <div className="system-log-panel__item-status">
              <StatusIndicator status={log.status} showLabel={false} />
            </div>
            <div className="system-log-panel__item-content">
              <span className="system-log-panel__item-message">
                {log.message}
              </span>
              <span className="system-log-panel__item-time">
                {formatDateTime(log.timestamp)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
