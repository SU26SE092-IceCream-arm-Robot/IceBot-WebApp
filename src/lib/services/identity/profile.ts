import axios from "axios";

import axiosClient from "@/lib/axios-client";
import { unwrapApiResult } from "@/lib/api/result";
import type { ApiResult } from "@/types";
import type {
  ChangeCurrentAccountPasswordRequest,
  CurrentAccountNotificationDevice,
  CurrentAccountProfile,
  CurrentAccountSessionsResult,
  RevokeCurrentAccountSessionsResult,
  UpdateCurrentAccountProfileRequest,
} from "@/types/identity/profile";

export function getProfileErrorMessage(error: unknown, fallbackMessage: string): string {
  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    return error.response?.data?.message || fallbackMessage;
  }

  return error instanceof Error ? error.message : fallbackMessage;
}

export async function getCurrentAccountProfile(): Promise<CurrentAccountProfile> {
  const response = await axiosClient.get<ApiResult<CurrentAccountProfile>>("/api/v1/me");
  return unwrapApiResult(response.data, "Không thể tải thông tin cá nhân.");
}

export async function updateCurrentAccountProfile(
  request: UpdateCurrentAccountProfileRequest,
): Promise<CurrentAccountProfile> {
  const response = await axiosClient.put<ApiResult<CurrentAccountProfile>>(
    "/api/v1/me/profile",
    request,
  );
  return unwrapApiResult(response.data, "Không thể cập nhật thông tin cá nhân.");
}

export async function changeCurrentAccountPassword(
  request: ChangeCurrentAccountPasswordRequest,
): Promise<void> {
  const response = await axiosClient.put<ApiResult<boolean>>(
    "/api/v1/me/password",
    request,
  );
  unwrapApiResult(response.data, "Không thể đổi mật khẩu.");
}

export async function listCurrentAccountSessions(): Promise<CurrentAccountSessionsResult> {
  const response = await axiosClient.get<ApiResult<CurrentAccountSessionsResult>>(
    "/api/v1/me/sessions",
  );
  return unwrapApiResult(response.data, "Không thể tải các phiên đăng nhập.");
}

export async function revokeCurrentAccountSession(sessionId: string): Promise<void> {
  await axiosClient.delete(
    `/api/v1/me/sessions/${encodeURIComponent(sessionId)}`,
  );
}

export async function revokeAllCurrentAccountSessions(): Promise<number> {
  const response = await axiosClient.post<ApiResult<RevokeCurrentAccountSessionsResult>>(
    "/api/v1/authentication/revoke-all",
    {},
  );
  return unwrapApiResult(response.data, "Không thể đăng xuất khỏi các phiên.").revoked;
}

export async function listCurrentAccountNotificationDevices(): Promise<
  CurrentAccountNotificationDevice[]
> {
  const response = await axiosClient.get<ApiResult<CurrentAccountNotificationDevice[]>>(
    "/api/v1/me/notification-devices",
  );
  return unwrapApiResult(response.data, "Không thể tải thiết bị nhận thông báo.");
}

export async function unregisterCurrentAccountNotificationDevice(
  installationId: string,
): Promise<void> {
  await axiosClient.delete(`/api/v1/me/notification-devices/${installationId}`);
}
