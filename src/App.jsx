import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { FireMonitoringDashboard } from "./pages";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Auth/Login";
import PasswordReset from "./pages/Auth/PasswordReset";
import Layout from "./components/layout/Layout";
import NoticeCreate from "./pages/Notices/NoticeCreate";
import NoticeEdit from "./pages/Notices/NoticeEdit";
import NoticesList from "./pages/Notices/NoticesList";
import NoticeLog from "./pages/Notices/NoticeLog";
import ComplaintStatistics from "./pages/Complaints/Statistics";
/* 민원 관련 페이지 컴포넌트 임포트 (경로 확인 필요) */
import ComplaintsList from "./pages/Complaints/ComplaintsList";
import ComplaintAnswer from "./pages/Complaints/ComplaintAnswer";
import ComplaintLog from "./pages/Complaints/ComplaintLog";
import ComplaintStatus from "./pages/Complaints/ComplaintStatus";

/* 관리비 관련 컴포넌트 임포트 (파일 생성 후 경로 확인 필요) */
import ManagementFeeList from "./pages/Management/ManagementFeeList"; 

import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 기본 로그인 경로 */}
          <Route
            path="/login"
            element={<Login />}
          />

          {/* 비밀번호 초기화 경로 */}
          <Route
            path="/password-reset"
            element={<PasswordReset />}
          />

          {/* 관리자 영역 */}
          <Route
            path="/admin/*"
            element={
              <Layout>
                <Routes>
                  <Route
                    path="notices"
                    element={<NoticesList />}
                  />
                  <Route
                    path="notices/create"
                    element={<NoticeCreate />}
                  />
                  <Route
                    path="notices/:noticeId/edit"
                    element={<NoticeEdit />}
                  />
                  <Route
                    path="notices/log"
                    element={<NoticeLog />}
                  />
                  <Route
                    path="safety"
                    element={
                      <FireMonitoringDashboard />
                    }
                  />
                  <Route
                    path="residents"
                    element={
                      <div>입주민 조회 페이지 (구현 예정)</div>
                    }
                  />
                  <Route
                    path="units"
                    element={
                      <div>세대 관리 페이지 (구현 예정)</div>
                    }
                  />
                  
                  {/* --- 민원 관리 라우트 추가 시작 --- */}
                  <Route
                    path="complaints/list"
                    element={<ComplaintsList />}
                  />
                  <Route
                    path="complaints/answer"
                    element={<ComplaintAnswer />}
                  />
                  <Route
                    path="complaints/status"
                    element={<ComplaintStatus />}
                  />
                  <Route
                    path="complaints/log"
                    element={<ComplaintLog />}
                  />
                  <Route
                    path="complaints/statistics"
                    element={<ComplaintStatistics />}
                  />
                  <Route 
                    path="complaints" 
                    element={<Navigate to="list" replace />} 
                  />
                  {/* --- 민원 관리 라우트 추가 끝 --- */}

                  {/* --- 관리비 항목 관리 라우트 추가 시작 --- */}
                  <Route
                    path="/bills/items"
                    element={<ManagementFeeList />}
                  />
                  {/* --- 관리비 항목 관리 라우트 추가 끝 --- */}

                  <Route
                    path="bills"
                    element={
                      <div>고지서 관리 페이지 (구현 예정)</div>
                    }
                  />
                  <Route
                    path="facilities"
                    element={
                      <div>시설 관리 페이지 (구현 예정)</div>
                    }
                  />
                  <Route
                    path="*"
                    element={
                      <div>페이지를 찾을 수 없습니다.</div>
                    }
                  />
                </Routes>
              </Layout>
            }
          />

          {/* 기본 경로 → 로그인으로 리다이렉트 */}
          <Route
            path="/"
            element={
              <Navigate to="/login" replace />
            }
          />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div style={{ padding: 40, textAlign: "center" }}>
                <h1>404</h1>
                <p>페이지를 찾을 수 없습니다.</p>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;