import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  KioskResult,
  ManagementKiosksQuery,
} from "@/types/kiosk-management";

function requireData<T>(result: ApiResult<T>, fallbackMessage: string): T {
  if (!result.succeeded || result.data === undefined) {
    throw new Error(result.message || fallbackMessage);
  }

  return result.data;
}

export async function getManagementKiosks(
  query: ManagementKiosksQuery = {},
  signal?: AbortSignal,
): Promise<KioskResult[]> {
  const response = await axiosClient.get<ApiResult<KioskResult[]>>(
    "/api/v1/management/kiosks",
    {
      params: {
        organizationId: query.organizationId,
        storeId: query.storeId,
        status: query.status,
        search: query.search?.trim() || undefined,
      },
      signal,
    },
  );

  return requireData(response.data, "Không thể tải danh sách kiosk quản lý.");
}

export async function getManagementKioskById(
  kioskId: string,
  signal?: AbortSignal,
): Promise<KioskResult> {
  const response = await axiosClient.get<ApiResult<KioskResult>>(
    `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}`,
    { signal },
  );

  return requireData(response.data, "Không thể tải metadata kiosk.");
}

export function getKioskManagementErrorMessage(
  error: unknown,
  fallbackMessage = "Không thể tải dữ liệu kiosk quản lý.",
): string {
  if (axios.isCancel(error)) {
    return "";
  }

  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    if (error.response?.status === 403) {
      return "Tài khoản hiện tại không có quyền xem metadata kiosk.";
    }

    return error.response?.data?.message || fallbackMessage;
  }

  return error instanceof Error ? error.message : fallbackMessage;
}
