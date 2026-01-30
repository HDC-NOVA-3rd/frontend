/**
 * 시설 잠금 제어 훅
 * POST 요청을 통해 시설 예약을 차단/해제합니다.
 */

import { useState, useCallback } from 'react';
import { lockFacility } from '../services/safetyApi';

/**
 * 시설 잠금/해제를 처리하는 훅
 * @returns {object} - { setLock, loading, error, reset }
 */
export function useFacilityLock() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * 시설 잠금/해제 실행
   * @param {number} facilityId - 시설 ID
   * @param {boolean} reservationAvailable - 예약 가능 여부 (false = 잠금, true = 해제)
   * @returns {Promise<any>} - 응답 데이터
   */
  const setLock = useCallback(async (facilityId, reservationAvailable) => {
    setLoading(true);
    setError(null);

    try {
      const result = await lockFacility({ facilityId, reservationAvailable });
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    setLock,
    loading,
    error,
    reset,
  };
}
