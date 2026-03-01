/**
 * Notice (admin) API
 * Requires a valid admin access token in localStorage as `accessToken`.
 */

import { get, post, put, del } from "./api";

/** 공지사항 목록 조회 (게시판) */
export function getNoticeList() {
  return get("/api/notice");
}

/** 공지사항 단건 조회 */
export function getNotice(noticeId) {
  return get(`/api/admin/notice/${noticeId}`);
}

export function createNotice(data) {
  // data: { title: string, content: string, dongIds?: number[] }
  return post("/api/admin/notice", data);
}

/** 공지사항 수정 */
export function updateNotice(noticeId, data) {
  // data: { title: string, content: string, dongIds?: number[] }
  return put(`/api/admin/notice/${noticeId}`, data);
}

/** 공지사항 삭제 */
export function deleteNotice(noticeId) {
  return del(`/api/admin/notice/${noticeId}`);
}

export function sendNoticeAlert(noticeId, data = {}) {
  // data: { dongIds?: number[] } - omit/empty => send to all allowed dongs
  return post(`/api/admin/notice/${noticeId}/send-alert`, data);
}

export function getNoticeLogs() {
  return get("/api/admin/notice/log");
}

export function getDongListByApartment(apartmentId) {
  return get(`/api/apartment/${apartmentId}/dong`);
}
