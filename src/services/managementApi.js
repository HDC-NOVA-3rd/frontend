import { get, post, put, patch } from "./api";

/** [관리자] 관리비 항목 전체 조회 */
export function getManagementFees() {
  return get("/api/admin/management-fee");
}

/** [관리자] 관리비 항목 등록 */
export function createManagementFee(data) {
  return post("/api/admin/management-fee", data);
}

/** [관리자] 관리비 항목 수정 */
export function updateManagementFee(feeId, data) {
  return put(`/api/admin/management-fee/${feeId}`, data);
}

/** [관리자] 관리비 항목 비활성화 (삭제) */
export function deactivateManagementFee(feeId) {
  return patch(`/api/admin/management-fee/${feeId}/deactivate`);
}

/** [관리자] 관리비 항목 복구 */
export function restoreManagementFee(feeId) {
  return patch(`/api/admin/management-fee/${feeId}/restore`);
}