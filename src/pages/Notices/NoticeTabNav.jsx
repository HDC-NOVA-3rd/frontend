import { useLocation, useNavigate } from "react-router-dom";
import "./Notices.css";

const TABS = [
  { id: "list", path: "/admin/notices", label: "공지 목록", icon: "📋" },
  { id: "create", path: "/admin/notices/create", label: "공지 등록", icon: "✏️" },
  { id: "log", path: "/admin/notices/log", label: "발송 내역", icon: "📊" },
];

export default function NoticeTabNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="notices-tabs" aria-label="공지사항 탭">
      {TABS.map((tab) => {
        const isActive = pathname === tab.path;
        return (
          <button
            key={tab.id}
            className={`notices-tab ${isActive ? "active" : ""}`}
            onClick={() => navigate(tab.path)}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="notices-tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
