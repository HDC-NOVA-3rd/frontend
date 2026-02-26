import { useState } from 'react';
import Sidebar from './Sidebar';
import './Layout.css';

export default function Layout({ children }) {
  // sidebarOpen: 모바일에서 사이드바 자체가 아예 나타나고 사라지는 상태
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // isCollapsed: 데스크탑에서 사이드바 너비가 줄어드는 상태
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="layout">

      
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      
      {/* isCollapsed 값에 따라 클래스를 부여하여 여백 조정 */}
      <main className={`layout-main ${isCollapsed ? 'collapsed' : ''}`}>
        {children}
      </main>
    </div>
  );
}