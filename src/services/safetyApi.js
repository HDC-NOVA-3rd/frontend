/**
 * Safety API 서비스
 * 화재감시 대시보드를 위한 Safety 관련 API 함수들
 * 담당자: 경신 천
 */

import { get, post } from './api';

/**
 * 현재 안전 상태 리스트 조회
 * @param {number} apartmentId - 아파트 ID
 * @returns {Promise<any>} - 안전 상태 데이터
 */
export function getSafetyStatus(apartmentId) {
  return get(`/api/safety/status/apartment/${apartmentId}`);
}

/**
 * 안전 이벤트 로그 조회
 * @param {number} apartmentId - 아파트 ID
 * @returns {Promise<any>} - 이벤트 로그 데이터
 */
export function getEventLog(apartmentId) {
  return get(`/api/safety/event/log/apartment/${apartmentId}`);
}

/**
 * 센서 로그 조회
 * @param {number} apartmentId - 아파트 ID
 * @returns {Promise<any>} - 센서 로그 데이터
 */
export function getSensorLog(apartmentId) {
  return get(`/api/safety/sensor/log/apartment/${apartmentId}`);
}

/**
 * 시설 예약 차단/해제
 * @param {object} data - { facilityId: number, reservationAvailable: boolean }
 * @returns {Promise<any>} - 응답 데이터
 */
export function lockFacility(data) {
  return post('/api/safety/facility/lock', data);
}

/**
 * 화재/위험 알림 발송
 * @param {object} data - 알림 데이터
 * @returns {Promise<any>} - 응답 데이터
 */
export function sendAlert(data) {
  return post('/api/alert/safety', data);
}
