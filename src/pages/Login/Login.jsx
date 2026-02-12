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
} from "../../services/adminApi"; // verifyOtp 서비스 추가 필요
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { loginSuccess } = useAuth(); // AuthContext에서 제공하는 로그인 성공 함수 (이름은 Context 확인 필요)
  const { setAuthFromToken } = useAuth(); // import 확인
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    loginId: "",
    password: "",
    otpCode: "", // OTP 코드 추가
  });

  const [isOtpStep, setIsOtpStep] =
    useState(false); // OTP 입력 단계인지 확인
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] =
    useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!isOtpStep) {
        // [1단계] ID/PW 로그인 시도
        // 백엔드에서 1단계 통과 시 200 OK와 함께 OTP 필요 신호를 준다고 가정합니다.
        await adminLogin({
          loginId: formData.loginId,
          password: formData.password,
        });
        setIsOtpStep(true); // OTP 입력 칸으로 전환
      } else {
        // [2단계] OTP 인증 시도
        const tokenData = await verifyOtp({
          loginId: formData.loginId,
          otpCode: formData.otpCode,
        });

        // 최종 토큰 저장
        localStorage.setItem(
          "accessToken",
          tokenData.accessToken,
        );
        localStorage.setItem(
          "refreshToken",
          tokenData.refreshToken,
        );

        // 🔥 여기서 Context의 유저 정보를 업데이트!
        setAuthFromToken(tokenData.accessToken);

        // 역할별 이동 (tokenData에 role이 포함되어 있다고 가정)
        if (tokenData.role === "SUPER_ADMIN") {
          navigate("/admin/safety");
        } else {
          navigate("/admin/safety");
        }
      }
    } catch (err) {
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
            // ID, Password 입력창
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
            // OTP 입력창
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
            {isLoading
              ? "처리 중..."
              : isOtpStep
                ? "인증하기"
                : "로그인"}
          </button>

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
