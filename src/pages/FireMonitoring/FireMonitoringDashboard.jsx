/**
 * 화재감시 관제 대시보드
 *
 * 백엔드 API 구조 기반:
 * - SafetyStatusResponse: { dongNo, facilityName, status(SAFE/DANGER), reason, updatedAt }
 * - SafetyEventLogResponse: { id, dongNo, facilityName, manual, requestFrom, sensorName, sensorType, value, unit, statusTo, eventAt }
 * - SafetySensorLogResponse: { sensorName, dongNo, facilityName, sensorType, value, unit, recordedAt }
 */

import { useEffect, useRef, useState, useMemo } from "react";
import {
  Flame,
  ThermometerSun,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Home,
  AlertTriangle,
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
import { get } from "../../services/api";
import { lockFacility } from "../../services/safetyApi";
import { useSafetyMqtt } from "../../hooks/useSafetyMqtt";

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
  if (item.zoneType === "household") {
    const dong = item.dongNo ? `${item.dongNo}동` : "";
    const ho = item.hoNo ? `${item.hoNo}호` : "";
    return [dong, ho].filter(Boolean).join(" ") || item.hoNo || "세대 미지정";
  }
  if (item.zoneType === "facility") {
    // spaceName이 없거나 "공간 미지정" 더미값이면 facilityName으로 표시
    if (!item.spaceName || item.spaceName === "공간 미지정") {
      return item.facilityName || "시설 미지정";
    }
    return item.spaceName;
  }
  return item.dongNo || item.facilityName || "알 수 없음";
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

const getSensorAlertReasons = (sensors) => {
  const hasGasAlert = sensors.some(
    (s) => normalizeSensorType(s.sensorType) === "GAS" && Number(s.value) > GAS_DANGER_THRESHOLD,
  );
  const hasHeatAlert = sensors.some(
    (s) => normalizeSensorType(s.sensorType) === "HEAT" && Number(s.value) > HEAT_DANGER_THRESHOLD,
  );

  const reasons = [];
  if (hasGasAlert) reasons.push("GAS");
  if (hasHeatAlert) reasons.push("HEAT");
  return reasons;
};

const getReasonSummary = (reasonCodes = [], fallbackStatus = "SAFE") => {
  if (!Array.isArray(reasonCodes) || reasonCodes.length === 0) {
    return fallbackStatus === "DANGER" ? "위험 상태" : "";
  }

  if (reasonCodes.includes("GAS") && reasonCodes.includes("HEAT")) {
    return "가스·고온 동시 감지";
  }

  return reasonCodes.map((code) => getReasonLabel(code)).join(" · ");
};

const normalizeSensorType = (sensorType) => {
  if (!sensorType) return "";
  return sensorType.toUpperCase();
};

const isSensorAlert = (sensor) => {
  const sensorType = normalizeSensorType(sensor.sensorType);
  return (
    (sensorType === "GAS" && Number(sensor.value) > GAS_DANGER_THRESHOLD) ||
    (sensorType === "HEAT" && Number(sensor.value) > HEAT_DANGER_THRESHOLD)
  );
};

const getLatestByType = (sensors, type) => {
  const latest = sensors
    .filter((s) => normalizeSensorType(s.sensorType) === type)
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];
  return latest ? Number(latest.value) : 0;
};

const getSensorIcon = (sensorType, size) => {
  if (sensorType === "GAS") return <Flame size={size} />;
  if (sensorType === "HEAT") return <ThermometerSun size={size} />;
  return <Flame size={size} />;
};

// ========== Component ==========

export function FireMonitoringDashboard() {
  const [selectedZone, setSelectedZone] = useState(null);
  const [householdUnits, setHouseholdUnits] = useState([]);
  const [facilityUnits, setFacilityUnits] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lockingFacilityId, setLockingFacilityId] = useState(null);
  const [criticalAlert, setCriticalAlert] = useState(null);
  const closeButtonRef = useRef(null);
  const isDangerWatchInitializedRef = useRef(false);
  const prevDangerSignaturesRef = useRef(new Map());

  // MQTT 실시간 연결: 초기 데이터는 REST API로, 이후 업데이트는 MQTT로 수신
  const { safetyStatus, eventLogs, sensorLogs, isConnected, loading, error, lastUpdated, refetch } =
    useSafetyMqtt(DEFAULT_APARTMENT_ID);

  useEffect(() => {
    if (!selectedZone) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedZone(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedZone]);

  useEffect(() => {
    let cancelled = false;

    const fetchStructure = async () => {
      try {
        const dongs = await get(`/api/apartment/${DEFAULT_APARTMENT_ID}/dong`);
        const safeDongs = Array.isArray(dongs) ? dongs : [];

        const hoLists = await Promise.all(
          safeDongs.map((dong) => get(`/api/apartment/dong/${dong.id}/ho`)),
        );

        if (!cancelled) {
          const units = [];
          safeDongs.forEach((dong, idx) => {
            const hos = Array.isArray(hoLists[idx]) ? hoLists[idx] : [];
            hos.forEach((ho) => {
              units.push({
                id: `hu-${dong.id}-${ho.id}`,
                dongNo: dong.dongNo,
                hoNo: ho.hoNo,
              });
            });
          });
          setHouseholdUnits(units);
        }

        const facilities = await get(`/api/apartment/${DEFAULT_APARTMENT_ID}/facility`);
        const safeFacilities = Array.isArray(facilities) ? facilities : [];
        const spaceLists = await Promise.all(
          safeFacilities.map((facility) => get(`/api/facility/${facility.facilityId}/space`)),
        );

        if (!cancelled) {
          const units = [];
          safeFacilities.forEach((facility, idx) => {
            const spaces = Array.isArray(spaceLists[idx]) ? spaceLists[idx] : [];
            if (spaces.length === 0) {
              units.push({
                id: `fu-${facility.facilityId}-none`,
                facilityId: facility.facilityId,
                facilityName: facility.name,
                spaceName: "공간 미지정",
                reservationAvailable: facility.reservationAvailable,
              });
              return;
            }
            spaces.forEach((space) => {
              units.push({
                id: `fu-${facility.facilityId}-${space.id}`,
                facilityId: facility.facilityId,
                facilityName: facility.name,
                spaceName: space.name,
                reservationAvailable: facility.reservationAvailable,
              });
            });
          });
          setFacilityUnits(units);
        }
      } catch (err) {
        console.error("구조 데이터 조회 실패:", err);
      }
    };

    fetchStructure();

    return () => {
      cancelled = true;
    };
  }, []);

  const statusByDong = useMemo(() => {
    const map = new Map();
    safetyStatus
      .filter((s) => s.dongNo)
      .forEach((s) => {
        map.set(s.dongNo, s);
      });
    return map;
  }, [safetyStatus]);

  const statusByFacility = useMemo(() => {
    const map = new Map();
    safetyStatus
      .filter((s) => s.facilityName)
      .forEach((s) => {
        map.set(s.facilityName, s);
      });
    return map;
  }, [safetyStatus]);

  const householdZones = useMemo(() => {
    const groups = new Map();
    sensorLogs.forEach((sensor) => {
      if (!sensor.hoNo) return;
      const key = `${sensor.dongNo || ""}|${sensor.hoNo}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(sensor);
    });

    const keysFromSensors = Array.from(groups.keys());
    const baseKeys =
      householdUnits.length > 0
        ? householdUnits.map((unit) => `${unit.dongNo || ""}|${unit.hoNo}`)
        : keysFromSensors;

    return baseKeys
      .map((key) => {
        const sensors = groups.get(key) || [];
        const [dongNo, hoNo] = key.split("|");
        const matchedStatus = statusByDong.get(dongNo);
        const gasLatest = getLatestByType(sensors, "GAS");
        const heatLatest = getLatestByType(sensors, "HEAT");
        const alertCount = sensors.filter((s) => isSensorAlert(s)).length;
        const sensorReasons = getSensorAlertReasons(sensors);
        const hasSensors = sensors.length > 0;
        const status =
          sensorReasons.length > 0
            ? "DANGER"
            : hasSensors
              ? "SAFE"
              : matchedStatus?.status || "UNKNOWN"; // 센서 없으면 '미연결' 처리
        const mergedReasons =
          sensorReasons.length > 0
            ? sensorReasons
            : status === "DANGER" && matchedStatus?.reason
              ? [matchedStatus.reason]
              : [];

        const latestRecordedAt = sensors
          .map((s) => s.recordedAt)
          .filter(Boolean)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

        return {
          id: `household-${key}`,
          zoneType: "household",
          dongNo: dongNo || undefined,
          hoNo,
          status,
          reasonCodes: mergedReasons,
          reason: mergedReasons[0] || null,
          updatedAt: latestRecordedAt || matchedStatus?.updatedAt || null,
          sensors,
          gasLatest,
          heatLatest,
          hasSensor: sensors.length > 0,
          activeSensorCount: sensors.filter((s) => s.value != null).length,
          alertSensorCount: alertCount,
        };
      })
      .sort((a, b) => getZoneName(a).localeCompare(getZoneName(b), "ko-KR"));
  }, [sensorLogs, statusByDong, householdUnits]);

  const facilityZones = useMemo(() => {
    const groups = new Map();
    sensorLogs.forEach((sensor) => {
      if (!sensor.facilityName) return;
      const key = `${sensor.facilityName}|${sensor.spaceName || "공간 미지정"}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(sensor);
    });

    const keysFromSensors = Array.from(groups.keys());
    const baseKeys =
      facilityUnits.length > 0
        ? facilityUnits.map((unit) => `${unit.facilityName}|${unit.spaceName || "공간 미지정"}`)
        : keysFromSensors;

    return baseKeys
      .map((key) => {
        const sensors = groups.get(key) || [];
        const [facilityName, spaceName] = key.split("|");
        const matchedStatus = statusByFacility.get(facilityName);
        const matchedUnit = facilityUnits.find(
          (unit) =>
            unit.facilityName === facilityName &&
            (unit.spaceName || "공간 미지정") === (spaceName || "공간 미지정"),
        );
        const gasLatest = getLatestByType(sensors, "GAS");
        const heatLatest = getLatestByType(sensors, "HEAT");
        const alertCount = sensors.filter((s) => isSensorAlert(s)).length;
        const sensorReasons = getSensorAlertReasons(sensors);
        const hasSensors = sensors.length > 0;
        const status =
          sensorReasons.length > 0
            ? "DANGER"
            : hasSensors
              ? "SAFE"
              : matchedStatus?.status || "UNKNOWN"; // 센서 없으면 '미연결' 처리
        const mergedReasons =
          sensorReasons.length > 0
            ? sensorReasons
            : status === "DANGER" && matchedStatus?.reason
              ? [matchedStatus.reason]
              : [];
        const latestRecordedAt = sensors
          .map((s) => s.recordedAt)
          .filter(Boolean)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

        return {
          id: `facility-${key}`,
          zoneType: "facility",
          facilityName,
          spaceName,
          facilityId: matchedStatus?.facilityId || matchedUnit?.facilityId,
          reservationAvailable:
            typeof matchedUnit?.reservationAvailable === "boolean"
              ? matchedUnit.reservationAvailable
              : null,
          status,
          reasonCodes: mergedReasons,
          reason: mergedReasons[0] || null,
          updatedAt: latestRecordedAt || matchedStatus?.updatedAt || null,
          sensors,
          gasLatest,
          heatLatest,
          hasSensor: sensors.length > 0,
          activeSensorCount: sensors.filter((s) => s.value != null).length,
          alertSensorCount: alertCount,
        };
      })
      .sort((a, b) => getZoneName(a).localeCompare(getZoneName(b), "ko-KR"));
  }, [sensorLogs, statusByFacility, facilityUnits]);

  const allZones = useMemo(
    () => [...householdZones, ...facilityZones],
    [householdZones, facilityZones],
  );
  const dangerZones = useMemo(
    () => allZones.filter((zone) => zone.status === "DANGER" && zone.hasSensor),
    [allZones],
  );

  useEffect(() => {
    const currentDangerSignatures = new Map(
      dangerZones.map((zone) => [zone.id, [...(zone.reasonCodes || [])].sort().join(",")]),
    );

    // 초기 로딩 시 기존 위험 상태는 이벤트로 간주하지 않음
    if (!isDangerWatchInitializedRef.current) {
      prevDangerSignaturesRef.current = currentDangerSignatures;
      isDangerWatchInitializedRef.current = true;
      return;
    }

    const newlyDetectedZones = dangerZones.filter((zone) => {
      const currentSignature = currentDangerSignatures.get(zone.id) || "";
      const previousSignature = prevDangerSignaturesRef.current.get(zone.id) || "";

      if (!previousSignature) return true;

      const previousCodes = previousSignature.split(",").filter(Boolean);
      const currentCodes = currentSignature.split(",").filter(Boolean);
      return currentCodes.some((code) => !previousCodes.includes(code));
    });

    if (newlyDetectedZones.length > 0) {
      const head = newlyDetectedZones
        .slice(0, 2)
        .map((zone) => `${getZoneName(zone)}(${getReasonSummary(zone.reasonCodes, zone.status)})`)
        .join(" / ");
      const tail = newlyDetectedZones.length > 2 ? ` 외 ${newlyDetectedZones.length - 2}건` : "";

      setCriticalAlert({
        id: Date.now(),
        count: newlyDetectedZones.length,
        message: `${head}${tail}`,
      });
    }

    prevDangerSignaturesRef.current = currentDangerSignatures;
  }, [dangerZones]);

  useEffect(() => {
    if (!criticalAlert) return undefined;

    const timer = setTimeout(() => {
      setCriticalAlert(null);
    }, 9000);

    return () => clearTimeout(timer);
  }, [criticalAlert]);

  // 수동 새로고침
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  // 통계 계산
  const stats = useMemo(() => {
    const dangerZonesAll = allZones.filter((s) => s.status === "DANGER");
    const safeZones = allZones.filter((s) => s.status === "SAFE");
    const dongCount = householdZones.length;
    const facilityCount = facilityZones.length;
    const gasAlerts = dangerZonesAll.filter((s) => (s.reasonCodes || []).includes("GAS")).length;
    const heatAlerts = dangerZonesAll.filter((s) => (s.reasonCodes || []).includes("HEAT")).length;

    return {
      total: allZones.length,
      danger: dangerZonesAll.length,
      safe: safeZones.length,
      dongCount,
      facilityCount,
      gasAlerts,
      heatAlerts,
      sensorCount: sensorLogs.length, // 백엔드가 센서당 최신 1건만 반환
    };
  }, [allZones, householdZones, facilityZones, sensorLogs]);

  // 선택된 구역의 센서 목록 (호/공간별 그룹핑)
  const selectedZoneSensors = useMemo(() => {
    if (!selectedZone) return [];
    return selectedZone.sensors || [];
  }, [selectedZone]);

  // 호/공간별로 그룹핑
  const groupedSensors = useMemo(() => {
    if (selectedZoneSensors.length === 0) return {};

    const groups = {};
    selectedZoneSensors.forEach((sensor) => {
      const groupKey =
        selectedZone?.zoneType === "household"
          ? sensor.sensorType || "기타 센서"
          : sensor.spaceName ||
            selectedZone?.facilityName ||
            selectedZone?.spaceName ||
            "공간 미지정";
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(sensor);
    });
    return groups;
  }, [selectedZoneSensors, selectedZone]);

  // 수동 잠금/해제 핸들러 (백엔드 API 호출)
  const handleManualLock = async (zone, reservationAvailable) => {
    // 시설만 잠금 가능 (facilityId 필요)
    if (!zone.facilityId) {
      // 동(Dong)은 아직 잠금 API가 없으므로 알림만
      alert("동(Dong) 잠금 기능은 아직 지원되지 않습니다.");
      return;
    }

    try {
      setLockingFacilityId(zone.facilityId);
      const response = await lockFacility({
        facilityId: zone.facilityId,
        reservationAvailable,
      });

      console.log("잠금 응답:", response);

      setFacilityUnits((prev) =>
        prev.map((unit) =>
          unit.facilityId === zone.facilityId ? { ...unit, reservationAvailable } : unit,
        ),
      );
      setSelectedZone((prev) =>
        prev && prev.facilityId === zone.facilityId ? { ...prev, reservationAvailable } : prev,
      );

      // 성공 시 데이터 새로고침
      await refetch();
    } catch (err) {
      console.error("잠금 처리 실패:", err);
      alert(`잠금 처리 실패: ${err.message}`);
    } finally {
      setLockingFacilityId(null);
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
    <div className={`safety-dashboard ${criticalAlert ? "safety-dashboard--critical-active" : ""}`}>
      {criticalAlert && (
        <>
          <div className="critical-alert-flash" aria-hidden="true" />
          <section className="critical-alert-banner" role="alert" aria-live="assertive">
            <div className="critical-alert-banner__icon">
              <AlertTriangle size={22} />
            </div>
            <div className="critical-alert-banner__content">
              <strong>센서 위험 수치 감지</strong>
              <p>{criticalAlert.message}</p>
            </div>
            <button
              type="button"
              className="critical-alert-banner__close"
              onClick={() => setCriticalAlert(null)}
            >
              확인
            </button>
          </section>
        </>
      )}

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
            세대 {stats.dongCount} / 시설 {stats.facilityCount}
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
              세대/시설 안전 상태
            </h3>
            <div className="header-actions">
              {lastUpdated && (
                <span className="last-updated">
                  {lastUpdated.toLocaleTimeString("ko-KR")} 업데이트
                </span>
              )}
              <button
                className={`refresh-btn ${isRefreshing ? "refreshing" : ""}`}
                onClick={handleRefresh}
                disabled={isRefreshing}
                aria-label="데이터 새로고침"
              >
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
            {/* 세대 구역 */}
            <div className="zone-group">
              <h4 className="zone-group__title">
                <Home size={14} /> 세대
              </h4>
              <div className="zone-group__cards">
                {householdZones.map((zone) => (
                  <ZoneCard
                    key={zone.id}
                    zone={zone}
                    isSelected={selectedZone?.id === zone.id}
                    onSelect={() => setSelectedZone(selectedZone?.id === zone.id ? null : zone)}
                  />
                ))}
              </div>
            </div>

            {/* 시설(Facility) 구역 */}
            <div className="zone-group">
              <h4 className="zone-group__title">
                <Building2 size={14} /> 시설
              </h4>
              <div className="zone-group__cards">
                {facilityZones.map((zone) => (
                  <ZoneCard
                    key={zone.id}
                    zone={zone}
                    isSelected={selectedZone?.id === zone.id}
                    onSelect={() => setSelectedZone(selectedZone?.id === zone.id ? null : zone)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 우측: 이벤트 로그 */}
        <aside className="side-section">
          {/* 이벤트 로그 */}
          <div className="event-log-panel">
            <div className="event-log__header">
              <h4>
                <Clock size={16} /> 이벤트 로그
              </h4>
              <span className="live-badge">LIVE</span>
            </div>
            <div className="event-log__list">
              {eventLogs.length === 0 && (
                <div className="event-log__empty">수신된 이벤트가 없습니다.</div>
              )}
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
        <div className="zone-detail-backdrop" onClick={() => setSelectedZone(null)}>
          <div
            className="zone-detail-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`${getZoneName(selectedZone)} 상세`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="drawer-header">
              <h3>{getZoneName(selectedZone)} 상세</h3>
              <button
                ref={closeButtonRef}
                className="close-btn"
                onClick={() => setSelectedZone(null)}
                aria-label="상세 닫기"
              >
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
              {selectedZone.reasonCodes?.length > 0 && (
                <span className="reason-text">
                  {getReasonSummary(selectedZone.reasonCodes, selectedZone.status)}
                </span>
              )}
              <span className="updated-text">
                마지막 업데이트: {formatDateTime(selectedZone.updatedAt)}
              </span>
            </div>

            <div className="drawer-sensors">
              <h4>
                {selectedZone.zoneType === "household" ? (
                  <DoorOpen size={16} />
                ) : (
                  <Layers size={16} />
                )}
                {selectedZone.zoneType === "household" ? "세대 센서 현황" : "시설 센서 현황"}
                <span className="sensor-count">({selectedZoneSensors.length}개)</span>
              </h4>
              {selectedZoneSensors.length === 0 ? (
                <div className="empty-sensors">등록된 센서가 없습니다.</div>
              ) : (
                <div className="unit-groups">
                  {Object.entries(groupedSensors).map(([unitName, sensors]) => {
                    // 해당 호/공간의 최대값 체크
                    const hasAlert = sensors.some((s) => isSensorAlert(s));

                    return (
                      <div
                        key={unitName}
                        className={`unit-group ${hasAlert ? "unit-group--alert" : ""}`}
                      >
                        <div className="unit-group__header">
                          <span className="unit-name">
                            {selectedZone.zoneType === "household" ? (
                              <DoorOpen size={14} />
                            ) : (
                              <Layers size={14} />
                            )}
                            {unitName}
                          </span>
                          <span className="unit-sensor-count">{sensors.length}개 센서</span>
                        </div>
                        <div className="unit-group__sensors">
                          {sensors.map((sensor, idx) => {
                            const sensorType = normalizeSensorType(sensor.sensorType);
                            const isAlert = isSensorAlert(sensor);

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
                                  <span className="value">
                                    {sensor.value != null ? Number(sensor.value).toFixed(1) : "-"}
                                  </span>
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
                <p className="reservation-state">
                  예약 상태:{" "}
                  {selectedZone.reservationAvailable === null
                    ? "확인 중"
                    : selectedZone.reservationAvailable
                      ? "허용"
                      : "차단"}
                </p>
                <div className="drawer-action-row">
                  <button
                    className="action-btn action-btn--lock"
                    onClick={() => handleManualLock(selectedZone, false)}
                    disabled={
                      lockingFacilityId === selectedZone.facilityId ||
                      selectedZone.reservationAvailable === null ||
                      selectedZone.reservationAvailable === false
                    }
                  >
                    {lockingFacilityId === selectedZone.facilityId ? (
                      <>
                        <Loader2 size={16} className="btn-spinner" /> 처리 중...
                      </>
                    ) : (
                      <>
                        <Lock size={16} /> 수동 잠금 (예약 차단)
                      </>
                    )}
                  </button>
                  <button
                    className="action-btn action-btn--unlock"
                    onClick={() => handleManualLock(selectedZone, true)}
                    disabled={
                      lockingFacilityId === selectedZone.facilityId ||
                      selectedZone.reservationAvailable === null ||
                      selectedZone.reservationAvailable === true
                    }
                  >
                    {lockingFacilityId === selectedZone.facilityId ? (
                      <>
                        <Loader2 size={16} className="btn-spinner" /> 처리 중...
                      </>
                    ) : (
                      <>
                        <Unlock size={16} /> 수동 해제 (예약 허용)
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ========== Sub Component: ZoneCard ==========

function ZoneCard({ zone, isSelected, onSelect }) {
  const isDanger = zone.status === "DANGER";
  const zoneName = getZoneName(zone);
  const sensors = zone.sensors || [];
  const gasLatest = zone.gasLatest || 0;
  const heatLatest = zone.heatLatest || 0;

  return (
    <button
      type="button"
      className={`zone-card zone-card--${zone.status.toLowerCase()} ${isSelected ? "selected" : ""}`}
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`${zoneName} ${zone.status === "DANGER" ? "위험" : zone.status === "UNKNOWN" ? "미연결" : "정상"} 상세 열기`}
    >
      <div className="zone-card__header">
        <span className="zone-card__name">{zoneName}</span>
        {isDanger && <Flame className="danger-icon" size={16} />}
      </div>

      <div className="zone-card__meta">
        {zone.zoneType === "household" ? (
          <span>{zone.dongNo || "동 미지정"}</span>
        ) : (
          <span>{zone.facilityName || "시설 미지정"}</span>
        )}
        <span>센서 {zone.activeSensorCount || 0}개</span>
      </div>

      <div className="zone-card__sensors">
        {sensors.length === 0 ? (
          <span className="no-sensor">센서 없음</span>
        ) : (
          <>
            {gasLatest > 0 && (
              <div
                className={`sensor-mini sensor-mini--gas ${gasLatest > GAS_DANGER_THRESHOLD ? "alert" : ""}`}
              >
                <Flame size={12} />
                <span>{gasLatest.toFixed(0)}</span>
              </div>
            )}
            {heatLatest > 0 && (
              <div
                className={`sensor-mini sensor-mini--heat ${heatLatest > HEAT_DANGER_THRESHOLD ? "alert" : ""}`}
              >
                <ThermometerSun size={12} />
                <span>{heatLatest.toFixed(1)}°</span>
              </div>
            )}
            {zone.alertSensorCount > 0 && (
              <div className="sensor-mini sensor-mini--heat alert">
                <AlertTriangle size={12} />
                <span>경고 {zone.alertSensorCount}</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="zone-card__footer">
        <span className={`status-text status-text--${zone.status.toLowerCase()}`}>
          {zone.status === "DANGER" ? "위험" : zone.status === "UNKNOWN" ? "미연결" : "정상"}
        </span>
        <span className="reason-tag">
          {!zone.hasSensor
            ? "센서 연결 대기"
            : zone.reasonCodes?.length > 0
              ? getReasonSummary(zone.reasonCodes, zone.status)
              : "정상 범위"}
        </span>
      </div>
    </button>
  );
}
