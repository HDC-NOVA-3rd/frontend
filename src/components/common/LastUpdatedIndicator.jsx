/**
 * 마지막 업데이트 시간 표시 컴포넌트
 */

import { getTimeAgo } from '../../utils/dateFormat';
import './LastUpdatedIndicator.css';

export function LastUpdatedIndicator({ timestamp, onRefresh }) {
  const timeAgo = timestamp ? getTimeAgo(timestamp) : '-';

  return (
    <div className="last-updated">
      <span className="last-updated__icon">🔄</span>
      <span className="last-updated__text">
        마지막 업데이트: {timeAgo}
      </span>
      {onRefresh && (
        <button 
          className="last-updated__refresh-btn" 
          onClick={onRefresh}
          title="새로고침"
        >
          새로고침
        </button>
      )}
    </div>
  );
}
