// PasswordResetRequest.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { requestPasswordReset } from "../../services/adminApi";
import "./Login.css";

export default function PasswordResetRequest() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    loginId: "",
    email: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await requestPasswordReset(formData);

      // OTP 입력 페이지로 이동하면서 loginId 전달
      navigate("/password-reset/otp", {
        state: { loginId: formData.loginId },
      });
    } catch (err) {
      setError(err.message || "요청 실패");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1 className="login-title">비밀번호 재설정</h1>
          <p className="login-subtitle">
            계정 확인을 위해 정보를 입력하세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">아이디</label>
            <input
              type="text"
              name="loginId"
              value={formData.loginId}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">이메일</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          {error && (
            <div className="login-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? "처리 중..." : "인증번호 발송"}
          </button>
        </form>
      </div>
    </div>
  );
}