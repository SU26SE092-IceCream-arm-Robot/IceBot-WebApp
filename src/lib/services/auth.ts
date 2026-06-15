import axios from "axios";

import {
  API_BASE_URL,
  normalizeApiRequestPath,
} from "@/lib/api-base-url";
import { createSessionFromLogin } from "@/lib/auth-session";
import type {
  ApiResult,
  AuthSession,
  AuthenticatedAccountResult,
  CurrentAccountResult,
} from "@/types";

const authHttpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

authHttpClient.interceptors.request.use((config) => {
  config.url = normalizeApiRequestPath(config.url);
  return config;
});

export interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

function requireData<T>(result: ApiResult<T>): T {
  if (!result.succeeded || !result.data) {
    throw new Error(result.message || "Yêu cầu không thành công.");
  }

  return result.data;
}

export function getAuthErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    return error.response?.data?.message || "Không thể xác thực tài khoản.";
  }

  return error instanceof Error ? error.message : "Không thể xác thực tài khoản.";
}

export async function loginWithPassword(request: LoginRequest): Promise<AuthSession> {
  const response = await authHttpClient.post<ApiResult<AuthenticatedAccountResult>>(
    "/api/v1/authentication/login",
    request,
  );

  return createSessionFromLogin(requireData(response.data));
}

export async function refreshAccessToken(refreshToken: string): Promise<AuthSession> {
  const response = await authHttpClient.post<ApiResult<AuthenticatedAccountResult>>(
    "/api/v1/authentication/refresh",
    { refreshToken },
  );

  return createSessionFromLogin(requireData(response.data));
}

export async function getCurrentAccount(accessToken: string): Promise<CurrentAccountResult> {
  const response = await authHttpClient.get<ApiResult<CurrentAccountResult>>("/api/v1/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return requireData(response.data);
}

export async function revokeRefreshToken(refreshToken: string, reason?: string): Promise<void> {
  await authHttpClient.post<ApiResult<{ revoked: boolean }>>("/api/v1/authentication/revoke", {
    refreshToken,
    reason,
  });
}

export async function revokeAllSessions(accessToken: string, reason?: string): Promise<void> {
  await authHttpClient.post<ApiResult<{ revoked: number }>>(
    "/api/v1/authentication/revoke-all",
    { reason },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}
