import axios from "axios";

/* =================================
   Base URL 설정
================================= */

const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const API_BASE     = import.meta.env.DEV ? "" : RAW_API_BASE;


/* =================================
   Axios Instance 생성
================================= */
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, 
  headers : {
    "Content-Type": "application/json",
  },
});


/* =================================
   Custom Error 
================================= */

export class ApiError extends Error {
  constructor(status, statusText, message, data) {
    super(message || `API Error: ${status} ${statusText}`);

    this.name       = "ApiError";
    this.status     = status;
    this.statusText = statusText;
    this.data       = data; 
  }
}


/* =================================
   토큰 관리 변수 (메모리 저장)
================================= */
let memoryToken = null; 

// AuthContext나 로그인 시점에 이 함수를 호출해서 토큰을 메모리에 저장합니다.
export const setMemoryToken = (token) => {
  memoryToken = token;
};

/* =================================
   Request Interceptor
================================= */
api.interceptors.request.use((config) => {
  if (memoryToken) {
    config.headers.Authorization = `Bearer ${memoryToken}`;
  }
  return config;
});


/* =================================
   Token Refresh Logic
================================= */

let isRefreshing       = false;
let refreshSubscribers = [];

function onRefreshed(newToken) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback) {
  refreshSubscribers.push(callback);
}

async function refreshAccessToken() {
  try {
    const response = await axios.post(
      `${API_BASE}/api/admin/auth/refresh`,
      {}, 
      { 
        withCredentials: true, 
        validateStatus: () => true 
      }
    );

    if (response.status === 200) {
      const newAccessToken = response.data.accessToken;
      setMemoryToken(newAccessToken); 
      return newAccessToken;
    }
    return null;
  } catch {
    return null;
  }
}


/* =================================
   Response Interceptor
================================= */

api.interceptors.response.use(
  (response) => {
    // 백엔드에서 200 OK이면서 데이터가 없는 경우(ResponseEntity.ok().build()) 에러 방지
    if (response.status === 204 || !response.data) return response; 
    return response;
  },

  async (error) => {
    const originalRequest = error.config;
    const status          = error.response?.status;
    const serverData      = error.response?.data;

    // 에러 메시지 추출 공통 로직
    const message =
      serverData?.message ||
      serverData?.error   ||
      error.message       ||
      "알 수 없는 오류가 발생했습니다.";

    /* 401 처리 */
    if (status === 401) {
      // -----------------------------------------------------------
      // 로그인 API(/auth/login) 호출 중 401은 실패 메시지만 전달
      // -----------------------------------------------------------
      if (originalRequest.url.includes("/api/admin/auth/login")) {
        return Promise.reject(
          new ApiError(status, error.response?.statusText, message, serverData)
        );
      }

      // 일반적인 API 호출 시 401이 나면 기존 리프레시 로직 작동
      if (!originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve) => {
            addRefreshSubscriber((newToken) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(originalRequest));
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const newToken = await refreshAccessToken();
        isRefreshing   = false;

        if (newToken) {
          onRefreshed(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }

        // 리프레시 실패 시 
        setMemoryToken(null); // 메모리 비움
        window.location.href = "/login";

        return Promise.reject(new ApiError(401, "Unauthorized", "세션이 만료되었습니다."));
      }
    }

    // 그 외 에러(400, 403, 500 등) 처리
    return Promise.reject(
      new ApiError(status, error.response?.statusText, message, serverData)
    );
  }
);


/* =================================
   HTTP Methods
================================= */

export async function get(url, config = {}) {
  const response = await api.get(url, config);
  return response?.data ?? null;
}

export async function post(url, data, config = {}) {
  const response = await api.post(url, data, config);
  return response?.data ?? null;
}

export async function put(url, data, config = {}) {
  const response = await api.put(url, data, config);
  return response?.data ?? null;
}

export async function patch(url, data, config = {}) {
  const response = await api.patch(url, data, config);
  return response?.data ?? null;
}

export async function del(url, config = {}) {
  const response = await api.delete(url, config);
  return response !== undefined; 
}


export default api;