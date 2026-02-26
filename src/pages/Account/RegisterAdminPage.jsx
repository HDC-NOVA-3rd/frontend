import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAdmin } from "../../services/adminApi";
import "./RegisterAdminPage.css"; // 아래 CSS 코드를 이 파일명으로 저장하세요.

const RegisterAdminPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    loginId: "",
    password: "",
    passwordConfirm: "",
    phoneNumber: "",
    birthDate: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 전화번호 자동 하이픈
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phoneNumber") {
      setFormData((prev) => ({ ...prev, phoneNumber: formatPhoneNumber(value) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const calculateStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const passwordStrength = calculateStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      await createAdmin(formData);
      navigate("/admin/register-success");
    } catch (err) {
      setError(err.response?.data?.message || "계정 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const isPasswordMismatch = formData.password && formData.passwordConfirm && formData.password !== formData.passwordConfirm;

  return (
    <div className="admin-reg-container">
      <div className="admin-reg-box">
        <div className="admin-reg-header">
          <h2 className="admin-reg-title">관리자 계정 생성</h2>
          <p className="admin-reg-subtitle">SUPER_ADMIN 권한으로 신규 관리자를 등록합니다.</p>
        </div>

        <form className="admin-reg-form" onSubmit={handleSubmit}>
          <div className="admin-reg-group">
            <label className="admin-reg-label">이름</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="admin-reg-input" required placeholder="실명을 입력하세요" />
          </div>

          <div className="admin-reg-group">
            <label className="admin-reg-label">로그인 ID</label>
            <input type="text" name="loginId" value={formData.loginId} onChange={handleChange} className="admin-reg-input" required placeholder="아이디를 입력하세요" />
          </div>

          <div className="admin-reg-group">
            <label className="admin-reg-label">이메일</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="admin-reg-input" required placeholder="example@domain.com" />
          </div>

          <div className="admin-reg-group">
            <label className="admin-reg-label">비밀번호</label>
            <div className="admin-reg-password-wrapper">
              <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className="admin-reg-input" required />
              <button type="button" className="admin-reg-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {formData.password && (
              <div className="admin-reg-strength-bar">
                <div className={`admin-reg-strength-fill strength-${passwordStrength}`}></div>
              </div>
            )}
          </div>

          <div className="admin-reg-group">
            <label className="admin-reg-label">비밀번호 확인</label>
            <input type={showPassword ? "text" : "password"} name="passwordConfirm" value={formData.passwordConfirm} onChange={handleChange} 
                   className={`admin-reg-input ${isPasswordMismatch ? "admin-reg-input-error" : ""}`} required />
          </div>

          <div className="admin-reg-group">
            <label className="admin-reg-label">전화번호</label>
            <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="admin-reg-input" required placeholder="010-0000-0000" />
          </div>

          <div className="admin-reg-group">
            <label className="admin-reg-label">생년월일</label>
            <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="admin-reg-input" />
          </div>

          {(error || isPasswordMismatch) && (
            <div className="admin-reg-error-msg">{error || "비밀번호가 일치하지 않습니다."}</div>
          )}

          <button type="submit" disabled={loading} className="admin-reg-submit-btn">
            {loading ? "등록 중..." : "관리자 계정 생성"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterAdminPage;