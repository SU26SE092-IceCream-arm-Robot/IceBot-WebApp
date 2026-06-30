import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  CreateMenuRequest,
  CreateMenuItemRequest,
  CreateProductRequest,
  MenuItemResult,
  MenuItemStatus,
  MenuManagementPagedResult,
  MenuManagementQuery,
  MenuResult,
  MenuStatus,
  ProductResult,
  ProductVariantResult,
  UpdateMenuRequest,
  UpdateMenuItemRequest,
  UpdateProductRequest,
  UpdateProductVariantRequest,
  UpsertProductVariantRequest,
} from "@/types/menu-management";

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
  if (!result.succeeded || !result.data) {
    throw new Error(getApiResultMessage(result, fallbackMessage));
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

export async function createManagementProduct(
  request: CreateProductRequest,
): Promise<ProductResult> {
  const response = await axiosClient.post<ApiResult<ProductResult>>(
    "/api/v1/management/products",
    request,
  );
  return requireData(response.data, "Không thể tạo sản phẩm.");
}

export async function updateManagementProduct(
  productId: string,
  request: UpdateProductRequest,
): Promise<ProductResult> {
  const response = await axiosClient.put<ApiResult<ProductResult>>(
    `/api/v1/management/products/${encodeURIComponent(productId)}`,
    request,
  );
  return requireData(response.data, "Không thể cập nhật sản phẩm.");
}

export async function deleteManagementProduct(productId: string): Promise<boolean> {
  const response = await axiosClient.delete<ApiResult<boolean>>(
    `/api/v1/management/products/${encodeURIComponent(productId)}`,
  );
  return requireData(response.data, "Không thể xóa sản phẩm.");
}

export async function createManagementProductVariant(
  productId: string,
  request: UpsertProductVariantRequest,
): Promise<ProductVariantResult> {
  const response = await axiosClient.post<ApiResult<ProductVariantResult>>(
    `/api/v1/management/products/${encodeURIComponent(productId)}/variants`,
    request,
  );
  return requireData(response.data, "Không thể tạo biến thể sản phẩm.");
}

export async function updateManagementProductVariant(
  productId: string,
  variantId: string,
  request: UpdateProductVariantRequest,
): Promise<ProductVariantResult> {
  const response = await axiosClient.put<ApiResult<ProductVariantResult>>(
    `/api/v1/management/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`,
    request,
  );
  return requireData(response.data, "Không thể cập nhật biến thể sản phẩm.");
}

export async function deleteManagementProductVariant(
  productId: string,
  variantId: string,
): Promise<boolean> {
  const response = await axiosClient.delete<ApiResult<boolean>>(
    `/api/v1/management/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`,
  );
  return requireData(response.data, "Không thể xóa biến thể sản phẩm.");
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

export async function createManagementMenu(
  request: CreateMenuRequest,
): Promise<MenuResult> {
  const response = await axiosClient.post<ApiResult<MenuResult>>(
    "/api/v1/management/menus",
    request,
  );
  return requireData(response.data, "Không thể tạo thực đơn.");
}

export async function updateManagementMenu(
  menuId: string,
  request: UpdateMenuRequest,
): Promise<MenuResult> {
  const response = await axiosClient.put<ApiResult<MenuResult>>(
    `/api/v1/management/menus/${encodeURIComponent(menuId)}`,
    request,
  );
  return requireData(response.data, "Không thể cập nhật thực đơn.");
}

export async function deleteManagementMenu(menuId: string): Promise<boolean> {
  const response = await axiosClient.delete<ApiResult<boolean>>(
    `/api/v1/management/menus/${encodeURIComponent(menuId)}`,
  );
  return requireData(response.data, "Không thể xóa thực đơn.");
}

export async function createManagementMenuItem(
  menuId: string,
  request: CreateMenuItemRequest,
): Promise<MenuItemResult> {
  const response = await axiosClient.post<ApiResult<MenuItemResult>>(
    `/api/v1/management/menus/${encodeURIComponent(menuId)}/items`,
    request,
  );
  return requireData(response.data, "Không thể thêm món vào thực đơn.");
}

export async function updateManagementMenuItem(
  menuId: string,
  menuItemId: string,
  request: UpdateMenuItemRequest,
): Promise<MenuItemResult> {
  const response = await axiosClient.put<ApiResult<MenuItemResult>>(
    `/api/v1/management/menus/${encodeURIComponent(menuId)}/items/${encodeURIComponent(menuItemId)}`,
    request,
  );
  return requireData(response.data, "Không thể cập nhật món trong thực đơn.");
}

export async function deleteManagementMenuItem(
  menuId: string,
  menuItemId: string,
): Promise<boolean> {
  const response = await axiosClient.delete<ApiResult<boolean>>(
    `/api/v1/management/menus/${encodeURIComponent(menuId)}/items/${encodeURIComponent(menuItemId)}`,
  );
  return requireData(response.data, "Không thể xóa món khỏi thực đơn.");
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
      return "Tài khoản hiện tại không có quyền truy cập hoặc quản lý danh mục và thực đơn.";
    }

    return getApiResultMessage(
      error.response?.data,
      `Không thể tải ${resourceName}.`,
    );
  }

  return error instanceof Error ? error.message : `Không thể tải ${resourceName}.`;
}
