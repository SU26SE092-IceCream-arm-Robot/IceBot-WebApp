import type { PagedResult, PaginationMeta } from "@/types/accounts";

export type OrderChannel =
  | "Tablet"
  | "Kiosk"
  | "MobileApp"
  | "Web"
  | "Admin"
  | "External";

export type OrderStatus =
  | "Draft"
  | "PendingPayment"
  | "Paid"
  | "ReadyForExecution"
  | "Accepted"
  | "Preparing"
  | "Ready"
  | "Completed"
  | "Cancelled"
  | "Failed"
  | "ExecutionRejected"
  | "RefundRequired"
  | "Refunded"
  | "Compensated";

export type PaymentStatus =
  | "Unpaid"
  | "Authorized"
  | "Paid"
  | "PartiallyRefunded"
  | "Refunded"
  | "Failed"
  | "Cancelled";

export type OrderItemStatus =
  | "Pending"
  | "Accepted"
  | "Preparing"
  | "Completed"
  | "Cancelled"
  | "Failed";

export type OrderStatusFilter = "ALL" | OrderStatus;

export type PaymentStatusFilter = "ALL" | PaymentStatus;

export interface OrderItemResult {
  id: string;
  menuItemId: string;
  productId: string;
  productVariantId: string;
  recipeId?: string | null;
  clientLineId?: string | null;
  menuItemCodeSnapshot: string;
  menuItemNameSnapshot: string;
  productCodeSnapshot: string;
  productNameSnapshot: string;
  productVariantCodeSnapshot: string;
  productVariantNameSnapshot: string;
  recipeVersionSnapshot?: number | null;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalAmount: number;
  status: OrderItemStatus;
}

export interface OrderResult {
  id: string;
  kioskId: string;
  storeId?: string | null;
  organizationId?: string | null;
  orderNumber: string;
  clientOrderId?: string | null;
  runtimeSnapshotId?: string | null;
  runtimeSnapshotGeneratedAt?: string | null;
  channel: OrderChannel;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  currency: string;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  placedAt: string;
  paidAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  customerStatus: string;
  customerStatusMessage: string;
  canRetryPayment: boolean;
  requiresStaffSupport: boolean;
  items: OrderItemResult[];
}

export interface OrderStatusHistoryResult {
  id: string;
  orderId: string;
  changedByAccountId?: string | null;
  changedByName?: string | null;
  changedByEmail?: string | null;
  fromStatus?: OrderStatus | null;
  toStatus: OrderStatus;
  reason?: string | null;
  changedAt: string;
}

export interface TransactionsFilters {
  searchTerm: string;
  status: OrderStatusFilter;
  paymentStatus: PaymentStatusFilter;
}

export interface ManagementOrdersQuery {
  searchTerm?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  organizationId?: string;
  storeId?: string;
  kioskId?: string;
  pageNumber: number;
  pageSize: number;
}

export interface OrderStatusHistoryQuery {
  pageNumber: number;
  pageSize: number;
}

export interface TransactionsSummary {
  total: number;
  paidOnPage: number;
  refundRequiredOnPage: number;
  failedOrCancelledOnPage: number;
}

export type TransactionsPaginationMeta = PaginationMeta;

export type TransactionsPagedResult<T> = PagedResult<T>;
