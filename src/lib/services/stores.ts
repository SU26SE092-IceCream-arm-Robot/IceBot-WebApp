import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  ManagementStoresQuery,
  StoreResult,
} from "@/types/kiosk-management";
import type {
  CreateStoreRequest,
  UpdateStoreRequest,
} from "@/types/tenant-management";

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

function requireData<T>(result: ApiResult<T>, fallbackMessage: string): T {
  if (!result.succeeded || result.data === undefined) {
    throw new Error(getApiResultMessage(result, fallbackMessage));
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

export async function createManagementStore(
  organizationId: string,
  request: CreateStoreRequest,
): Promise<StoreResult> {
  const response = await axiosClient.post<ApiResult<StoreResult>>(
    `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/stores`,
    request,
  );
  return requireData(response.data, "Không thể tạo cửa hàng.");
}

export async function updateManagementStore(
  storeId: string,
  request: UpdateStoreRequest,
): Promise<StoreResult> {
  const response = await axiosClient.put<ApiResult<StoreResult>>(
    `/api/v1/management/stores/${encodeURIComponent(storeId)}`,
    request,
  );
  return requireData(response.data, "Không thể cập nhật cửa hàng.");
}

export async function setManagementStoreActive(
  storeId: string,
  active: boolean,
): Promise<boolean> {
  const action = active ? "activate" : "disable";
  const response = await axiosClient.patch<ApiResult<boolean>>(
    `/api/v1/management/stores/${encodeURIComponent(storeId)}/${action}`,
  );
  return requireData(
    response.data,
    active ? "Không thể kích hoạt cửa hàng." : "Không thể vô hiệu hóa cửa hàng.",
  );
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
      return "Tài khoản hiện tại không có quyền thực hiện thao tác này với cửa hàng.";
    }

    return getApiResultMessage(error.response?.data, fallbackMessage);
  }

  return error instanceof Error ? error.message : fallbackMessage;
}
