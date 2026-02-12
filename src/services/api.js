import axios from "axios";

const RAW_API_BASE =
  import.meta.env.VITE_API_BASE_URL || "";
const API_BASE = import.meta.env.DEV
  ? ""
  : RAW_API_BASE;

/* ================================
   Axios Instance
================================ */
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
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

  try {
    const response = await axios.post(
      `${API_BASE}/api/admin/auth/refresh`,
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
  } catch (error) {
    return null;
  }
}

/* ================================
   Response Interceptor
================================ */
api.interceptors.response.use(
  (response) => {
    if (response.status === 204) return null;
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // 401 처리
    if (
      status === 401 &&
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
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(
          new ApiError(401, "Unauthorized"),
        );
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message;

    return Promise.reject(
      new ApiError(
        status,
        error.response?.statusText,
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
  return response?.data ?? null;
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
  return response?.data ?? null;
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
  return response?.data ?? null;
}

export async function patch(
  url,
  data,
  config = {},
) {
  const response = await api.patch(
    url,
    data,
    config,
  );
  return response?.data ?? null;
}

export async function del(url, config = {}) {
  const response = await api.delete(url, config);
  return response?.data ?? null;
}

export default api;
