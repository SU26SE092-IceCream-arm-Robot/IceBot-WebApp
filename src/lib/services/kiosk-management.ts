import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  CreateKioskRequest,
  KioskResult,
  ManagementKiosksQuery,
} from "@/types/kiosk-management";

function requireData<T>(result: ApiResult<T>, fallbackMessage: string): T {
  if (!result.succeeded || result.data === undefined) {
    throw new Error(getApiResultMessage(result, fallbackMessage));
  }

  return result.data;
}

function getApiResultMessage(
  result: ApiResult<unknown> | undefined,
  fallbackMessage: string,
): string {
  if (!result) return fallbackMessage;
  const validationMessages = Object.values(result.validationErrors ?? {}).flat();
  return validationMessages.length > 0
    ? validationMessages.join(" ")
    : result.message || result.businessError || fallbackMessage;
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

  return requireData(response.data, "Không thể tải thông tin kiosk.");
}

export async function createManagementKiosk(
  storeId: string,
  request: CreateKioskRequest,
): Promise<KioskResult> {
  const response = await axiosClient.post<ApiResult<KioskResult>>(
    `/api/v1/management/stores/${encodeURIComponent(storeId)}/kiosks`,
    request,
  );

  return requireData(response.data, "Không thể tạo kiosk.");
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
      return "Tài khoản hiện tại không có quyền xem thông tin kiosk.";
    }

    return getApiResultMessage(error.response?.data, fallbackMessage);
  }

  return error instanceof Error ? error.message : fallbackMessage;
}
