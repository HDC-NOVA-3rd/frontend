import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createAdmin, getMyApartmentInfo } from "../../services/adminApi";
import { Eye, EyeOff, CheckCircle } from "lucide-react"; // CheckCircle 아이콘 추가

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

  const [aptInfo, setAptInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); 

  const handleReset = () => {
  // 1. 폼 데이터 초기화
  setFormData({
    name: "",
    email: "",
    loginId: "",
    password: "",
    passwordConfirm: "",
    phoneNumber: "",
    birthDate: "",
  });
  // 2. 에러 및 성공 상태 초기화
  setError("");
  setIsSuccess(false);
};

  useEffect(() => {
    const fetchAptData = async () => {
      try {
        const res = await getMyApartmentInfo();
        setAptInfo(res);
      } catch (err) {
        console.error("아파트 정보 로드 실패:", err);
      }
    };
    fetchAptData();
  }, []);

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
      setIsSuccess(true); // [수정] 페이지 이동 대신 성공 상태 true로 변경
    } catch (err) {
      setError(err.response?.data?.message || "계정 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const isPasswordMismatch = formData.password && formData.passwordConfirm && formData.password !== formData.passwordConfirm;

  // --- 성공 화면 렌더링 함수 ---
  if (isSuccess) {
    return (
      <div className="admin-reg-container">
        <div className="admin-reg-box success-view" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <CheckCircle size={64} color="#10b981" style={{ marginBottom: '20px' }} />
          <h2 className="admin-reg-title">등록 완료!</h2>
          <p className="admin-reg-subtitle">
            <strong className="apt-name-highlight">{formData.name}</strong> 관리자 계정이 정상적으로 생성되었습니다.
          </p>
          <div style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={() => navigate("/admin/login")} className="admin-reg-submit-btn">
              로그인하러 가기
            </button>
            <button 
              onClick={handleReset} // 여기서 위에서 만든 초기화 함수 호출
              className="admin-reg-submit-btn" 
              style={{ backgroundColor: '#6b7280' }}
            >
              추가 등록하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 기본 등록 폼 렌더링 ---
  return (
    <div className="admin-reg-container">
      <div className="admin-reg-box">
        <div className="admin-reg-header">
          <h2 className="admin-reg-title">관리자 계정 생성</h2>
          <p className="admin-reg-subtitle">
            {aptInfo?.apartmentName ? (
              <>
                <strong className="apt-name-highlight">{aptInfo.apartmentName}</strong>의 신규 관리자를 등록합니다.
              </>
            ) : (
              "신규 관리자를 등록합니다."
            )}
          </p>
        </div>

        <form className="admin-reg-form" onSubmit={handleSubmit}>
          {/* ... 기존 input 필드들 (동일) ... */}
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
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                className="admin-reg-input" 
                required 
              />
              <button 
                type="button" 
                className="admin-reg-toggle-btn" 
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
            <div className="admin-reg-password-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                name="passwordConfirm" 
                value={formData.passwordConfirm} 
                onChange={handleChange} 
                className={`admin-reg-input ${isPasswordMismatch ? "admin-reg-input-error" : ""}`} 
                required 
              />
            </div>
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
            <div className="admin-reg-error-msg">
              {error || "비밀번호가 일치하지 않습니다."}
            </div>
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