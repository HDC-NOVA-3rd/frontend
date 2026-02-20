import React, { useEffect, useState } from 'react';
import { getBillList, getBill } from '../../services/billApi'; 
import BillDetailModal from './BillDetailModal';

const BillListPage = () => {
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. 초기 목록 로드
  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const data = await getBillList();
      setBills(data);
    } catch (error) {
      console.error("고지서 목록 조회 실패:", error);
      alert("데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 2. 상세 정보 조회 (클릭 시)
  const handleShowDetail = async (billId) => {
    try {
      const detail = await getBill(billId);
      setSelectedBill(detail);
    } catch (error) {
      alert("상세 정보를 가져올 수 없습니다.");
    }
  };

  if (loading) return <div>로딩 중...</div>;

  return (
    <div className="admin-container">
      <h1>세대별 납부 현황</h1>
      
      <table className="bill-table">
        <thead>
          <tr>
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
            <tr key={bill.billId}>
              <td>{bill.billMonth}</td>
              <td>{bill.dongName}동 {bill.hoName}호</td>
              <td>{bill.totalPrice.toLocaleString()}원</td>
              <td>{bill.dueDate}</td>
              <td>
                <span className={`status-${bill.status}`}>
                  {bill.status === 'PAID' ? '완납' : '미납'}
                </span>
              </td>
              <td>
                <button onClick={() => handleShowDetail(bill.billId)}>보기</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 상세 모달 */}
      {selectedBill && (
        <BillDetailModal 
          bill={selectedBill} 
          onClose={() => setSelectedBill(null)} 
        />
      )}
    </div>
  );
};

export default BillListPage;