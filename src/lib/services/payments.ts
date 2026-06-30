import axiosClient from "@/lib/axios-client";
import type { PaymentMethodResult, PaymentMethodStatusUpdateRequest } from "@/types/payments";
import type { ApiResult } from "@/types";

export async function getPaymentMethods(signal?: AbortSignal): Promise<PaymentMethodResult[]> {
  const response = await axiosClient.get<ApiResult<PaymentMethodResult[]>>(
    "/api/v1/management/payment-methods",
    { signal }
  );

  return response.data.data || [];
}

export async function setPaymentMethodStatus(id: number, isActive: boolean): Promise<PaymentMethodResult> {
  const request: PaymentMethodStatusUpdateRequest = { isActive };
  const response = await axiosClient.patch<ApiResult<PaymentMethodResult>>(
    `/api/v1/management/payment-methods/${id}/status`,
    request
  );

  if (!response.data.succeeded || !response.data.data) {
    throw new Error(response.data.message || "Failed to update payment method status");
  }

  return response.data.data;
}
