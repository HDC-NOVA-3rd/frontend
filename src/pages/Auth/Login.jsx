import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { adminLogin, verifyOtp } from "../../services/adminApi";
import { useAuth } from "../../context/AuthContext";

import "./Login.css";

export default function Login() {
  const { setAuth } = useAuth(); 
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    loginId: "",
    password: "",
    otpCode: "",
  });

  const [isOtpStep, setIsOtpStep] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleProcessLogin = useCallback(async (isOtp, currentOtpCode) => {
    if (isLoading) return;
    setError("");
    setIsLoading(true);

    try {
      if (!isOtp) {
        await adminLogin({ loginId: formData.loginId, password: formData.password });
        setIsOtpStep(true);
      } else {
        const tokenData = await verifyOtp({ loginId: formData.loginId, otpCode: currentOtpCode });
        if (tokenData?.accessToken) {
          setAuth(tokenData.accessToken);
          navigate("/admin/settings/dashboard", { replace: true });
        } else {
          throw new Error("인증 데이터가 올바르지 않습니다.");
        }
      }
    } catch (err) {
      setError(err.message || "인증에 실패했습니다.");
      if (isOtp) setFormData((prev) => ({ ...prev, otpCode: "" }));
    } finally {
      setIsLoading(false);
    }
  }, [formData, isLoading, navigate, setAuth]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "otpCode") {
      const onlyNums = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, [name]: onlyNums }));
      if (onlyNums.length === 6) handleProcessLogin(true, onlyNums);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (error) setError(""); 
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    handleProcessLogin(isOtpStep, formData.otpCode);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1 className="login-title">
            {isOtpStep ? "OTP 인증" : "관리자 로그인"}
          </h1>
          <p className="login-subtitle">
            {isOtpStep ? "전송된 인증번호 6자리를 입력하세요" : "스마트 아파트 관리 시스템"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {!isOtpStep ? (
            <>
              <div className="form-group">
                <label className="form-label">아이디</label>
                <input
                  type="text"
                  name="loginId"
                  value={formData.loginId}
                  onChange={handleChange}
                  className="form-input"
                  required
                  autoComplete="username"
                  placeholder="아이디를 입력하세요"
                />
              </div>
              <div className="form-group">
                <label className="form-label">비밀번호</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  required
                  autoComplete="current-password"
                  placeholder="비밀번호를 입력하세요"
                />
              </div>
            </>
          ) : (
            <div className="form-group">
              <label className="form-label">인증번호 (OTP)</label>
              <div className="otp-input-wrapper">
                <input
                  type="text"
                  inputMode="numeric"
                  name="otpCode"
                  placeholder="000000"
                  value={formData.otpCode}
                  onChange={handleChange}
                  className="form-input"
                  maxLength={6}
                  required
                  autoFocus
                  style={{ 
                    letterSpacing: "6px",
                    fontSize: "1.2rem",
                    fontWeight: "700",
                    color: "#2b59a7",
                    /* text-align: left와 width: 100%는 CSS 클래스에서 적용 */
                  }}
                />
                <ShieldCheck
                  size={20}
                  className="otp-icon"
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#2b59a7",
                  }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="login-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? "처리 중..." : isOtpStep ? "인증하기" : "로그인"}
          </button>

          {!isOtpStep && (
            <div className="footer-links">
              <button
                type="button"
                onClick={() => navigate("/password-reset")}
                className="login-link-btn"
                style={{ color: "#2b59a7" }}
              >
                비밀번호를 잊으셨나요?
              </button>
            </div>
          )}

          {isOtpStep && (
            <div className="footer-links">
              <button
                type="button"
                className="back-button"
                onClick={() => setIsOtpStep(false)}
              >
                이전으로 돌아가기
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}