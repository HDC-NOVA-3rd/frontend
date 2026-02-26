import React from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import "./RegisterAdminPage.css";

const RegisterSuccessPage = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-reg-container">
      <div className="admin-reg-box admin-reg-center">
        <div className="admin-reg-success-icon">🎉</div>
        <h2 className="admin-reg-title">등록 완료</h2>
        <p className="admin-reg-subtitle">
          관리자 계정이 성공적으로 생성되었습니다.<br />이제 해당 계정으로 로그인이 가능합니다.
        </p>

        <button className="admin-reg-submit-btn" onClick={() => navigate("/admin")}>
          관리자 대시보드로 이동
        </button>
      </div>
    </div>
  );
};

export default RegisterSuccessPage;