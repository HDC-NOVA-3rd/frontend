/**
 * 공통 API 클라이언트
 * React Query 없이 fetch 기반으로 API 호출을 처리합니다.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * API 에러 클래스
 * HTTP 에러 응답을 구조화된 형태로 처리합니다.
 */
export class ApiError extends Error {
  constructor(status, statusText, message) {
    super(message || `API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
  }
}

/**
 * JSON 데이터를 fetch하는 범용 함수
 * @param {string} endpoint - API 엔드포인트 (/api/...)
 * @param {RequestInit} options - fetch 옵션
 * @returns {Promise<any>} - JSON 응답 데이터
 */
export async function fetchJson(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Authorization 헤더 추가 (로그인 담당자가 구현할 토큰 관리와 연동)
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText);
  }

  // 204 No Content 처리
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/**
 * GET 요청 헬퍼
 */
export function get(endpoint, options = {}) {
  return fetchJson(endpoint, { ...options, method: 'GET' });
}

/**
 * POST 요청 헬퍼
 */
export function post(endpoint, data, options = {}) {
  return fetchJson(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PUT 요청 헬퍼
 */
export function put(endpoint, data, options = {}) {
  return fetchJson(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * DELETE 요청 헬퍼
 */
export function del(endpoint, options = {}) {
  return fetchJson(endpoint, { ...options, method: 'DELETE' });
}
