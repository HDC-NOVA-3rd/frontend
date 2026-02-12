import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "";

/* ================================
   Axios Instance
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
  }
}

/* ================================
   Request Interceptor
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
}

/* ================================
   Response Interceptor
}
