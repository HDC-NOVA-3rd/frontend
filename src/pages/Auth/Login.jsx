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

  // [핸들러] 입력값 변경 시 formData 업데이트
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(""); // 사용자가 입력을 시작하면 에러 메시지 초기화
  };

  // [핸들러] 폼 제출 (로그인 시도)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!isOtpStep) {
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
          otpCode: formData.otpCode,
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
        if (tokenData.role === "SUPER_ADMIN") {
          navigate("/admin/safety");
        } else {
          navigate("/admin/safety");
        }
      }
    } catch (err) {
      // 서버 에러 메시지가 있으면 표시, 없으면 기본 메시지 출력
      setError(
        err.response?.data?.message ||
          "인증에 실패했습니다.",
      );
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
                  name="otpCode"
                  placeholder="000000"
                  value={formData.otpCode}
                  onChange={handleChange}
                  className="form-input"
                  maxLength={6}
                  required
                  autoFocus
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

          {/* 에러 메시지 출력 */}
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
