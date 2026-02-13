import { get, post, put, patch, del } from "./api";

/** [입주민] 민원 등록 */
export function createComplaint(data) {
  return post("/api/complaint", data);
}

/** [입주민] 민원 수정 */
export function updateComplaint(complaintId, data) {
  return put(`/api/complaint/${complaintId}`, data);
}

/** [입주민] 민원 피드백(리뷰) 등록 */
export function createFeedback(complaintId, data) {
  return post(`/api/complaint/${complaintId}/feedbacks`, data);
}

/** [입주민] 내 민원 목록 조회 */
export function getMyComplaints(active) {
  // axios의 get은 두 번째 인자가 config 객체이므로 params로 감싸야 합니다.
  const config = active !== undefined ? { params: { active } } : {};
  return get("/api/complaint/list/member", config);
}

/** [입주민] 내 민원 상세 조회 */
export function getComplaintDetailForMember(complaintId) {
  return get(`/api/complaint/${complaintId}/member`);
}

/** [입주민] 민원 취소 */
export function cancelComplaint(complaintId) {
  return patch(`/api/complaint/${complaintId}/cancel`);
}

/** [입주민] 민원 삭제 */
export function deleteComplaint(complaintId) {
  return del(`/api/complaint/${complaintId}`);
}

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