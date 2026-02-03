import { useState } from 'react';
import {
  BarChart3,
  AlertTriangle,
  Users,
  FileText,
  Bell,
  Settings,
  ChevronDown,
  Home,
  CreditCard,
  MessageSquare,
  LogOut
} from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose }) {
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleSubmenu = (menuName) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  const menuItems = [
    {
      label: '대시보드',
      icon: Home,
      path: '/admin/safety',
      submenu: null
    },
    {
      label: '안전 모니터링',
      icon: AlertTriangle,
      submenu: [
        { label: '화재감시', path: '/admin/safety' },
        { label: '안전 상태', path: '/admin/safety/status' },
        { label: '이벤트 로그', path: '/admin/safety/events' },
        { label: '센서 로그', path: '/admin/safety/sensors' }
      ]
    },
    {
      label: '입주민 관리',
      icon: Users,
      submenu: [
        { label: '입주민 조회', path: '/admin/residents' },
        { label: '세대 관리', path: '/admin/units' },
        { label: '입주민 등록', path: '/admin/residents/create' }
      ]
    },
    {
      label: '민원 처리',
      icon: FileText,
      submenu: [
        { label: '민원 목록', path: '/admin/complaints' },
        { label: '민원 통계', path: '/admin/complaints/statistics' },
        { label: '처리 현황', path: '/admin/complaints/status' }
      ]
    },
    {
      label: '공지사항',
      icon: Bell,
      submenu: [
        { label: '공지사항 등록', path: '/admin/notices/create' },
        { label: '공지사항 목록', path: '/admin/notices' },
        { label: '공지 로그', path: '/admin/notices/log' }
      ]
    },
    {
      label: '고지서 관리',
      icon: CreditCard,
      submenu: [
        { label: '고지서 조회', path: '/admin/bills' },
        { label: '관리비 항목', path: '/admin/bills/items' },
        { label: '결제 현황', path: '/admin/bills/payments' }
      ]
    },
    {
      label: '설정',
      icon: Settings,
      submenu: [
        { label: '관리자 정보', path: '/admin/settings/profile' },
        { label: '시스템 설정', path: '/admin/settings/system' }
      ]
    }
  ];

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <nav className="sidebar-nav">
          <div className="sidebar-menu">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isExpanded = expandedMenus[item.label];

              return (
                <div key={index} className="menu-item-wrapper">
                  <button
                    className="menu-item"
                    onClick={() => hasSubmenu ? toggleSubmenu(item.label) : null}
                  >
                    <Icon size={20} />
                    <span className="menu-label">{item.label}</span>
                    {hasSubmenu && (
                      <ChevronDown 
                        size={16} 
                        className={`menu-chevron ${isExpanded ? 'expanded' : ''}`}
                      />
                    )}
                  </button>

                  {hasSubmenu && isExpanded && (
                    <div className="submenu">
                      {item.submenu.map((subitem, subindex) => (
                        <a 
                          key={subindex}
                          href={subitem.path}
                          className="submenu-item"
                        >
                          {subitem.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="sidebar-footer">
            <button className="logout-btn">
              <LogOut size={20} />
              <span>로그아웃</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
