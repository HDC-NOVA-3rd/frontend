import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createAdmin } from "../../services/adminApi";
import "./RegisterAdminPage.css";

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

  // 🛡 SUPER_ADMIN 접근 제한
  // useEffect(() => {
  //   const role = localStorage.getItem("role");
  //   if (role !== "SUPER_ADMIN") {
  //     alert("접근 권한이 없습니다.");
  //     navigate("/admin");
  //   }
  // }, [navigate]);

  // 전화번호 자동 하이픈
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7)
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(
      7,
      11
    )}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phoneNumber") {
      setFormData((prev) => ({
        ...prev,
        phoneNumber: formatPhoneNumber(value),
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  // 🧠 비밀번호 강도 계산
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

      // 🔄 성공 페이지 이동
      navigate("/admin/register-success");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "계정 생성 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const isPasswordMismatch =
    formData.password &&
    formData.passwordConfirm &&
    formData.password !== formData.passwordConfirm;

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h2 className="login-title">관리자 계정 생성</h2>
          <p className="login-subtitle">
            SUPER_ADMIN 권한으로 관리자를 등록합니다.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">이름</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">로그인 ID</label>
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
            <label className="form-label">이메일</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          {/* 👁 비밀번호 토글 */}
          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                required
              />
              <button
                type="button"
                className="toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                👁
              </button>
            </div>

            {/* 🧠 강도 바 */}
            {formData.password && (
              <div className="strength-bar">
                <div
                  className={`strength strength-${passwordStrength}`}
                ></div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">비밀번호 확인</label>
            <input
              type={showPassword ? "text" : "password"}
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              className={`form-input ${
                isPasswordMismatch ? "input-error" : ""
              }`}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">전화번호</label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">생년월일</label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          {(error || isPasswordMismatch) && (
            <div className="login-error">
              {error || "비밀번호가 일치하지 않습니다."}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading ? "등록 중..." : "관리자 계정 생성"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterAdminPage;