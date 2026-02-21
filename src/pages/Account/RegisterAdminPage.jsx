import React, { useState } from 'react';
import { createAdmin } from '../../services/adminApi'; 

const RegisterAdminPage  = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    loginId: '',
    password: '',
    passwordConfirm: '',
    phoneNumber: '',
    birthDate: '',
  });

  const [loading, setLoading] = useState(false);

  // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 등록 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 프론트엔드 1차 검증: 비밀번호 일치 확인
    if (formData.password !== formData.passwordConfirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (!window.confirm("새로운 관리자 계정을 생성하시겠습니까?")) return;

    setLoading(true);
    try {
      // API 호출 (제공해주신 adminApi.js의 createAdmin 사용)
      await createAdmin(formData);
      alert("관리자 계정이 성공적으로 생성되었습니다.");
      
      // 등록 후 폼 초기화
      setFormData({
        name: '',
        email: '',
        loginId: '',
        password: '',
        passwordConfirm: '',
        phoneNumber: '',
        birthDate: '',
      });
    } catch (error) {
      console.error("Registration error:", error);
      // 백엔드 BusinessException 메시지가 있다면 출력
      alert(error.response?.data?.message || "계정 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">관리자 계정 생성</h2>
      <p className="text-sm text-gray-500 mb-6">* SUPER_ADMIN 권한으로 현재 아파트의 관리자를 등록합니다.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 이름 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">이름</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* 로그인 ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700">로그인 ID</label>
          <input
            type="text"
            name="loginId"
            value={formData.loginId}
            onChange={handleChange}
            placeholder="4~50자"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* 이메일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">이메일</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* 비밀번호 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">비밀번호</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="최소 8자 이상"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* 비밀번호 확인 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">비밀번호 확인</label>
          <input
            type="password"
            name="passwordConfirm"
            value={formData.passwordConfirm}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* 전화번호 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">전화번호</label>
          <input
            type="text"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="010-1234-5678"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* 생년월일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">생년월일</label>
          <input
            type="date"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md text-white font-semibold ${
            loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 transition'
          }`}
        >
          {loading ? '등록 중...' : '관리자 계정 생성'}
        </button>
      </form>
    </div>
  );
};

export default RegisterAdminPage ;