import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { adminLogin, adminRefresh, adminLogout } from "../services/adminApi";
import { setMemoryToken, clearAuthState } from "../services/api"; 

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // JWT 디코딩 함수 
  const parseJwt = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(
        decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        )
      );
    } catch (e) {
      return null;
    }
  };

  // 인증 정보를 설정하는 통합 함수
  const setAuth = useCallback((accessToken) => {
    if (!accessToken) return null;

    // 1. API 인터셉터가 사용할 메모리 토큰 업데이트
    setMemoryToken(accessToken);

    // 2. 토큰 파싱해서 유저 상태 저장
    const payload = parseJwt(accessToken);
    if (payload) {
      const userData = {
        loginId: payload.sub,
        role: payload.auth || payload.role,
        apartmentId: payload.apartmentId,
      };
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    }
    return null;
  }, []);

  // 로그인 요청 (ID/PW 단계)
  const login = async (loginId, password) => {
    // 백엔드가 이제 쿠키를 구워주므로, 프론트는 결과만 리턴받음
    return await adminLogin({ loginId, password });
  };

  // 로그아웃
  const logout = async () => {
    try {
      await adminLogout(); // 백엔드 쿠키 만료 요청
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      // 로컬 상태들 초기화 (Point 4: clearAuthState 연동)
      clearAuthState();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // 자동 로그인 (Silent Refresh - Point 3)
  const refreshAuth = useCallback(async () => {
    try {
      const data = await adminRefresh(); // 쿠키를 이용해 새 AccessToken 요청
      if (data && data.accessToken) {
        setAuth(data.accessToken);
      } else {
        // 응답은 왔으나 토큰이 없는 경우
        clearAuthState();
      }
    } catch (error) {
      // 토큰이 없거나 만료된 경우 (Point 2: 무한 루프 방지 위해 상태 비움)
      console.log("세션 없음 혹은 만료");
      clearAuthState();
    } finally {
      // 어떤 결과든 로딩은 끝냄
      setLoading(false);
    }
  }, [setAuth]);

  // 앱 구동 시 자동 로그인 시도
  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        setAuth, // OTP 검증 성공 시 이 함수를 호출해서 토큰을 넣어주세요!
        refreshAuth,
      }}
    >
      {/* 초기 로딩 중에는 하위 컴포넌트를 렌더링하지 않아 깜빡임을 방지함 */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}