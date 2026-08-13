import axios from "axios";

import axiosClient from "@/lib/axios-client";
import { getApiResultMessage, unwrapApiResult } from "@/lib/api/result";
import type { ApiResult } from "@/types";
import type {
  KioskMenuItemAvailabilityResult,
  MenuItemOperationalAvailabilityState,
  SetKioskMenuItemAvailabilityRequest,
} from "@/types/kiosks/menu-item-availability";

function availabilityPath(kioskId: string): string {
  return `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}`;
}

export async function listKioskMenuItemAvailability(
  kioskId: string,
  query: { search?: string; state?: MenuItemOperationalAvailabilityState },
  signal?: AbortSignal,
): Promise<KioskMenuItemAvailabilityResult[]> {
  const response = await axiosClient.get<ApiResult<KioskMenuItemAvailabilityResult[]>>(
    `${availabilityPath(kioskId)}/menu-item-availability`,
    {
      params: { search: query.search?.trim() || undefined, state: query.state },
      signal,
    },
  );
  return unwrapApiResult(response.data, "Không thể tải trạng thái món tại kiosk.");
}

export async function setKioskMenuItemAvailability(
  kioskId: string,
  menuItemId: string,
  request: SetKioskMenuItemAvailabilityRequest,
): Promise<KioskMenuItemAvailabilityResult> {
  const response = await axiosClient.put<ApiResult<KioskMenuItemAvailabilityResult>>(
    `${availabilityPath(kioskId)}/menu-items/${encodeURIComponent(menuItemId)}/availability`,
    request,
  );
  return unwrapApiResult(response.data, "Không thể cập nhật trạng thái bán của món.");
}

export function getMenuItemAvailabilityErrorMessage(
  error: unknown,
  fallbackMessage = "Không thể xử lý trạng thái món tại kiosk.",
): string {
  if (axios.isCancel(error)) return "";
  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    if (error.response?.status === 403) {
      return "Bạn không có quyền thay đổi trạng thái bán tại kiosk này.";
    }
    if (error.response?.status === 404) {
      return "Không tìm thấy kiosk hoặc món trong phạm vi được cấp quyền.";
    }
    if (error.response?.status === 409) {
      return "Trạng thái món vừa được người khác cập nhật. Hãy tải lại và thử lại.";
    }
    return getApiResultMessage(error.response?.data, fallbackMessage);
  }
  return error instanceof Error ? error.message : fallbackMessage;
}
