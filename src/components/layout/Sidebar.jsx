import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Home, Bell, MessageSquare, Users, ShieldCheck, 
  Receipt, Settings, KeyRound, UserPlus, LogOut, 
  LayoutDashboard, User, BarChart3, ChevronLeft, ChevronRight, Building2 
} from "lucide-react";
import { adminLogout, getMyApartmentInfo, getMyAdminInfo } from "../../services/adminApi";
import "./Sidebar.css";

export default function Sidebar({ isOpen, onClose, isCollapsed, setIsCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = localStorage.getItem("userRole") || "MANAGER";

  const [aptInfo, setAptInfo] = useState(null);
  const [adminInfo, setAdminInfo] = useState(null);

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        // api.js의 get함수는 이미 response.data를 리턴하므로 res를 직접 넣습니다.
        const aptRes = await getMyApartmentInfo();
        const adminRes = await getMyAdminInfo();
        
        setAptInfo(aptRes); 
        setAdminInfo(adminRes);
      } catch (error) {
        console.error("사이드바 데이터 로드 실패:", error);
      }
    };
    fetchSidebarData();
  }, []);

  const handleLogout = async () => {
    if (!window.confirm("로그아웃 하시겠습니까?")) return;
    try {
      await adminLogout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.clear();
      navigate("/login");
    }
  };

  const menuItems = [
    { label: "대시보드", icon: BarChart3, path: "/admin/settings/overall-statistics", roles: ["SUPER_ADMIN", "MANAGER"] },
    { label: "세대 현황", icon: Home, path: "/admin/household/list", roles: ["SUPER_ADMIN", "MANAGER"] },
    { label: "공지사항", icon: Bell, path: "/admin/notice/list", roles: ["SUPER_ADMIN", "MANAGER"] },
    { label: "민원 관리", icon: MessageSquare, path: "/admin/complaint/list", roles: ["SUPER_ADMIN", "MANAGER"] },
    { label: "입주민 명부", icon: Users, path: "/admin/resident/manage", roles: ["SUPER_ADMIN", "MANAGER"] },
    { label: "안전 관리", icon: ShieldCheck, path: "/admin/safety", roles: ["SUPER_ADMIN", "MANAGER"] },
    { label: "납부 현황", icon: Receipt, path: "/admin/bill/list", roles: ["SUPER_ADMIN", "MANAGER"] },
    { label: "고지서 항목", icon: Settings, path: "/admin/bill/item/list", roles: ["SUPER_ADMIN", "MANAGER"] },
    { label: "내 계정 정보", icon: LayoutDashboard, path: "/admin/account", roles: ["SUPER_ADMIN", "MANAGER"] },
    { label: "비밀번호 변경", icon: KeyRound, path: "/admin/account/password-change", roles: ["SUPER_ADMIN", "MANAGER"] },
    { label: "관리자 추가", icon: UserPlus, path: "/admin/settings/register-admin", roles: ["SUPER_ADMIN", "MANAGER"] },
  ];

  const filteredMenus = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? "show" : ""}`} onClick={onClose} />
      
      <aside className={`sidebar ${isOpen ? "open" : ""} ${isCollapsed ? "collapsed" : ""}`}>
        <button 
          className="sidebar-toggle-btn" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label="Toggle Sidebar"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="sidebar-header">
          <div className="logo-wrapper">
            {/* 아파트 로고 아이콘 */}
            <Building2 size={24} className="apt-icon" />
            {!isCollapsed && (
              <h3 className="sidebar-logo">
                    {/* 아파트 이름이 있으면 '이름 + 관리시스템', 없으면 그냥 '관리시스템' */}
                    {aptInfo?.apartmentName 
                      ? `${aptInfo.apartmentName} 관리소` 
                      : "아파트 관리소"}
              </h3>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="menu-list">
            {filteredMenus.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={index}
                  to={item.path}
                  className={`menu-item ${isActive ? "active" : ""}`}
                  title={isCollapsed ? item.label : ""}
                  onClick={() => { if (window.innerWidth <= 768) onClose(); }}
                >
                  <div className="icon-wrapper">
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  {!isCollapsed && <span className="menu-label">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="sidebar-footer">
          {adminInfo && (
            <div className="admin-info-section">
              <div className="admin-profile-img">
                {adminInfo.profileImg ? (
                  <img src={adminInfo.profileImg} alt="Profile" />
                ) : (
                  <div className="profile-placeholder">
                    <User size={isCollapsed ? 18 : 22} />
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <div className="admin-details">
                  <span className="admin-name">{adminInfo.name} 님</span>
                  <span className="admin-email">{adminInfo.email}</span>
                </div>
              )}
            </div>
          )}
          
          <button className="logout-btn" onClick={handleLogout} title={isCollapsed ? "로그아웃" : ""}>
            <LogOut size={18} />
            {!isCollapsed && <span>로그아웃</span>}
          </button>
        </div>
      </aside>
    </>
  );
}