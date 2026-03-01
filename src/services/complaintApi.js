import { get, post, patch } from "./api";

/** [관리자] 민원 담당 관리자 배정 */
export function assignAdmin(complaintId, targetAdminId) {
  // post(url, data, config) 순서이므로 data는 null, params는 config에 넣습니다.
  return post(`/api/complaint/${complaintId}/assign`, null, { params: { targetAdminId } });
}

/** [관리자] 민원 상태 변경 */
export function changeComplaintStatus(complaintId, status) {
  return patch(`/api/complaint/${complaintId}/status`, null, { params: { status } });
}

/** [관리자] 민원 답변 등록 */
export function createComplaintAnswer(complaintId, data) {
  return post(`/api/complaint/${complaintId}/answers`, data);
}

/** [관리자] 민원 해결 완료 처리 */
export function completeComplaint(complaintId) {
  return post(`/api/complaint/${complaintId}/complete`);
}

/** [관리자] 아파트 민원 상세 조회 */
export function getComplaintDetailForAdmin(complaintId) {
  return get(`/api/complaint/${complaintId}/apartment`);
}

/** [관리자] 아파트별 민원 목록 통합 조회 */
export function getComplaintsByApartment(active) {
  const config = active !== undefined ? { params: { active } } : {};
  return get("/api/complaint/list/apartment", config);
}