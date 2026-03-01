import { get, post, put, patch, del } from "./api";

/** [관리자] 입주민 상세 조회 */
export function getResident(residentId) {
  return get(`/api/resident/${residentId}`);
}

/** [관리자] 아파트 전체 입주민 목록 조회 (필터 및 검색 포함) */
// params 예시: { dongId: 1, searchTerm: "홍길동" }
export function getResidentsByApartment(params = {}) {
  return get("/api/resident/apartment", { params });
}

/** [관리자] 입주민 등록 */
export function createResident(data) {
  return post("/api/resident", data);
}

/** [관리자] 입주민 정보 수정 */
export function updateResident(residentId, data) {
  return put(`/api/resident/${residentId}`, data);
}

/** [관리자] 입주민 삭제 */
export function deleteResident(residentId) {
  return del(`/api/resident/${residentId}`);
}

/** [관리자] 특정 호 입주민 전체 삭제 */
export function deleteResidentsByHo(hoId) {
  return del(`/api/resident/ho/${hoId}`);
}