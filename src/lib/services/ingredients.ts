import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  CreateIngredientRequest,
  IngredientResult,
  IngredientsPagedResult,
  IngredientsQuery,
  UpdateIngredientRequest,
} from "@/types/ingredients";

function requireData<T>(result: ApiResult<T>, fallbackMessage: string): T {
  if (!result.succeeded || result.data === null || result.data === undefined) {
    throw new Error(result.message || result.businessError || fallbackMessage);
  }
  return result.data;
}

export async function listIngredients(
  query: IngredientsQuery,
  signal?: AbortSignal,
): Promise<IngredientsPagedResult> {
  const response = await axiosClient.get<IngredientsPagedResult>(
    "/api/v1/management/ingredients",
    {
      params: {
        search: query.search?.trim() || undefined,
        isActive: query.isActive,
        pageNumber: query.pageNumber,
        pageSize: query.pageSize,
      },
      signal,
    },
  );

  if (!response.data.succeeded) {
    throw new Error(response.data.message || "Không thể tải danh mục nguyên liệu.");
  }

  return response.data;
}

export async function createIngredient(
  request: CreateIngredientRequest,
): Promise<IngredientResult> {
  const response = await axiosClient.post<ApiResult<IngredientResult>>(
    "/api/v1/management/ingredients",
    request,
  );
  return requireData(response.data, "Không thể tạo nguyên liệu.");
}

export async function updateIngredient(
  ingredientId: string,
  request: UpdateIngredientRequest,
): Promise<IngredientResult> {
  const response = await axiosClient.put<ApiResult<IngredientResult>>(
    `/api/v1/management/ingredients/${encodeURIComponent(ingredientId)}`,
    request,
  );
  return requireData(response.data, "Không thể cập nhật nguyên liệu.");
}

export async function setIngredientStatus(
  ingredientId: string,
  isActive: boolean,
): Promise<IngredientResult> {
  const response = await axiosClient.patch<ApiResult<IngredientResult>>(
    `/api/v1/management/ingredients/${encodeURIComponent(ingredientId)}/status`,
    { isActive },
  );
  return requireData(response.data, "Không thể đổi trạng thái nguyên liệu.");
}

export async function deleteIngredient(ingredientId: string): Promise<void> {
  const response = await axiosClient.delete<ApiResult<unknown>>(
    `/api/v1/management/ingredients/${encodeURIComponent(ingredientId)}`,
  );
  if (!response.data.succeeded) {
    throw new Error(
      response.data.message ||
        response.data.businessError ||
        "Không thể xóa nguyên liệu.",
    );
  }
}

export function getIngredientsErrorMessage(
  error: unknown,
  fallbackMessage = "Không thể tải danh mục nguyên liệu.",
): string {
  if (axios.isCancel(error)) {
    return "";
  }

  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    if (error.response?.status === 403) {
      return "Tài khoản hiện tại không có quyền xem danh mục nguyên liệu.";
    }

    const result = error.response?.data;
    const validationMessages = Object.values(
      result?.validationErrors ?? {},
    ).flat();
    return (
      validationMessages.join(" ") ||
      result?.message ||
      result?.businessError ||
      fallbackMessage
    );
  }

  return error instanceof Error ? error.message : fallbackMessage;
}
