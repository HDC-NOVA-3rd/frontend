/**
 * 센서 상태 카드 (전기/가스/온도/화재)
 */

import { StatusIndicator } from './StatusIndicator';
import './StatusCard.css';

const SENSOR_ICONS = {
  electric: '⚡',
  gas: '🔥',
  temperature: '🌡️',
  fire: '🚨',
  community: '🏢',
};

export function StatusCard({ 
  type = 'electric', 
  title, 
  status = 'unknown', 
  value,
  unit,
  description,
  onClick 
}) {
  const icon = SENSOR_ICONS[type] || '📊';

  return (
    <div 
      className={`status-card status-card--${status}`} 
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="status-card__header">
        <span className="status-card__icon">{icon}</span>
        <span className="status-card__title">{title}</span>
      </div>
      
      <div className="status-card__body">
        <div className="status-card__status">
          <StatusIndicator status={status} />
        </div>
        
        {value !== undefined && (
          <div className="status-card__value">
            <span className="status-card__value-number">{value}</span>
            {unit && <span className="status-card__value-unit">{unit}</span>}
          </div>
        )}
      </div>
      
      {description && (
        <p className="status-card__description">{description}</p>
      )}
    </div>
  );
}
