import React, { useState, useEffect } from 'react';
import { requestChangePassword, confirmChangePassword } from '../../services/adminApi'; 
import { Eye, EyeOff, Lock, ShieldCheck, KeyRound, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"; 

import './PasswordChange.css';

const PasswordChange = ({ loginId }) => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [timer, setTimer] = useState(0);

  const [formData, setFormData] = useState({
    loginId: loginId || '',
    currentPassword: '',
    otpCode: '',
    newPassword: '',
    passwordConfirm: ''
  });

  // OTP 타이머 로직
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  // 1단계: OTP 발송
  const handleRequest = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      await requestChangePassword({ currentPassword: formData.currentPassword });
      setSuccessMsg("인증번호가 발송되었습니다. 메일을 확인해주세요.");
      setStep(2);
      setTimer(180); // 3분 타이머
    } catch (err) {
      setError("현재 비밀번호가 일치하지 않거나 요청에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2단계: 변경 확정
  const handleConfirm = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (formData.newPassword !== formData.passwordConfirm) {
      setError("새 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);
    try {
      await confirmChangePassword(formData);
      setSuccessMsg("비밀번호 변경이 완료되었습니다.");
      // 성공 후 로직 추가 가능 (예: 로그아웃 처리)
    } catch (err) {
      setError("OTP 코드가 틀렸거나 변경에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pw-change-container">
      <div className="pw-change-box">
        <div className="pw-header">
          <div className="pw-icon-circle">
            <Lock size={24} />
          </div>
          <h2 className="pw-title">비밀번호 변경</h2>
          <p className="pw-subtitle">보안을 위해 새로운 비밀번호를 설정해주세요.</p>
        </div>

        {/* 세련된 알림 배너 */}
        {successMsg && (
          <div className="pw-msg-banner success">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}
        {error && (
          <div className="pw-msg-banner error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="pw-step-indicator">
          <div className={`pw-step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className="pw-step-line"></div>
          <div className={`pw-step-dot ${step === 2 ? 'active' : ''}`}>2</div>
        </div>
        
        <form onSubmit={step === 1 ? handleRequest : handleConfirm} className="pw-form">
          {step === 1 ? (
            <div className="pw-group">
              <label className="pw-label"><KeyRound size={14} /> 현재 비밀번호</label>
              <div className="pw-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="currentPassword" 
                  placeholder="현재 비밀번호 입력"
                  className="pw-input"
                  value={formData.currentPassword} 
                  onChange={handleChange} 
                  required 
                />
                <button type="button" className="pw-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="pw-group">
                <label className="pw-label">
                  <ShieldCheck size={14} /> OTP 코드
                  {timer > 0 && <span className="pw-timer">{formatTime(timer)}</span>}
                </label>
                <input 
                  name="otpCode" 
                  placeholder="인증번호 6자리"
                  className="pw-input"
                  value={formData.otpCode} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="pw-group">
                <label className="pw-label"><Lock size={14} /> 새 비밀번호</label>
                <div className="pw-input-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="newPassword" 
                    placeholder="새 비밀번호 입력"
                    className="pw-input"
                    value={formData.newPassword} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>
              <div className="pw-group">
                <label className="pw-label"><Lock size={14} /> 새 비밀번호 확인</label>
                <div className="pw-input-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="passwordConfirm" 
                    placeholder="비밀번호 재입력"
                    className={`pw-input ${formData.newPassword !== formData.passwordConfirm && formData.passwordConfirm ? "pw-input-error" : ""}`}
                    value={formData.passwordConfirm} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>
            </>
          )}

          <div className="pw-button-group">
            {step === 2 && !isLoading && (
              <button type="button" onClick={() => {setStep(1); setSuccessMsg("");}} className="pw-btn-secondary">이전</button>
            )}
            <button type="submit" className="pw-btn-primary" disabled={isLoading}>
              {isLoading ? (
                <span className="pw-loading-content"><Loader2 size={18} className="pw-spin" /> 처리 중...</span>
              ) : (
                step === 1 ? "OTP 인증번호 발송" : "비밀번호 변경 완료"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordChange;