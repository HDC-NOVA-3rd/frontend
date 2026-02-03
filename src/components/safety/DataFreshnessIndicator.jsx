/**
 * DataFreshnessIndicator - 데이터 신선도 표시기
 * 
 * 신뢰성(Trust over beauty)
 * - 데이터가 언제 갱신되었는지 항상 표시
 * - 지연 발생 시 명확히 경고
 * - 오프라인/연결 끊김 상태 표시
 */

import { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Loader2
} from 'lucide-react';
import './DataFreshnessIndicator.css';

// 상태 판정 기준 (ms)
const FRESHNESS_THRESHOLDS = {
  FRESH: 10000,      // 10초 이내: 신선
  STALE: 30000,      // 30초 이내: 약간 지연
  DELAYED: 60000,    // 1분 이내: 지연
  CRITICAL: 120000,  // 2분 초과: 심각한 지연
};

const getFreshnessStatus = (lastUpdated, isOnline = true) => {
  if (!isOnline) {
    return {
      status: 'offline',
      label: '오프라인',
      description: '서버 연결이 끊어졌습니다',
      className: 'freshness--offline',
      icon: WifiOff,
    };
  }

  if (!lastUpdated) {
    return {
      status: 'unknown',
      label: '알 수 없음',
      description: '데이터를 불러오는 중...',
      className: 'freshness--unknown',
      icon: Clock,
    };
  }

  const now = Date.now();
  const elapsed = now - new Date(lastUpdated).getTime();

  if (elapsed < FRESHNESS_THRESHOLDS.FRESH) {
    return {
      status: 'fresh',
      label: '실시간',
      description: '데이터가 최신 상태입니다',
      className: 'freshness--fresh',
      icon: CheckCircle2,
    };
  }

  if (elapsed < FRESHNESS_THRESHOLDS.STALE) {
    return {
      status: 'stale',
      label: `${Math.floor(elapsed / 1000)}초 전`,
      description: '약간의 지연이 있습니다',
      className: 'freshness--stale',
      icon: Clock,
    };
  }

  if (elapsed < FRESHNESS_THRESHOLDS.DELAYED) {
    return {
      status: 'delayed',
      label: `${Math.floor(elapsed / 1000)}초 지연`,
      description: '데이터 갱신이 지연되고 있습니다',
      className: 'freshness--delayed',
      icon: AlertTriangle,
    };
  }

  const delayedMin = Math.floor(elapsed / 60000);
  return {
    status: 'critical',
    label: `${delayedMin}분 이상 지연`,
    description: '심각한 데이터 지연! 확인이 필요합니다',
    className: 'freshness--critical',
    icon: AlertTriangle,
  };
};

export function DataFreshnessIndicator({ 
  lastUpdated, 
  isOnline = true,
  isRefreshing = false,
  onRefresh,
  pollingInterval = 5000,
  showDetails = false,
  compact = false
}) {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [freshness, setFreshness] = useState(() => 
    getFreshnessStatus(lastUpdated, isOnline)
  );

  // 매초 업데이트하여 경과 시간 표시
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
      setFreshness(getFreshnessStatus(lastUpdated, isOnline));
    }, 1000);

    return () => clearInterval(timer);
  }, [lastUpdated, isOnline]);

  // 마지막 업데이트 시간 포맷
  const formatLastUpdated = () => {
    if (!lastUpdated) return '-';
    return new Date(lastUpdated).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const IconComponent = freshness.icon;

  // Compact 버전 (헤더용)
  if (compact) {
    return (
      <div className={`data-freshness data-freshness--compact ${freshness.className}`}>
        {isRefreshing ? (
          <Loader2 size={14} className="spinning" />
        ) : (
          <IconComponent size={14} />
        )}
        <span className="data-freshness__label">{freshness.label}</span>
        {onRefresh && (
          <button 
            className="data-freshness__refresh-btn"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="수동 새로고침"
          >
            <RefreshCw size={12} className={isRefreshing ? 'spinning' : ''} />
          </button>
        )}
      </div>
    );
  }

  // Full 버전
  return (
    <div className={`data-freshness ${freshness.className}`}>
      {/* 상태 아이콘 */}
      <div className="data-freshness__status">
        {isRefreshing ? (
          <Loader2 size={16} className="spinning" />
        ) : (
          <IconComponent size={16} />
        )}
      </div>

      {/* 라벨 */}
      <div className="data-freshness__content">
        <span className="data-freshness__label">{freshness.label}</span>
        {showDetails && (
          <span className="data-freshness__time">
            {formatLastUpdated()} 업데이트
          </span>
        )}
      </div>

      {/* 실시간 표시 (신선할 때만) */}
      {freshness.status === 'fresh' && (
        <div className="data-freshness__live">
          <span className="pulse-dot" />
          LIVE
        </div>
      )}

      {/* 새로고침 버튼 */}
      {onRefresh && (
        <button 
          className="data-freshness__refresh-btn"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="수동 새로고침"
        >
          <RefreshCw size={14} className={isRefreshing ? 'spinning' : ''} />
        </button>
      )}

      {/* 지연 경고 배너 (심각할 때만) */}
      {(freshness.status === 'delayed' || freshness.status === 'critical') && (
        <div className="data-freshness__warning-banner">
          <AlertTriangle size={12} />
          <span>{freshness.description}</span>
        </div>
      )}
    </div>
  );
}

/**
 * ConnectionStatus - 연결 상태 표시 (하단 고정용)
 */
export function ConnectionStatus({ 
  isOnline = true, 
  lastUpdated,
  pollingInterval = 5000 
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className={`connection-status ${isOnline ? 'connection-status--online' : 'connection-status--offline'}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
      <span>{isOnline ? '연결됨' : '연결 끊김'}</span>
      
      {showTooltip && (
        <div className="connection-status__tooltip">
          <p>폴링 간격: {pollingInterval / 1000}초</p>
          {lastUpdated && (
            <p>마지막 갱신: {new Date(lastUpdated).toLocaleTimeString('ko-KR')}</p>
          )}
        </div>
      )}
    </div>
  );
}
