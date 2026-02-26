import React, { useEffect, useState, useCallback } from "react";
import {
  FileText,
  AlertTriangle,
  Wallet,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X
} from "lucide-react";
import "./BillListPage.css";
import { getBillList, getBill, getBillExcel } from "../../services/billApi";
import * as XLSX from "xlsx";

const BillListPage = () => {
  // --- 상태 관리 ---
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [stats, setStats] = useState({
    totalCount: 0,
    unpaidCount: 0,
    totalAmount: 0,
    unpaidAmount: 0,
  });

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [searchCond, setSearchCond] = useState({
    dongNo: "",
    hoNo: "",
    billMonth: "",
    onlyUnpaid: false,
  });

  // --- 데이터 페칭 ---
  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...searchCond, page, size: 10, sort: "billMonth,desc" };
      const res = await getBillList(params);
      setBills(res.content || []);
      setTotalPages(res.totalPages || 0);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [page, searchCond]);

  const calculateStats = useCallback(async () => {
    try {
      const allData = await getBillExcel(searchCond);
      const summary = allData.reduce(
        (acc, bill) => {
          acc.totalCount++;
          acc.totalAmount += bill.totalPrice;
          if (bill.status !== "PAID") {
            acc.unpaidCount++;
            acc.unpaidAmount += bill.totalPrice;
          }
          return acc;
        },
        { totalCount: 0, unpaidCount: 0, totalAmount: 0, unpaidAmount: 0 }
      );
      setStats(summary);
    } catch (error) {
      console.error("통계 계산 실패:", error);
    }
  }, [searchCond]);

  useEffect(() => {
    fetchBills();
    calculateStats();
  }, [fetchBills, calculateStats]);

  // --- 핸들러 ---
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchBills();
    calculateStats();
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
    setTimeout(() => setSelectedBill(null), 300); // 애니메이션 후 데이터 초기화
  };

  const handleExcelDownload = async () => {
    try {
      const data = await getBillExcel(searchCond);
      const excelData = data.map((b) => ({
        청구월: b.billMonth,
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
    } catch (error) {
      alert("엑셀 다운로드에 실패했습니다.");
    }
  };

  return (
    <div className="bill-dashboard">
      {/* 1. KPI 섹션 */}
      <div className="bill-kpi-section">
        <div className="bill-kpi-card">
          <FileText size={20} className="icon-blue" />
          <div>
            <div className="kpi-label">총 건수</div>
            <div className="kpi-value">{stats.totalCount.toLocaleString()}</div>
          </div>
        </div>

        <div className="bill-kpi-card danger">
          <AlertTriangle size={20} className="icon-red" />
          <div>
            <div className="kpi-label">미납 건수</div>
            <div className="kpi-value">{stats.unpaidCount.toLocaleString()}</div>
          </div>
        </div>

        <div className="bill-kpi-card">
          <Wallet size={20} className="icon-green" />
          <div>
            <div className="kpi-label">총 금액</div>
            <div className="kpi-value">{stats.totalAmount.toLocaleString()}원</div>
          </div>
        </div>

        <div className="bill-kpi-card danger">
          <Wallet size={20} className="icon-red" />
          <div>
            <div className="kpi-label">미납 총액</div>
            <div className="kpi-value">{stats.unpaidAmount.toLocaleString()}원</div>
          </div>
        </div>
      </div>

      {/* 2. 검색 필터 섹션 */}
      <div className="bill-filter-card">
        <form onSubmit={handleSearch} className="bill-filter-form">
          <div className="input-group">
            <input
              type="text"
              placeholder="동"
              value={searchCond.dongNo}
              onChange={(e) => setSearchCond({ ...searchCond, dongNo: e.target.value })}
            />
            <input
              type="text"
              placeholder="호"
              value={searchCond.hoNo}
              onChange={(e) => setSearchCond({ ...searchCond, hoNo: e.target.value })}
            />
            <input
              type="month"
              value={searchCond.billMonth}
              onChange={(e) => setSearchCond({ ...searchCond, billMonth: e.target.value })}
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={searchCond.onlyUnpaid}
                onChange={(e) => setSearchCond({ ...searchCond, onlyUnpaid: e.target.checked })}
              />
              <span>미납자만</span>
            </label>
          </div>
          <div className="button-group">
            <button type="submit" className="primary-btn">
              <Search size={16} /> 검색
            </button>
            <button type="button" className="excel-btn" onClick={handleExcelDownload}>
              <Download size={16} /> 엑셀
            </button>
          </div>
        </form>
      </div>

      {/* 3. 테이블 섹션 */}
      <div className="bill-table-card">
        {loading ? (
          <div className="loading-box">
            <Loader2 className="spin" /> 로딩중...
          </div>
        ) : (
          <div className="table-responsive">
            <table className="bill-table">
              <thead>
                <tr>
                  <th>연/월</th>
                  <th>동/호수</th>
                  <th>총 금액</th>
                  <th>납부기한</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {bills.length > 0 ? (
                  bills.map((bill) => (
                    <tr key={bill.billId} onClick={() => openDetail(bill.billId)} className="row-hover">
                      <td>{bill.billMonth}</td>
                      <td>{bill.dongName}동 {bill.hoName}호</td>
                      <td>{bill.totalPrice.toLocaleString()}원</td>
                      <td>{bill.dueDate}</td>
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
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="no-data">조회된 내역이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 페이지네이션 */}
        <div className="pagination">
          <button disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft size={18} />
          </button>
          <span className="page-indicator">
            <strong>{totalPages === 0 ? 0 : page + 1}</strong> / {totalPages}
          </span>
          <button disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* 4. 사이드 Drawer 상세 정보 */}
      <div className={`side-drawer ${isDrawerOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <h3>📄 고지서 상세 내역</h3>
          <button className="drawer-close" onClick={closeDrawer}><X size={24} /></button>
        </div>
        <div className="drawer-body">
          {selectedBill ? (
            <div className="drawer-content">
              <div className="detail-info-card">
                <div className="detail-row">
                  <span className="label">청구월</span>
                  <span className="value">{selectedBill.billMonth}</span>
                </div>
                <div className="detail-row">
                  <span className="label">대상</span>
                  <span className="value">{selectedBill.dongName}동 {selectedBill.hoName}호</span>
                </div>
                <div className="detail-row">
                  <span className="label">납부상태</span>
                  <span className={`value status-text ${selectedBill.status === "PAID" ? "paid" : "unpaid"}`}>
                    {selectedBill.status === "PAID" ? "완납" : "미납"}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">납부기한</span>
                  <span className="value">{selectedBill.dueDate}</span>
                </div>
              </div>

              <h4 className="section-title">세부 청구 항목</h4>
              <table className="item-table">
                <thead>
                  <tr>
                    <th>항목명</th>
                    <th>금액</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBill.items?.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name} <small className="item-type">({item.itemType})</small></td>
                      <td className="text-right">{item.price.toLocaleString()}원</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th>합계</th>
                    <th className="text-right total-price">{selectedBill.totalPrice?.toLocaleString()}원</th>
                  </tr>
                </tfoot>
              </table>
              
              <div className="drawer-actions">
                <button className="notices-btn full-width" onClick={closeDrawer}>닫기</button>
              </div>
            </div>
          ) : (
            <div className="drawer-loading">
              <Loader2 className="spin" />
            </div>
          )}
        </div>
      </div>

      {/* Drawer 배경 어둡게 */}
      {isDrawerOpen && <div className="drawer-backdrop" onClick={closeDrawer}></div>}
    </div>
  );
};

export default BillListPage;