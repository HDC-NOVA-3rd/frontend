import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { requestPasswordReset } from "../../services/adminApi";
import "./Login.css";

export default function PasswordResetOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginId, email } = location.state || {};

  const [otpCode, setOtpCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");
  const [isResending, setIsResending] = useState(false);

  // ⏱ 타이머
  useEffect(() => {
    if (timeLeft <= 0) {
      setExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleChange = (e) => {
    if (expired) return;

    const onlyNums = e.target.value.replace(/[^0-9]/g, "");
    setOtpCode(onlyNums);

    if (onlyNums.length === 6) {
      navigate("/password-reset/new", {
        state: { loginId, otpCode: onlyNums },
      });
    }
  };

  // 🔄 OTP 재전송
  const handleResend = async () => {
    if (isResending) return;

    setIsResending(true);
    setError("");

    try {
      await requestPasswordReset({ loginId, email });

      // 타이머 리셋
      setTimeLeft(300);
      setExpired(false);
      setOtpCode("");
    } catch (err) {
      setError(err.message || "재전송 실패");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1 className="login-title">OTP 인증</h1>
          <p className="login-subtitle">
            남은 시간: {formatTime(timeLeft)}
          </p>
        </div>

        <div className="login-form">
          <div className="form-group">
            <label className="form-label">인증번호</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                inputMode="numeric"
                value={otpCode}
                onChange={handleChange}
                className="form-input"
                maxLength={6}
                disabled={expired}
                autoFocus
                style={{
                  textAlign: "center",
                  letterSpacing: "8px",
                  fontSize: "1.2rem",
                }}
              />
              <ShieldCheck
                size={20}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "10px",
                  color: "#6366f1",
                }}
              />
            </div>
          </div>

          {expired && (
            <div className="login-error">
              <AlertCircle size={16} />
              <span>OTP가 만료되었습니다.</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="back-button"
            style={{ marginTop: "10px" }}
          >
            {isResending ? "재전송 중..." : "인증번호 재전송"}
          </button>

          {error && (
            <div className="login-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}