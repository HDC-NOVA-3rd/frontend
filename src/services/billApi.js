import { get } from "./api";

/** * 고지서 목록 조회 (관리자) 
 * @param {Object} params - { page, size, dongNo, hoNo, billMonth, onlyUnpaid }
 */
export function getBillList(params) {
  // get 함수가 두 번째 인자로 params를 받아 쿼리스트링으로 변환한다고 가정
  return get("/api/bill", params); 
}

/** 고지서 상세 조회 */
export function getBill(billId) {
  return get(`/api/bill/${billId}`);
}

/** 엑셀 데이터 조회 */
export function getBillExcel(params) {
  return get("/api/bill/excel", params);
}