import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  ManagementOrdersQuery,
  OrderResult,
  OrderStatusHistoryQuery,
  OrderStatusHistoryResult,
  TransactionsPagedResult,
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
