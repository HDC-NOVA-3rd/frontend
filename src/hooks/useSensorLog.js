/**
 * 센서 로그 조회 훅
 * 초기에 1회 로드합니다. 실시간 업데이트는 useSafetyMqtt에서 함께 처리됩니다.
 */

import { useState, useEffect, useCallback } from 'react';
import { getSensorLog } from '../services/safetyApi';

/**
 * 센서 로그를 초기에 1회 조회하는 훅
 * @param {number} apartmentId - 아파트 ID
 * @param {object} options - 추가 옵션
 * @returns {object} - { data, loading, error, refetch }
 */
export function useSensorLog(apartmentId, options = {}) {
  const { enabled = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!apartmentId || !enabled) return;
    try {
      setLoading(true);
      const result = await getSensorLog(apartmentId);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [apartmentId, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
