import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Home, Bell, MessageSquare, Users, ShieldCheck, 
  Receipt, Settings, KeyRound, UserPlus, LogOut, 
  LayoutDashboard, User, BarChart3, ChevronLeft, ChevronRight 
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
        const [aptRes, adminRes] = await Promise.all([
          getMyApartmentInfo(),
          getMyAdminInfo()
        ]);
        setAptInfo(aptRes.data);
        setAdminInfo(adminRes.data);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      }
    };
    fetchSidebarData();
  }, []);

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

  const menuItems = [
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
    { label: "전체 통계", icon: BarChart3, path: "/admin/settings/overall-statistics", roles: ["SUPER_ADMIN", "MANAGER"] },
  ];

  const filteredMenus = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? "show" : ""}`} onClick={onClose} />
      
      <aside className={`sidebar ${isOpen ? "open" : ""} ${isCollapsed ? "collapsed" : ""}`}>
        {/* 접기/펴기 토글 버튼 */}
        <button 
          className="sidebar-toggle-btn" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label="Toggle Sidebar"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="sidebar-header">
          <h3 className="sidebar-logo">
            {isCollapsed ? "APT" : (aptInfo?.apartmentName ? `${aptInfo.apartmentName}` : "관리시스템")}
          </h3>
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
                  <div className="profile-placeholder"><User size={24} /></div>
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
          
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            {!isCollapsed && <span>로그아웃</span>}
          </button>
        </div>
      </aside>
    </>
  );
}