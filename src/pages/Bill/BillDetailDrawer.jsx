import React from "react";
import { X } from "lucide-react";
import "./BillListPage.css";

const BillDetailDrawer = ({ bill, onClose }) => {
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}></div>
      <div className="drawer">
        <div className="drawer-header">
          <h3>{bill.billMonth} 고지서</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="drawer-body">
          <p>{bill.dongName}동 {bill.hoName}호</p>
          <p>납부기한: {bill.dueDate}</p>

          <table className="bill-table">
            <thead>
              <tr>
                <th>항목</th>
                <th>금액</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.price.toLocaleString()}원</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default BillDetailDrawer;