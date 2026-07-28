import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  CreateDeviceRequest,
  DeviceListResult,
  DeviceResult,
  SetDeviceStatusRequest,
  UpdateDeviceRequest,
} from "@/types/devices";

function requireData<T>(result: ApiResult<T>, fallbackMessage: string): T {
  if (!result.succeeded || result.data === undefined || result.data === null) {
    throw new Error(result.message || result.businessError || fallbackMessage);
  }
  return result.data;
}

export async function getDevicesByKiosk(kioskId: string, signal?: AbortSignal): Promise<DeviceListResult> {
  const response = await axiosClient.get<DeviceListResult>(
    "/api/v1/management/devices",
    {
      params: { kioskId },
      signal,
    }
  );

  if (!response.data.succeeded) {
    throw new Error(response.data.message || "Không thể tải danh sách thiết bị.");
  }

  return response.data;
}

export async function createManagementDevice(
  kioskId: string,
  request: CreateDeviceRequest,
): Promise<DeviceResult> {
  const response = await axiosClient.post<ApiResult<DeviceResult>>(
    `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/devices`,
    request,
  );
  return requireData(response.data, "Không thể tạo thiết bị.");
}

export async function updateManagementDevice(
  kioskId: string,
  deviceId: string,
  request: UpdateDeviceRequest,
): Promise<DeviceResult> {
  const response = await axiosClient.put<ApiResult<DeviceResult>>(
    `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/devices/${encodeURIComponent(deviceId)}`,
    request,
  );
  return requireData(response.data, "Không thể cập nhật thiết bị.");
}

export async function setManagementDeviceStatus(
  kioskId: string,
  deviceId: string,
  request: SetDeviceStatusRequest,
): Promise<DeviceResult> {
  const response = await axiosClient.patch<ApiResult<DeviceResult>>(
    `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/devices/${encodeURIComponent(deviceId)}/status`,
    request,
  );
  return requireData(response.data, "Không thể cập nhật trạng thái thiết bị.");
}

export async function retireManagementDevice(
  kioskId: string,
  deviceId: string,
  reason: string,
): Promise<DeviceResult> {
  const response = await axiosClient.delete<ApiResult<DeviceResult>>(
    `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/devices/${encodeURIComponent(deviceId)}`,
    { params: { reason: reason.trim() || undefined } },
  );
  return requireData(response.data, "Không thể ngừng sử dụng thiết bị.");
}

export function getDeviceManagementErrorMessage(
  error: unknown,
  fallbackMessage = "Không thể thực hiện thao tác với thiết bị.",
): string {
  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.businessError ||
      fallbackMessage
    );
  }
  return error instanceof Error ? error.message : fallbackMessage;
}
