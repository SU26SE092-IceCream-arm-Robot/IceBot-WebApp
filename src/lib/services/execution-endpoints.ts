import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  CreateExecutionEndpointRequest,
  ExecutionEndpointResult,
} from "@/types/execution-endpoints";

function requireData<T>(result: ApiResult<T>, fallbackMessage: string): T {
  if (!result.succeeded || result.data === undefined) {
    throw new Error(result.message || result.businessError || fallbackMessage);
  }
  return result.data;
}

export async function listExecutionEndpointsByKiosk(
  kioskId: string,
  signal?: AbortSignal,
): Promise<ExecutionEndpointResult[]> {
  const response = await axiosClient.get<ApiResult<ExecutionEndpointResult[]>>(
    "/api/v1/management/execution-endpoints",
    { params: { kioskId }, signal },
  );
  return requireData(response.data, "Không thể tải điểm thực thi.");
}

export async function createExecutionEndpoint(
  kioskId: string,
  request: CreateExecutionEndpointRequest,
): Promise<ExecutionEndpointResult> {
  const response = await axiosClient.post<ApiResult<ExecutionEndpointResult>>(
    `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/execution-endpoints`,
    request,
  );
  return requireData(response.data, "Không thể tạo điểm thực thi.");
}

export async function setExecutionEndpointLifecycle(
  kioskId: string,
  endpointId: string,
  action: "disable" | "reactivate" | "retire",
): Promise<ExecutionEndpointResult> {
  const response = await axiosClient.patch<ApiResult<ExecutionEndpointResult>>(
    `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/execution-endpoints/${encodeURIComponent(endpointId)}/${action}`,
  );
  return requireData(response.data, "Không thể cập nhật điểm thực thi.");
}

export function getExecutionEndpointsErrorMessage(
  error: unknown,
  fallbackMessage = "Không thể tải điểm thực thi.",
): string {
  if (axios.isCancel(error)) return "";
  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    if (error.response?.status === 403) {
      return "Tài khoản hiện tại không có quyền truy cập hoặc thực hiện thao tác này với điểm thực thi.";
    }
    return (
      error.response?.data?.message ||
      error.response?.data?.businessError ||
      fallbackMessage
    );
  }
  return error instanceof Error ? error.message : fallbackMessage;
}
