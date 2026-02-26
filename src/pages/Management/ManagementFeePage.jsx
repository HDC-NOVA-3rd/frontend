import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, 
  Settings2, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  X,
  RefreshCw,
  Edit2,
  Trash2,
  RotateCcw
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
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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
      setFormData({ name: fee.name, price: fee.price, description: fee.description || '' });
    } else {
      setEditingId(null);
      setFormData({ name: '', price: '', description: '' });
    }
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setEditingId(null);
      setFormData({ name: '', price: '', description: '' });
    }, 300);
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
    <div className="bill-dashboard management-fee-page">
      
      {/* 1. 상단 KPI 섹션 */}
      <section className="bill-kpi-section">
        <div className="bill-kpi-card" style={{ borderTopColor: '#f59e0b' }}>
          <div className="kpi-label">세대별 관리비 총 합계</div>
          <div className="kpi-value" style={{ color: '#f59e0b' }}>
            {totalBillAmount.toLocaleString()}<small style={{fontSize: '1rem', marginLeft: '4px'}}>원</small>
          </div>
        </div>
        <div className="bill-kpi-card" style={{ borderTopColor: '#3b82f6' }}>
          <div className="kpi-label">전체 항목 수</div>
          <div className="kpi-value">{stats.total}<small style={{fontSize: '1rem', marginLeft: '4px'}}>건</small></div>
        </div>
        <div className="bill-kpi-card" style={{ borderTopColor: '#10b981' }}>
          <div className="kpi-label">활성(사용중)</div>
          <div className="kpi-value">{stats.active}<small style={{fontSize: '1rem', marginLeft: '4px'}}>개</small></div>
        </div>
        <div className="bill-kpi-card danger">
          <div className="kpi-label">비활성(미사용)</div>
          <div className="kpi-value">{stats.inactive}<small style={{fontSize: '1rem', marginLeft: '4px'}}>개</small></div>
        </div>
      </section>

      {/* 2. 섹션 헤더 및 컨트롤러 */}
      <div className="bill-filter-card">
        <div className="bill-filter-form">
          <div className="input-group">
            <h3 style={{ display: 'flex', alignItems: 'center', margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
              <Settings2 size={20} style={{ marginRight: '8px', color: '#64748b' }} />
              관리비 항목 설정
            </h3>
          </div>
          
          <div className="filter-right-wrapper">
            <button className={`reset-btn ${loading ? 'spin' : ''}`} onClick={fetchFees} title="새로고침">
              <RefreshCw size={18} />
            </button>
            <button className="excel-btn" onClick={() => openDrawer()}>
              <Plus size={18} /> 항목 추가
            </button>
          </div>
        </div>
      </div>
      
      {/* 3. 테이블 영역 */}
      <div className="bill-table-card">
        <div className="table-responsive">
          <table className="bill-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th style={{ minWidth: '180px' }}>항목명</th>
                <th style={{ width: '150px' }}>단가</th>
                <th>설명</th>
                <th style={{ width: '120px' }}>상태</th>
                <th style={{ width: '100px' }}>편집</th>
                <th style={{ width: '100px' }}>상태 관리</th>
              </tr>
            </thead>
            <tbody>
              {fees.length > 0 ? (
                fees.map(fee => (
                  <tr key={fee.id} className={!fee.active ? 'row-inactive' : 'row-hover'}>
                    <td className="font-mono" style={{color: '#94a3b8'}}>{fee.id}</td>
                    <td><strong>{fee.name}</strong></td>
                    <td className="text-primary" style={{fontWeight: 700}}>{fee.price?.toLocaleString()}원</td>
                    <td className="text-muted" style={{textAlign: 'left'}}>{fee.description || '-'}</td>
                    <td>
                      <span className={`status-badge ${fee.active ? 'status-paid' : 'status-unpaid'}`} style={{display: 'inline-flex', alignItems: 'center', gap: '4px'}}>
                        {fee.active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {fee.active ? "사용중" : "비활성"}
                      </span>
                    </td>
                    {/* 관리 컬럼 분리 1: 수정 */}
                    <td>
                      <button className="sm-detail-btn" onClick={() => openDrawer(fee)} style={{ width: '100%', padding: '6px 0' }}>
                        <Edit2 size={14} style={{marginRight: '4px'}}/> 편집
                      </button>
                    </td>
                    {/* 관리 컬럼 분리 2: 비활성/복구 */}
                    <td>
                      <button 
                        className={`sm-detail-btn ${fee.active ? 'btn-danger-outline' : 'btn-success-outline'}`}
                        onClick={() => handleStatusClick(fee)}
                        style={{ width: '100%', padding: '6px 0' }}
                      >
                        {fee.active ? <><Trash2 size={14} /> 비활성</> : <><RotateCcw size={14} /> 복구</>}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" className="no-data">등록된 관리비 항목이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. 우측 드로어 (Drawer) */}
      <div className={`side-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3>{editingId ? "📄 항목 정보 수정" : "➕ 새 항목 등록"}</h3>
          <button className="drawer-close" onClick={closeDrawer}><X size={24} /></button>
        </div>

        <div className="drawer-body">
          <form onSubmit={handleSubmit} className="drawer-content">
            <div className="detail-info-card">
              <div className="form-group" style={{marginBottom: '20px'}}>
                <label className="kpi-label">항목명</label>
                <input className="text-input" style={{width: '100%'}} name="name" value={formData.name} onChange={handleChange} required placeholder="예: 일반관리비, 전기료" />
              </div>
              <div className="form-group" style={{marginBottom: '20px'}}>
                <label className="kpi-label">단가 (원)</label>
                <input className="text-input" style={{width: '100%'}} name="price" type="number" value={formData.price} onChange={handleChange} required placeholder="0" />
              </div>
              <div className="form-group">
                <label className="kpi-label">상세 설명</label>
                <textarea 
                  className="text-input" 
                  style={{width: '100%', height: '120px', padding: '12px', resize: 'none'}} 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  placeholder="항목에 대한 설명을 입력하세요" 
                />
              </div>
            </div>
            
            <div className="drawer-actions">
              <button type="button" className="close-action-btn" onClick={closeDrawer} style={{flex: 1, background: '#f1f5f9', color: '#64748b'}}>취소</button>
              <button type="submit" className="excel-btn" style={{flex: 2, justifyContent: 'center'}}>저장하기</button>
            </div>
          </form>
        </div>
      </div>
      {isDrawerOpen && <div className="drawer-backdrop" onClick={closeDrawer}></div>}

      {/* 5. 비활성화 확인 모달 */}
      {isConfirmOpen && (
        <div className="drawer-backdrop" style={{zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div className="bill-filter-card" style={{width: '380px', textAlign: 'center', padding: '32px'}}>
            <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
            <h4 style={{fontSize: '1.2rem', marginBottom: '8px'}}>정말 비활성화하시겠습니까?</h4>
            <p style={{color: '#64748b', marginBottom: '24px'}}><strong>{targetFee?.name}</strong> 항목을 비활성화하면<br/>이후 발생하는 고지서 항목에서 제외됩니다.</p>
            <div className="button-group" style={{justifyContent: 'center'}}>
              <button className="reset-btn" style={{width: 'auto', padding: '0 20px'}} onClick={() => setIsConfirmOpen(false)}>취소</button>
              <button className="excel-btn" style={{background: '#ef4444'}} onClick={() => toggleStatus(targetFee.id, true)}>비활성화 실행</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementFeePage;