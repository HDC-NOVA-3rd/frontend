/**
 * 안전 이벤트 로그 조회 훅
 * 10초마다 이벤트 로그 데이터를 폴링합니다.
 */

import { useCallback } from 'react';
import { usePolling } from './usePolling';
import { getEventLog } from '../services/safetyApi';

/**
 * 안전 이벤트 로그를 주기적으로 조회하는 훅
 * @param {number} apartmentId - 아파트 ID
 * @param {object} options - 추가 옵션
 * @returns {object} - { data, loading, error, lastUpdated, refetch }
 */
export function useSafetyEventLog(apartmentId, options = {}) {
  const fetchFn = useCallback(() => {
    if (!apartmentId) {
      return Promise.resolve(null);
    }
    return getEventLog(apartmentId);
  }, [apartmentId]);

  return usePolling(fetchFn, {
    ...options,
    enabled: !!apartmentId && (options.enabled !== false),
    deps: [apartmentId],
  });
}
