import axios, { type AxiosResponse } from "axios";

import axiosClient from "@/lib/axios-client";
import { getApiResultMessage } from "@/lib/api/result";
import type { ApiResult } from "@/types";
import type {
  CreateServiceRegistrationRequest,
  ServiceRegistrationResult,
} from "@/types/service-registrations";

function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `sr-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function extractResult(response: AxiosResponse<unknown>): ServiceRegistrationResult {
  const data = response.data as Record<string, unknown> | undefined;
  if (data && typeof data === "object") {
    if ("succeeded" in data) {
      const apiResult = data as unknown as ApiResult<ServiceRegistrationResult>;
      if (!apiResult.succeeded || !apiResult.data) {
        throw new Error(getApiResultMessage(apiResult, "Không thể gửi yêu cầu đăng ký dịch vụ."));
      }
      return apiResult.data;
    }
    if ("referenceCode" in data || "id" in data) {
      return data as unknown as ServiceRegistrationResult;
    }
  }
  throw new Error("Phản hồi từ máy chủ không hợp lệ.");
}

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

  return extractResult(response);
}

export function getServiceRegistrationErrorMessage(
  error: unknown,
  fallbackMessage = "Không thể gửi yêu cầu đăng ký dịch vụ. Vui lòng thử lại sau.",
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
    if (error.response?.status === 400) return "Dữ liệu đăng ký không hợp lệ. Vui lòng kiểm tra lại.";
    if (error.response?.status === 409) return "Yêu cầu đăng ký đã tồn tại hoặc đang được xử lý.";
    if (error.response?.status === 500) return "Máy chủ gặp sự cố khi xử lý đăng ký. Vui lòng thử lại sau.";
  }
  return error instanceof Error ? error.message : fallbackMessage;
}
