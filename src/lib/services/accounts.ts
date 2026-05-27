import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  InternalAccountResult,
  ManagementAccountsQuery,
  PagedResult,
} from "@/types/accounts";

export async function listManagementAccounts(
  query: ManagementAccountsQuery,
  signal?: AbortSignal
): Promise<PagedResult<InternalAccountResult>> {
  const response = await axiosClient.get<PagedResult<InternalAccountResult>>(
    "/api/v1/management/accounts",
    {
      params: {
        search: query.searchTerm.trim() || undefined,
        status: query.status === "ALL" ? undefined : query.status,
        pageNumber: query.pageNumber,
        pageSize: query.pageSize,
      },
      signal,
    }
  );

  if (!response.data.succeeded) {
    throw new Error(response.data.message || "Không thể tải danh sách tài khoản.");
  }

  return response.data;
}

export function getAccountsErrorMessage(error: unknown): string {
  if (axios.isCancel(error)) {
    return "";
  }

  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    if (error.response?.status === 403) {
      return "Tài khoản hiện tại không có quyền quản lý người dùng.";
    }

    return error.response?.data?.message || "Không thể tải danh sách tài khoản.";
  }

  return error instanceof Error ? error.message : "Không thể tải danh sách tài khoản.";
}
