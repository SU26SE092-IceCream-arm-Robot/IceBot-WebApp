import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  ManagementStoresQuery,
  StoreResult,
} from "@/types/kiosk-management";

function requireData<T>(result: ApiResult<T>, fallbackMessage: string): T {
  if (!result.succeeded || result.data === undefined) {
    throw new Error(result.message || fallbackMessage);
  }

  return result.data;
}

export async function getManagementStores(
  query: ManagementStoresQuery = {},
  signal?: AbortSignal,
): Promise<StoreResult[]> {
  const response = await axiosClient.get<ApiResult<StoreResult[]>>(
    "/api/v1/management/stores",
    {
      params: {
        organizationId: query.organizationId,
        status: query.status,
        search: query.search?.trim() || undefined,
      },
      signal,
    },
  );

  return requireData(response.data, "Không thể tải danh sách cửa hàng.");
}

export async function getManagementStoreById(
  storeId: string,
  signal?: AbortSignal,
): Promise<StoreResult> {
  const response = await axiosClient.get<ApiResult<StoreResult>>(
    `/api/v1/management/stores/${encodeURIComponent(storeId)}`,
    { signal },
  );

  return requireData(response.data, "Không thể tải thông tin cửa hàng.");
}

export function getStoresErrorMessage(
  error: unknown,
  fallbackMessage = "Không thể tải dữ liệu cửa hàng.",
): string {
  if (axios.isCancel(error)) {
    return "";
  }

  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    if (error.response?.status === 403) {
      return "Tài khoản hiện tại không có quyền xem dữ liệu cửa hàng.";
    }

    return error.response?.data?.message || fallbackMessage;
  }

  return error instanceof Error ? error.message : fallbackMessage;
}
