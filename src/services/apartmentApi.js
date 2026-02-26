import { get } from "./api";

/** * [공통] 전체 아파트 목록 조회 
 * @returns {Promise<Array>} ApartmentResponse 리스트
 */
export function getApartmentList() {
  return get("/api/apartment");
}

/** * [구조] 특정 아파트의 동(Dong) 목록 조회 
 * @param {number|string} apartmentId 아파트 고유 ID
 * @returns {Promise<Array>} DongResponse 리스트
 */
export function getDongList(apartmentId) {
  return get(`/api/apartment/${apartmentId}/dong`);
}

/** * [구조] 특정 동의 호(Ho) 목록 조회 
 * @param {number|string} dongId 동 고유 ID (dongNo 아님)
 * @returns {Promise<Array>} HoResponse 리스트
 */
export function getHoList(dongId) {
  return get(`/api/apartment/dong/${dongId}/ho`);
}

/** * [구조] 특정 아파트의 커뮤니티 시설 목록 조회 
 * @param {number|string} apartmentId 아파트 고유 ID
 * @returns {Promise<Array>} FacilityResponse 리스트
 */
export function getFacilityList(apartmentId) {
  return get(`/api/apartment/${apartmentId}/facility`);
}