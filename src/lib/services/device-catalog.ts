import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  DeviceModelResult,
  DeviceModelsQuery,
  DeviceTypeResult,
  DeviceTypesQuery,
} from "@/types/device-catalog";

function requireData<T>(result: ApiResult<T>, fallbackMessage: string): T {
  if (!result.succeeded || result.data === null || result.data === undefined) {
    throw new Error(result.message || result.businessError || fallbackMessage);
  }
  return result.data;
}

export async function listDeviceTypes(
  query: DeviceTypesQuery,
  signal?: AbortSignal,
): Promise<DeviceTypeResult[]> {
  const response = await axiosClient.get<ApiResult<DeviceTypeResult[]>>(
    "/api/v1/management/device-types",
    {
      params: {
        search: query.search?.trim() || undefined,
        isActive: query.isActive,
      },
      signal,
    },
  );

  return requireData(response.data, "Không thể tải danh mục loại thiết bị.");
}

export async function listDeviceModels(
  deviceTypeId: number,
  query: DeviceModelsQuery,
  signal?: AbortSignal,
): Promise<DeviceModelResult[]> {
  const response = await axiosClient.get<ApiResult<DeviceModelResult[]>>(
    `/api/v1/management/device-types/${deviceTypeId}/models`,
    {
      params: { search: query.search?.trim() || undefined },
      signal,
    },
  );

  return requireData(response.data, "Không thể tải danh mục model thiết bị.");
}

export function getDeviceCatalogErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (axios.isCancel(error)) return "";

  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    if (error.response?.status === 403) {
      return "Tài khoản hiện tại không có quyền xem danh mục thiết bị.";
    }
    const result = error.response?.data;
    return result?.message || result?.businessError || fallbackMessage;
  }

  return error instanceof Error ? error.message : fallbackMessage;
}
