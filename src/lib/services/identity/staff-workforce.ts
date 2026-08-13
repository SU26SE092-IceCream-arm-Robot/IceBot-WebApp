import axios from "axios";

import axiosClient from "@/lib/axios-client";
import { getApiResultMessage, unwrapApiResult } from "@/lib/api/result";
import type { ApiResult } from "@/types";
import type {
  CreateStaffWorkforceRequest,
  StaffLifecycleRequest,
  StaffWorkforcePage,
  StaffWorkforceResult,
  StaffWorkforceStatusFilter,
  UpdateStaffWorkforceRequest,
  UpdateStaffWorkforceScopesRequest,
} from "@/types/identity/staff-workforce";

function workforcePath(organizationId: string): string {
  return `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/workforce/staff`;
}

export async function listStaffWorkforce(
  organizationId: string,
  query: {
    search?: string;
    status: StaffWorkforceStatusFilter;
    pageNumber: number;
    pageSize: number;
  },
  signal?: AbortSignal,
): Promise<StaffWorkforcePage> {
  const response = await axiosClient.get<StaffWorkforcePage>(workforcePath(organizationId), {
    params: {
      search: query.search?.trim() || undefined,
      status: query.status === "ALL" ? undefined : query.status,
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
    },
    signal,
  });

  if (!response.data.succeeded) {
    throw new Error(getApiResultMessage(response.data, "Không thể tải danh sách nhân viên."));
  }
  return response.data;
}

export async function getStaffWorkforce(
  organizationId: string,
  accountId: string,
  signal?: AbortSignal,
): Promise<StaffWorkforceResult> {
  const response = await axiosClient.get<ApiResult<StaffWorkforceResult>>(
    `${workforcePath(organizationId)}/${encodeURIComponent(accountId)}`,
    { signal },
  );
  return unwrapApiResult(response.data, "Không thể tải thông tin nhân viên.");
}

export async function createStaffWorkforce(
  organizationId: string,
  request: CreateStaffWorkforceRequest,
  idempotencyKey: string,
): Promise<StaffWorkforceResult> {
  const response = await axiosClient.post<ApiResult<StaffWorkforceResult>>(
    workforcePath(organizationId),
    request,
    { headers: { "Idempotency-Key": idempotencyKey } },
  );
  return unwrapApiResult(response.data, "Không thể tạo nhân viên.");
}

export async function updateStaffWorkforce(
  organizationId: string,
  accountId: string,
  request: UpdateStaffWorkforceRequest,
): Promise<StaffWorkforceResult> {
  const response = await axiosClient.put<ApiResult<StaffWorkforceResult>>(
    `${workforcePath(organizationId)}/${encodeURIComponent(accountId)}`,
    request,
  );
  return unwrapApiResult(response.data, "Không thể cập nhật nhân viên.");
}

export async function updateStaffWorkforceScopes(
  organizationId: string,
  accountId: string,
  request: UpdateStaffWorkforceScopesRequest,
): Promise<StaffWorkforceResult> {
  const response = await axiosClient.put<ApiResult<StaffWorkforceResult>>(
    `${workforcePath(organizationId)}/${encodeURIComponent(accountId)}/scopes`,
    request,
  );
  return unwrapApiResult(response.data, "Không thể cập nhật phạm vi nhân viên.");
}

export async function changeStaffWorkforceLifecycle(
  organizationId: string,
  accountId: string,
  action: "deactivate" | "reactivate",
  request: StaffLifecycleRequest,
): Promise<StaffWorkforceResult> {
  const response = await axiosClient.post<ApiResult<StaffWorkforceResult>>(
    `${workforcePath(organizationId)}/${encodeURIComponent(accountId)}/${action}`,
    request,
  );
  return unwrapApiResult(response.data, "Không thể cập nhật trạng thái nhân viên.");
}

export async function sendStaffWorkforceInvitation(
  organizationId: string,
  accountId: string,
  sendEmail: boolean,
): Promise<StaffWorkforceResult> {
  const response = await axiosClient.post<ApiResult<StaffWorkforceResult>>(
    `${workforcePath(organizationId)}/${encodeURIComponent(accountId)}/invitation`,
    undefined,
    { params: { sendEmail } },
  );
  return unwrapApiResult(response.data, "Không thể gửi lại lời mời.");
}

export function getStaffWorkforceErrorMessage(
  error: unknown,
  fallbackMessage = "Không thể xử lý dữ liệu nhân viên.",
): string {
  if (axios.isCancel(error)) return "";
  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    if (error.response?.status === 403) {
      return "Bạn không có quyền quản lý nhân viên trong phạm vi này.";
    }
    return getApiResultMessage(error.response?.data, fallbackMessage);
  }
  return error instanceof Error ? error.message : fallbackMessage;
}

