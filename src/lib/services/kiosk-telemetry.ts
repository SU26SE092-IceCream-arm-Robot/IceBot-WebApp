import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  KioskDeviceEventResult,
  KioskHeartbeatResult,
  KioskTelemetryPage,
  KioskTelemetryPagination,
} from "@/types/kiosk-detail";

interface PagedApiResult<T> extends ApiResult<T[]> {
  pagination: KioskTelemetryPagination;
}

interface KioskTelemetryQuery {
  pageNumber?: number;
  pageSize?: number;
  from?: string;
  to?: string;
}

function requirePage<T>(
  result: PagedApiResult<T>,
  fallbackMessage: string,
): KioskTelemetryPage<T> {
  if (!result.succeeded || !result.data) {
    throw new Error(result.message || fallbackMessage);
  }

  return {
    data: result.data,
    pagination: result.pagination,
  };
}

export async function listKioskHeartbeats(
  kioskId: string,
  query: KioskTelemetryQuery = {},
  signal?: AbortSignal,
): Promise<KioskTelemetryPage<KioskHeartbeatResult>> {
  const response = await axiosClient.get<PagedApiResult<KioskHeartbeatResult>>(
    `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/heartbeats`,
    {
      params: {
        pageNumber: query.pageNumber ?? 1,
        pageSize: query.pageSize ?? 20,
        from: query.from,
        to: query.to,
      },
      signal,
    },
  );

  return requirePage(response.data, "Không thể tải dữ liệu heartbeat.");
}

export async function listKioskEvents(
  kioskId: string,
  query: KioskTelemetryQuery = {},
  signal?: AbortSignal,
): Promise<KioskTelemetryPage<KioskDeviceEventResult>> {
  const response = await axiosClient.get<PagedApiResult<KioskDeviceEventResult>>(
    `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/events`,
    {
      params: {
        pageNumber: query.pageNumber ?? 1,
        pageSize: query.pageSize ?? 20,
        from: query.from,
        to: query.to,
      },
      signal,
    },
  );

  return requirePage(response.data, "Không thể tải sự kiện kiosk.");
}

export function getKioskTelemetryErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (axios.isCancel(error)) {
    return "";
  }

  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    if (error.response?.status === 403) {
      return "Tài khoản hiện tại không có quyền xem dữ liệu vận hành kiosk.";
    }

    return error.response?.data?.message || fallbackMessage;
  }

  return error instanceof Error ? error.message : fallbackMessage;
}
