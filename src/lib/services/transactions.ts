import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  ManagementOrdersQuery,
  ManagementOrderListItemResult,
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
  ExecutionAttemptDetailResult,
  ExecutionAttemptResult,
  OrderChannel,
  OrderItemStatus,
  OrderStatus,
  PaymentStatus,
} from "@/types/transactions";

interface GraphQLErrorItem {
  message: string;
  extensions?: Record<string, unknown>;
}

interface GraphQLResponse<T> {
  data?: T | null;
  errors?: GraphQLErrorItem[];
}

interface GraphQLPage<T> {
  items: T[];
  pageInfo: TransactionsPagedResult<T>["pagination"];
}

interface RawManagementOrderListItem
  extends Omit<ManagementOrderListItemResult, "status" | "paymentStatus"> {
  status: string;
  paymentStatus: string;
}

interface RawOrderItem
  extends Omit<OrderResult["items"][number], "status"> {
  status: string;
}

interface RawOrderDetail
  extends Omit<OrderResult, "channel" | "status" | "paymentStatus" | "items"> {
  channel: string;
  status: string;
  paymentStatus: string;
  items: RawOrderItem[];
}

interface RawOrderStatusHistory
  extends Omit<OrderStatusHistoryResult, "fromStatus" | "toStatus"> {
  fromStatus?: string | null;
  toStatus: string;
}

class TransactionsGraphQLError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "TransactionsGraphQLError";
  }
}

const ORDER_STATUS_FROM_GRAPHQL: Record<string, OrderStatus> = {
  DRAFT: "Draft",
  PENDING_PAYMENT: "PendingPayment",
  PAID: "Paid",
  READY_FOR_EXECUTION: "ReadyForExecution",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  FAILED: "Failed",
  EXECUTION_REJECTED: "ExecutionRejected",
  REFUND_REQUIRED: "RefundRequired",
  REFUNDED: "Refunded",
  COMPENSATED: "Compensated",
};

const PAYMENT_STATUS_FROM_GRAPHQL: Record<string, PaymentStatus> = {
  UNPAID: "Unpaid",
  AUTHORIZED: "Authorized",
  PAID: "Paid",
  PARTIALLY_REFUNDED: "PartiallyRefunded",
  REFUNDED: "Refunded",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

const ORDER_CHANNEL_FROM_GRAPHQL: Record<string, OrderChannel> = {
  TABLET: "Tablet",
  KIOSK: "Kiosk",
  MOBILE_APP: "MobileApp",
  WEB: "Web",
  ADMIN: "Admin",
  EXTERNAL: "External",
};

const ORDER_ITEM_STATUS_FROM_GRAPHQL: Record<string, OrderItemStatus> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  FAILED: "Failed",
};

const ORDER_STATUS_TO_GRAPHQL: Record<OrderStatus, string> = Object.fromEntries(
  Object.entries(ORDER_STATUS_FROM_GRAPHQL).map(([key, value]) => [value, key]),
) as Record<OrderStatus, string>;

const PAYMENT_STATUS_TO_GRAPHQL: Record<PaymentStatus, string> =
  Object.fromEntries(
    Object.entries(PAYMENT_STATUS_FROM_GRAPHQL).map(([key, value]) => [
      value,
      key,
    ]),
  ) as Record<PaymentStatus, string>;

const MANAGEMENT_ORDERS_QUERY = `
  query ManagementOrders(
    $search: String
    $status: OrderStatus
    $paymentStatus: PaymentStatus
    $organizationId: UUID
    $storeId: UUID
    $kioskId: UUID
    $pageNumber: Int
    $pageSize: Int
  ) {
    orders(
      search: $search
      status: $status
      paymentStatus: $paymentStatus
      organizationId: $organizationId
      storeId: $storeId
      kioskId: $kioskId
      pageNumber: $pageNumber
      pageSize: $pageSize
    ) {
      items {
        id organizationId storeId kioskId orderNumber clientOrderId
        status paymentStatus currency totalAmount paidAmount
        customerName customerPhoneNumber placedAt paidAt completedAt cancelledAt
        customerStatus canRetryPayment requiresStaffSupport
      }
      pageInfo { page pageSize totalCount totalPages hasNext hasPrevious }
    }
  }
`;

const MANAGEMENT_ORDER_QUERY = `
  query ManagementOrder($id: UUID!) {
    order(id: $id) {
      id organizationId storeId kioskId orderNumber clientOrderId
      channel externalChannel status paymentStatus currency
      subtotalAmount discountAmount taxAmount totalAmount paidAmount
      customerName customerPhoneNumber notes
      placedAt paidAt completedAt cancelledAt
      customerStatus customerStatusMessage canRetryPayment requiresStaffSupport
      items {
        id menuItemId productId productVariantId recipeId clientLineId
        menuItemCode menuItemName productCode productName
        productVariantCode productVariantName recipeVersion
        quantity unitPrice discountAmount totalAmount status
        selectedOptions { productOptionId optionGroupCode code name priceDelta }
      }
    }
  }
`;

const ORDER_STATUS_HISTORY_QUERY = `
  query ManagementOrderStatusHistory($orderId: UUID!, $pageNumber: Int, $pageSize: Int) {
    orderStatusHistory(orderId: $orderId, pageNumber: $pageNumber, pageSize: $pageSize) {
      items {
        id orderId changedByAccountId changedByName changedByEmail
        fromStatus toStatus reason changedAt
      }
      pageInfo { page pageSize totalCount totalPages hasNext hasPrevious }
    }
  }
`;

const ORDER_EXECUTION_ATTEMPTS_QUERY = `
  query ManagementOrderExecutionAttempts($orderId: UUID!, $pageNumber: Int, $pageSize: Int) {
    orderExecutionAttempts(orderId: $orderId, pageNumber: $pageNumber, pageSize: $pageSize) {
      items {
        sourceCommandId orderId dispatchAttemptNo kioskExecutionEndpointId
        commandStatus createdAt requestedByAccountId commandExpiryAt deliveredAt respondedAt
        rejectionCode rejectionMessage executionProfile sourceConfigurationReleaseId releaseChecksum
        executionStatus observationStatus customerExecutionStatus sourceExecutorId
        lastAppliedSourceEventId lastAppliedSequenceNumber lastEdgeCreatedAt
        lastExecutorReportedAt cloudReceivedAt
      }
      pageInfo { page pageSize totalCount totalPages hasNext hasPrevious }
    }
  }
`;

async function executeGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
  fallbackMessage: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await axiosClient.post<GraphQLResponse<T>>(
    "/graphql",
    { query, variables },
    { signal },
  );

  if (response.data.errors?.length) {
    const firstError = response.data.errors[0];
    const code =
      typeof firstError.extensions?.code === "string"
        ? firstError.extensions.code
        : undefined;
    throw new TransactionsGraphQLError(
      response.data.errors.map((error) => error.message).join(" ") ||
        fallbackMessage,
      code,
    );
  }

  if (!response.data.data) {
    throw new TransactionsGraphQLError(fallbackMessage);
  }

  return response.data.data;
}

function requireMappedEnum<T>(
  value: string,
  mapping: Record<string, T>,
  fieldName: string,
): T {
  const mapped = mapping[value];
  if (!mapped) {
    throw new TransactionsGraphQLError(
      `Backend trả về ${fieldName} không được hỗ trợ: ${value}.`,
    );
  }
  return mapped;
}

function mapOrderListItem(
  order: RawManagementOrderListItem,
): ManagementOrderListItemResult {
  return {
    ...order,
    status: requireMappedEnum(order.status, ORDER_STATUS_FROM_GRAPHQL, "trạng thái đơn"),
    paymentStatus: requireMappedEnum(
      order.paymentStatus,
      PAYMENT_STATUS_FROM_GRAPHQL,
      "trạng thái thanh toán",
    ),
  };
}

function mapOrderDetail(order: RawOrderDetail): OrderResult {
  return {
    ...order,
    channel: requireMappedEnum(order.channel, ORDER_CHANNEL_FROM_GRAPHQL, "kênh đặt hàng"),
    status: requireMappedEnum(order.status, ORDER_STATUS_FROM_GRAPHQL, "trạng thái đơn"),
    paymentStatus: requireMappedEnum(
      order.paymentStatus,
      PAYMENT_STATUS_FROM_GRAPHQL,
      "trạng thái thanh toán",
    ),
    items: order.items.map((item) => ({
      ...item,
      status: requireMappedEnum(
        item.status,
        ORDER_ITEM_STATUS_FROM_GRAPHQL,
        "trạng thái món",
      ),
    })),
  };
}

function toPagedResult<T>(page: GraphQLPage<T>): TransactionsPagedResult<T> {
  return {
    succeeded: true,
    statusCode: 200,
    data: page.items,
    pagination: page.pageInfo,
  };
}

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
    status: query.status ? ORDER_STATUS_TO_GRAPHQL[query.status] : undefined,
    paymentStatus: query.paymentStatus
      ? PAYMENT_STATUS_TO_GRAPHQL[query.paymentStatus]
      : undefined,
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
): Promise<TransactionsPagedResult<ManagementOrderListItemResult>> {
  const result = await executeGraphQL<{
    orders: GraphQLPage<RawManagementOrderListItem>;
  }>(
    MANAGEMENT_ORDERS_QUERY,
    buildOrdersParams(query),
    "Không thể tải danh sách giao dịch.",
    signal,
  );

  return toPagedResult({
    ...result.orders,
    items: result.orders.items.map(mapOrderListItem),
  });
}

export async function getManagementOrderById(
  orderId: string,
  signal?: AbortSignal,
): Promise<OrderResult> {
  const result = await executeGraphQL<{ order: RawOrderDetail }>(
    MANAGEMENT_ORDER_QUERY,
    { id: orderId },
    "Không thể tải chi tiết giao dịch.",
    signal,
  );

  return mapOrderDetail(result.order);
}

export async function getManagementOrderStatusHistory(
  orderId: string,
  query: OrderStatusHistoryQuery,
  signal?: AbortSignal,
): Promise<TransactionsPagedResult<OrderStatusHistoryResult>> {
  const result = await executeGraphQL<{
    orderStatusHistory: GraphQLPage<RawOrderStatusHistory>;
  }>(
    ORDER_STATUS_HISTORY_QUERY,
    {
      orderId,
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
    },
    "Không thể tải lịch sử trạng thái giao dịch.",
    signal,
  );

  return toPagedResult({
    ...result.orderStatusHistory,
    items: result.orderStatusHistory.items.map((item) => ({
      ...item,
      fromStatus: item.fromStatus
        ? requireMappedEnum(item.fromStatus, ORDER_STATUS_FROM_GRAPHQL, "trạng thái trước")
        : null,
      toStatus: requireMappedEnum(item.toStatus, ORDER_STATUS_FROM_GRAPHQL, "trạng thái sau"),
    })),
  });
}

export async function getManagementOrderExecutionAttempts(
  orderId: string,
  query: OrderStatusHistoryQuery,
  signal?: AbortSignal,
): Promise<TransactionsPagedResult<ExecutionAttemptResult>> {
  const result = await executeGraphQL<{
    orderExecutionAttempts: GraphQLPage<ExecutionAttemptResult>;
  }>(
    ORDER_EXECUTION_ATTEMPTS_QUERY,
    {
      orderId,
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
    },
    "Không thể tải lịch sử lần thực thi.",
    signal,
  );

  return toPagedResult(result.orderExecutionAttempts);
}

export async function getManagementExecutionAttempt(
  sourceCommandId: string,
  signal?: AbortSignal,
): Promise<ExecutionAttemptDetailResult> {
  const response = await axiosClient.get<ApiResult<ExecutionAttemptDetailResult>>(
    `/api/v1/management/execution-attempts/${encodeURIComponent(sourceCommandId)}`,
    { signal },
  );

  return requireData(response.data, "Không thể tải chi tiết lần thực thi.");
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

  if (error instanceof TransactionsGraphQLError) {
    if (error.code === "AUTH_NOT_AUTHENTICATED") {
      return "Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.";
    }

    if (error.code === "403" || error.code === "AUTH_NOT_AUTHORIZED") {
      return "Tài khoản hiện tại không có quyền xem dữ liệu giao dịch.";
    }

    return error.message || fallbackMessage;
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
