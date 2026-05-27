import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

import {
  clearAuthSession,
  getStoredAccessToken,
  readAuthSession,
  writeAuthSession,
} from "@/lib/auth-session";
import { refreshAccessToken } from "@/lib/services/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.icebot.com";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const axiosClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

let refreshRequest: Promise<string> | null = null;

function redirectToLogin(): void {
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

function isAuthenticationRequest(url?: string): boolean {
  return Boolean(url?.includes("/api/v1/authentication/"));
}

async function rotateBrowserSession(): Promise<string> {
  const session = readAuthSession();
  if (!session?.refreshToken) {
    throw new Error("Refresh token không tồn tại.");
  }

  const refreshedSession = await refreshAccessToken(session.refreshToken);
  writeAuthSession(refreshedSession);
  return refreshedSession.accessToken;
}

axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = getStoredAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !config ||
      config._retry ||
      isAuthenticationRequest(config.url)
    ) {
      return Promise.reject(error);
    }

    config._retry = true;

    try {
      refreshRequest ??= rotateBrowserSession().finally(() => {
        refreshRequest = null;
      });

      const accessToken = await refreshRequest;
      config.headers.Authorization = `Bearer ${accessToken}`;
      return axiosClient(config);
    } catch (refreshError) {
      clearAuthSession();
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  },
);

export default axiosClient;
