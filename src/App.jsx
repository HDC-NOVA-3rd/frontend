import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FireMonitoringDashboard } from "./pages";
import Login from "./pages/Login/Login";
import Layout from "./components/layout/Layout";
import NoticeCreate from "./pages/Notices/NoticeCreate";
import NoticeEdit from "./pages/Notices/NoticeEdit";
import NoticesList from "./pages/Notices/NoticesList";
import NoticeLog from "./pages/Notices/NoticeLog";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 로그인 */}
        <Route path="/login" element={<Login />} />

        {/* 관리자 영역 (헤더 + 사이드바 포함) */}
        <Route
          path="/admin/*"
          element={
            <Layout>
              <Routes>
                <Route path="notices" element={<NoticesList />} />
                <Route path="notices/create" element={<NoticeCreate />} />
                <Route path="notices/:noticeId/edit" element={<NoticeEdit />} />
                <Route path="notices/log" element={<NoticeLog />} />
                <Route path="safety" element={<FireMonitoringDashboard />} />
                <Route path="residents" element={<div>입주민 조회 페이지 (구현 예정)</div>} />
                <Route path="units" element={<div>세대 관리 페이지 (구현 예정)</div>} />
                <Route path="complaints" element={<div>민원 처리 페이지 (구현 예정)</div>} />
                <Route path="bills" element={<div>고지서 관리 페이지 (구현 예정)</div>} />
                <Route path="facilities" element={<div>시설 관리 페이지 (구현 예정)</div>} />
                <Route path="*" element={<div>페이지를 찾을 수 없습니다.</div>} />
              </Routes>
            </Layout>
          }
        />

        {/* 기본 경로 → 로그인으로 리다이렉트 */}
        <Route path="/" element={<Navigate to="/login" replace />} />

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
  );
}

export default App;
