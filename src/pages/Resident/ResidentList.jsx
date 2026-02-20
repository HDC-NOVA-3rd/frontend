import React, { useState, useEffect } from "react";
import { 
  getResidentsByApartment, 
  createResident, 
  updateResident, 
  deleteResident 
} from "../../services/residentApi"; 
import "./ResidentList.css";

const ResidentList = () => {
  const [residents, setResidents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResident, setEditingResident] = useState(null); // 수정 시 데이터 저장
  const [formData, setFormData] = useState({ name: "", phone: "", dong: "", ho: "" });

  // 1. 목록 로드
  const fetchResidents = async () => {
    try {
      const data = await getResidentsByApartment();
      setResidents(data);
    } catch (error) {
      alert("입주민 목록을 불러오는데 실패했습니다.");
    }
  };

  useEffect(() => { fetchResidents(); }, []);

  // 2. 등록/수정 모달 열기
  const openModal = (resident = null) => {
    if (resident) {
      setEditingResident(resident);
      setFormData({ name: resident.name, phone: resident.phone, dong: resident.dong, ho: resident.ho });
    } else {
      setEditingResident(null);
      setFormData({ name: "", phone: "", dong: "", ho: "" });
    }
    setIsModalOpen(true);
  };

  // 3. 저장 (등록 or 수정)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingResident) {
        await updateResident(editingResident.id, formData);
        alert("수정되었습니다.");
      } else {
        await createResident(formData);
        alert("등록되었습니다.");
      }
      setIsModalOpen(false);
      fetchResidents();
    } catch (error) {
      alert("저장에 실패했습니다.");
    }
  };

  // 4. 삭제
  const handleDelete = async (id) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      try {
        await deleteResident(id);
        fetchResidents();
      } catch (error) {
        alert("삭제 실패");
      }
    }
  };

  return (
    <div className="resident-container">
      <div className="header">
        <h2>입주민 관리</h2>
        <button className="btn-primary" onClick={() => openModal()}>+ 신규 등록</button>
      </div>

      <table className="resident-table">
        <thead>
          <tr>
            <th>동</th>
            <th>호</th>
            <th>이름</th>
            <th>연락처</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {residents.map((r) => (
            <tr key={r.id}>
              <td>{r.dong}동</td>
              <td>{r.ho}호</td>
              <td>{r.name}</td>
              <td>{r.phone}</td>
              <td>
                <button className="btn-edit" onClick={() => openModal(r)}>수정</button>
                <button className="btn-delete" onClick={() => handleDelete(r.id)}>삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 등록/수정 모달 */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingResident ? "입주민 정보 수정" : "신규 입주민 등록"}</h3>
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder="이름" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              <input type="text" placeholder="전화번호" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
              <div className="form-row">
                <input type="text" placeholder="동" value={formData.dong} onChange={(e) => setFormData({...formData, dong: e.target.value})} required />
                <input type="text" placeholder="호" value={formData.ho} onChange={(e) => setFormData({...formData, ho: e.target.value})} required />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setIsModalOpen(false)}>취소</button>
                <button type="submit" className="btn-primary">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentList;