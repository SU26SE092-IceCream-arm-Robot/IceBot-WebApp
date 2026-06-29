import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  CreateOrganizationRequest,
  OrganizationPagedResult,
  OrganizationResult,
  OrganizationsQuery,
  UpdateOrganizationRequest,
} from "@/types/tenant-management";

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
  if (!result.succeeded || result.data === undefined || result.data === null) {
    throw new Error(getApiResultMessage(result, fallbackMessage));
  }
  return result.data;
}

export async function listManagementOrganizations(
  query: OrganizationsQuery,
  signal?: AbortSignal,
): Promise<OrganizationPagedResult> {
  const response = await axiosClient.get<OrganizationPagedResult>(
    "/api/v1/management/organizations",
    {
      params: {
        search: query.search?.trim() || undefined,
        status: query.status,
        pageNumber: query.pageNumber,
        pageSize: query.pageSize,
      },
      signal,
    },
  );

  if (!response.data.succeeded) {
    throw new Error(
      getApiResultMessage(response.data, "Không thể tải danh sách tổ chức."),
    );
  }
  return response.data;
}

export async function getManagementOrganizationById(
  organizationId: string,
  signal?: AbortSignal,
): Promise<OrganizationResult> {
  const response = await axiosClient.get<ApiResult<OrganizationResult>>(
    `/api/v1/management/organizations/${encodeURIComponent(organizationId)}`,
    { signal },
  );
  return requireData(response.data, "Không thể tải thông tin tổ chức.");
}

export async function createManagementOrganization(
  request: CreateOrganizationRequest,
): Promise<OrganizationResult> {
  const response = await axiosClient.post<ApiResult<OrganizationResult>>(
    "/api/v1/management/organizations",
    request,
  );
  return requireData(response.data, "Không thể tạo tổ chức.");
}

export async function updateManagementOrganization(
  organizationId: string,
  request: UpdateOrganizationRequest,
): Promise<OrganizationResult> {
  const response = await axiosClient.put<ApiResult<OrganizationResult>>(
    `/api/v1/management/organizations/${encodeURIComponent(organizationId)}`,
    request,
  );
  return requireData(response.data, "Không thể cập nhật tổ chức.");
}

export async function setManagementOrganizationActive(
  organizationId: string,
  active: boolean,
): Promise<OrganizationResult> {
  const action = active ? "activate" : "disable";
  const response = await axiosClient.patch<ApiResult<OrganizationResult>>(
    `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/${action}`,
  );
  return requireData(
    response.data,
    active ? "Không thể kích hoạt tổ chức." : "Không thể vô hiệu hóa tổ chức.",
  );
}

export function getOrganizationsErrorMessage(
  error: unknown,
  fallbackMessage = "Không thể xử lý dữ liệu tổ chức.",
): string {
  if (axios.isCancel(error)) return "";
  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    if (error.response?.status === 403) {
      return "Tài khoản hiện tại không có quyền thực hiện thao tác này với tổ chức.";
    }
    return getApiResultMessage(error.response?.data, fallbackMessage);
  }
  return error instanceof Error ? error.message : fallbackMessage;
}
