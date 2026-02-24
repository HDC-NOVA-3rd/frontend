import React, { useEffect, useState } from 'react';
import { getBillList, getBill, getBillExcel } from '../../services/billApi'; 
import BillDetailModal from './BillDetailModal';
import * as XLSX from 'xlsx';

const BillListPage = () => {
  const [bills, setBills] = useState([]); // 현재 페이지 목록
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  
  // 통계 상태 (프론트에서 계산)
  const [stats, setStats] = useState({
    totalCount: 0, unpaidCount: 0, totalAmount: 0, unpaidAmount: 0
  });

  // 페이징 및 검색 상태
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchCond, setSearchCond] = useState({
    dongNo: '',
    hoNo: '',
    billMonth: '',
    onlyUnpaid: false
  });

  // 1. 초기 데이터 및 검색 시 호출
  useEffect(() => {
    fetchBills();
    calculateStats(); // 통계는 별도로 전체 데이터를 가져와 계산
  }, [page]); 

  const fetchBills = async () => {
    setLoading(true);
    try {
      const params = { ...searchCond, page, size: 10, sort: 'billMonth,desc' };
      const response = await getBillList(params);
      setBills(response.content);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. 프론트엔드 통계 계산 로직 (엑셀용 API 활용)
  const calculateStats = async () => {
    try {
      // 현재 검색 조건에 맞는 전체 데이터를 가져옴 (통계용)
      const allData = await getBillExcel(searchCond);
      
      const summary = allData.reduce((acc, bill) => {
        acc.totalCount += 1;
        acc.totalAmount += bill.totalPrice;
        
        // PAID 상태가 아니면(READY, OVERDUE 등) 미납으로 처리
        if (bill.status !== 'PAID') {
          acc.unpaidCount += 1;
          acc.unpaidAmount += bill.totalPrice;
        }
        return acc;
      }, { totalCount: 0, unpaidCount: 0, totalAmount: 0, unpaidAmount: 0 });

      setStats(summary);
    } catch (error) {
      console.error("통계 계산 실패:", error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchBills();
    calculateStats();
  };

  // 3. 실제 엑셀 다운로드 실행
  const handleExcelDownload = async () => {
    try {
      const data = await getBillExcel(searchCond);
      
      const excelData = data.map(b => ({
        "청구월": b.billMonth,
        "동": b.dongName,
        "호": b.hoName,
        "금액": b.totalPrice,
        "납부기한": b.dueDate,
        "상태": b.status === 'PAID' ? '완납' : '미납'
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "고지서현황");
      
      XLSX.writeFile(workbook, `고지서현황_${searchCond.billMonth || '전체'}.xlsx`);
    } catch (error) {
      alert("엑셀 다운로드 중 오류가 발생했습니다.");
    }
  };

  if (loading && bills.length === 0) return <div>로딩 중...</div>;

  return (
    <div className="admin-container">
      <h1>세대별 납부 현황</h1>

      {/* 요약 통계 섹션 */}
      <div className="stats-summary" style={{
        display: 'flex', gap: '30px', padding: '20px', 
        backgroundColor: '#f4f7f6', borderRadius: '10px', marginBottom: '20px'
      }}>
        <div><strong>총 건수:</strong> {stats.totalCount}건</div>
        <div style={{ color: '#e74c3c' }}><strong>미납 건수:</strong> {stats.unpaidCount}건</div>
        <div><strong>총 금액:</strong> {stats.totalAmount.toLocaleString()}원</div>
        <div style={{ color: '#e74c3c' }}><strong>미납 총액:</strong> {stats.unpaidAmount.toLocaleString()}원</div>
      </div>

      {/* 검색 필터 */}
      <form onSubmit={handleSearch} className="search-bar" style={{ marginBottom: '20px' }}>
        <input type="text" placeholder="동" value={searchCond.dongNo} 
               onChange={e => setSearchCond({...searchCond, dongNo: e.target.value})} />
        <input type="text" placeholder="호" value={searchCond.hoNo} 
               onChange={e => setSearchCond({...searchCond, hoNo: e.target.value})} />
        <input type="month" value={searchCond.billMonth} 
               onChange={e => setSearchCond({...searchCond, billMonth: e.target.value})} />
        <label style={{ margin: '0 10px' }}>
          <input type="checkbox" checked={searchCond.onlyUnpaid} 
                 onChange={e => setSearchCond({...searchCond, onlyUnpaid: e.target.checked})} />
          미납자만 보기
        </label>
        <button type="submit">검색</button>
        <button type="button" onClick={handleExcelDownload} 
                style={{ marginLeft: '10px', backgroundColor: '#1d6f42', color: 'white' }}>
          엑셀 다운로드
        </button>
      </form>

      {/* 목록 테이블 */}
      <table className="bill-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th>연/월</th>
            <th>동/호수</th>
            <th>총 금액</th>
            <th>납부기한</th>
            <th>상태</th>
            <th>상세보기</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((bill) => (
            <tr key={bill.billId} style={{ borderBottom: '1px solid #eee' }}>
              <td>{bill.billMonth}</td>
              <td>{bill.dongName}동 {bill.hoName}호</td>
              <td>{bill.totalPrice.toLocaleString()}원</td>
              <td>{bill.dueDate}</td>
              <td>
                <span className={`status-${bill.status}`} style={{
                  color: bill.status === 'PAID' ? 'green' : 'red',
                  fontWeight: 'bold'
                }}>
                  {bill.status === 'PAID' ? '완납' : '미납'}
                </span>
              </td>
              <td>
                <button onClick={() => getBill(bill.billId).then(setSelectedBill)}>보기</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 페이징 버튼 */}
      <div className="pagination" style={{ marginTop: '20px', textAlign: 'center' }}>
        <button disabled={page === 0} onClick={() => setPage(page - 1)}>이전</button>
        <span style={{ margin: '0 15px' }}>{page + 1} / {totalPages}</span>
        <button disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>다음</button>
      </div>

      {selectedBill && (
        <BillDetailModal bill={selectedBill} onClose={() => setSelectedBill(null)} />
      )}
    </div>
  );
};

export default BillListPage;