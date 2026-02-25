import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom"; // Link 추가
import {
  BarChart3, AlertTriangle, Users, FileText, Bell, Settings,
  ChevronDown, Home, CreditCard, LogOut,
} from "lucide-react";
import { adminLogout } from "../../services/adminApi";
import "./Sidebar.css";

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation(); // 현재 경로 표시용
  const [expandedMenus, setExpandedMenus] = useState({});

  const handleLogout = async () => {
    if (!window.confirm("로그아웃 하시겠습니까?")) return;
    try {
      const token = localStorage.getItem("refreshToken");
      if (token) await adminLogout({ refreshToken: token });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.clear();
      navigate("/login");
    }
  };

  const toggleSubmenu = (menuName) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const menuItems = [
    { label: "세대 현황", icon: Home, path: "/admin/household/list" },
    {
      label: "안전 모니터링",
      icon: AlertTriangle,
      submenu: [
        { label: "화재감시", path: "/admin/safety" },
        { label: "안전 상태", path: "/admin/safety/status" },
        { label: "이벤트 로그", path: "/admin/safety/events" },
        { label: "센서 로그", path: "/admin/safety/sensors" },
      ],
    },
    {
      label: "입주민 관리",
      icon: Users,
      submenu: [
        { label: "입주민 관리", path: "/admin/resident/manage" },
        { label: "입주민 대시보드", path: "/admin/resident/dashboard" },
      ],
    },
    {
      label: "민원 현황",
      icon: FileText,
      submenu: [
        { label: "민원 목록", path: "/admin/complaint/list" },
        { label: "민원 통계", path: "/admin/complaint/statistics" },
        { label: "처리 현황", path: "/admin/complaint/status" },
      ],
    },
    {
      label: "공지사항",
      icon: Bell,
      submenu: [
        { label: "공지사항 등록", path: "/admin/notices/create" },
        { label: "공지사항 목록", path: "/admin/notices" },
        { label: "공지 로그", path: "/admin/notices/log" },
      ],
    },
    {
      label: "고지서 관리",
      icon: CreditCard,
      submenu: [
        { label: "세대별 납부 현황", path: "/admin/bills" },
        { label: "관리비 세부 항목", path: "/admin/bills/items" },
        { label: "관리비 통계", path: "/admin/bills/statistics" }
      ],
    },
    {
      label: "시스템 설정",
      icon: Settings,
      submenu: [
        { label: "내 계정 정보", path: "/admin/account" },
        { label: "비밀번호 변경", path: "/admin/account/password-change" },
        { label: "관리자 계정 생성", path: "/admin/settings/register-admin" },
      ],
    },
  ];

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <nav className="sidebar-nav">
          <div className="sidebar-menu">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isExpanded = expandedMenus[item.label];

              return (
                <div key={index} className="menu-item-wrapper">
                  {hasSubmenu ? (
                    <button className="menu-item" onClick={() => toggleSubmenu(item.label)}>
                      <Icon size={20} />
                      <span className="menu-label">{item.label}</span>
                      <ChevronDown size={16} className={`menu-chevron ${isExpanded ? "expanded" : ""}`} />
                    </button>
                  ) : (
                    <Link to={item.path} className={`menu-item ${location.pathname === item.path ? "active" : ""}`} onClick={onClose}>
                      <Icon size={20} />
                      <span className="menu-label">{item.label}</span>
                    </Link>
                  )}

                  {hasSubmenu && isExpanded && (
                    <div className="submenu">
                      {item.submenu.map((subitem, subindex) => (
                        <Link
                          key={subindex}
                          to={subitem.path}
                          className={`submenu-item ${location.pathname === subitem.path ? "active" : ""}`}
                          onClick={onClose}
                        >
                          {subitem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="sidebar-footer">
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={20} />
              <span>로그아웃</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}