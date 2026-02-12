import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "";

/* ================================
   Axios Instance
================================ */
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  validateStatus: () => true, // 직접 상태코드 처리
});

/* ================================
   Custom Error
================================ */
export class ApiError extends Error {
  constructor(status, statusText, message) {
    super(
      message ||
        `API Error: ${status} ${statusText}`,
    );
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
  }
}

/* ================================
   Request Interceptor
================================ */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(
    "accessToken",
  );
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ================================
   Refresh Logic
================================ */
let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(newToken) {
  refreshSubscribers.forEach((callback) =>
    callback(newToken),
  );
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback) {
  refreshSubscribers.push(callback);
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(
    "refreshToken",
  );
  if (!refreshToken) return null;

  const response = await axios.post(
    `${API_BASE}/auth/refresh`,
    { refreshToken },
    { validateStatus: () => true },
  );

  if (response.status === 200) {
    const newAccessToken =
      response.data.accessToken;
    localStorage.setItem(
      "accessToken",
      newAccessToken,
    );
    return newAccessToken;
  }

  return null;
}

/* ================================
   Response Interceptor
================================ */
api.interceptors.response.use(
  async (response) => {
    // 정상 응답
    if (
      response.status >= 200 &&
      response.status < 300
    ) {
      if (response.status === 204) return null;
      return response;
    }

    const originalRequest = response.config;

    // 401 처리
    if (
      response.status === 401 &&
      !originalRequest._retry
    ) {
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
      isRefreshing = false;

      if (newToken) {
        onRefreshed(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } else {
        // refresh 실패 → 로그아웃 처리
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(
          new ApiError(401, "Unauthorized"),
        );
      }
    }

    // 기타 에러
    const message =
      response.data?.message ||
      response.data?.error ||
      response.statusText;

    return Promise.reject(
      new ApiError(
        response.status,
        response.statusText,
        message,
      ),
    );
  },
);

/* ================================
   HTTP Methods
================================ */
export async function get(url, config = {}) {
  const response = await api.get(url, config);
  return response.data;
}

export async function post(
  url,
  data,
  config = {},
) {
  const response = await api.post(
    url,
    data,
    config,
  );
  return response.data;
}

export async function put(
  url,
  data,
  config = {},
) {
  const response = await api.put(
    url,
    data,
    config,
  );
  return response.data;
}

export async function del(url, config = {}) {
  const response = await api.delete(url, config);
  return response.data;
}
