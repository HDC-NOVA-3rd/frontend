// services/complaintApi.js
import { get } from "./api";

// 관리자(아파트 기준) 민원 전체 조회
export function getComplaintsByApartment() {
  return get("/api/complaint/list/apartment");
}
