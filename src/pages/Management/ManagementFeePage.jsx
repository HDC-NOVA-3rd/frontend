import React, { useState, useEffect } from 'react';
import { 
  getManagementFees, 
  createManagementFee, 
  updateManagementFee, 
  deactivateManagementFee, 
  restoreManagementFee 
} from '../../services/managementApi';
import "./ManagementFeePage.css";

const ManagementFeePage = () => {
  const [fees, setFees] = useState([]);
  const [formData, setFormData] = useState({ name: '', price: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [targetFee, setTargetFee] = useState(null);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const response = await getManagementFees();
      const data = response?.data || response;
      setFees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFees(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openEditModal = (fee = null) => {
    if (fee) {
      setEditingId(fee.id);
      setFormData({ name: fee.name, price: fee.price, description: fee.description });
    } else {
      setEditingId(null);
      setFormData({ name: '', price: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateManagementFee(editingId, formData);
      } else {
        await createManagementFee(formData);
      }
      setIsModalOpen(false);
      fetchFees();
    } catch (error) {
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  const handleStatusClick = (fee) => {
    if (fee.active) {
      setTargetFee(fee);
      setIsConfirmOpen(true);
    } else {
      toggleStatus(fee.id, false);
    }
  };

  const toggleStatus = async (feeId, isActive) => {
    try {
      if (isActive) {
        await deactivateManagementFee(feeId);
      } else {
        await restoreManagementFee(feeId);
      }
      setIsConfirmOpen(false);
      fetchFees();
    } catch (error) {
      alert("상태 변경 실패");
    }
  };

  return (
    <div className="mgmt-container">
      <header className="mgmt-header">
        <h2 className="main-title">관리비 항목 설정</h2>
        <button className="btn-primary" onClick={() => openEditModal()}>+ 항목 추가</button>
      </header>

      {/* KPI 섹션 */}
      <section className="kpi-section">
        <div className="kpi-card">
          <span className="kpi-label">전체</span>
          <span className="kpi-value">{fees.length}</span>
        </div>
        <div className="kpi-card active">
          <span className="kpi-label">활성</span>
          <span className="kpi-value">{fees.filter(f => f.active).length}</span>
        </div>
        <div className="kpi-card inactive">
          <span className="kpi-label">비활성</span>
          <span className="kpi-value">{fees.filter(f => !f.active).length}</span>
        </div>
      </section>

      <div className="table-wrapper">
        <table className="mgmt-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>ID</th>
              <th style={{ minWidth: '180px' }}>항목명</th>
              <th style={{ width: '150px' }}>단가</th>
              <th>설명</th>
              <th style={{ width: '120px' }}>상태</th>
              <th style={{ width: '180px' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {fees.map(fee => (
              <tr key={fee.id} className={!fee.active ? 'row-inactive' : ''}>
                <td className="text-muted">{fee.id}</td>
                <td className="fee-name-cell">{fee.name}</td>
                <td className="font-semibold">{fee.price?.toLocaleString()}원</td>
                <td className="text-muted truncate">{fee.description || '-'}</td>
                <td>
                  <span className={`status-text ${fee.active ? 'active' : 'inactive'}`}>
                    {fee.active ? "● 활성화" : "○ 비활성화"}
                  </span>
                </td>
                <td>
                  <div className="action-cell">
                    <button className="btn-edit" onClick={() => openEditModal(fee)}>수정</button>
                    <button className={`btn-status ${fee.active ? 'deactivate' : 'restore'}`} 
                            onClick={() => handleStatusClick(fee)}>
                      {fee.active ? "비활성" : "복구"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 등록/수정 모달 */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">{editingId ? "항목 수정" : "새 항목 등록"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>항목명</label>
                <input name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>단가 (원)</label>
                <input name="price" type="number" value={formData.price} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>설명</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="3" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>취소</button>
                <button type="submit" className="btn-save">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 비활성화 확인 모달 */}
      {isConfirmOpen && (
        <div className="modal-overlay">
          <div className="modal-content confirm">
            <h3 className="modal-title">정말 비활성화하시겠습니까?</h3>
            <p className="confirm-desc"><strong>{targetFee?.name}</strong> 항목을 비활성화하면<br/>관리비 산정 및 노출에서 제외됩니다.</p>
            <div className="modal-actions centered">
              <button className="btn-cancel" onClick={() => setIsConfirmOpen(false)}>취소</button>
              <button className="btn-danger" onClick={() => toggleStatus(targetFee.id, true)}>비활성화</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementFeePage;