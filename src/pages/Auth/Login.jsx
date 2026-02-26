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

  // 로직 분리 및 useCallback으로 메모리 최적화
  const handleProcessLogin = useCallback(async (isOtp, currentOtpCode) => {
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

        // 결과값 검증 및 AuthContext 적용
        if (tokenData?.accessToken) {
          setAuth(tokenData.accessToken);
          
          // 전역 로딩이나 상태 업데이트와 충돌 피하기 위해 즉시 이동
          navigate("/admin/household/list", { replace: true });
        } else {
          throw new Error("인증 데이터가 올바르지 않습니다.");
        }
      }
    } catch (err) {
      // api.js의 ApiError 인스턴스일 경우 err.message를 사용
      const msg = err.message || "인증에 실패했습니다.";
      setError(msg);

      if (isOtp) {
        // OTP 실패 시 입력란만 초기화하여 재입력 유도
        setFormData((prev) => ({ ...prev, otpCode: "" }));
      }
    } finally {
      setIsLoading(false);
    }
  }, [formData, isLoading, navigate, setAuth]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "otpCode") {
      const onlyNums = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({
        ...prev,
        [name]: onlyNums,
      }));

      // 6자리 입력 시 자동 제출
      if (onlyNums.length === 6) {
        handleProcessLogin(true, onlyNums);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    if (error) setError(""); // 입력 시작 시 에러 메시지 삭제
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    await handleProcessLogin(isOtpStep, formData.otpCode);
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
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#6366f1",
                  }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="login-error" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '0.875rem', marginTop: '8px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="login-button" disabled={isLoading} style={{ marginTop: '20px' }}>
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
                fontSize: "0.875rem"
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