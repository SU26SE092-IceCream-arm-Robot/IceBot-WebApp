import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  AcceptInvitationRequest,
  AcceptInvitationResult,
  AccountInvitationResult,
  CreateAccountInvitationRequest,
  CreateInternalAccountRequest,
  InternalAccountResult,
  ManagementAccountsQuery,
  PagedResult,
} from "@/types/accounts";

function requireData<T>(result: ApiResult<T>, fallbackMessage: string): T {
  if (!result.succeeded || !result.data) {
    throw new Error(result.message || fallbackMessage);
  }

  return result.data;
}

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

export async function getAccountById(
  accountId: string,
  signal?: AbortSignal
): Promise<InternalAccountResult> {
  const response = await axiosClient.get<ApiResult<InternalAccountResult>>(
    `/api/v1/management/accounts/${encodeURIComponent(accountId)}`,
    { signal }
  );

  return requireData(response.data, "Không thể tải chi tiết tài khoản.");
}

export async function disableAccount(accountId: string): Promise<InternalAccountResult> {
  const response = await axiosClient.patch<ApiResult<InternalAccountResult>>(
    `/api/v1/management/accounts/${encodeURIComponent(accountId)}/disable`
  );

  return requireData(response.data, "Không thể vô hiệu hóa tài khoản.");
}

export async function createAccount(
  request: CreateInternalAccountRequest
): Promise<InternalAccountResult> {
  const response = await axiosClient.post<ApiResult<InternalAccountResult>>(
    "/api/v1/management/accounts",
    request
  );

  return requireData(response.data, "Không thể tạo tài khoản.");
}

export async function regenerateInvitation(
  accountId: string,
  sendEmail: boolean
): Promise<AccountInvitationResult> {
  const request: CreateAccountInvitationRequest = { sendEmail };
  const response = await axiosClient.post<ApiResult<AccountInvitationResult>>(
    `/api/v1/management/accounts/${encodeURIComponent(accountId)}/invitation`,
    request
  );

  return requireData(response.data, "Không thể tạo lại lời mời.");
}

export async function acceptInvitation(
  request: AcceptInvitationRequest
): Promise<AcceptInvitationResult> {
  const response = await axiosClient.post<ApiResult<AcceptInvitationResult>>(
    "/api/v1/authentication/accept-invitation",
    request
  );

  return requireData(response.data, "Không thể chấp nhận lời mời.");
}

export function getAccountsErrorMessage(
  error: unknown,
  fallbackMessage = "Không thể tải danh sách tài khoản."
): string {
  if (axios.isCancel(error)) {
    return "";
  }

  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    if (error.response?.status === 403) {
      return "Tài khoản hiện tại không có quyền quản lý người dùng.";
    }

    return error.response?.data?.message || fallbackMessage;
  }

  return error instanceof Error ? error.message : fallbackMessage;
}

export function getInvitationErrorMessage(
  error: unknown,
  fallbackMessage = "Không thể xử lý lời mời."
): string {
  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    return error.response?.data?.message || fallbackMessage;
  }

  return error instanceof Error ? error.message : fallbackMessage;
}
