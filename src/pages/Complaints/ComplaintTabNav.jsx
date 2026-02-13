import { useLocation, useNavigate } from "react-router-dom";
import "./Complaints.css";

// 탭 구성 데이터
const TABS = [
  { id: "list", path: "/admin/complaints/list", label: "민원 목록", icon: "📋" },
  { id: "answer", path: "/admin/complaints/answer", label: "민원 답변 등록", icon: "✏️" },
  { id: "log", path: "/admin/complaints/log", label: "변경 내역", icon: "📊" },
];

export default function ComplaintTabNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="complaints-tabs" aria-label="민원 관리 메뉴">
      {TABS.map((tab) => {
        // 현재 경로와 탭의 경로가 일치하는지 확인
        const isActive = pathname === tab.path;
        
        return (
          <button
            key={tab.id}
            className={`complaints-tab ${isActive ? "active" : ""}`}
            onClick={() => navigate(tab.path)}
            aria-current={isActive ? "page" : undefined}
            type="button"
          >
            <span className="complaints-tab-icon" aria-hidden="true">
              {tab.icon}
            </span>
            <span className="complaints-tab-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}