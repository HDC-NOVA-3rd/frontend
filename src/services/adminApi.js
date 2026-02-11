/**
 * Admin API 서비스
 * 관리자 로그인 및 계정/정보 관리 관련 API 함수들
 * 담당자: 창석 안
 */

import { get, post } from "./api";

/* ===========================
    Auth 관련
=========================== */

/**
 * 관리자 로그인 (1차 - ID/PW)
 * @param {object} data - { loginId, password }
 * @returns {Promise<any>}
 */
export function adminLogin(data) {
  return post("/api/admin/login", data);
}

/**
 * 로그인 OTP 검증 (2차 인증)
 * @param {object} data - { loginId, otpCode }
 * @returns {Promise<any>} - AdminTokenResponse
 */
export function adminLoginVerifyOtp(data) {
  return post(
    "/api/admin/login/verify-otp-code",
    data,
  );
}

/**
 * 로그아웃
 * @param {object} data - { refreshToken }
 * @returns {Promise<any>}
 */
export function adminLogout(data) {
  return post("/api/admin/logout", data);
}

/**
 * Access 토큰 재발급
 * @param {object} data - { refreshToken }
 * @returns {Promise<any>} - AdminTokenResponse
 */
export function adminRefresh(data) {
  return post("/api/admin/refresh", data);
}

/* ===========================
    비밀번호 관련
=========================== */

/**
 * 로그인 상태 비밀번호 변경 요청 (OTP 발송)
 * @param {object} data - { loginId, currentPassword }
 * @returns {Promise<any>}
 */
export function requestChangePassword(data) {
  return post(
    "/api/admin/password/change/request",
    data,
  );
}

/**
 * 로그인 상태 비밀번호 변경 확정
 * @param {object} data - { otpCode, currentPassword, newPassword, passwordConfirm }
 * @returns {Promise<any>}
 */
export function confirmChangePassword(data) {
  return post(
    "/api/admin/password/change/confirm",
    data,
  );
}

/**
 * 비로그인 비밀번호 초기화 요청 (OTP 발송)
 * @param {object} data - { loginId, email }
 * @returns {Promise<any>}
 */
export function requestPasswordReset(data) {
  return post(
    "/api/admin/password/reset/request",
    data,
  );
}

/**
 * 비로그인 비밀번호 초기화 확정
 * @param {object} data - { loginId, otpCode, newPassword, passwordConfirm }
 * @returns {Promise<any>}
 */
export function confirmPasswordReset(data) {
  return post(
    "/api/admin/password/reset/confirm",
    data,
  );
}

/* ===========================
   👤 관리자 계정 관리
=========================== */

/**
 * 관리자 생성 (SUPER_ADMIN 전용)
 * @param {object} data - AdminCreateRequest
 * @returns {Promise<any>}
 */
export function createAdmin(data) {
  return post("/api/admin/signup", data);
}

/* ===========================
   📄 관리자 정보 조회
=========================== */

/**
 * 내 정보 조회
 * @returns {Promise<any>} - AdminInfoResponse
 */
export function getMyAdminInfo() {
  return get("/api/admin/profile");
}

/**
 * 내 아파트 정보 조회
 * @returns {Promise<any>} - AdminApartmentResponse
 */
export function getMyApartmentInfo() {
  return get("/api/admin/apartment");
}
