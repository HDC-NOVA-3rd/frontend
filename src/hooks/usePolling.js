/**
 * 범용 폴링 훅
 * React Query 없이 useEffect + setInterval로 주기적 데이터 갱신을 처리합니다.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const DEFAULT_POLLING_INTERVAL = 10000; // 10초

/**
 * 폴링을 통해 데이터를 주기적으로 가져오는 훅
 * @param {Function} fetchFn - 데이터를 가져오는 비동기 함수
 * @param {object} options - 옵션
 * @param {number} options.interval - 폴링 간격 (ms), 기본값 10000
 * @param {boolean} options.enabled - 폴링 활성화 여부, 기본값 true
 * @param {any[]} options.deps - 의존성 배열
 * @returns {object} - { data, loading, error, lastUpdated, refetch }
 */
export function usePolling(fetchFn, options = {}) {
  const {
    interval = DEFAULT_POLLING_INTERVAL,
    enabled = true,
    deps = [],
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // fetchFn을 ref로 저장하여 불필요한 재렌더링 방지
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const fetchData = useCallback(async () => {
    try {
      const result = await fetchFnRef.current();
      setData(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      // AbortError는 무시 (요청 취소)
      if (err.name !== 'AbortError') {
        setError(err);
        console.error('Polling fetch error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // 초기 데이터 로드
    setLoading(true);
    fetchData();

    // 폴링 시작
    const intervalId = setInterval(fetchData, interval);

    // 클린업: 컴포넌트 언마운트 시 인터벌 정리
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchData, interval, enabled]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refetch: fetchData,
  };
}
