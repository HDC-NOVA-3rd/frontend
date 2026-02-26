import React from "react";
import { useNavigate } from "react-router-dom";

const RegisterSuccessPage = () => {
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <div className="login-box" style={{ textAlign: "center" }}>
        <h2 className="login-title">🎉 등록 완료</h2>
        <p className="login-subtitle">
          관리자 계정이 성공적으로 생성되었습니다.
        </p>

        <button
          className="login-button"
          onClick={() => navigate("/admin")}
        >
          관리자 대시보드로 이동
        </button>
      </div>
    </div>
  );
};

export default RegisterSuccessPage;