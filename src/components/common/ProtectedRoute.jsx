import { Navigate } from "react-router-dom";

// 보호된 라우트를 위한 컴포넌트
//보호 라우팅 추가 (로그인 안 하면 못 들어가게)
export default function ProtectedRoute({
  children,
}) {
  const token = localStorage.getItem(
    "accessToken",
  );

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
