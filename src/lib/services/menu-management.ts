import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  MenuManagementPagedResult,
  MenuManagementQuery,
  MenuResult,
  ProductResult,
} from "@/types/menu-management";

function buildListParams(query: MenuManagementQuery) {
  return {
    search: query.searchTerm.trim() || undefined,
    pageNumber: query.pageNumber,
    pageSize: query.pageSize,
  };
}

export async function listManagementProducts(
  query: MenuManagementQuery,
  signal?: AbortSignal
): Promise<MenuManagementPagedResult<ProductResult>> {
  const response = await axiosClient.get<MenuManagementPagedResult<ProductResult>>(
    "/api/v1/management/products",
    {
      params: buildListParams(query),
      signal,
    }
  );

  if (!response.data.succeeded) {
    throw new Error(response.data.message || "Không thể tải danh mục sản phẩm.");
  }

  return response.data;
}

export async function listManagementMenus(
  query: MenuManagementQuery,
  signal?: AbortSignal
): Promise<MenuManagementPagedResult<MenuResult>> {
  const response = await axiosClient.get<MenuManagementPagedResult<MenuResult>>(
    "/api/v1/management/menus",
    {
      params: buildListParams(query),
      signal,
    }
  );

  if (!response.data.succeeded) {
    throw new Error(response.data.message || "Không thể tải danh sách thực đơn.");
  }

  return response.data;
}

export function getMenuManagementErrorMessage(error: unknown, resourceName: string): string {
  if (axios.isCancel(error)) {
    return "";
  }

  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    if (error.response?.status === 403) {
      return "Tài khoản hiện tại không có quyền xem danh mục và thực đơn.";
    }

    return error.response?.data?.message || `Không thể tải ${resourceName}.`;
  }

  return error instanceof Error ? error.message : `Không thể tải ${resourceName}.`;
}
