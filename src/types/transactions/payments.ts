export interface PaymentMethodResult {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface PaymentMethodStatusUpdateRequest {
  isActive: boolean;
}

export type PaymentTransactionStatus =
  | "Pending"
  | "Authorized"
  | "Paid"
  | "Failed"
  | "Cancelled"
  | "Refunded"
  | "Expired";

export interface PaymentSessionDiagnosticsResult {
  paymentTransactionId: string;
  orderId: string;
  provider: string;
  providerOrderCode?: string | null;
  providerPaymentLinkId?: string | null;
  providerTransactionId?: string | null;
  status: PaymentTransactionStatus;
  amount: number;
  paidAmount?: number | null;
  currency: string;
  providerStatus?: string | null;
  requestedAt: string;
  expiresAt?: string | null;
  lastAttemptAt?: string | null;
  nextRetryAt?: string | null;
  retryCount: number;
  maxRetries: number;
  lastErrorCode?: string | null;
  lastErrorMessage?: string | null;
  rawRequestJson?: string | null;
  rawResponseJson?: string | null;
}
