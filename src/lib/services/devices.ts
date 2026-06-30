import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type { DeviceListResult } from "@/types/devices";

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
