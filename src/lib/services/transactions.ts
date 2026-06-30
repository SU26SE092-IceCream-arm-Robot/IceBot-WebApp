import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  ManagementOrdersQuery,
  ManagementOrderReasonRequest,
  ManagementRefundsQuery,
  OrderResult,
  OrderStatusHistoryQuery,
  OrderStatusHistoryResult,
  RefundResult,
  TransactionsPagedResult,
  RequestRefundRequest,
  MarkRefundProcessedRequest,
  RefundReasonRequest,
} from "@/types/transactions";

function requireData<T>(result: ApiResult<T>, fallbackMessage: string): T {
  if (!result.succeeded || !result.data) {
    throw new Error(result.message || fallbackMessage);
  }

  return result.data;
}

function requirePagedData<T>(
  result: TransactionsPagedResult<T>,
  fallbackMessage: string,
): TransactionsPagedResult<T> {
  if (!result.succeeded) {
    throw new Error(result.message || fallbackMessage);
  }

  return result;
}

function buildOrdersParams(query: ManagementOrdersQuery) {
  return {
    search: query.searchTerm?.trim() || undefined,
    status: query.status,
    paymentStatus: query.paymentStatus,
    organizationId: query.organizationId,
    storeId: query.storeId,
    kioskId: query.kioskId,
    pageNumber: query.pageNumber,
    pageSize: query.pageSize,
  };
}

function buildRefundsParams(query: ManagementRefundsQuery) {
  return {
    search: query.searchTerm?.trim() || undefined,
    status: query.status,
    organizationId: query.organizationId,
    storeId: query.storeId,
    kioskId: query.kioskId,
    pageNumber: query.pageNumber,
    pageSize: query.pageSize,
  };
}

export async function listManagementOrders(
  query: ManagementOrdersQuery,
  signal?: AbortSignal,
): Promise<TransactionsPagedResult<OrderResult>> {
  const response = await axiosClient.get<TransactionsPagedResult<OrderResult>>(
    "/api/v1/management/orders",
    {
      params: buildOrdersParams(query),
      signal,
    },
  );

  return requirePagedData(response.data, "Không thể tải danh sách giao dịch.");
}

export async function getManagementOrderById(
  orderId: string,
  signal?: AbortSignal,
): Promise<OrderResult> {
  const response = await axiosClient.get<ApiResult<OrderResult>>(
    `/api/v1/management/orders/${encodeURIComponent(orderId)}`,
    { signal },
  );

  return requireData(response.data, "Không thể tải chi tiết giao dịch.");
}

export async function getManagementOrderStatusHistory(
  orderId: string,
  query: OrderStatusHistoryQuery,
  signal?: AbortSignal,
): Promise<TransactionsPagedResult<OrderStatusHistoryResult>> {
  const response = await axiosClient.get<
    TransactionsPagedResult<OrderStatusHistoryResult>
  >(`/api/v1/management/orders/${encodeURIComponent(orderId)}/status-history`, {
    params: {
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
    },
    signal,
  });

  return requirePagedData(
    response.data,
    "Không thể tải lịch sử trạng thái giao dịch.",
  );
}

export async function listManagementRefunds(
  query: ManagementRefundsQuery,
  signal?: AbortSignal,
): Promise<TransactionsPagedResult<RefundResult>> {
  const response = await axiosClient.get<TransactionsPagedResult<RefundResult>>(
    "/api/v1/management/refunds",
    {
      params: buildRefundsParams(query),
      signal,
    },
  );

  return requirePagedData(
    response.data,
    "Không thể tải danh sách hoàn tiền.",
  );
}

export async function getManagementRefundById(
  refundId: string,
  signal?: AbortSignal,
): Promise<RefundResult> {
  const response = await axiosClient.get<ApiResult<RefundResult>>(
    `/api/v1/management/refunds/${encodeURIComponent(refundId)}`,
    { signal },
  );

  return requireData(response.data, "Không thể tải chi tiết hoàn tiền.");
}

export async function cancelManagementOrder(
  orderId: string,
  request: ManagementOrderReasonRequest,
): Promise<OrderResult> {
  const response = await axiosClient.patch<ApiResult<OrderResult>>(
    `/api/v1/management/orders/${encodeURIComponent(orderId)}/cancel`,
    request,
  );

  return requireData(response.data, "Không thể hủy giao dịch.");
}

export async function markManagementOrderRefundRequired(
  orderId: string,
  request: ManagementOrderReasonRequest,
): Promise<OrderResult> {
  const response = await axiosClient.patch<ApiResult<OrderResult>>(
    `/api/v1/management/orders/${encodeURIComponent(orderId)}/refund-required`,
    request,
  );

  return requireData(
    response.data,
    "Không thể đánh dấu giao dịch cần hoàn tiền.",
  );
}

export function getTransactionsErrorMessage(
  error: unknown,
  fallbackMessage = "Không thể tải dữ liệu giao dịch.",
): string {
  if (axios.isCancel(error)) {
    return "";
  }

  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    if (error.response?.status === 403) {
      return "Tài khoản hiện tại không có quyền xem dữ liệu giao dịch.";
    }

    return error.response?.data?.message || fallbackMessage;
  }

  return error instanceof Error ? error.message : fallbackMessage;
}

export async function requestManagementRefund(
  orderId: string,
  request: RequestRefundRequest,
  idempotencyKey: string,
): Promise<RefundResult> {
  const response = await axiosClient.post<ApiResult<RefundResult>>(
    `/api/v1/management/orders/${encodeURIComponent(orderId)}/refunds`,
    request,
    {
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    },
  );

  return requireData(response.data, "Không thể yêu cầu hoàn tiền.");
}

export async function markManagementRefundProcessed(
  refundId: string,
  request: MarkRefundProcessedRequest,
): Promise<RefundResult> {
  const response = await axiosClient.patch<ApiResult<RefundResult>>(
    `/api/v1/management/refunds/${encodeURIComponent(refundId)}/mark-processed`,
    request,
  );

  return requireData(response.data, "Không thể đánh dấu hoàn tiền đã xử lý.");
}

export async function rejectManagementRefund(
  refundId: string,
  request: RefundReasonRequest,
): Promise<RefundResult> {
  const response = await axiosClient.patch<ApiResult<RefundResult>>(
    `/api/v1/management/refunds/${encodeURIComponent(refundId)}/reject`,
    request,
  );

  return requireData(response.data, "Không thể từ chối yêu cầu hoàn tiền.");
}

export async function cancelManagementRefund(
  refundId: string,
  request: RefundReasonRequest,
): Promise<RefundResult> {
  const response = await axiosClient.patch<ApiResult<RefundResult>>(
    `/api/v1/management/refunds/${encodeURIComponent(refundId)}/cancel`,
    request,
  );

  return requireData(response.data, "Không thể hủy yêu cầu hoàn tiền.");
}
