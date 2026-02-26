import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  FileText,
  AlertTriangle,
  Wallet,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  RotateCcw,
} from "lucide-react";
import "./BillListPage.css";
import { getBill, getBillExcel } from "../../services/billApi";
import * as XLSX from "xlsx";

const BillListPage = () => {
  // --- 상태 관리 ---
  const [allBills, setAllBills] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 페이징 상태
  const [page, setPage] = useState(0);
  const itemsPerPage = 10;

  // 검색 조건 상태
  const [searchCond, setSearchCond] = useState({
    year: "",
    month: "",
    dongNo: "",
    hoNo: "",
    onlyUnpaid: false,
  });

  // --- 데이터 페칭 ---
  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBillExcel(); 
      setAllBills(res || []);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // --- 1. 단지 전체 통계 (상단 고정 KPI) ---
  const totalStats = useMemo(() => {
    return allBills.reduce(
      (acc, bill) => {
        acc.count++;
        acc.amount += bill.totalPrice;
        if (bill.status !== "PAID") {
          acc.unpaidCount++;
          acc.unpaidAmount += bill.totalPrice;
        }
        return acc;
      },
      { count: 0, unpaidCount: 0, amount: 0, unpaidAmount: 0 }
    );
  }, [allBills]);

  // --- 2. 프론트엔드 필터링 로직 ---
  const filteredBills = useMemo(() => {
    return allBills.filter(bill => {
      const matchDong = searchCond.dongNo ? bill.dongName.includes(searchCond.dongNo) : true;
      const matchHo = searchCond.hoNo ? bill.hoName.includes(searchCond.hoNo) : true;
      const matchUnpaid = searchCond.onlyUnpaid ? bill.status !== "PAID" : true;
      
      const [bYear, bMonth] = bill.billMonth.split("-");
      const matchYear = searchCond.year ? bYear === searchCond.year : true;
      const matchMonth = searchCond.month ? bMonth === searchCond.month : true;

      return matchDong && matchHo && matchUnpaid && matchYear && matchMonth;
    });
  }, [allBills, searchCond]);

  // --- 3. 검색 결과 요약 통계 ---
  const searchStats = useMemo(() => {
    return filteredBills.reduce(
      (acc, bill) => {
        acc.count++;
        acc.amount += bill.totalPrice;
        if (bill.status !== "PAID") {
          acc.unpaidCount++;
          acc.unpaidAmount += bill.totalPrice;
        }
        return acc;
      },
      { count: 0, unpaidCount: 0, amount: 0, unpaidAmount: 0 }
    );
  }, [filteredBills]);

  // --- 페이지네이션 처리 ---
  const paginatedBills = useMemo(() => {
    const start = page * itemsPerPage;
    return filteredBills.slice(start, start + itemsPerPage);
  }, [filteredBills, page]);

  const totalPages = Math.ceil(filteredBills.length / itemsPerPage);

  // --- 핸들러 ---
  const handleReset = () => {
    setSearchCond({ year: "", month: "", dongNo: "", hoNo: "", onlyUnpaid: false });
    setPage(0);
  };

  const openDetail = async (billId) => {
    try {
      const detail = await getBill(billId);
      setSelectedBill(detail);
      setIsDrawerOpen(true);
    } catch (error) {
      alert("상세 정보를 가져올 수 없습니다.");
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedBill(null), 300);
  };

  const handleExcelDownload = async () => {
    try {
      const excelData = filteredBills.map((b) => ({
        연도: b.billMonth.split("-")[0],
        월: b.billMonth.split("-")[1],
        동: b.dongName,
        호: b.hoName,
        금액: b.totalPrice,
        납부기한: b.dueDate,
        상태: b.status === "PAID" ? "완납" : "미납",
      }));
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "고지서현황");
      XLSX.writeFile(workbook, `고지서현황_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) { alert("엑셀 다운로드에 실패했습니다."); }
  };

  return (
    <div className="bill-dashboard">
      
      {/* 1. 단지 전체 현황 (KPI) */}
      <div className="bill-kpi-section global-stats">
        <div className="bill-kpi-card">
          <FileText size={20} className="icon-blue" />
          <div>
            <div className="kpi-label">전체 고지</div>
            <div className="kpi-value">{totalStats.count.toLocaleString()}건</div>
          </div>
        </div>
        <div className="bill-kpi-card danger">
          <AlertTriangle size={20} className="icon-red" />
          <div>
            <div className="kpi-label">전체 미납</div>
            <div className="kpi-value">{totalStats.unpaidCount.toLocaleString()}건</div>
          </div>
        </div>
        <div className="bill-kpi-card">
          <Wallet size={20} className="icon-green" />
          <div>
            <div className="kpi-label">전체 총액</div>
            <div className="kpi-value">{totalStats.amount.toLocaleString()}원</div>
          </div>
        </div>
        <div className="bill-kpi-card danger">
          <Wallet size={20} className="icon-red" />
          <div>
            <div className="kpi-label">미납 총액</div>
            <div className="kpi-value">{totalStats.unpaidAmount.toLocaleString()}원</div>
          </div>
        </div>
      </div>

      {/* 2. 검색 필터 섹션 */}
      <div className="bill-filter-card">
        <div className="bill-filter-form">
          {/* 필터 입력부 */}
          <div className="input-group">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <select 
                value={searchCond.year} 
                onChange={(e) => {setSearchCond({...searchCond, year: e.target.value}); setPage(0);}}
              >
                <option value="">전체 연도</option>
                <option value="2026">2026년</option>
                <option value="2025">2025년</option>
                <option value="2024">2024년</option>
              </select>
            </div>
            
            <select 
              value={searchCond.month} 
              onChange={(e) => {setSearchCond({...searchCond, month: e.target.value}); setPage(0);}}
            >
              <option value="">전체 월</option>
              {Array.from({length: 12}, (_, i) => (
                <option key={i+1} value={String(i+1).padStart(2, '0')}>{i+1}월</option>
              ))}
            </select>

            <input 
              type="text" 
              placeholder="동" 
              className="text-input"
              value={searchCond.dongNo} 
              onChange={(e) => {setSearchCond({...searchCond, dongNo: e.target.value}); setPage(0);}} 
            />
            <input 
              type="text" 
              placeholder="호" 
              className="text-input"
              value={searchCond.hoNo} 
              onChange={(e) => {setSearchCond({...searchCond, hoNo: e.target.value}); setPage(0);}} 
            />
            
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={searchCond.onlyUnpaid} 
                onChange={(e) => {setSearchCond({...searchCond, onlyUnpaid: e.target.checked}); setPage(0);}} 
              />
              <span>미납자만</span>
            </label>
          </div>

          {/* 인라인 요약 및 버튼 그룹 */}
          <div className="filter-right-wrapper">
            <div className="search-summary-inline">
              <div className="summary-item">검색 <strong>{searchStats.count.toLocaleString()}</strong>건</div>
              <div className="summary-sep">|</div>
              <div className="summary-item text-red">미납 <strong>{searchStats.unpaidCount.toLocaleString()}</strong>건</div>
              <div className="summary-sep">|</div>
              <div className="summary-item">총액 <strong>{searchStats.amount.toLocaleString()}</strong>원</div>
              <div className="summary-sep">|</div>
              <div className="summary-item text-red">미납합계 <strong>{searchStats.unpaidAmount.toLocaleString()}</strong>원</div>
            </div>
            
            <div className="button-group">
              <button type="button" className="reset-btn" onClick={handleReset} title="필터 초기화">
                <RotateCcw size={18} />
              </button>
              <button type="button" className="excel-btn" onClick={handleExcelDownload}>
                <Download size={16} /> 엑셀 다운로드
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 테이블 섹션 */}
      <div className="bill-table-card">
        {loading ? (
          <div className="loading-box"><Loader2 className="spin" /> 로딩중...</div>
        ) : (
          <div className="table-responsive">
            <table className="bill-table">
              <thead>
                <tr>
                  <th>연도</th><th>월</th><th>동</th><th>호수</th><th>총 금액</th><th>상태</th><th>관리</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBills.length > 0 ? (
                  paginatedBills.map((bill) => {
                    const [year, month] = bill.billMonth.split("-");
                    return (
                      <tr key={bill.billId} onClick={() => openDetail(bill.billId)} className="row-hover">
                        <td>{year}년</td>
                        <td>{month}월</td>
                        <td>{bill.dongName}동</td>
                        <td>{bill.hoName}호</td>
                        <td><strong>{bill.totalPrice.toLocaleString()}원</strong></td>
                        <td>
                          <span className={`status-badge ${bill.status === "PAID" ? "status-paid" : "status-unpaid"}`}>
                            {bill.status === "PAID" ? "완납" : "미납"}
                          </span>
                        </td>
                        <td>
                          <button className="sm-detail-btn" onClick={(e) => { e.stopPropagation(); openDetail(bill.billId); }}>
                            상세보기
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="7" className="no-data">조회된 내역이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="pagination">
          <button disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft size={18} /></button>
          <span className="page-indicator"><strong>{totalPages === 0 ? 0 : page + 1}</strong> / {totalPages || 1}</span>
          <button disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={18} /></button>
        </div>
      </div>

      {/* 5. 사이드 Drawer */}
      <div className={`side-drawer ${isDrawerOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <h3>📄 고지서 상세 내역</h3>
          <button className="drawer-close" onClick={closeDrawer}><X size={24} /></button>
        </div>
        <div className="drawer-body">
          {selectedBill ? (
            <div className="drawer-content">
              <div className="detail-info-card">
                <div className="detail-row"><span className="label">청구월</span><span className="value">{selectedBill.billMonth}</span></div>
                <div className="detail-row"><span className="label">대상</span><span className="value">{selectedBill.dongName}동 {selectedBill.hoName}호</span></div>
                <div className="detail-row">
                  <span className="label">납부상태</span>
                  <span className={`value status-text ${selectedBill.status === "PAID" ? "paid" : "unpaid"}`}>
                    {selectedBill.status === "PAID" ? "완납" : "미납"}
                  </span>
                </div>
                <div className="detail-row"><span className="label">납부기한</span><span className="value">{selectedBill.dueDate}</span></div>
              </div>

              <h4 className="section-title">세부 청구 항목</h4>
              <table className="item-table">
                <thead><tr><th>항목명</th><th>금액</th></tr></thead>
                <tbody>
                  {selectedBill.items?.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name} <small className="item-type">({item.itemType})</small></td>
                      <td className="text-right">{item.price.toLocaleString()}원</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><th>합계</th><th className="text-right total-price">{selectedBill.totalPrice?.toLocaleString()}원</th></tr>
                </tfoot>
              </table>
              <div className="drawer-actions">
                <button className="close-action-btn" onClick={closeDrawer}>닫기</button>
              </div>
            </div>
          ) : (
            <div className="drawer-loading"><Loader2 className="spin" /></div>
          )}
        </div>
      </div>
      {isDrawerOpen && <div className="drawer-backdrop" onClick={closeDrawer}></div>}
    </div>
  );
};

export default BillListPage;