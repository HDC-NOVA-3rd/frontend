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

  // 고지서 총액 계산 (활성화된 항목의 단가 합계)
  const totalBillAmount = fees
    .filter(fee => fee.active)
    .reduce((sum, fee) => sum + (Number(fee.price) || 0), 0);

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
    <div className={`safety-dashboard mgmt-page ${loading ? 'safety-dashboard--loading' : ''}`}>

      {/* KPI 섹션 */}
      <section className="kpi-section">
        
        <div className="kpi-card kpi-card--warning" style={{ borderLeft: '4px solid #f59e0b' }}>
          <span className="kpi-label">세대별 관리비</span>
          <div className="kpi-data">
            <span className="kpi-value" style={{ color: '#f59e0b' }}>{totalBillAmount.toLocaleString()}</span>
            <span className="kpi-sub">원</span>
          </div>
        </div>

        <div className="kpi-card kpi-card--primary">
          <span className="kpi-label">전체 항목</span>
          <div className="kpi-data">
            <span className="kpi-value">{fees.length}</span>
            <span className="kpi-sub">건</span>
          </div>
        </div>



        <div className="kpi-card kpi-card--success">
          <span className="kpi-label">활성 항목</span>
          <div className="kpi-data">
            <span className="kpi-value">{fees.filter(f => f.active).length}</span>
            <span className="kpi-sub">사용중</span>
          </div>
        </div>
        
        <div className="kpi-card kpi-card--danger">
          <span className="kpi-label">비활성 항목</span>
          <div className="kpi-data">
            <span className="kpi-value">{fees.filter(f => !f.active).length}</span>
            <span className="kpi-sub">미사용</span>
          </div>
        </div>
      </section>

      {/* 메인 리스트 영역 */}
      <div className="section-header">
        <h3>
          <span className="pulse-dot"></span>
          관리비 항목 설정
        </h3>
        <div className="header-actions">
           <button className="action-btn action-btn--unlock" onClick={() => openEditModal()}>
             + 항목 추가
           </button>
           <button className={`refresh-btn ${loading ? 'refreshing' : ''}`} onClick={fetchFees}>
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
           </button>
        </div>
      </div>
      
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
                <td className="text-muted font-mono">{fee.id}</td>
                <td className="fee-name-cell">{fee.name}</td>
                <td className="font-semibold text-primary">{fee.price?.toLocaleString()}원</td>
                <td className="text-muted truncate">{fee.description || '-'}</td>
                <td>
                  <span className={`status-badge ${fee.active ? 'status-badge--safe' : 'status-badge--unknown'}`}>
                    {fee.active ? "활성화" : "비활성화"}
                  </span>
                </td>
                <td>
                  <div className="action-cell">
                    <button className="btn-edit-mini" onClick={() => openEditModal(fee)}>수정</button>
                    <button 
                      className={`btn-status-mini ${fee.active ? 'deactivate' : 'restore'}`} 
                      onClick={() => handleStatusClick(fee)}
                    >
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
          <div className="modal-content zone-detail-drawer shadow-lg">
            <div className="drawer-header">
              <h3>{editingId ? "항목 수정" : "새 항목 등록"}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="drawer-sensors">
              <div className="form-group">
                <label className="kpi-label">항목명</label>
                <input className="custom-input" name="name" value={formData.name} onChange={handleChange} required placeholder="항목 이름을 입력하세요" />
              </div>
              <div className="form-group">
                <label className="kpi-label">단가 (원)</label>
                <input className="custom-input" name="price" type="number" value={formData.price} onChange={handleChange} required placeholder="0" />
              </div>
              <div className="form-group">
                <label className="kpi-label">설명</label>
                <textarea className="custom-textarea" name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="항목에 대한 상세 설명을 입력하세요" />
              </div>
              <div className="drawer-actions">
                <div className="drawer-action-row">
                  <button type="button" className="action-btn" onClick={() => setIsModalOpen(false)}>취소</button>
                  <button type="submit" className="action-btn action-btn--unlock" style={{background: '#3b82f6', color: 'white'}}>저장하기</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 비활성화 확인 모달 */}
      {isConfirmOpen && (
        <div className="modal-overlay">
          <div className="modal-content critical-alert-banner" style={{position: 'relative', gridTemplateColumns: '1fr', width: '360px'}}>
             <div className="critical-alert-banner__content">
                <strong>정말 비활성화하시겠습니까?</strong>
                <p><strong>{targetFee?.name}</strong> 항목을 비활성화하면 관리비 산정 및 노출에서 제외됩니다.</p>
             </div>
             <div className="drawer-action-row" style={{marginTop: '1.5rem'}}>
                <button className="critical-alert-banner__close" onClick={() => setIsConfirmOpen(false)}>취소</button>
                <button className="action-btn action-btn--lock" onClick={() => toggleStatus(targetFee.id, true)}>비활성화</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementFeePage;