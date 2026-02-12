import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// 역할 기반 라우트 컴포넌트
export default function RoleRoute({
  children,
  allowedRoles,
}) {
  const { isAuthenticated, user, loading } =
    useAuth();

  // 로딩 중일 때는 아무것도 렌더링하지 않음 (깜빡임 방지)
  if (loading) return null;

  // 1. 인증되지 않은 사용자는 로그인 페이지로
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. 권한 체크 (user?.role 이 allowedRoles에 포함되는지 확인)
  // user가 null일 경우를 대비해 ?. 연산자를 사용합니다.
  if (
    allowedRoles &&
    (!user || !allowedRoles.includes(user.role))
  ) {
    // 권한이 없으면 unauthorized 페이지로 리다이렉트
    return (
      <Navigate to="/unauthorized" replace />
    );
  }

  // 3. 모든 통과 시 해당 페이지 렌더링
  return children;
}
