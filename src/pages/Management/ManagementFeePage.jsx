import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, 
  Settings2, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  X,
  RefreshCw
} from "lucide-react";
import { 
  getManagementFees, 
  createManagementFee, 
  updateManagementFee, 
  deactivateManagementFee, 
  restoreManagementFee 
} from '../../services/managementApi';
import "./ManagementFeePage.css";

const ManagementFeePage = () => {
  // --- 1. 상태 관리 ---
  const [fees, setFees] = useState([]);
  const [formData, setFormData] = useState({ name: '', price: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // 드로어 상태로 명칭 변경
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [targetFee, setTargetFee] = useState(null);

  // --- 2. 데이터 페칭 ---
  const fetchFees = useCallback(async () => {
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
  }, []);

  useEffect(() => { 
    fetchFees(); 
  }, [fetchFees]);

  // --- 3. 통계 연산 ---
  const totalBillAmount = useMemo(() => {
    return fees
      .filter(fee => fee.active)
      .reduce((sum, fee) => sum + (Number(fee.price) || 0), 0);
  }, [fees]);

  const stats = useMemo(() => ({
    total: fees.length,
    active: fees.filter(f => f.active).length,
    inactive: fees.filter(f => !f.active).length
  }), [fees]);

  // --- 4. 이벤트 핸들러 ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openDrawer = (fee = null) => {
    if (fee) {
      setEditingId(fee.id);
      setFormData({ name: fee.name, price: fee.price, description: fee.description });
    } else {
      setEditingId(null);
      setFormData({ name: '', price: '', description: '' });
    }
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingId(null);
    setFormData({ name: '', price: '', description: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateManagementFee(editingId, formData);
      } else {
        await createManagementFee(formData);
      }
      closeDrawer();
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

      {/* 1. 상단 KPI 섹션 */}
      <section className="kpi-section">
        <div className="kpi-card kpi-card--warning" style={{ borderLeft: '4px solid #f59e0b' }}>
          <span className="kpi-label">세대별 관리비 합계</span>
          <div className="kpi-data">
            <span className="kpi-value" style={{ color: '#f59e0b' }}>{totalBillAmount.toLocaleString()}</span>
            <span className="kpi-sub">원</span>
          </div>
        </div>
        <div className="kpi-card kpi-card--primary">
          <span className="kpi-label">전체 항목</span>
          <div className="kpi-data">
            <span className="kpi-value">{stats.total}</span>
            <span className="kpi-sub">건</span>
          </div>
        </div>
        <div className="kpi-card kpi-card--success">
          <span className="kpi-label">활성 항목</span>
          <div className="kpi-data">
            <span className="kpi-value">{stats.active}</span>
            <span className="kpi-sub">사용중</span>
          </div>
        </div>
        <div className="kpi-card kpi-card--danger">
          <span className="kpi-label">비활성 항목</span>
          <div className="kpi-data">
            <span className="kpi-value">{stats.inactive}</span>
            <span className="kpi-sub">미사용</span>
          </div>
        </div>
      </section>

      {/* 2. 섹션 헤더 */}
      <div className="section-header">
        <h3>
          <Settings2 size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          관리비 항목 설정
        </h3>
        <div className="header-actions">
           <button className="action-btn action-btn--unlock" onClick={() => openDrawer()}>
             <Plus size={16} /> 항목 추가
           </button>
           <button className={`refresh-btn ${loading ? 'refreshing' : ''}`} onClick={fetchFees}>
             <RefreshCw size={16} />
           </button>
        </div>
      </div>
      
      {/* 3. 테이블 영역 */}
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
                    {fee.active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {fee.active ? "활성화" : "비활성화"}
                  </span>
                </td>
                <td>
                  <div className="action-cell">
                    <button className="btn-edit-mini" onClick={() => openDrawer(fee)}>수정</button>
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

      {/* 4. 우측 드로어 (Drawer) */}
      <div className={`modal-overlay ${isDrawerOpen ? 'active' : ''}`} onClick={closeDrawer} 
           style={{ display: isDrawerOpen ? 'block' : 'none' }}>
        <div className={`modal-content zone-detail-drawer ${isDrawerOpen ? 'open' : ''}`} 
             onClick={e => e.stopPropagation()}
             style={{ position: 'fixed', right: 0, top: 0, height: '100%', borderRadius: 0, width: '400px' }}>
          
          <div className="drawer-header">
            <h3>{editingId ? "항목 수정" : "새 항목 등록"}</h3>
            <button className="close-btn" onClick={closeDrawer}>
              <X size={24} />
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
              <textarea className="custom-textarea" name="description" value={formData.description} onChange={handleChange} rows="6" placeholder="상세 설명을 입력하세요" />
            </div>
            
            <div className="drawer-actions">
              <div className="drawer-action-row">
                <button type="button" className="action-btn" onClick={closeDrawer}>취소</button>
                <button type="submit" className="action-btn action-btn--unlock" style={{background: '#3b82f6', color: 'white'}}>저장하기</button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* 5. 비활성화 확인 모달 (중앙 알림창 유지) */}
      {isConfirmOpen && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content critical-alert-banner" style={{position: 'relative', gridTemplateColumns: '1fr', width: '360px'}}>
             <div className="critical-alert-banner__content">
                <AlertCircle size={32} color="#ef4444" style={{ marginBottom: '12px' }} />
                <strong>정말 비활성화하시겠습니까?</strong>
                <p><strong>{targetFee?.name}</strong> 항목을 비활성화하면 관리비 정산에서 제외됩니다.</p>
             </div>
             <div className="drawer-action-row" style={{marginTop: '1.5rem'}}>
                <button className="action-btn cancel-btn" onClick={() => setIsConfirmOpen(false)}>취소</button>
                <button className="action-btn action-btn--lock" onClick={() => toggleStatus(targetFee.id, true)}>비활성화</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementFeePage;