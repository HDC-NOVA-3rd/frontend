import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ShieldCheck,
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import {
  requestPasswordReset,
  confirmPasswordReset,
} from "../../services/adminApi";
import "./Login.css";

export default function PasswordReset() {
  const navigate = useNavigate();

  // [상태 관리] 전체 폼 데이터
  const [formData, setFormData] = useState({
    loginId: "",
    email: "",
    otpCode: "",
    newPassword: "",
    passwordConfirm: "", // 여기를 DTO와 일치하게 변경
  });

  // [상태 관리] UI 흐름 및 보안
  const [isOtpStep, setIsOtpStep] =
    useState(false); // 단계를 나누는 핵심 상태
  const [showPassword, setShowPassword] =
    useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] =
    useState(false);

  // [유효성 검증] 단계별로 검증 로직 수행
  const validateForm = () => {
    if (!isOtpStep) {
      // 1단계 검증: 아이디 및 이메일 형식
      if (!formData.loginId.trim()) {
        setError("아이디를 입력해주세요.");
        return false;
      }
      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError(
          "유효한 이메일 형식이 아닙니다.",
        );
        return false;
      }
    } else {
      // 2단계 검증: OTP 및 비밀번호 강도
      if (formData.otpCode.length !== 6) {
        setError(
          "인증번호 6자리를 입력해주세요.",
        );
        return false;
      }
      // 영문, 숫자, 특수문자 포함 8자 이상
      const passwordRegex =
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (
        !passwordRegex.test(formData.newPassword)
      ) {
        setError(
          "비밀번호는 영문, 숫자, 특수문자 포함 8자 이상이어야 합니다.",
        );
        return false;
      }
      if (
        formData.newPassword !==
        formData.passwordConfirm
      ) {
        setError(
          "비밀번호 확인이 일치하지 않습니다.",
        );
        return false;
      }
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (!isOtpStep) {
        // [1단계] 백엔드 요청 (DTO: loginId, email)
        await requestPasswordReset({
          loginId: formData.loginId,
          email: formData.email,
        });
        setIsOtpStep(true); // 성공 시 2단계로 전환 (1단계 UI는 사라짐)
      } else {
        // [2단계] 최종 변경 요청
        await confirmPasswordReset({
          loginId: formData.loginId,
          otpCode: formData.otpCode,
          newPassword: formData.newPassword,
          passwordConfirm:
            formData.passwordConfirm,
        });
        alert(
          "비밀번호가 성공적으로 변경되었습니다.",
        );
        navigate("/login");
      }
    } catch (err) {
      setError(err.message || "처리에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          {/* 2단계에서 1단계로 돌아가기 위한 버튼 */}
          {isOtpStep && (
            <button
              type="button"
              onClick={() => setIsOtpStep(false)}
              style={{
                position: "absolute",
                left: "20px",
                top: "25px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#64748b",
              }}
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="login-title">
            {isOtpStep
              ? "새 비밀번호 설정"
              : "비밀번호 재설정"}
          </h1>
          <p className="login-subtitle">
            {isOtpStep
              ? "보안을 위해 강력한 비밀번호를 설정하세요"
              : "계정 확인을 위해 정보를 입력해주세요"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="login-form"
          noValidate
        >
          {/* STEP 1: 아이디 & 이메일 (1단계일 때만 렌더링) */}
          {!isOtpStep ? (
            <div className="step-container">
              <div className="form-group">
                <label className="form-label">
                  아이디
                </label>
                <div
                  style={{ position: "relative" }}
                >
                  <input
                    type="text"
                    name="loginId"
                    value={formData.loginId}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="아이디 입력"
                    required
                  />
                  <User
                    size={18}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "12px",
                      color: "#94a3b8",
                    }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  이메일
                </label>
                <div
                  style={{ position: "relative" }}
                >
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="example@mail.com"
                    required
                  />
                  <Mail
                    size={18}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "12px",
                      color: "#94a3b8",
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: OTP & 비밀번호 (2단계일 때만 렌더링) */
            <div className="step-container">
              <div className="form-group">
                <label className="form-label">
                  인증번호 (OTP)
                </label>
                <div
                  style={{ position: "relative" }}
                >
                  <input
                    type="text"
                    name="otpCode"
                    placeholder="6자리 입력"
                    value={formData.otpCode}
                    onChange={handleChange}
                    className="form-input"
                    maxLength={6}
                    required
                    autoFocus
                  />
                  <ShieldCheck
                    size={18}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "12px",
                      color: "#6366f1",
                    }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  새 비밀번호
                </label>
                <div
                  style={{ position: "relative" }}
                >
                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="영문, 숫자, 특수문자 조합 8자 이상"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword,
                      )
                    }
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "12px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#94a3b8",
                    }}
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  비밀번호 확인
                </label>
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="passwordConfirm"
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="비밀번호 다시 입력"
                  required
                />
              </div>
            </div>
          )}

          {/* 에러 피드백 */}
          {error && (
            <div className="login-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* 메인 버튼: 단계에 따라 텍스트 변경 */}
          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading
              ? "처리 중..."
              : isOtpStep
                ? "비밀번호 변경 완료"
                : "인증번호 발송"}
          </button>

          {/* 초기 단계에서만 보이는 로그인 페이지 이동 버튼 */}
          {!isOtpStep && (
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="back-button"
              style={{
                background: "none",
                border: "none",
                color: "#64748b",
                marginTop: "15px",
                cursor: "pointer",
                width: "100%",
                fontSize: "0.9rem",
              }}
            >
              로그인 화면으로 돌아가기
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
