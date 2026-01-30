/**
 * 안전 상태 조회 훅
 * 10초마다 안전 상태 데이터를 폴링합니다.
 */

import { useCallback } from 'react';
import { usePolling } from './usePolling';
import { getSafetyStatus } from '../services/safetyApi';

/**
 * 안전 상태를 주기적으로 조회하는 훅
 * @param {number} apartmentId - 아파트 ID (로그인 담당자가 제공하는 useAuth에서 가져옴)
 * @param {object} options - 추가 옵션
 * @returns {object} - { data, loading, error, lastUpdated, refetch }
 */
export function useSafetyStatus(apartmentId, options = {}) {
  const fetchFn = useCallback(() => {
    if (!apartmentId) {
      return Promise.resolve(null);
    }
    return getSafetyStatus(apartmentId);
  }, [apartmentId]);

  return usePolling(fetchFn, {
    ...options,
    enabled: !!apartmentId && (options.enabled !== false),
    deps: [apartmentId],
  });
}
