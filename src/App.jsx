import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

/* 페이지 컴포넌트 임포트 */
import Login from "./pages/Auth/Login";
import PasswordReset from "./pages/Auth/PasswordReset";
import PasswordResetRequest from "./pages/Auth/PasswordResetRequest";
import PasswordResetOtp from "./pages/Auth/PasswordResetOtp";
import PasswordResetNewPassword from "./pages/Auth/PasswordResetNewPassword";

import Layout from "./components/layout/Layout";

/* 입주민 관련 */
import ResidentDashboard from "./pages/Resident/ResidentDashboard";
import ResidentList from "./pages/Resident/ResidentList";
import HouseholdList from "./pages/Resident/HouseholdList";

/* 공지사항 관련 */
import NoticesList from "./pages/Notices/NoticesList";
import NoticeCreate from "./pages/Notices/NoticeCreate";
import NoticeEdit from "./pages/Notices/NoticeEdit";
import NoticeLog from "./pages/Notices/NoticeLog";

/* 안전 / 모니터링 */
import { FireMonitoringDashboard } from "./pages";

/* 민원 관련 */
import ComplaintsList from "./pages/Complaints/ComplaintsList";
import ComplaintAnswer from "./pages/Complaints/ComplaintAnswer";
import ComplaintLog from "./pages/Complaints/ComplaintLog";
import ComplaintStatus from "./pages/Complaints/ComplaintStatus";
import ComplaintStatistics from "./pages/Complaints/Statistics";

/* 관리비 관련 */
import ManagementFeeList from "./pages/Management/ManagementFeeList"; 
import BillListPage from "./pages/Bill/BillListPage"; 

/* 계정 관련 */
import PasswordChange from "./pages/Account/PasswordChange";
import ProfilePage from "./pages/Account/ProfilePage";
import ApartmentPage from "./pages/Account/ApartmentPage";


import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ---------------------- 인증 관련 ---------------------- */}
          <Route path="/login" element={<Login />} />
          <Route path="/password-reset" element={<PasswordReset />} />
          <Route path="/password-reset/otp" element={<PasswordResetOtp />} />
          <Route path="/password-reset/new" element={<PasswordResetNewPassword />} />

          {/* ---------------------- 관리자 영역 ---------------------- */}
          <Route path="/admin/*" element={<Layout>
            <Routes>
              {/* 입주민 */}
              <Route path="resident/dashboard" element={<ResidentDashboard />} />
              <Route path="resident/list" element={<ResidentList />} />
              <Route path="household/list" element={<HouseholdList />} />

              {/* 공지사항 */}
              <Route path="notices" element={<NoticesList />} />
              <Route path="notices/create" element={<NoticeCreate />} />
              <Route path="notices/:noticeId/edit" element={<NoticeEdit />} />
              <Route path="notices/log" element={<NoticeLog />} />

              {/* 안전 / 화재 모니터링 */}
              <Route path="safety" element={<FireMonitoringDashboard />} />

              {/* 민원 관리 */}
              <Route path="complaint/list" element={<ComplaintsList />} />
              <Route path="complaint/answer" element={<ComplaintAnswer />} />
              <Route path="complaint/status" element={<ComplaintStatus />} />
              <Route path="complaint/log" element={<ComplaintLog />} />
              <Route path="complaint/statistics" element={<ComplaintStatistics />} />
              <Route path="complaint" element={<Navigate to="list" replace />} />

              {/* 관리비 */}
              <Route path="bills/items" element={<ManagementFeeList />} />
              <Route path="bills" element={<BillListPage />} />

              {/* 계정 설정 */}
              <Route path="account/password-change" element={<PasswordChange loginId={window.loginId} />} />
              <Route path="settings/accounts" element={<ProfilePage />} />
              <Route path="settings/apartment" element={<ApartmentPage />} />


              {/* 시설 관리 */}
              <Route path="facilities" element={<div>시설 관리 페이지 (구현 예정)</div>} />

              {/* 관리자 404 */}
              <Route path="*" element={<div>페이지를 찾을 수 없습니다.</div>} />
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