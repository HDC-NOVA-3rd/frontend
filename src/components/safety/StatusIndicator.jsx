/**
 * 상태 표시 인디케이터 (정상/주의/위험)
 */

import './StatusIndicator.css';

const STATUS_CONFIG = {
  normal: {
    label: '정상',
    className: 'status-indicator--normal',
  },
  warning: {
    label: '주의',
    className: 'status-indicator--warning',
  },
  danger: {
    label: '위험',
    className: 'status-indicator--danger',
  },
  unknown: {
    label: '알 수 없음',
    className: 'status-indicator--unknown',
  },
};

export function StatusIndicator({ status = 'unknown', showLabel = true }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;

  return (
    <span className={`status-indicator ${config.className}`}>
      <span className="status-indicator__dot"></span>
      {showLabel && (
        <span className="status-indicator__label">{config.label}</span>
      )}
    </span>
  );
}
