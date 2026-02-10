/**
 * ActiveAlertsPanel - 우선순위 경보 패널
 *
 * "지금 처리해야 할 것"을 최상단 고정
 * - Active/Unacknowledged 경보만 표시
 * - 심각도 + 미인지 시간 기준 정렬
 * - 1클릭 인지(Acknowledge) 가능
 */

import { useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  CheckCircle2,
  ChevronRight,
  Flame,
  ThermometerSun,
  User,
  MessageSquare,
} from "lucide-react";
import "./ActiveAlertsPanel.css";

// 경과 시간 계산 (사람이 읽기 쉬운 형태)
const getElapsedTime = (isoString) => {
  if (!isoString) return "-";
  const now = new Date();
  const eventTime = new Date(isoString);
  const diffMs = now - eventTime;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return `${diffSec}초 전`;
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  return `${Math.floor(diffHour / 24)}일 전`;
};

// 긴급도 계산 (경보 우선순위)
const calculateUrgency = (alert) => {
  let score = 0;

  // 1. 심각도
  if (alert.status === "DANGER") score += 100;
  else if (alert.status === "WARNING") score += 50;

  // 2. 미인지 여부
  if (!alert.acknowledged) score += 30;

  // 3. 경과 시간 (오래될수록 긴급)
  const elapsed = Date.now() - new Date(alert.eventAt || alert.updatedAt).getTime();
  const elapsedMin = elapsed / 60000;
  if (elapsedMin > 10) score += 20;
  else if (elapsedMin > 5) score += 10;

  // 4. 센서 타입 (가스 > 고온)
  if (alert.reason === "GAS" || alert.sensorType === "GAS") score += 15;
  if (alert.reason === "HEAT" || alert.sensorType === "HEAT") score += 10;

  return score;
};

// 경보 아이콘 결정
const getAlertIcon = (alert) => {
  if (alert.reason === "GAS" || alert.sensorType === "GAS") {
    return <Flame size={16} />;
  }
  if (alert.reason === "HEAT" || alert.sensorType === "HEAT") {
    return <ThermometerSun size={16} />;
  }
  return <Flame size={16} />;
};

// 상태 라벨
const getStatusLabel = (status) => {
  const labels = {
    DANGER: "위험",
    WARNING: "주의",
    SAFE: "정상",
  };
  return labels[status] || status;
};

// 사유 라벨
const getReasonLabel = (reason, sensorType) => {
  const labels = {
    HEAT: "고온 감지",
    GAS: "가스 감지",
    MANUAL_LOCK: "수동 잠금",
  };
  return labels[reason] || labels[sensorType] || reason || "-";
};

export function ActiveAlertsPanel({
  alerts = [],
  onAcknowledge,
  onSelect,
  onAddNote,
  selectedAlertId,
}) {
  const [expandedId, setExpandedId] = useState(null);

  // 활성 경보만 필터 (DANGER, WARNING 상태 + 미해결)
  const activeAlerts = alerts
    .filter((a) => a.status === "DANGER" || a.status === "WARNING")
    .map((a) => ({ ...a, urgency: calculateUrgency(a) }))
    .sort((a, b) => b.urgency - a.urgency);

  const unacknowledgedCount = activeAlerts.filter((a) => !a.acknowledged).length;

  const handleAcknowledge = (e, alert) => {
    e.stopPropagation();
    if (onAcknowledge) {
      onAcknowledge(alert);
    }
  };

  const handleToggleExpand = (alertId) => {
    setExpandedId(expandedId === alertId ? null : alertId);
  };

  if (activeAlerts.length === 0) {
    return (
      <div className="active-alerts-panel active-alerts-panel--empty">
        <div className="active-alerts-panel__header">
          <ShieldAlert size={18} />
          <h3>활성 경보</h3>
          <span className="active-alerts-panel__count active-alerts-panel__count--zero">0</span>
        </div>
        <div className="active-alerts-panel__empty-state">
          <CheckCircle2 size={32} className="text-success" />
          <p>현재 처리해야 할 경보가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="active-alerts-panel">
      {/* 헤더 */}
      <div className="active-alerts-panel__header">
        <ShieldAlert size={18} />
        <h3>활성 경보</h3>
        <span className="active-alerts-panel__count">{activeAlerts.length}</span>
        {unacknowledgedCount > 0 && (
          <span className="active-alerts-panel__unack-badge">{unacknowledgedCount} 미확인</span>
        )}
      </div>

      {/* 경보 목록 */}
      <div className="active-alerts-panel__list">
        {activeAlerts.map((alert) => {
          const alertId = alert.id || `${alert.dongNo || alert.facilityName}-${alert.eventAt}`;
          const isExpanded = expandedId === alertId;
          const isSelected = selectedAlertId === alertId;
          const zoneName = alert.dongNo || alert.facilityName || "알 수 없음";

          return (
            <div
              key={alertId}
              className={`
                alert-item 
                alert-item--${alert.status.toLowerCase()}
                ${!alert.acknowledged ? "alert-item--unacknowledged" : ""}
                ${isSelected ? "alert-item--selected" : ""}
                ${isExpanded ? "alert-item--expanded" : ""}
              `}
              onClick={() => onSelect && onSelect(alert)}
            >
              {/* 메인 행 */}
              <div className="alert-item__main">
                {/* 상태 아이콘 */}
                <div className={`alert-item__icon alert-item__icon--${alert.status.toLowerCase()}`}>
                  {getAlertIcon(alert)}
                </div>

                {/* 내용 */}
                <div className="alert-item__content">
                  <div className="alert-item__top">
                    <span className="alert-item__zone">{zoneName}</span>
                    <span
                      className={`alert-item__status alert-item__status--${alert.status.toLowerCase()}`}
                    >
                      {getStatusLabel(alert.status)}
                    </span>
                  </div>
                  <div className="alert-item__bottom">
                    <span className="alert-item__reason">
                      {getReasonLabel(alert.reason, alert.sensorType)}
                    </span>
                    {alert.value && (
                      <span className="alert-item__value">
                        {alert.value}
                        {alert.unit}
                      </span>
                    )}
                  </div>
                </div>

                {/* 시간 */}
                <div className="alert-item__time">
                  <Clock size={12} />
                  <span>{getElapsedTime(alert.eventAt || alert.updatedAt)}</span>
                </div>

                {/* 확장 토글 */}
                <button
                  className="alert-item__expand-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleExpand(alertId);
                  }}
                >
                  <ChevronRight size={16} className={isExpanded ? "rotated" : ""} />
                </button>
              </div>

              {/* 확장 영역: 액션 버튼들 */}
              {isExpanded && (
                <div className="alert-item__actions">
                  {!alert.acknowledged && (
                    <button
                      className="alert-action alert-action--acknowledge"
                      onClick={(e) => handleAcknowledge(e, alert)}
                    >
                      <CheckCircle2 size={14} />
                      인지(확인)
                    </button>
                  )}
                  <button
                    className="alert-action alert-action--assign"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: 담당자 배정 모달
                    }}
                  >
                    <User size={14} />
                    담당 배정
                  </button>
                  <button
                    className="alert-action alert-action--note"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddNote && onAddNote(alert);
                    }}
                  >
                    <MessageSquare size={14} />
                    메모 추가
                  </button>
                </div>
              )}

              {/* 미인지 강조 표시 */}
              {!alert.acknowledged && <div className="alert-item__unack-indicator" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
