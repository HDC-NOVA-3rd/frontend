/**
 * 화재감시 관제 대시보드
 *
 * 백엔드 API 구조 기반:
 * - SafetyStatusResponse: { dongNo, facilityName, status(SAFE/DANGER), reason, updatedAt }
 * - SafetyEventLogResponse: { id, dongNo, facilityName, manual, requestFrom, sensorName, sensorType, value, unit, statusTo, eventAt }
 * - SafetySensorLogResponse: { sensorName, dongNo, facilityName, sensorType, value, unit, recordedAt }
 */

import { useState, useMemo } from "react";
import {
  Flame,
  ThermometerSun,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Home,
  CalendarX,
  CalendarCheck,
  AlertTriangle,
  Megaphone,
  CircuitBoard,
  XCircle,
  Clock,
  Activity,
  Lock,
  Unlock,
  DoorOpen,
  Layers,
  RefreshCw,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import "./FireMonitoringDashboard.css";
import { lockFacility } from "../../services/safetyApi";
import { useSafetyMqtt } from "../../hooks/useSafetyMqtt";
import { useAlert } from "../../hooks/useAlert";

// ========== 설정 ==========
const DEFAULT_APARTMENT_ID = 1; // 테스트용 아파트 ID
const GAS_DANGER_THRESHOLD = 500;
const HEAT_DANGER_THRESHOLD = 70;

// ========== Helper Functions ==========

const formatTime = (isoString) => {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const formatDateTime = (isoString) => {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getZoneName = (item) => {
  return item.dongNo || item.facilityName || "알 수 없음";
};

const getZoneType = (item) => {
  return item.dongNo ? "dong" : "facility";
};

const getReasonLabel = (reason) => {
  const labels = {
    HEAT: "고온 감지",
    GAS: "가스 감지",
    MANUAL_LOCK: "수동 잠금",
    MANUAL_UNLOCK: "수동 해제",
  };
  return labels[reason] || reason || "-";
};

const normalizeSensorType = (sensorType) => {
  if (!sensorType) return "";
  return sensorType.toUpperCase();
};

const getSensorIcon = (sensorType, size) => {
  if (sensorType === "GAS") return <Flame size={size} />;
  if (sensorType === "HEAT") return <ThermometerSun size={size} />;
  return <Flame size={size} />;
};

// ========== Component ==========

export function FireMonitoringDashboard() {
  const [selectedZone, setSelectedZone] = useState(null);

  // MQTT 실시간 연결: 초기 데이터는 REST API로, 이후 업데이트는 MQTT로 수신
  const { safetyStatus, eventLogs, sensorLogs, isConnected, loading, error, lastUpdated, refetch } =
    useSafetyMqtt(DEFAULT_APARTMENT_ID);

  // 수동 새로고침
  const handleRefresh = () => {
    refetch();
  };

  // 통계 계산
  const stats = useMemo(() => {
    const dangerZones = safetyStatus.filter((s) => s.status === "DANGER");
    const safeZones = safetyStatus.filter((s) => s.status === "SAFE");
    const dongCount = safetyStatus.filter((s) => s.dongNo).length;
    const facilityCount = safetyStatus.filter((s) => s.facilityName).length;
    const gasAlerts = dangerZones.filter((s) => s.reason === "GAS").length;
    const heatAlerts = dangerZones.filter((s) => s.reason === "HEAT").length;

    return {
      total: safetyStatus.length,
      danger: dangerZones.length,
      safe: safeZones.length,
      dongCount,
      facilityCount,
      gasAlerts,
      heatAlerts,
      sensorCount: sensorLogs.length, // 백엔드가 센서당 최신 1건만 반환
    };
  }, [safetyStatus, sensorLogs]);

  // 선택된 구역의 센서 목록 (호/공간별 그룹핑)
  const selectedZoneSensors = useMemo(() => {
    if (!selectedZone) return [];
    return sensorLogs.filter(
      (s) =>
        (selectedZone.dongNo && s.dongNo === selectedZone.dongNo) ||
        (selectedZone.facilityName && s.facilityName === selectedZone.facilityName),
    );
  }, [selectedZone, sensorLogs]);

  // 알림 훅
  const { send: sendEmergencyAlert } = useAlert();

  // 화재 긴급 알림 (전체)
  const handleEmergencyAlert = async () => {
    if (!window.confirm("아파트 전체에 화재 위험 긴급 알림을 발송하시겠습니까?")) return;

    try {
      await sendEmergencyAlert({
        apartmentId: DEFAULT_APARTMENT_ID,
        title: "화재 경보 발생",
        message: "현재 아파트 내 화재 위험이 감지되었습니다. 신속히 대피하시고 안전에 유의하시기 바랍니다.",
        type: "FIRE_EMERGENCY",
      });
      alert("긴급 알림이 발송되었습니다.");
    } catch (err) {
      alert(`알림 발송 실패: ${err.message}`);
    }
  };

  // 전 구역 시설 예약 차단
  const handleGlobalLockdown = async () => {
    const facilities = safetyStatus.filter((z) => z.facilityId);
    if (facilities.length === 0) {
      alert("차단할 시설이 없습니다.");
      return;
    }

    if (!window.confirm(`전체 ${facilities.length}개 시설의 예약을 즉시 차단하시겠습니까?`)) return;

    try {
      const promises = facilities.map((f) =>
        lockFacility({ facilityId: f.facilityId, reservationAvailable: false }),
      );
      await Promise.all(promises);
      alert("모든 시설의 예약이 차단되었습니다.");
      await refetch();
    } catch (err) {
      alert(`시설 차단 중 오류 발생: ${err.message}`);
    }
  };

  // 호/공간별로 그룹핑
  const groupedSensors = useMemo(() => {
    if (selectedZoneSensors.length === 0) return {};

    const groups = {};
    selectedZoneSensors.forEach((sensor) => {
      // 동이면 hoNo로 그룹, 시설이면 spaceName으로 그룹
      const groupKey = sensor.hoNo || sensor.spaceName || "미지정";
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(sensor);
    });
    return groups;
  }, [selectedZoneSensors]);

  // 수동 잠금/해제 핸들러 (백엔드 API 호출)
  const handleManualLock = async (zone, lock) => {
    // 시설만 잠금 가능 (facilityId 필요)
    if (!zone.facilityId) {
      // 동(Dong)은 아직 잠금 API가 없으므로 알림만
      alert("동(Dong) 잠금 기능은 아직 지원되지 않습니다.");
      return;
    }

    try {
      const response = await lockFacility({
        facilityId: zone.facilityId,
        reservationAvailable: !lock, // lock=true면 예약차단(false), lock=false면 예약허용(true)
      });

      console.log("잠금 응답:", response);

      // 성공 시 데이터 새로고침
      await refetch();
    } catch (err) {
      console.error("잠금 처리 실패:", err);
      alert(`잠금 처리 실패: ${err.message}`);
    }
  };

  // 로딩 상태 UI
  if (loading) {
    return (
      <div className="safety-dashboard safety-dashboard--loading">
        <div className="loading-container">
          <Loader2 className="loading-spinner" size={48} />
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태 UI
  if (error && safetyStatus.length === 0) {
    return (
      <div className="safety-dashboard safety-dashboard--error">
        <div className="error-container">
          <AlertCircle size={48} />
          <h3>데이터 로드 실패</h3>
          <p>{error}</p>
          <button className="retry-btn" onClick={handleRefresh}>
            <RefreshCw size={16} /> 다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="safety-dashboard">
      {/* ===== KPI Summary ===== */}
      <section className="kpi-section">
        <div className="kpi-card kpi-card--primary">
          <div className="kpi-icon">
            <Building2 size={22} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">전체 구역</span>
            <span className="kpi-value">{stats.total}</span>
          </div>
          <div className="kpi-sub">
            동 {stats.dongCount} / 시설 {stats.facilityCount}
          </div>
        </div>

        <div className="kpi-card kpi-card--success">
          <div className="kpi-icon">
            <ShieldCheck size={22} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">안전 상태</span>
            <span className="kpi-value">{stats.safe}</span>
          </div>
          <div className="kpi-sub">SAFE</div>
        </div>

        <div className="kpi-card kpi-card--danger">
          <div className="kpi-icon">
            <ShieldAlert size={22} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">위험 경보</span>
            <span className="kpi-value">{stats.danger}</span>
          </div>
          <div className="kpi-sub">
            {stats.gasAlerts > 0 && <span>가스 {stats.gasAlerts}</span>}
            {stats.heatAlerts > 0 && <span>고온 {stats.heatAlerts}</span>}
          </div>
        </div>

        <div className="kpi-card kpi-card--info">
          <div className="kpi-icon">
            <CircuitBoard size={22} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">활성 센서</span>
            <span className="kpi-value">{stats.sensorCount}</span>
          </div>
          <div className="kpi-sub">실시간 모니터링</div>
        </div>
      </section>

      {/* ===== Main Content Grid ===== */}
      <div className="main-grid">
        {/* 좌측: 구역별 상태 그리드 */}
        <section className="zone-section">
          <div className="section-header">
            <h3>
              <Activity size={18} />
              구역별 안전 상태
            </h3>
            <div className="header-actions">
              {lastUpdated && (
                <span className="last-updated">
                  {lastUpdated.toLocaleTimeString("ko-KR")} 업데이트
                </span>
              )}
              <button className="refresh-btn" onClick={handleRefresh}>
                <RefreshCw size={16} />
              </button>
              <div
                className={`live-indicator ${isConnected ? "" : "live-indicator--disconnected"}`}
              >
                {isConnected ? (
                  <>
                    <span className="pulse-dot"></span>
                    <Wifi size={14} /> MQTT 실시간
                  </>
                ) : (
                  <>
                    <WifiOff size={14} /> 연결 끊김
                  </>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="api-error-banner">
              <AlertCircle size={14} />
              <span>일부 데이터 로드 실패: {error}</span>
            </div>
          )}

          <div className="zone-grid">
            {/* 동(Dong) 구역 */}
            <div className="zone-group">
              <h4 className="zone-group__title">
                <Home size={14} /> 주거동
              </h4>
              <div className="zone-group__cards">
                {safetyStatus
                  .filter((z) => z.dongNo)
                  .map((zone, idx) => (
                    <ZoneCard
                      key={`dong-${idx}`}
                      zone={zone}
                      isSelected={selectedZone?.dongNo === zone.dongNo}
                      onSelect={() =>
                        setSelectedZone(selectedZone?.dongNo === zone.dongNo ? null : zone)
                      }
                      sensors={sensorLogs.filter((s) => s.dongNo === zone.dongNo)}
                      onManualLock={handleManualLock}
                    />
                  ))}
              </div>
            </div>

            {/* 시설(Facility) 구역 */}
            <div className="zone-group">
              <h4 className="zone-group__title">
                <Building2 size={14} /> 공용시설
              </h4>
              <div className="zone-group__cards">
                {safetyStatus
                  .filter((z) => z.facilityName)
                  .map((zone, idx) => (
                    <ZoneCard
                      key={`fac-${idx}`}
                      zone={zone}
                      isSelected={selectedZone?.facilityName === zone.facilityName}
                      onSelect={() =>
                        setSelectedZone(
                          selectedZone?.facilityName === zone.facilityName ? null : zone,
                        )
                      }
                      sensors={sensorLogs.filter((s) => s.facilityName === zone.facilityName)}
                      onManualLock={handleManualLock}
                    />
                  ))}
              </div>
            </div>
          </div>
        </section>

        {/* 우측: 이벤트 로그 & 긴급 제어 */}
        <aside className="side-section">
          {/* 긴급 제어 */}
          <div className="control-panel">
            <h4>
              <ShieldAlert size={16} /> 긴급 제어
            </h4>
            <div className="control-buttons">
              <button className="control-btn control-btn--alert" onClick={handleEmergencyAlert}>
                <Megaphone size={18} />
                긴급 알림
              </button>
              <button className="control-btn control-btn--lockdown" onClick={handleGlobalLockdown}>
                <CalendarX size={18} />
                시설 예약 차단
              </button>
            </div>
          </div>

          {/* 이벤트 로그 */}
          <div className="event-log-panel">
            <div className="event-log__header">
              <h4>
                <Clock size={16} /> 이벤트 로그
              </h4>
              <span className="live-badge">LIVE</span>
            </div>
            <div className="event-log__list">
              {eventLogs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className={`event-item event-item--${log.statusTo.toLowerCase()}`}
                >
                  <div className="event-item__time">{formatTime(log.eventAt)}</div>
                  <div className="event-item__content">
                    <span className="event-item__zone">{getZoneName(log)}</span>
                    <span className="event-item__detail">
                      {log.manual ? (
                        <span className="manual-tag">수동</span>
                      ) : (
                        log.sensorType && (
                          <>
                            <span
                              className={`sensor-type sensor-type--${normalizeSensorType(log.sensorType).toLowerCase()}`}
                            >
                              {getSensorIcon(normalizeSensorType(log.sensorType), 12)}
                              {normalizeSensorType(log.sensorType)}
                            </span>
                            <span className="sensor-value">
                              {log.value}
                              {log.unit}
                            </span>
                          </>
                        )
                      )}
                    </span>
                  </div>
                  <div
                    className={`event-item__status event-item__status--${log.statusTo.toLowerCase()}`}
                  >
                    {log.statusTo}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ===== 선택된 구역 상세 (Modal/Drawer) ===== */}
      {selectedZone && (
        <div className="zone-detail-drawer">
          <div className="drawer-header">
            <h3>{getZoneName(selectedZone)} 상세</h3>
            <button className="close-btn" onClick={() => setSelectedZone(null)}>
              <XCircle size={20} />
            </button>
          </div>

          <div className="drawer-status">
            <div className={`status-badge status-badge--${selectedZone.status.toLowerCase()}`}>
              {selectedZone.status === "DANGER" ? (
                <ShieldAlert size={16} />
              ) : (
                <ShieldCheck size={16} />
              )}
              {selectedZone.status}
            </div>
            {selectedZone.reason && (
              <span className="reason-text">{getReasonLabel(selectedZone.reason)}</span>
            )}
            <span className="updated-text">
              마지막 업데이트: {formatDateTime(selectedZone.updatedAt)}
            </span>
          </div>

          <div className="drawer-sensors">
            <h4>
              {selectedZone.dongNo ? <DoorOpen size={16} /> : <Layers size={16} />}
              {selectedZone.dongNo ? "호별 센서 현황" : "공간별 센서 현황"}
              <span className="sensor-count">({selectedZoneSensors.length}개)</span>
            </h4>
            {selectedZoneSensors.length === 0 ? (
              <div className="empty-sensors">등록된 센서가 없습니다.</div>
            ) : (
              <div className="unit-groups">
                {Object.entries(groupedSensors).map(([unitName, sensors]) => {
                  // 해당 호/공간의 최대값 체크
                  const hasAlert = sensors.some((s) => {
                    const sensorType = normalizeSensorType(s.sensorType);
                    return (
                      (sensorType === "GAS" && s.value >= GAS_DANGER_THRESHOLD) ||
                      (sensorType === "HEAT" && s.value >= HEAT_DANGER_THRESHOLD)
                    );
                  });

                  return (
                    <div
                      key={unitName}
                      className={`unit-group ${hasAlert ? "unit-group--alert" : ""}`}
                    >
                      <div className="unit-group__header">
                        <span className="unit-name">
                          {selectedZone.dongNo ? <DoorOpen size={14} /> : <Layers size={14} />}
                          {unitName}
                        </span>
                        <span className="unit-sensor-count">{sensors.length}개 센서</span>
                      </div>
                      <div className="unit-group__sensors">
                        {sensors.map((sensor, idx) => {
                          const sensorType = normalizeSensorType(sensor.sensorType);
                          const isAlert =
                            (sensorType === "GAS" && sensor.value >= GAS_DANGER_THRESHOLD) ||
                            (sensorType === "HEAT" && sensor.value >= HEAT_DANGER_THRESHOLD);

                          return (
                            <div
                              key={idx}
                              className={`sensor-item sensor-item--${sensorType.toLowerCase()} ${isAlert ? "sensor-item--alert" : ""}`}
                            >
                              <div className="sensor-item__type">
                                {getSensorIcon(sensorType, 14)}
                                <span>{sensorType}</span>
                              </div>
                              <div className="sensor-item__value">
                                <span className="value">{sensor.value.toFixed(1)}</span>
                                <span className="unit">{sensor.unit}</span>
                              </div>
                              <div className="sensor-item__name">{sensor.sensorName}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedZone.facilityName && (
            <div className="drawer-actions">
              {selectedZone.status === "SAFE" ? (
                <button
                  className="action-btn action-btn--lock"
                  onClick={() => handleManualLock(selectedZone, true)}
                >
                  <Lock size={16} /> 수동 잠금 (예약 차단)
                </button>
              ) : (
                <button
                  className="action-btn action-btn--unlock"
                  onClick={() => handleManualLock(selectedZone, false)}
                >
                  <Unlock size={16} /> 수동 해제 (예약 허용)
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ========== Sub Component: ZoneCard ==========

function ZoneCard({ zone, isSelected, onSelect, sensors, onManualLock }) {
  const isDanger = zone.status === "DANGER";
  const zoneName = getZoneName(zone);
  const zoneType = getZoneType(zone);

  // 센서 최신값 (recordedAt 기준)
  const getLatestValue = (type) => {
    const latest = sensors
      .filter((s) => normalizeSensorType(s.sensorType) === type)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];
    return latest ? latest.value : 0;
  };

  const gasLatest = getLatestValue("GAS");
  const heatLatest = getLatestValue("HEAT");

  return (
    <div
      className={`zone-card zone-card--${zone.status.toLowerCase()} ${isSelected ? "selected" : ""}`}
      onClick={onSelect}
    >
      <div className="zone-card__header">
        <span className="zone-card__name">{zoneName}</span>
        {isDanger && <Flame className="danger-icon" size={16} />}
      </div>

      <div className="zone-card__sensors">
        {sensors.length === 0 ? (
          <span className="no-sensor">센서 없음</span>
        ) : (
          <>
            {gasLatest > 0 && (
              <div
                className={`sensor-mini sensor-mini--gas ${gasLatest >= GAS_DANGER_THRESHOLD ? "alert" : ""}`}
              >
                <Flame size={12} />
                <span>{gasLatest.toFixed(0)}</span>
              </div>
            )}
            {heatLatest > 0 && (
              <div
                className={`sensor-mini sensor-mini--heat ${heatLatest >= HEAT_DANGER_THRESHOLD ? "alert" : ""}`}
              >
                <ThermometerSun size={12} />
                <span>{heatLatest.toFixed(1)}°</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="zone-card__footer">
        <span className={`status-text status-text--${zone.status.toLowerCase()}`}>
          {zone.status === "DANGER" ? "위험" : "정상"}
        </span>
        {zone.reason && <span className="reason-tag">{getReasonLabel(zone.reason)}</span>}
      </div>
    </div>
  );
}
