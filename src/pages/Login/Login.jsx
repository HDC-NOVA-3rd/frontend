import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    loginId: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // TODO: 실제 API 호출 구현
    try {
      console.log('Admin login attempt:', formData);
      
      // Mock login - 실제 구현 시 제거
      setTimeout(() => {
        // 임시로 바로 fire-monitoring으로 이동
        navigate('/admin/safety');
      }, 500);
      
    } catch (err) {
      setError(err.message || '로그인에 실패했습니다.');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1 className="login-title">관리자 로그인</h1>
          <p className="login-subtitle">스마트 아파트 관리 시스템</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="loginId" className="form-label">
              아이디
            </label>
            <input
              type="text"
              id="loginId"
              name="loginId"
              value={formData.loginId}
              onChange={handleChange}
              className="form-input"
              placeholder="아이디를 입력하세요"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="비밀번호를 입력하세요"
              required
              disabled={isLoading}
            />
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
            disabled={isLoading}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="login-footer">
          <div className="login-links">
            <button type="button" className="login-link">
              비밀번호 재설정
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
