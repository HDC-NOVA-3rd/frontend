import { useEffect, useState, useRef, useCallback } from "react";
import mqtt from "mqtt";
import { get } from "../services/api";

const MQTT_TOPIC = "hdc/frontend/safety/update";

/**
 * Safety 정보를 초기에 REST API로 받고,
 * 이후 Mosquitto 브로커(WebSocket)를 통해 MQTT로 실시간 업데이트 수신하는 Hook
 *
 * 데이터 흐름: MQTT 디바이스 → Mosquitto 브로커 ← 프론트엔드(subscribe)
 *
 * @param {number} apartmentId - 아파트 ID
 * @param {Object} options - 옵션
 * @param {boolean} options.enabled - 활성화 여부 (기본: true)
 * @returns {{ safetyStatus, eventLogs, sensorLogs, isConnected, loading, error, lastUpdated, refetch }}
 */
export function useSafetyMqtt(apartmentId, options = {}) {
  const {
    brokerUrl = import.meta.env.VITE_MQTT_BROKER_URL || "ws://223.171.136.185:9001",
    username = import.meta.env.VITE_MQTT_USERNAME || "",
    password = import.meta.env.VITE_MQTT_PASSWORD || "",
    enabled = true,
  } = options;

  const [safetyStatus, setSafetyStatus] = useState([]);
  const [eventLogs, setEventLogs] = useState([]);
  const [sensorLogs, setSensorLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const clientRef = useRef(null);

  // 초기 데이터 로드 (REST API - 한 번만)
  const fetchInitialData = useCallback(async () => {
    if (!apartmentId) return;
    try {
      setLoading(true);
      setError(null);

      const [statusData, eventData, sensorData] = await Promise.all([
        get(`/api/safety/status/apartment/${apartmentId}`),
        get(`/api/safety/event/log/apartment/${apartmentId}`),
        get(`/api/safety/sensor/log/apartment/${apartmentId}`),
      ]);

      setSafetyStatus(statusData || []);
      setEventLogs(eventData || []);
      setSensorLogs(sensorData || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("초기 safety 데이터 로드 실패:", err);
      setError(err.message || "API 호출에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [apartmentId]);

  useEffect(() => {
    if (!apartmentId || !enabled) {
      setLoading(false);
      return;
    }

    // 1. 초기 데이터 REST API로 로드
    fetchInitialData();

    // 2. Mosquitto 브로커에 MQTT over WebSocket 연결
    console.log("🔌 MQTT connecting to:", brokerUrl);
    const client = mqtt.connect(brokerUrl, {
      clientId: `frontend_safety_${apartmentId}_${Date.now()}`,
      clean: true,
      reconnectPeriod: 3000,
      connectTimeout: 10000,
      username: username || undefined,
      password: password || undefined,
      protocolVersion: 4,
    });

    clientRef.current = client;

    client.on("connect", () => {
      console.log("✅ MQTT Connected to Mosquitto broker");
      setIsConnected(true);

      client.subscribe(MQTT_TOPIC, { qos: 1 }, (err) => {
        if (err) {
          console.error("❌ MQTT subscribe failed:", err);
        } else {
          console.log(`✅ Subscribed to ${MQTT_TOPIC}`);
        }
      });
    });

    client.on("message", (_topic, message) => {
      try {
        const update = JSON.parse(message.toString());
        console.log("📨 Safety MQTT update:", update);

        // safetyStatus 즉시 업데이트 (구역 상태 카드)
        setSafetyStatus((prev) => {
          const idx = prev.findIndex(
            (item) => item.dongNo === update.dongNo && item.facilityName === update.facilityName,
          );
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = update;
            return next;
          }
          return [update, ...prev];
        });

        setLastUpdated(new Date());

        // 센서 로그도 MQTT 메시지로 받은 값 반영
        if (update.sensorType && update.value !== undefined) {
          setSensorLogs((prev) => {
            const idx = prev.findIndex((log) => {
              if (update.sensorId != null && log.sensorId != null) {
                return log.sensorId === update.sensorId;
              }
              return (
                log.sensorName === update.sensorName &&
                log.sensorType === update.sensorType &&
                log.dongNo === update.dongNo &&
                log.facilityName === update.facilityName
              );
            });

            const nextLog = {
              sensorId: update.sensorId,
              sensorName: update.sensorName || (idx !== -1 ? prev[idx].sensorName : undefined),
              dongNo: update.dongNo,
              hoNo: update.hoNo || (idx !== -1 ? prev[idx].hoNo : undefined),
              facilityName: update.facilityName,
              spaceName: update.spaceName || (idx !== -1 ? prev[idx].spaceName : undefined),
              sensorType: update.sensorType,
              value: update.value,
              unit: update.unit,
              recordedAt: update.recordedAt,
            };

            if (idx !== -1) {
              const next = [...prev];
              next[idx] = { ...next[idx], ...nextLog };
              return next;
            }

            return [nextLog, ...prev];
          });
        }
      } catch (err) {
        console.error("❌ MQTT message parse error:", err);
      }
    });

    client.on("error", (err) => {
      console.error("❌ MQTT error:", err);
      setIsConnected(false);
    });

    client.on("close", () => {
      console.log("MQTT connection closed");
      setIsConnected(false);
    });

    client.on("reconnect", () => {
      console.log("🔄 MQTT reconnecting to Mosquitto...");
    });

    client.on("offline", () => {
      console.log("MQTT client offline");
      setIsConnected(false);
    });

    return () => {
      if (clientRef.current) {
        clientRef.current.end(true);
        clientRef.current = null;
      }
    };
  }, [apartmentId, brokerUrl, username, password, enabled, fetchInitialData]);

  return {
    safetyStatus,
    eventLogs,
    sensorLogs,
    isConnected,
    loading,
    error,
    lastUpdated,
    refetch: fetchInitialData,
  };
}
