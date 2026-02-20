import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import "./Login.css";
import {
  adminLogin,
  verifyOtp,
} from "../../services/adminApi";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { setAuthFromToken } = useAuth(); // 토큰 기반 인증 상태 업데이트 함수
  const navigate = useNavigate();

  // [상태 관리] 입력 폼 데이터
  const [formData, setFormData] = useState({
    loginId: "",
    password: "",
    otpCode: "",
  });

  // [상태 관리] UI 단계 및 로딩/에러
  const [isOtpStep, setIsOtpStep] =
    useState(false); // false: ID/PW 단계, true: OTP 단계
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] =
    useState(false);

  // 입력값 변경 시 formData 업데이트
  const handleChange = (e) => {
    const { name, value } = e.target;

    // -----------------------------------------------------------
    //  OTP 입력 시 숫자 필터링 및 자동 제출 
    // -----------------------------------------------------------
    if (name === "otpCode") {
      const onlyNums = value.replace(/[^0-9]/g, ""); // 숫자 이외의 문자 제거
      setFormData((prev) => ({
        ...prev,
        [name]: onlyNums,
      }));

      // 6자리가 모두 입력되면 자동으로 제출 시도
      if (onlyNums.length === 6) {
        handleProcessLogin(true, onlyNums);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    setError(""); // 사용자가 입력을 시작하면 에러 메시지 초기화
  };

  // 폼 제출 (로그인 시도)
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    // 공통 로직 호출
    await handleProcessLogin(isOtpStep, formData.otpCode);
  };

  // 로그인 및 OTP 검증 처리 공통 함수
  const handleProcessLogin = async (isOtp, currentOtpCode) => {
    if (isLoading) return; // 중복 제출 방지
    
    setError("");
    setIsLoading(true);

    try {
      if (!isOtp) {
        // -----------------------------------------------------------
        // [1단계] ID/PW 로그인 시도
        // -----------------------------------------------------------
        await adminLogin({
          loginId: formData.loginId,
          password: formData.password,
        });
        // 성공 시 서버에서 OTP를 발송했다고 가정하고 OTP 입력 단계로 전환
        setIsOtpStep(true);
      } else {
        // -----------------------------------------------------------
        // [2단계] OTP 인증 시도
        // -----------------------------------------------------------
        const tokenData = await verifyOtp({
          loginId: formData.loginId,
          otpCode: currentOtpCode,
        });

        // 브라우저 로컬 스토리지에 토큰 저장
        localStorage.setItem(
          "accessToken",
          tokenData.accessToken,
        );
        localStorage.setItem(
          "refreshToken",
          tokenData.refreshToken,
        );

        // AuthContext 상태 업데이트 (전역 유저 정보 설정)
        setAuthFromToken(tokenData.accessToken);

        // 관리자 권한에 따른 페이지 리다이렉션
        navigate("/admin/safety");
      }
    } catch (err) {

      // -----------------------------------------------------------
      // 가공된 에러 객체(ApiError)에서 메시지 추출
      // -----------------------------------------------------------
      const msg = err.message || "인증에 실패했습니다.";

      setError(msg);

      // OTP 단계에서 실패 시 입력칸 초기화
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
        {/* 헤더 섹션: 단계에 따라 제목 변경 */}
        <div className="login-header">
          <h1 className="login-title">
            {isOtpStep
              ? "OTP 인증"
              : "관리자 로그인"}
          </h1>
          <p className="login-subtitle">
            {isOtpStep
              ? "전송된 인증번호 6자리를 입력하세요"
              : "스마트 아파트 관리 시스템"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="login-form"
        >
          {!isOtpStep ? (
            // -----------------------------------------------------------
            // [입력창] 1단계: 아이디 및 비밀번호
            // -----------------------------------------------------------
            <>
              <div className="form-group">
                <label className="form-label">
                  아이디
                </label>
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
                <label className="form-label">
                  비밀번호
                </label>
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
            // -----------------------------------------------------------
            // [입력창] 2단계: OTP 코드 입력 
            // -----------------------------------------------------------
            <div className="form-group">
              <label className="form-label">
                인증번호 (OTP)
              </label>
              <div
                className="otp-input-wrapper"
                style={{ position: "relative" }}
              >
                <input
                  type="text"
                  inputMode="numeric" // 모바일 숫자 키패드 활성화
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

          {/* 에러 메시지 출력 (백엔드 ErrorResponse.message 포함) */}
          {error && (
            <div className="login-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* 메인 액션 버튼 */}
          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading
              ? "처리 중..."
              : isOtpStep
                ? "인증하기"
                : "로그인"}
          </button>

          {/* -----------------------------------------------------------
              [링크 추가] 비밀번호 찾기 (1단계에서만 표시)
          ----------------------------------------------------------- */}
          {!isOtpStep && (
            <div
              style={{
                textAlign: "center",
                marginTop: "15px",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  navigate("/password-reset")
                }
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

          {/* -----------------------------------------------------------
              [링크 추가] 이전으로 돌아가기 (2단계 OTP 화면에서만 표시)
          ----------------------------------------------------------- */}
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