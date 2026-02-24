import { useState } from "react";
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

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "otpCode") {
      const onlyNums = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({
        ...prev,
        [name]: onlyNums,
      }));

      if (onlyNums.length === 6) {
        handleProcessLogin(true, onlyNums);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    setError("");
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    await handleProcessLogin(isOtpStep, formData.otpCode);
  };

  const handleProcessLogin = async (isOtp, currentOtpCode) => {
    if (isLoading) return;
    
    setError("");
    setIsLoading(true);

    try {
      if (!isOtp) {
        // [1단계] ID/PW 로그인
        await adminLogin({
          loginId: formData.loginId,
          password: formData.password,
        });
        setIsOtpStep(true);
      } else {
        // [2단계] OTP 인증
        const tokenData = await verifyOtp({
          loginId: formData.loginId,
          otpCode: currentOtpCode,
        });

        // 백엔드에서 리프레시 토큰은 이미 쿠키로 구워졌을 것이고,
        // 액세스 토큰은 메모리 상태 관리를 위해 setAuth에 넘깁니다.
        
        if (tokenData && tokenData.accessToken) {
          // AuthContext의 setAuth를 통해 메모리에 토큰 저장 및 유저 정보 설정
          setAuth(tokenData.accessToken);

          // 관리자 권한에 따른 페이지 리다이렉션
          navigate("/admin/safety");
        } else {
          throw new Error("인증 데이터가 올바르지 않습니다.");
        }
      }
    } catch (err) {
      const msg = err.message || "인증에 실패했습니다.";
      setError(msg);

      if (isOtp) {
        setFormData((prev) => ({ ...prev, otpCode: "" }));
      }
    } finally {
      setIsLoading(false);
    }
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
                />
              </div>
            </>
          ) : (
            <div className="form-group">
              <label className="form-label">인증번호 (OTP)</label>
              <div className="otp-input-wrapper" style={{ position: "relative" }}>
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
                  style={{ textAlign: "center", letterSpacing: "8px", fontSize: "1.2rem" }}
                />
                <ShieldCheck
                  size={20}
                  className="otp-icon"
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "10px",
                    color: "#6366f1",
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
            <div style={{ textAlign: "center", marginTop: "15px" }}>
              <button
                type="button"
                onClick={() => navigate("/password-reset")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6366f1",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                비밀번호를 잊으셨나요?
              </button>
            </div>
          )}

          {isOtpStep && (
            <button
              type="button"
              className="back-button"
              onClick={() => setIsOtpStep(false)}
              style={{
                background: "none",
                border: "none",
                color: "#666",
                marginTop: "10px",
                cursor: "pointer",
                width: "100%",
              }}
            >
              이전으로 돌아가기
            </button>
          )}
        </form>
      </div>
    </div>
  );
}