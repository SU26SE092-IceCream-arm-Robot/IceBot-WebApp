import axiosClient from "@/lib/axios-client";
import type { PaymentMethodResult, PaymentMethodStatusUpdateRequest } from "@/types/payments";
import type { ApiResult } from "@/types";

function requireData<T>(result: ApiResult<T>, fallbackMessage: string): T {
  if (
    !result.succeeded ||
    result.data === null ||
    result.data === undefined
  ) {
    throw new Error(result.message || fallbackMessage);
  }

  return result.data;
}

export async function getPaymentMethods(signal?: AbortSignal): Promise<PaymentMethodResult[]> {
  const response = await axiosClient.get<ApiResult<PaymentMethodResult[]>>(
    "/api/v1/management/payment-methods",
    { signal }
  );

  return requireData(
    response.data,
    "Không thể tải danh sách phương thức thanh toán.",
  );
}

export async function setPaymentMethodStatus(id: number, isActive: boolean): Promise<boolean> {
  const request: PaymentMethodStatusUpdateRequest = { isActive };
  const response = await axiosClient.patch<ApiResult<boolean>>(
    `/api/v1/management/payment-methods/${id}/status`,
    request
  );

  if (!response.data.succeeded || response.data.data !== true) {
    throw new Error(response.data.message || "Failed to update payment method status");
  }

  return response.data.data;
}
