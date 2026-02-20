import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, CheckCircle } from "lucide-react";
import { confirmPasswordReset } from "../../services/adminApi";
import "./Login.css";

export default function PasswordResetNewPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginId, otpCode } = location.state || {};

  const [formData, setFormData] = useState({
    newPassword: "",
    passwordConfirm: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 🔐 강도 계산
  const passwordStrength = useMemo(() => {
    const pw = formData.newPassword;
    let score = 0;

    if (pw.length >= 8) score++;
    if (/[A-Za-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[@$!%*?&]/.test(pw)) score++;

    return score;
  }, [formData.newPassword]);

  const isMatch =
    formData.passwordConfirm &&
    formData.newPassword === formData.passwordConfirm;

  const canSubmit =
    passwordStrength >= 3 && isMatch && !isLoading;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);

    try {
      await confirmPasswordReset({
        loginId,
        otpCode,
        newPassword: formData.newPassword,
        passwordConfirm: formData.passwordConfirm,
      });

      alert("비밀번호가 성공적으로 변경되었습니다.");
      navigate("/login");
    } catch (err) {
      setError(err.message || "변경 실패");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1 className="login-title">새 비밀번호 설정</h1>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">새 비밀번호</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="form-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "10px",
                  background: "none",
                  border: "none",
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* 강도 바 */}
            {formData.newPassword && (
              <div style={{ marginTop: "8px" }}>
                <div
                  style={{
                    height: "6px",
                    width: `${passwordStrength * 25}%`,
                    background:
                      passwordStrength >= 3
                        ? "#22c55e"
                        : "#ef4444",
                    borderRadius: "4px",
                    transition: "0.3s",
                  }}
                />
                <p
                  style={{
                    fontSize: "0.85rem",
                    marginTop: "4px",
                    color:
                      passwordStrength >= 3
                        ? "#22c55e"
                        : "#ef4444",
                  }}
                >
                  {passwordStrength >= 3
                    ? "사용 가능한 비밀번호"
                    : "보안이 약합니다"}
                </p>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">비밀번호 확인</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleChange}
                className="form-input"
              />
              {isMatch && (
                <CheckCircle
                  size={18}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "10px",
                    color: "#22c55e",
                  }}
                />
              )}
            </div>

            {formData.passwordConfirm && !isMatch && (
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#ef4444",
                  marginTop: "4px",
                }}
              >
                비밀번호가 일치하지 않습니다
              </p>
            )}
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
            disabled={!canSubmit}
            style={{
              opacity: canSubmit ? 1 : 0.5,
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            {isLoading ? "처리 중..." : "비밀번호 변경"}
          </button>
        </form>
      </div>
    </div>
  );
}