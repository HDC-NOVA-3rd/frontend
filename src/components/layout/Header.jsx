import { useState } from 'react';
import { Menu, X, LogOut, Bell, Settings, User } from 'lucide-react';
import './Header.css';

export default function Header({ onMenuToggle }) {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    // TODO: 로그아웃 API 호출
    console.log('Logout');
    // navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onMenuToggle}>
          <Menu size={24} />
        </button>
        <div className="header-logo">
          <h1>스마트 아파트 관리</h1>
        </div>
      </div>

      <div className="header-right">
        <button className="header-icon-btn" title="알림">
          <Bell size={20} />
          <span className="badge">3</span>
        </button>

        <div className="header-divider"></div>

        <div className="header-user">
          <button 
            className="user-menu-btn"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <User size={20} />
            <span>관리자</span>
          </button>

          {showDropdown && (
            <div className="user-dropdown">
              <button className="dropdown-item">
                <Settings size={16} />
                <span>프로필 수정</span>
              </button>
              <button className="dropdown-item">
                <Settings size={16} />
                <span>비밀번호 변경</span>
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item logout-btn" onClick={handleLogout}>
                <LogOut size={16} />
                <span>로그아웃</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
