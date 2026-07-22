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
  | "ReadyForFulfillment"
  | "Accepted"
  | "Preparing"
  | "Ready"
  | "Completed"
  | "Cancelled"
  | "Failed"
  | "ExecutionRejected"
  | "RefundRequired"
  | "Refunded"
  | "Compensated"
  | "FulfillmentIssue";

export type PaymentStatus =
  | "Unpaid"
  | "Authorized"
  | "Paid"
  | "PartiallyRefunded"
  | "Refunded"
  | "Failed"
  | "Cancelled";

export type RefundStatus =
  | "Requested"
  | "Processing"
  | "Processed"
  | "Rejected"
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

export type RefundStatusFilter = "ALL" | RefundStatus;

export interface OrderItemResult {
  id: string;
  menuItemId: string;
  productId: string;
  productVariantId: string;
  recipeId?: string | null;
  clientLineId?: string | null;
  menuItemCode: string;
  menuItemName: string;
  productCode: string;
  productName: string;
  productVariantCode: string;
  productVariantName: string;
  recipeVersion?: number | null;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalAmount: number;
  status: OrderItemStatus;
  selectedOptions: OrderItemOptionResult[];
}

export interface OrderItemOptionResult {
  productOptionId: string;
  optionGroupCode: string;
  code: string;
  name: string;
  priceDelta: number;
}

export interface ManagementOrderListItemResult {
  id: string;
  kioskId: string;
  storeId?: string | null;
  organizationId?: string | null;
  orderNumber: string;
  clientOrderId?: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  currency: string;
  totalAmount: number;
  paidAmount: number;
  customerName?: string | null;
  customerPhoneNumber?: string | null;
  placedAt: string;
  paidAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  customerStatus: string;
  canRetryPayment: boolean;
  requiresStaffSupport: boolean;
}

export interface OrderResult extends ManagementOrderListItemResult {
  channel: OrderChannel;
  externalChannel?: string | null;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  notes?: string | null;
  customerStatusMessage: string;
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

export interface ExecutionAttemptSummaryResult {
  sourceCommandId: string;
  dispatchAttemptNo: number;
  commandStatus: string;
  createdAt: string;
  deliveredAt?: string | null;
  respondedAt?: string | null;
  rejectionCode?: string | null;
  rejectionMessage?: string | null;
  executionStatus?: string | null;
  observationStatus?: string | null;
  customerExecutionStatus?: string | null;
}

export interface ExecutionAttemptDiagnosticsResult {
  sourceCommandId: string;
  orderId: string;
  dispatchAttemptNo: number;
  kioskExecutionEndpointId: string;
  commandStatus: string;
  createdAt: string;
  requestedByAccountId?: string | null;
  commandExpiryAt?: string | null;
  deliveredAt?: string | null;
  respondedAt?: string | null;
  rejectionCode?: string | null;
  rejectionMessage?: string | null;
  executionProfile?: string | null;
  sourceConfigurationReleaseId?: string | null;
  releaseChecksum?: string | null;
  executionStatus?: string | null;
  observationStatus?: string | null;
  customerExecutionStatus?: string | null;
  sourceExecutorId?: string | null;
  lastAppliedSourceEventId?: string | null;
  lastAppliedSequenceNumber?: number | null;
  lastEdgeCreatedAt?: string | null;
  lastExecutorReportedAt?: string | null;
  cloudReceivedAt?: string | null;
}

export interface ExecutionAttemptReferenceResult {
  sourceCommandId: string;
  dispatchAttemptNo: number;
  commandStatus: string;
  createdAt: string;
}

export interface ExecutionAttemptProvenanceResult {
  isRedispatch: boolean;
  retryOfSourceCommandId?: string | null;
  requestedByAccountId?: string | null;
  redispatchReason?: string | null;
  timedOutBeforeAcceptance: boolean;
  timedOutAt?: string | null;
  commandExpiryAt?: string | null;
  executionReportTimedOut: boolean;
  observationRecordedAt?: string | null;
}

export interface ExecutionDeliveryAttemptResult {
  deliveryAttemptNo: number;
  sentAt: string;
  outcome: string;
  responseCode?: string | null;
  responseMessage?: string | null;
}

export interface ProductionExecutionResult {
  id: string;
  sourceProductionJobId?: string | null;
  orderItemId: string;
  productionUnitNo: number;
  productionUnitQuantity: number;
  workcellId?: string | null;
  controllerId?: string | null;
  executionPlanChecksum?: string | null;
  activeSetVersion?: number | null;
  activeSetChecksum?: string | null;
  status: string;
  physicalOutputState: string;
  errorCode?: string | null;
  errorMessage?: string | null;
  sourceExecutorId: string;
  lastAppliedSourceEventId: string;
  lastAppliedSequenceNumber: number;
  lastEdgeCreatedAt: string;
  lastExecutorReportedAt: string;
  cloudReceivedAt: string;
}

export interface ProductionUnitOutcomeSummaryResult {
  orderItemId: string;
  productionUnitStartNo: number;
  expectedQuantity: number;
  completedQuantity: number;
  failedQuantity: number;
  manualInterventionQuantity: number;
  inProgressQuantity: number;
  unreportedQuantity: number;
  aggregateStatus?: string | null;
}

export interface ExecutionAttemptDetailResult {
  attempt: ExecutionAttemptDiagnosticsResult;
  previousAttempt?: ExecutionAttemptReferenceResult | null;
  nextAttempt?: ExecutionAttemptReferenceResult | null;
  provenance: ExecutionAttemptProvenanceResult;
  deliveryAttempts: ExecutionDeliveryAttemptResult[];
  productionExecutions: ProductionExecutionResult[];
  productionUnitOutcomes: ProductionUnitOutcomeSummaryResult[];
}

export interface RefundResult {
  id: string;
  paymentTransactionId: string;
  refundNumber: string;
  providerRefundId?: string | null;
  amount: number;
  currency: string;
  reason: string;
  status: RefundStatus;
  requestedAt: string;
  processedAt?: string | null;
  rejectedAt?: string | null;
  lastErrorCode?: string | null;
  lastErrorMessage?: string | null;
  orderId: string;
  orderNumber: string;
  refundMethod: string;
  voucherCode?: string | null;
  voucherValue?: number | null;
  note?: string | null;
}

export interface TransactionsFilters {
  searchTerm: string;
  status: OrderStatusFilter;
  paymentStatus: PaymentStatusFilter;
}

export interface RefundsFilters {
  searchTerm: string;
  status: RefundStatusFilter;
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

export interface ManagementRefundsQuery {
  searchTerm?: string;
  status?: RefundStatus;
  organizationId?: string;
  storeId?: string;
  kioskId?: string;
  pageNumber: number;
  pageSize: number;
}

export interface ManagementOrderReasonRequest {
  reason?: string | null;
}

export interface TransactionsSummary {
  total: number;
  paidOnPage: number;
  refundRequiredOnPage: number;
  failedOrCancelledOnPage: number;
}

export interface RefundsSummary {
  total: number;
  requestedOnPage: number;
  processedOnPage: number;
  failedOrRejectedOnPage: number;
}

export type TransactionsPaginationMeta = PaginationMeta;

export type TransactionsPagedResult<T> = PagedResult<T>;

export type RefundMethod = "FullMoneyRefund" | "Voucher";

export interface RequestRefundRequest {
  refundMethod: RefundMethod;
  reason: string;
  voucherCode?: string | null;
  voucherValue?: number | null;
  note?: string | null;
}

export interface MarkRefundProcessedRequest {
  providerRefundId?: string | null;
  moneyWasRefunded?: boolean | null;
}

export interface RefundReasonRequest {
  reason: string;
}
