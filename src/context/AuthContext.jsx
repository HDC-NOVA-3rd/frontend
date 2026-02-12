import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { adminLogin } from "../services/adminApi";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] =
    useState(false);
  const [loading, setLoading] = useState(true);

  // 🔥 JWT 디코딩 함수 (한글 깨짐 방지 및 안전한 파싱)
  const parseJwt = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url
        .replace(/-/g, "+")
        .replace(/_/g, "/");
      return JSON.parse(
        decodeURIComponent(
          atob(base64)
            .split("")
            .map(function (c) {
              return (
                "%" +
                (
                  "00" +
                  c.charCodeAt(0).toString(16)
                ).slice(-2)
              );
            })
            .join(""),
        ),
      );
    } catch (e) {
      console.error("JWT 파싱 에러:", e);
      return null;
    }
  };

  // 🔥 토큰을 받아 유저 정보를 컨텍스트에 저장하는 함수
  const setAuthFromToken = (accessToken) => {
    const payload = parseJwt(accessToken);
    if (payload) {
      const userData = {
        loginId: payload.sub,
        // 토큰의 auth 필드를 우선순위로 사용 (ROLE_SUPER_ADMIN 등)
        role: payload.auth || payload.role,
        apartmentId: payload.apartmentId,
      };
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    }
    return null;
  };

  // 🔥 1차 로그인 (ID/PW) - 현재 시나리오에서는 저장 로직은 Login.js에서 처리하므로 유연하게 유지
  const login = async (loginId, password) => {
    const tokenData = await adminLogin({
      loginId,
      password,
    });
    // OTP 사용 시 이 단계에서 바로 저장하지 않고 tokenData를 리턴하여 처리
    return tokenData;
  };

  // 🔥 로그아웃
  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    setIsAuthenticated(false);
  };

  // 🔥 앱 시작 시 혹은 새로고침 시 토큰 확인 (자동 로그인)
  useEffect(() => {
    const token = localStorage.getItem(
      "accessToken",
    );
    if (token) {
      setAuthFromToken(token);
    }
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        loading,
        setAuthFromToken, // Login.js에서 OTP 인증 성공 후 호출할 함수
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider",
    );
  }
  return context;
}
