import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  IngredientsPagedResult,
  IngredientsQuery,
} from "@/types/ingredients";

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
