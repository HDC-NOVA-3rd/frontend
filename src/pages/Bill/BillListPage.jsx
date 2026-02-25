import React, { useEffect, useState } from "react";
import {
  FileText,
  AlertTriangle,
  Wallet,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import "./BillListPage.css";
import { getBillList, getBill, getBillExcel } from "../../services/billApi";
import BillDetailDrawer from "./BillDetailDrawer";
import * as XLSX from "xlsx";

const BillListPage = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);

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

  useEffect(() => {
    fetchBills();
    calculateStats();
  }, [page]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const params = { ...searchCond, page, size: 10, sort: "billMonth,desc" };
      const res = await getBillList(params);
      setBills(res.content);
      setTotalPages(res.totalPages);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async () => {
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
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchBills();
    calculateStats();
  };

  const handleExcelDownload = async () => {
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
    XLSX.writeFile(workbook, `고지서현황.xlsx`);
  };

  return (
    <div className="bill-dashboard">
      {/* KPI */}
      <div className="bill-kpi-section">
        <div className="bill-kpi-card">
          <FileText size={20} />
          <div>
            <div className="kpi-label">총 건수</div>
            <div className="kpi-value">{stats.totalCount}</div>
          </div>
        </div>

        <div className="bill-kpi-card danger">
          <AlertTriangle size={20} />
          <div>
            <div className="kpi-label">미납 건수</div>
            <div className="kpi-value">{stats.unpaidCount}</div>
          </div>
        </div>

        <div className="bill-kpi-card">
          <Wallet size={20} />
          <div>
            <div className="kpi-label">총 금액</div>
            <div className="kpi-value">
              {stats.totalAmount.toLocaleString()}원
            </div>
          </div>
        </div>

        <div className="bill-kpi-card danger">
          <Wallet size={20} />
          <div>
            <div className="kpi-label">미납 총액</div>
            <div className="kpi-value">
              {stats.unpaidAmount.toLocaleString()}원
            </div>
          </div>
        </div>
      </div>

      {/* 검색 카드 */}
      <div className="bill-filter-card">
        <form onSubmit={handleSearch} className="bill-filter-form">
          <input
            type="text"
            placeholder="동"
            value={searchCond.dongNo}
            onChange={(e) =>
              setSearchCond({ ...searchCond, dongNo: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="호"
            value={searchCond.hoNo}
            onChange={(e) =>
              setSearchCond({ ...searchCond, hoNo: e.target.value })
            }
          />
          <input
            type="month"
            value={searchCond.billMonth}
            onChange={(e) =>
              setSearchCond({ ...searchCond, billMonth: e.target.value })
            }
          />
          <label>
            <input
              type="checkbox"
              checked={searchCond.onlyUnpaid}
              onChange={(e) =>
                setSearchCond({
                  ...searchCond,
                  onlyUnpaid: e.target.checked,
                })
              }
            />
            미납자만
          </label>

          <button type="submit" className="primary-btn">
            <Search size={16} /> 검색
          </button>

          <button
            type="button"
            className="excel-btn"
            onClick={handleExcelDownload}
          >
            <Download size={16} /> 엑셀
          </button>
        </form>
      </div>

      {/* 테이블 카드 */}
      <div className="bill-table-card">
        {loading ? (
          <div className="loading-box">
            <Loader2 className="spin" /> 로딩중...
          </div>
        ) : (
          <table className="bill-table">
            <thead>
              <tr>
                <th>연/월</th>
                <th>동/호수</th>
                <th>총 금액</th>
                <th>납부기한</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.billId}>
                  <td>{bill.billMonth}</td>
                  <td>{bill.dongName}동 {bill.hoName}호</td>
                  <td>{bill.totalPrice.toLocaleString()}원</td>
                  <td>{bill.dueDate}</td>
                  <td>
                    <span className={bill.status === "PAID" ? "status-paid" : "status-unpaid"}>
                      {bill.status === "PAID" ? "완납" : "미납"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="detail-btn"
                      onClick={() =>
                        getBill(bill.billId).then(setSelectedBill)
                      }
                    >
                      상세
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 페이지네이션 */}
        <div className="pagination">
          <button disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft size={16} />
          </button>
          <span>{page + 1} / {totalPages}</span>
          <button
            disabled={page + 1 >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {selectedBill && (
        <BillDetailDrawer
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
        />
      )}
    </div>
  );
};

export default BillListPage;