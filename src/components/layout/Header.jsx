import { useState } from "react";
import {
  Menu,
  X,
  LogOut,
  Bell,
  Settings,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminLogout } from "../../services/adminApi";
import "./Header.css";

export default function Header({ onMenuToggle }) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] =
    useState(false);

  const handleLogout = async () => {
    if (!window.confirm("로그아웃 하시겠습니까?"))
      return;

    try {
      const token = localStorage.getItem(
        "refreshToken",
      );

      if (token) {
        // 문자열(token)이 아니라 객체({ refreshToken: token })를 보내기
        await adminLogout({
          refreshToken: token,
        });
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // 성공/실패 여부와 상관없이 클라이언트는 로그아웃 처리
      localStorage.clear();
      navigate("/login");
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="menu-toggle"
          onClick={onMenuToggle}
        >
          <Menu size={24} />
        </button>
        <div className="header-logo">
          <h1>스마트 아파트 관리</h1>
        </div>
      </div>

      <div className="header-right">
        <button
          className="header-icon-btn"
          title="알림"
        >
          <Bell size={20} />
          <span className="badge">3</span>
        </button>

        <div className="header-divider"></div>

        <div className="header-user">
          <button
            className="user-menu-btn"
            onClick={() =>
              setShowDropdown(!showDropdown)
            }
          >
            <User size={20} />
            <span>관리자</span>
          </button>

          {showDropdown && (
            <div className="user-dropdown">
              <button className="dropdown-item">
                <User size={16} />
                <span>내 계정 정보</span>
              </button>
              <button className="dropdown-item">
                <Settings size={16} />
                <span>비밀번호 변경</span>
              </button>
              <div className="dropdown-divider"></div>
              <button
                className="dropdown-item logout-btn"
                onClick={handleLogout}
              >
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
