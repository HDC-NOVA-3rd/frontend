import React, { useState } from 'react';
import { requestChangePassword, confirmChangePassword } from '../../services/adminApi'; // API 경로에 맞게 수정
import './PasswordChange.css';

const PasswordChange = ({ loginId }) => {
  // 단계 관리 (1: 요청, 2: 확정)
  const [step, setStep] = useState(1);
  
  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    loginId: loginId || '', // 부모 컴포넌트나 상태관리에서 받아온 ID
    currentPassword: '',
    otpCode: '',
    newPassword: '',
    passwordConfirm: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 1단계: OTP 발송 요청
  const handleRequest = async (e) => {
    e.preventDefault();
    try {
      const data = {
        loginId: formData.loginId,
        currentPassword: formData.currentPassword
      };
      await requestChangePassword(data);
      alert('OTP 코드가 발송되었습니다.');
      setStep(2); // 2단계로 이동
    } catch (error) {
      alert('비밀번호가 일치하지 않거나 요청에 실패했습니다.');
    }
  };

  // 2단계: 비밀번호 변경 확정
  const handleConfirm = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.passwordConfirm) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      const data = {
        otpCode: formData.otpCode,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        passwordConfirm: formData.passwordConfirm
      };
      await confirmChangePassword(data);
      alert('비밀번호 변경이 완료되었습니다.');
      // 성공 후 로직 (예: 로그아웃 또는 메인 이동)
    } catch (error) {
      alert('OTP 코드가 틀렸거나 변경에 실패했습니다.');
    }
  };

  return (
    <div className="password-change-container">
      <h2>비밀번호 변경</h2>
      
      {step === 1 ? (
        /* 1단계: 본인 확인 */
        <form onSubmit={handleRequest} className="pw-form">
          <div className="input-group">
            <label>아이디</label>
            <input name="loginId" value={formData.loginId} readOnly />
          </div>
          <div className="input-group">
            <label>현재 비밀번호</label>
            <input 
              type="password" 
              name="currentPassword" 
              value={formData.currentPassword} 
              onChange={handleChange} 
              required 
            />
          </div>
          <button type="submit" className="btn-primary">OTP 발송</button>
        </form>
      ) : (
        /* 2단계: OTP 및 새 비번 입력 */
        <form onSubmit={handleConfirm} className="pw-form">
          <div className="input-group">
            <label>OTP 코드</label>
            <input 
              name="otpCode" 
              placeholder="인증번호 입력"
              value={formData.otpCode} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="input-group">
            <label>새 비밀번호</label>
            <input 
              type="password" 
              name="newPassword" 
              value={formData.newPassword} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="input-group">
            <label>새 비밀번호 확인</label>
            <input 
              type="password" 
              name="passwordConfirm" 
              value={formData.passwordConfirm} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="button-group">
            <button type="button" onClick={() => setStep(1)} className="btn-secondary">이전</button>
            <button type="submit" className="btn-primary">비밀번호 변경</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PasswordChange;