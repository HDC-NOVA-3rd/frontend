/**
 * Bill (admin) API
 * Requires a valid admin access token in localStorage as `accessToken`.
 */

import { get, post, put, del } from "./api";

/** 고지서 목록 조회 (관리자) */
export function getBillList() {
  return get("/api/bill"); // 관리자 → 단지 전체 고지서 조회
}

/** 개별 고지서 상세 조회 (관리자) */
export function getBill(billId) {
  return get(`/api/bill/${billId}`);
}

