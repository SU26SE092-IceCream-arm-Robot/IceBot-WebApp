import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  ManagementRoleResult,
  PermissionMatrixResult,
  RoleScopeOptionsResult,
} from "@/types/accounts";

function requireData<T>(result: ApiResult<T>, fallbackMessage: string): T {
  if (!result.succeeded || !result.data) {
    throw new Error(result.message || fallbackMessage);
  }

  return result.data;
}

export async function getManagementRoles(
  signal?: AbortSignal
): Promise<ManagementRoleResult[]> {
  const response = await axiosClient.get<ApiResult<ManagementRoleResult[]>>(
    "/api/v1/management/roles",
    { signal }
  );

  return requireData(response.data, "Không thể tải danh sách vai trò.");
}

export async function getRoleScopeOptions(
  roleCode: string,
  signal?: AbortSignal
): Promise<RoleScopeOptionsResult> {
  const response = await axiosClient.get<ApiResult<RoleScopeOptionsResult>>(
    `/api/v1/management/role-scope-options?roleCode=${encodeURIComponent(roleCode)}`,
    { signal }
  );

  return requireData(response.data, "Không thể tải phạm vi cho vai trò.");
}

export async function getPermissionMatrix(
  signal?: AbortSignal
): Promise<PermissionMatrixResult> {
  const response = await axiosClient.get<ApiResult<PermissionMatrixResult>>(
    "/api/v1/management/permission-matrix",
    { signal }
  );

  return requireData(response.data, "Không thể tải ma trận phân quyền.");
}

export function getRolesErrorMessage(
  error: unknown,
  fallbackMessage = "Không thể tải dữ liệu vai trò."
): string {
  if (axios.isCancel(error)) {
    return "";
  }

  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    return error.response?.data?.message || fallbackMessage;
  }

  return error instanceof Error ? error.message : fallbackMessage;
}
