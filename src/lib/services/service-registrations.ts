import axios, { type AxiosResponse } from "axios";

import axiosClient from "@/lib/axios-client";
import { getApiResultMessage } from "@/lib/api/result";
import type { ApiResult } from "@/types";
import type {
  ApproveServiceRegistrationRequest,
  CreateServiceRegistrationRequest,
  ManagementServiceRegistrationDetail,
  ManagementServiceRegistrationsQuery,
  RejectServiceRegistrationRequest,
  ServiceRegistrationsPagedResult,
  ServiceRegistrationResult,
  StartReviewServiceRegistrationRequest,
  RetryProvisioningServiceRegistrationRequest,
} from "@/types/service-registrations";

function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `sr-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function extractResult<T>(response: AxiosResponse<unknown>, fallbackMessage: string): T {
  const data = response.data as Record<string, unknown> | undefined;
  if (data && typeof data === "object") {
    if ("succeeded" in data) {
      const apiResult = data as unknown as ApiResult<T>;
      if (!apiResult.succeeded || apiResult.data === undefined || apiResult.data === null) {
        throw new Error(getApiResultMessage(apiResult, fallbackMessage));
      }
      return apiResult.data;
    }
    return data as unknown as T;
  }
  throw new Error("Phản hồi từ máy chủ không hợp lệ.");
}

// ---------------------------------------------------------------------------
// Public Service Registration (Landing Page)
// ---------------------------------------------------------------------------

export async function submitServiceRegistration(
  request: CreateServiceRegistrationRequest,
  idempotencyKey?: string,
): Promise<ServiceRegistrationResult> {
  const key = idempotencyKey?.trim() || generateIdempotencyKey();
  const response = await axiosClient.post<unknown>(
    "/api/v1/service-registrations",
    request,
    {
      headers: {
        "Idempotency-Key": key,
      },
    },
  );

  return extractResult<ServiceRegistrationResult>(
    response,
    "Không thể gửi yêu cầu đăng ký dịch vụ.",
  );
}

// ---------------------------------------------------------------------------
// SystemAdmin Management APIs
// ---------------------------------------------------------------------------

const MANAGEMENT_COLLECTION_PATH = "/api/v1/management/service-registrations";

export async function listManagementServiceRegistrations(
  query: ManagementServiceRegistrationsQuery = {},
  signal?: AbortSignal,
): Promise<ServiceRegistrationsPagedResult> {
  const response = await axiosClient.get<ServiceRegistrationsPagedResult>(
    MANAGEMENT_COLLECTION_PATH,
    {
      params: {
        status: query.status && query.status !== "ALL" ? query.status : undefined,
        search: query.search?.trim() || undefined,
        createdFrom: query.createdFrom || undefined,
        createdTo: query.createdTo || undefined,
        pageNumber: query.pageNumber || 1,
        pageSize: query.pageSize || 20,
      },
      signal,
    },
  );

  if (response.data && typeof response.data === "object" && "succeeded" in response.data) {
    if (!response.data.succeeded) {
      throw new Error(
        getApiResultMessage(response.data, "Không thể tải danh sách đơn đăng ký."),
      );
    }
    return response.data;
  }

  return response.data;
}

export async function getManagementServiceRegistration(
  id: string,
  signal?: AbortSignal,
): Promise<ManagementServiceRegistrationDetail> {
  const response = await axiosClient.get<unknown>(
    `${MANAGEMENT_COLLECTION_PATH}/${encodeURIComponent(id)}`,
    { signal },
  );

  return extractResult<ManagementServiceRegistrationDetail>(
    response,
    "Không thể tải thông tin chi tiết đơn đăng ký.",
  );
}

export async function startReviewServiceRegistration(
  id: string,
  expectedRevision?: number,
): Promise<ManagementServiceRegistrationDetail> {
  const payload: StartReviewServiceRegistrationRequest =
    expectedRevision !== undefined ? { expectedRevision } : {};

  const response = await axiosClient.post<unknown>(
    `${MANAGEMENT_COLLECTION_PATH}/${encodeURIComponent(id)}/start-review`,
    payload,
  );

  return extractResult<ManagementServiceRegistrationDetail>(
    response,
    "Không thể bắt đầu rà soát đơn đăng ký.",
  );
}

export async function approveServiceRegistration(
  id: string,
  request: ApproveServiceRegistrationRequest,
): Promise<ManagementServiceRegistrationDetail> {
  const response = await axiosClient.post<unknown>(
    `${MANAGEMENT_COLLECTION_PATH}/${encodeURIComponent(id)}/approve`,
    request,
  );

  return extractResult<ManagementServiceRegistrationDetail>(
    response,
    "Không thể phê duyệt đơn đăng ký dịch vụ.",
  );
}

export async function rejectServiceRegistration(
  id: string,
  request: RejectServiceRegistrationRequest,
): Promise<ManagementServiceRegistrationDetail> {
  const response = await axiosClient.post<unknown>(
    `${MANAGEMENT_COLLECTION_PATH}/${encodeURIComponent(id)}/reject`,
    request,
  );

  return extractResult<ManagementServiceRegistrationDetail>(
    response,
    "Không thể từ chối đơn đăng ký dịch vụ.",
  );
}

export async function retryProvisioningServiceRegistration(
  id: string,
  expectedRevision?: number,
): Promise<ManagementServiceRegistrationDetail> {
  const payload: RetryProvisioningServiceRegistrationRequest =
    expectedRevision !== undefined ? { expectedRevision } : {};

  const response = await axiosClient.post<unknown>(
    `${MANAGEMENT_COLLECTION_PATH}/${encodeURIComponent(id)}/retry-provisioning`,
    payload,
  );

  return extractResult<ManagementServiceRegistrationDetail>(
    response,
    "Không thể thử lại quy trình cấp phát.",
  );
}

export function getServiceRegistrationErrorMessage(
  error: unknown,
  fallbackMessage = "Thao tác không thành công. Vui lòng thử lại sau.",
): string {
  if (axios.isCancel(error)) return "";
  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    const responseData = error.response?.data;
    if (responseData && typeof responseData === "object") {
      if (responseData.validationErrors) {
        const messages = Object.values(responseData.validationErrors).flat();
        if (messages.length > 0) return messages.join(" ");
      }
      if (responseData.message) return responseData.message;
      if (responseData.businessError) return responseData.businessError;
      if (responseData.systemError) return responseData.systemError;
    }
    if (error.response?.status === 400) return "Dữ liệu yêu cầu không hợp lệ. Vui lòng kiểm tra lại.";
    if (error.response?.status === 403) return "Bạn không có quyền thực hiện thao tác quản trị này.";
    if (error.response?.status === 404) return "Không tìm thấy đơn đăng ký dịch vụ.";
    if (error.response?.status === 409) {
      return "Đơn đăng ký đã bị thay đổi bởi quản trị viên khác. Vui lòng làm mới để cập nhật.";
    }
    if (error.response?.status === 500) return "Máy chủ gặp sự cố khi xử lý yêu cầu. Vui lòng thử lại.";
  }
  return error instanceof Error ? error.message : fallbackMessage;
}
