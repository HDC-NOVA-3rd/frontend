/**
 * 센서 로그 조회 훅
 * 10초마다 센서 로그 데이터를 폴링합니다.
 */

import { useCallback } from 'react';
import { usePolling } from './usePolling';
import { getSensorLog } from '../services/safetyApi';
import { mockSensorLog } from '../mocks/safetyMockData';

// 개발 중 Mock 데이터 사용 여부
const USE_MOCK = true;

/**
 * 센서 로그를 주기적으로 조회하는 훅
 * @param {number} apartmentId - 아파트 ID
 * @param {object} options - 추가 옵션
 * @returns {object} - { data, loading, error, lastUpdated, refetch }
 */
export function useSensorLog(apartmentId, options = {}) {
  const fetchFn = useCallback(() => {
    if (!apartmentId) {
      return Promise.resolve(null);
    }
    
    // Mock 데이터 사용 (백엔드 연결 전)
    if (USE_MOCK) {
      return Promise.resolve(mockSensorLog);
    }
    
    return getSensorLog(apartmentId);
  }, [apartmentId]);

  return usePolling(fetchFn, {
    ...options,
    enabled: !!apartmentId && (options.enabled !== false),
    deps: [apartmentId],
  });
}
