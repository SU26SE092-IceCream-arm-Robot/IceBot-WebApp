import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  AlertResult,
  AlertsListQuery,
  AlertsPagedResult,
  ResolveAlertRequest,
} from "@/types/alerts";

function getApiResultMessage(
  result: ApiResult<unknown> | undefined,
  fallbackMessage: string,
): string {
  if (!result) {
    return fallbackMessage;
  }

  const validationMessages = Object.values(result.validationErrors ?? {}).flat();
  if (validationMessages.length > 0) {
    return validationMessages.join(" ");
  }

  return result.message || result.businessError || fallbackMessage;
}

function requireData<T>(result: ApiResult<T>, fallbackMessage: string): T {
  if (!result.succeeded || !result.data) {
    throw new Error(getApiResultMessage(result, fallbackMessage));
  }

  return result.data;
}

function requirePagedData(
  result: AlertsPagedResult,
  fallbackMessage: string,
): AlertsPagedResult {
  if (!result.succeeded) {
    throw new Error(result.message || fallbackMessage);
  }

  return result;
}

export async function listAlerts(
  query: AlertsListQuery,
  signal?: AbortSignal,
): Promise<AlertsPagedResult> {
  const response = await axiosClient.get<AlertsPagedResult>(
    "/api/v1/management/alerts",
    {
      params: {
        status: query.status === "ALL" ? undefined : query.status,
        severity: query.severity === "ALL" ? undefined : query.severity,
        organizationId: query.organizationId,
        storeId: query.storeId,
        kioskId: query.kioskId,
        from: query.from,
        to: query.to,
        pageNumber: query.pageNumber,
        pageSize: query.pageSize,
      },
      signal,
    },
  );

  return requirePagedData(response.data, "Không thể tải danh sách cảnh báo.");
}

export async function getAlertById(
  alertId: string,
  signal?: AbortSignal,
): Promise<AlertResult> {
  const response = await axiosClient.get<ApiResult<AlertResult>>(
    `/api/v1/management/alerts/${encodeURIComponent(alertId)}`,
    { signal },
  );

  return requireData(response.data, "Không thể tải chi tiết cảnh báo.");
}

export async function acknowledgeAlert(alertId: string): Promise<AlertResult> {
  const response = await axiosClient.patch<ApiResult<AlertResult>>(
    `/api/v1/management/alerts/${encodeURIComponent(alertId)}/acknowledge`,
  );

  return requireData(response.data, "Không thể xác nhận cảnh báo.");
}

export async function resolveAlert(
  alertId: string,
  request: ResolveAlertRequest,
): Promise<AlertResult> {
  const response = await axiosClient.patch<ApiResult<AlertResult>>(
    `/api/v1/management/alerts/${encodeURIComponent(alertId)}/resolve`,
    request,
  );

  return requireData(response.data, "Không thể đánh dấu xử lý cảnh báo.");
}

export function getAlertErrorMessage(
  error: unknown,
  fallbackMessage = "Đã có lỗi xảy ra với cảnh báo.",
): string {
  if (axios.isCancel(error)) {
    return "";
  }

  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    if (error.response?.status === 403) {
      return "Tài khoản hiện tại không có quyền thao tác với cảnh báo.";
    }

    if (error.response?.data) {
      return getApiResultMessage(error.response.data, fallbackMessage);
    }
  }

  return error instanceof Error ? error.message : fallbackMessage;
}
