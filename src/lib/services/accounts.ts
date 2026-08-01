import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  AcceptInvitationRequest,
  AcceptInvitationResult,
  AccountInvitationResult,
  AccountRolesAssignmentRequest,
  CreateAccountInvitationRequest,
  CreateInternalAccountRequest,
  EffectiveAccessResult,
  InternalAccountResult,
  ManagementAccountsQuery,
  PagedResult,
  ResetPasswordRequest,
} from "@/types/accounts";

function requireData<T>(result: ApiResult<T>, fallbackMessage: string): T {
  if (!result.succeeded || !result.data) {
    throw new Error(result.message || fallbackMessage);
  }

  return result.data;
}

function accountsPath(organizationId: string): string {
  return `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/accounts`;
}

export async function listManagementAccounts(
  organizationId: string,
  query: ManagementAccountsQuery,
  signal?: AbortSignal
): Promise<PagedResult<InternalAccountResult>> {
  const response = await axiosClient.get<PagedResult<InternalAccountResult>>(
    accountsPath(organizationId),
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
  organizationId: string,
  accountId: string,
  signal?: AbortSignal
): Promise<InternalAccountResult> {
  const response = await axiosClient.get<ApiResult<InternalAccountResult>>(
    `${accountsPath(organizationId)}/${encodeURIComponent(accountId)}`,
    { signal }
  );

  return requireData(response.data, "Không thể tải chi tiết tài khoản.");
}

export async function disableAccount(
  organizationId: string,
  accountId: string
): Promise<InternalAccountResult> {
  const response = await axiosClient.patch<ApiResult<InternalAccountResult>>(
    `${accountsPath(organizationId)}/${encodeURIComponent(accountId)}/disable`
  );

  return requireData(response.data, "Không thể vô hiệu hóa tài khoản.");
}

export async function createAccount(
  organizationId: string,
  request: CreateInternalAccountRequest
): Promise<InternalAccountResult> {
  const response = await axiosClient.post<ApiResult<InternalAccountResult>>(
    accountsPath(organizationId),
    request
  );

  return requireData(response.data, "Không thể tạo tài khoản.");
}

export async function regenerateInvitation(
  organizationId: string,
  accountId: string,
  sendEmail: boolean
): Promise<AccountInvitationResult> {
  const request: CreateAccountInvitationRequest = { sendEmail };
  const response = await axiosClient.post<ApiResult<AccountInvitationResult>>(
    `${accountsPath(organizationId)}/${encodeURIComponent(accountId)}/invitation`,
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

export async function resetAccountPassword(
  organizationId: string,
  accountId: string,
  request: ResetPasswordRequest
): Promise<void> {
  const response = await axiosClient.put<ApiResult<void>>(
    `${accountsPath(organizationId)}/${encodeURIComponent(accountId)}/password`,
    request
  );

  requireData(response.data, "Không thể đặt lại mật khẩu.");
}

export async function getEffectiveAccess(
  organizationId: string,
  accountId: string,
  signal?: AbortSignal
): Promise<EffectiveAccessResult> {
  const response = await axiosClient.get<ApiResult<EffectiveAccessResult>>(
    `${accountsPath(organizationId)}/${encodeURIComponent(accountId)}/effective-access`,
    { signal }
  );

  return requireData(response.data, "Không thể tải quyền hạn thực tế.");
}

export async function assignAccountRoles(
  organizationId: string,
  accountId: string,
  request: AccountRolesAssignmentRequest
): Promise<InternalAccountResult> {
  const response = await axiosClient.put<ApiResult<InternalAccountResult>>(
    `${accountsPath(organizationId)}/${encodeURIComponent(accountId)}/roles`,
    request
  );

  return requireData(response.data, "Không thể cập nhật vai trò.");
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
