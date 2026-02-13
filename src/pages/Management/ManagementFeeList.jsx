import React, { useState, useEffect } from 'react';
import { 
  getManagementFees, 
  createManagementFee, 
  updateManagementFee, 
  deactivateManagementFee, 
  restoreManagementFee 
} from '../../services/managementApi';

const ManagementFeeList = () => {
  const [fees, setFees] = useState([]);
  // 백엔드 ManagementFeeCreateRequest 필드명에 맞춰 price 사용
  const [formData, setFormData] = useState({ name: '', price: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. 목록 로드
  const fetchFees = async () => {
    try {
      setLoading(true);
      const response = await getManagementFees();
      
      // 데이터가 response.data에 있거나 response 자체일 수 있으므로 처리
      const data = response?.data || response;
      
      // 데이터가 배열인지 확인 후 저장 (map 에러 방지)
      setFees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch Error:", error);
      setFees([]); // 에러 발생 시 빈 배열로 초기화
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  // 2. 입력 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 3. 등록 및 수정 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateManagementFee(editingId, formData);
        alert("수정되었습니다.");
      } else {
        await createManagementFee(formData);
        alert("등록되었습니다.");
      }
      setFormData({ name: '', price: '', description: '' });
      setEditingId(null);
      fetchFees();
    } catch (error) {
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  // 4. 수정 모드 진입
  const handleEdit = (fee) => {
    setEditingId(fee.id);
    // 백엔드 응답 필드인 price를 formData에 넣어줌
    setFormData({ name: fee.name, price: fee.price, description: fee.description });
  };

  // 5. 비활성화 및 복구
  const toggleStatus = async (feeId, isActive) => {
    try {
      if (isActive) {
        await deactivateManagementFee(feeId);
      } else {
        await restoreManagementFee(feeId);
      }
      fetchFees();
    } catch (error) {
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>관리비 항목 관리</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px' }}>
        <h3>{editingId ? "항목 수정" : "새 항목 등록"}</h3>
        <input name="name" placeholder="항목명" value={formData.name} onChange={handleChange} required style={{marginRight: '5px'}} />
        <input name="price" type="number" placeholder="단가" value={formData.price} onChange={handleChange} required style={{marginRight: '5px'}} />
        <input name="description" placeholder="설명" value={formData.description} onChange={handleChange} style={{marginRight: '5px'}} />
        <button type="submit">{editingId ? "수정완료" : "등록하기"}</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({ name: '', price: '', description: '' }); }} style={{marginLeft: '5px'}}>취소</button>}
      </form>

      {loading ? <p>로딩 중...</p> : (
        <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>항목명</th>
              <th>단가</th>
              <th>설명</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {/* fees가 배열인 경우에만 map 실행 */}
            {fees && fees.length > 0 ? (
              fees.map(fee => (
                <tr key={fee.id} style={{ backgroundColor: fee.active ? '#fff' : '#f0f0f0' }}>
                  <td>{fee.id}</td>
                  <td>{fee.name}</td>
                  {/* fee.unitPrice 대신 fee.price 사용 */}
                  <td>{fee.price?.toLocaleString()}원</td>
                  <td>{fee.description}</td>
                  <td>{fee.active ? "사용중" : "비활성"}</td>
                  <td>
                    <button onClick={() => handleEdit(fee)} style={{marginRight: '5px'}}>수정</button>
                    <button onClick={() => toggleStatus(fee.id, fee.active)}>
                      {fee.active ? "비활성화" : "복구"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>데이터가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ManagementFeeList;