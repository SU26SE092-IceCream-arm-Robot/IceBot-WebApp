import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  MenuItemResult,
  MenuItemStatus,
  MenuManagementPagedResult,
  MenuManagementQuery,
  MenuResult,
  MenuStatus,
  ProductResult,
  ProductVariantResult,
} from "@/types/menu-management";

function requireData<T>(result: ApiResult<T>, fallbackMessage: string): T {
  if (!result.succeeded || !result.data) {
    throw new Error(result.message || fallbackMessage);
  }

  return result.data;
}

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

export async function getProductById(
  productId: string,
  signal?: AbortSignal
): Promise<ProductResult> {
  const response = await axiosClient.get<ApiResult<ProductResult>>(
    `/api/v1/management/products/${encodeURIComponent(productId)}`,
    { signal }
  );

  return requireData(response.data, "Không thể tải chi tiết sản phẩm.");
}

export async function setProductAvailability(
  productId: string,
  isAvailable: boolean
): Promise<ProductResult> {
  const response = await axiosClient.patch<ApiResult<ProductResult>>(
    `/api/v1/management/products/${encodeURIComponent(productId)}/availability`,
    { isAvailable }
  );

  return requireData(response.data, "Không thể cập nhật trạng thái sản phẩm.");
}

export async function setProductVariantAvailability(
  productId: string,
  variantId: string,
  isAvailable: boolean
): Promise<ProductVariantResult> {
  const response = await axiosClient.patch<ApiResult<ProductVariantResult>>(
    `/api/v1/management/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/availability`,
    { isAvailable }
  );

  return requireData(response.data, "Không thể cập nhật trạng thái biến thể.");
}

export async function getMenuById(
  menuId: string,
  signal?: AbortSignal
): Promise<MenuResult> {
  const response = await axiosClient.get<ApiResult<MenuResult>>(
    `/api/v1/management/menus/${encodeURIComponent(menuId)}`,
    { signal }
  );

  return requireData(response.data, "Không thể tải chi tiết thực đơn.");
}

export async function setMenuStatus(
  menuId: string,
  status: MenuStatus
): Promise<MenuResult> {
  const response = await axiosClient.patch<ApiResult<MenuResult>>(
    `/api/v1/management/menus/${encodeURIComponent(menuId)}/status`,
    { status }
  );

  return requireData(response.data, "Không thể cập nhật trạng thái thực đơn.");
}

export async function setMenuItemStatus(
  menuId: string,
  menuItemId: string,
  status: MenuItemStatus
): Promise<MenuItemResult> {
  const response = await axiosClient.patch<ApiResult<MenuItemResult>>(
    `/api/v1/management/menus/${encodeURIComponent(menuId)}/items/${encodeURIComponent(menuItemId)}/status`,
    { status }
  );

  return requireData(response.data, "Không thể cập nhật trạng thái món.");
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
