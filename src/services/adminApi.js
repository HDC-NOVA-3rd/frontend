/**
 * Admin API Service
 * 관리자 인증 및 계정 관리 관련 API
 */

import { get, post } from "./api";

/* ===========================
    Auth
=========================== */

/**
 * 관리자 로그인 (1차 - ID/PW)
 * @param {{ loginId: string, password: string }}
 */
export const adminLogin = (data) =>
  post("/api/admin/auth/login", data);

/**
 * 로그인 OTP 검증 (2차 인증)
 * @param {{ loginId: string, otpCode: string }}
 */
export const verifyOtp = (data) =>
  post("/api/admin/auth/login/otp", data);

/**
 * 로그아웃
 */
export const adminLogout = () =>
  post("/api/admin/auth/logout"); 

/**
 * Access 토큰 재발급
 */
export const adminRefresh = () =>
  post("/api/admin/auth/refresh"); 

/* ===========================
    Password
=========================== */

/**
 * 로그인 상태 비밀번호 변경 요청 (OTP 발송)
 */
export const requestChangePassword = (data) =>
  post(
    "/api/admin/account/password/change/request",
    data,
  );

/**
 * 로그인 상태 비밀번호 변경 확정
 */
export const confirmChangePassword = (data) =>
  post(
    "/api/admin/account/password/change/confirm",
    data,
  );

/**
 * 비로그인 비밀번호 초기화 요청 (OTP 발송)
 */
export const requestPasswordReset = (data) =>
  post(
    "/api/admin/auth/password/reset/request",
    data,
  );

/**
 * 비로그인 비밀번호 초기화 확정
 */
export const confirmPasswordReset = (data) =>
  post(
    "/api/admin/auth/password/reset/confirm",
    data,
  );

/* ===========================
    Admin Account
=========================== */

/**
 * 관리자 생성 (SUPER_ADMIN 전용)
 */
export const createAdmin = (data) =>
  post("/api/admin/account/register", data);

/* ===========================
    Admin Info
=========================== */

/**
 * 내 정보 조회
 */
export const getMyAdminInfo = () =>
  get("/api/admin/account/profile");

/**
 * 내 아파트 정보 조회
 */
export const getMyApartmentInfo = () =>
  get("/api/admin/account/apartment");
