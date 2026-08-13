import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  KioskMenuItemAvailabilityResult,
  MenuItemOperationalAvailabilityState,
  SetKioskMenuItemAvailabilityRequest,
} from "@/types/operations/menu-availability";

function unwrap<T>(result: ApiResult<T>, fallback: string): T {
  if (!result.succeeded || result.data === undefined) {
    throw new Error(result.message || result.businessError || fallback);
  }

  return result.data;
}

export async function getKioskMenuItemAvailability(
  kioskId: string,
  query: { search?: string; state?: MenuItemOperationalAvailabilityState } = {},
  signal?: AbortSignal,
): Promise<KioskMenuItemAvailabilityResult[]> {
  const response = await axiosClient.get<ApiResult<KioskMenuItemAvailabilityResult[]>>(
    `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/menu-item-availability`,
    {
      params: {
        search: query.search?.trim() || undefined,
        state: query.state,
      },
      signal,
    },
  );
  return unwrap(response.data, "Không thể tải tình trạng bán món.");
}

export async function setKioskMenuItemAvailability(
  kioskId: string,
  menuItemId: string,
  request: SetKioskMenuItemAvailabilityRequest,
): Promise<KioskMenuItemAvailabilityResult> {
  const response = await axiosClient.put<ApiResult<KioskMenuItemAvailabilityResult>>(
    `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/menu-items/${encodeURIComponent(menuItemId)}/availability`,
    request,
  );
  return unwrap(response.data, "Không thể cập nhật tình trạng bán món.");
}

export function getMenuItemAvailabilityErrorMessage(error: unknown): string {
  if (axios.isCancel(error)) return "";
  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    return error.response?.data?.message || "Không thể cập nhật tình trạng bán món.";
  }
  return error instanceof Error ? error.message : "Không thể cập nhật tình trạng bán món.";
}
