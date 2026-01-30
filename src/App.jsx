import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FireMonitoringDashboard } from './pages';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 화재감시 대시보드 */}
        <Route path="/admin/safety" element={<FireMonitoringDashboard />} />
        
        {/* 기본 경로 → 대시보드로 리다이렉트 */}
        <Route path="/" element={<Navigate to="/admin/safety" replace />} />
        
        {/* 404 */}
        <Route path="*" element={
          <div style={{ padding: 40, textAlign: 'center' }}>
            <h1>404</h1>
            <p>페이지를 찾을 수 없습니다.</p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
