import { useEffect, useState, useRef, useCallback } from 'react';
import mqtt from 'mqtt';
import { get } from '../services/api';

const MQTT_TOPIC = 'hdc/frontend/safety/update';

/**
 * Safety 정보를 초기에 REST API로 받고, 이후 MQTT로 실시간 업데이트 수신하는 Hook
 * 
 * @param {number} apartmentId - 아파트 ID
 * @param {Object} options - 옵션
 * @param {string} options.brokerUrl - MQTT 브로커 WebSocket URL (기본: env에서 읽음)
 * @param {boolean} options.enabled - 활성화 여부 (기본: true)
 * @returns {{ safetyStatus, eventLogs, sensorLogs, isConnected, loading, error, refetch }}
 */
export function useSafetyMqtt(apartmentId, options = {}) {
  const {
    brokerUrl = import.meta.env.VITE_MQTT_BROKER_URL || 'ws://localhost:9001',
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
      console.error('초기 safety 데이터 로드 실패:', err);
      setError(err.message || 'API 호출에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [apartmentId]);

  // MQTT 메시지 수신 시 이벤트/센서 로그 갱신
  const refreshLogsAfterUpdate = useCallback(async () => {
    if (!apartmentId) return;
    try {
      const [eventData, sensorData] = await Promise.all([
        get(`/api/safety/event/log/apartment/${apartmentId}`),
        get(`/api/safety/sensor/log/apartment/${apartmentId}`),
      ]);
      setEventLogs(eventData || []);
      setSensorLogs(sensorData || []);
    } catch (err) {
      console.error('로그 갱신 실패:', err);
    }
  }, [apartmentId]);

  useEffect(() => {
    if (!apartmentId || !enabled) {
      setLoading(false);
      return;
    }

    // 1. 초기 데이터 REST API로 로드
    fetchInitialData();

    // 2. MQTT 브로커 연결
    const client = mqtt.connect(brokerUrl, {
      clientId: `frontend_safety_${apartmentId}_${Date.now()}`,
      clean: true,
      reconnectPeriod: 3000,
      connectTimeout: 30000,
    });

    client.on('connect', () => {
      console.log('✅ MQTT Connected');
      setIsConnected(true);

      client.subscribe(MQTT_TOPIC, { qos: 2 }, (err) => {
        if (err) {
          console.error('❌ MQTT subscribe failed:', err);
        } else {
          console.log(`✅ Subscribed to ${MQTT_TOPIC}`);
        }
      });
    });

    client.on('message', (_topic, message) => {
      try {
        const update = JSON.parse(message.toString());
        console.log('📨 Safety MQTT update:', update);

        // safetyStatus 배열 업데이트 (동일 구역이면 교체, 아니면 추가)
        setSafetyStatus((prev) => {
          const idx = prev.findIndex(
            (item) =>
              item.dongNo === update.dongNo &&
              item.facilityName === update.facilityName
          );
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = update;
            return next;
          }
          return [update, ...prev];
        });

        setLastUpdated(new Date());

        // 이벤트/센서 로그도 갱신 (상태 변경 시 서버에서 새 로그가 생기므로)
        refreshLogsAfterUpdate();
      } catch (err) {
        console.error('❌ MQTT message parse error:', err);
      }
    });

    client.on('error', (err) => {
      console.error('❌ MQTT error:', err);
      setIsConnected(false);
    });

    client.on('close', () => {
      setIsConnected(false);
    });

    client.on('reconnect', () => {
      console.log('🔄 MQTT reconnecting...');
    });

    clientRef.current = client;

    return () => {
      if (clientRef.current) {
        clientRef.current.end();
        clientRef.current = null;
      }
    };
  }, [apartmentId, brokerUrl, enabled, fetchInitialData, refreshLogsAfterUpdate]);

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
