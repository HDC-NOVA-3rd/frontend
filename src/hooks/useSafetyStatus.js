/**
 * 안전 상태 조회 훅
 * 초기에 1회 로드합니다. 실시간 업데이트는 useSafetyMqtt 훅을 사용하세요.
 */

import { useState, useEffect, useCallback } from 'react';
import { getSafetyStatus } from '../services/safetyApi';

/**
 * 안전 상태를 초기에 1회 조회하는 훅
 * @param {number} apartmentId - 아파트 ID
 * @param {object} options - 추가 옵션
 * @returns {object} - { data, loading, error, refetch }
 */
export function useSafetyStatus(apartmentId, options = {}) {
  const { enabled = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!apartmentId || !enabled) return;
    try {
      setLoading(true);
      const result = await getSafetyStatus(apartmentId);
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
