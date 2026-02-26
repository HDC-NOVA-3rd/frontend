import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Login from "./pages/Auth/Login";
import PasswordReset from "./pages/Auth/PasswordReset";
import Layout from "./components/layout/Layout";
import ResidentManagePage from "./pages/Resident/ResidentManagePage";
import HouseholdManagePage from "./pages/Household/HouseholdManagePage";
import NoticesList from "./pages/Notices/NoticesList";
import  FireMonitoringDashboard from "./pages/FireMonitoring/FireMonitoringDashboard";
import ComplaintsList from "./pages/Complaints/ComplaintsList";
import ManagementFeePage from "./pages/Management/ManagementFeePage"; 
import BillListPage from "./pages/Bill/BillListPage"; 
import PasswordChange from "./pages/Account/PasswordChange";
import ProfilePage from "./pages/Account/ProfilePage";
import RegisterAdminPage from "./pages/Account/RegisterAdminPage";
import Statistics from "./pages/Statistics/Statistics";

import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ---------------------- 인증 관련 ---------------------- */}
          <Route path="/login" element={<Login />} />
          <Route path="/password-reset" element={<PasswordReset />} />

          {/* ---------------------- 관리자 영역 ---------------------- */}
          <Route path="/admin/*" element={<Layout>
            <Routes>
              {/* 입주민 */}
              <Route path="resident/manage" element={<ResidentManagePage />} />
              <Route path="household/list" element={<HouseholdManagePage />} />

              {/* 공지사항 */}
              <Route path="notice/list" element={<NoticesList />} />

              {/* 안전 / 화재 모니터링 */}
              <Route path="safety" element={<FireMonitoringDashboard />} />

              {/* 민원 관리 */}
              <Route path="complaint/list" element={<ComplaintsList />} />

              {/* 관리비 */}
              <Route path="bill/list" element={<BillListPage />} />
              <Route path="bill/item/list" element={<ManagementFeePage />} />

              {/* 계정 설정 */}
              <Route path="account" element={<ProfilePage />} />
              <Route path="account/password-change" element={<PasswordChange />} />
              <Route path="settings/register-admin" element={<RegisterAdminPage />} />

              {/* 통계 */}
              <Route path="settings/settings/overall-statistics" element={<Statistics />} />

              <Route path="*" element={<Navigate to="household/list" replace />} />
            </Routes>
          </Layout>} />

          {/* 기본 경로 → 로그인으로 리다이렉트 */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* 전체 404 */}
          <Route path="*" element={
            <div style={{ padding: 40, textAlign: "center" }}>
              <h1>404</h1>
              <p>페이지를 찾을 수 없습니다.</p>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;