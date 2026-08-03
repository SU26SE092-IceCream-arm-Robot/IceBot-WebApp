import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  ChangeCurrentAccountPasswordRequest,
  CurrentAccountNotificationDevice,
  CurrentAccountProfile,
  CurrentAccountSession,
  RevokeCurrentAccountSessionsResult,
  UpdateCurrentAccountProfileRequest,
} from "@/types/profile";

function requireData<T>(result: ApiResult<T>, fallbackMessage: string): T {
  if (!result.succeeded || result.data === undefined || result.data === null) {
    throw new Error(result.message || fallbackMessage);
  }

  return result.data;
}

export function getProfileErrorMessage(error: unknown, fallbackMessage: string): string {
  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    return error.response?.data?.message || fallbackMessage;
  }

  return error instanceof Error ? error.message : fallbackMessage;
}

export async function getCurrentAccountProfile(): Promise<CurrentAccountProfile> {
  const response = await axiosClient.get<ApiResult<CurrentAccountProfile>>("/api/v1/me");
  return requireData(response.data, "Không thể tải thông tin cá nhân.");
}

export async function updateCurrentAccountProfile(
  request: UpdateCurrentAccountProfileRequest,
): Promise<CurrentAccountProfile> {
  const response = await axiosClient.put<ApiResult<CurrentAccountProfile>>(
    "/api/v1/me/profile",
    request,
  );
  return requireData(response.data, "Không thể cập nhật thông tin cá nhân.");
}

export async function changeCurrentAccountPassword(
  request: ChangeCurrentAccountPasswordRequest,
): Promise<void> {
  const response = await axiosClient.put<ApiResult<boolean>>(
    "/api/v1/me/password",
    request,
  );
  requireData(response.data, "Không thể đổi mật khẩu.");
}

export async function listCurrentAccountSessions(): Promise<CurrentAccountSession[]> {
  const response = await axiosClient.get<ApiResult<CurrentAccountSession[]>>(
    "/api/v1/me/sessions",
  );
  return requireData(response.data, "Không thể tải các phiên đăng nhập.");
}

export async function revokeAllCurrentAccountSessions(): Promise<number> {
  const response = await axiosClient.post<ApiResult<RevokeCurrentAccountSessionsResult>>(
    "/api/v1/authentication/revoke-all",
    {},
  );
  return requireData(response.data, "Không thể đăng xuất khỏi các phiên.").revoked;
}

export async function listCurrentAccountNotificationDevices(): Promise<
  CurrentAccountNotificationDevice[]
> {
  const response = await axiosClient.get<ApiResult<CurrentAccountNotificationDevice[]>>(
    "/api/v1/me/notification-devices",
  );
  return requireData(response.data, "Không thể tải thiết bị nhận thông báo.");
}

export async function unregisterCurrentAccountNotificationDevice(
  installationId: string,
): Promise<void> {
  await axiosClient.delete(`/api/v1/me/notification-devices/${installationId}`);
}
