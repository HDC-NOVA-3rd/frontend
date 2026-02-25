import React from 'react';
import {
  Flame,
  ThermometerSun,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Home,
  AlertTriangle,
  CircuitBoard,
  XCircle,
  Clock,
  Activity,
  Lock,
  Unlock,
  DoorOpen,
  Layers,
  RefreshCw,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import "./BillListPage.css";

const BillDetailModal = ({ bill, onClose }) => {
  if (!bill) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{bill.billMonth} 고지서 상세</h2>
        <p>위치: {bill.dongName}동 {bill.hoName}호</p>
        <p>납부기한: {bill.dueDate}</p>
        <hr />
        <table className="detail-table">
          <thead>
            <tr>
              <th>항목명</th>
              <th>유형</th>
              <th>금액</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.itemType}</td>
                <td>{item.price.toLocaleString()} 원</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan="2">총계</th>
              <th>{bill.totalPrice.toLocaleString()} 원</th>
            </tr>
          </tfoot>
        </table>
        <button onClick={onClose}>닫기</button>
      </div>
    </div>
  );
};

export default BillDetailModal;