/**
 * 알림 발송 훅
 * POST 요청을 통해 화재/위험 알림을 발송합니다.
 */

import { useState, useCallback } from 'react';
import { sendAlert } from '../services/safetyApi';

/**
 * 알림 발송을 처리하는 훅
 * @returns {object} - { send, loading, error, success, reset }
 */
export function useAlert() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  /**
   * 알림 발송 실행
   * @param {object} alertData - 알림 데이터
   * @returns {Promise<any>} - 응답 데이터
   */
  const send = useCallback(async (alertData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await sendAlert(alertData);
      setSuccess(true);
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
    setSuccess(false);
  }, []);

  return {
    send,
    loading,
    error,
    success,
    reset,
  };
}
