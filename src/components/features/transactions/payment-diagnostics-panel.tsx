"use client";

import { AlertTriangle, CreditCard, RefreshCw } from "lucide-react";

import {
  formatTransactionDate,
  formatTransactionMoney,
} from "@/components/features/transactions/transactions-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { usePaymentDiagnostics } from "@/hooks/use-payment-diagnostics";
import { hasEffectivePermission } from "@/lib/rbac";
import type {
  PaymentSessionDiagnosticsResult,
  PaymentTransactionStatus,
} from "@/types/payments";

const STATUS_LABELS: Record<PaymentTransactionStatus, string> = {
  Pending: "Đang chờ",
  Authorized: "Đã xác thực",
  Paid: "Đã thanh toán",
  Failed: "Thất bại",
  Cancelled: "Đã hủy",
  Refunded: "Đã hoàn tiền",
  Expired: "Đã hết hạn",
};

function DiagnosticField({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 break-words text-sm text-foreground">
        {value || "—"}
      </div>
    </div>
  );
}

function PaymentDiagnostic({
  diagnostic,
}: {
  diagnostic: PaymentSessionDiagnosticsResult;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/10 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{diagnostic.provider}</p>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {diagnostic.paymentTransactionId}
          </p>
        </div>
        <Badge variant="outline">{STATUS_LABELS[diagnostic.status]}</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DiagnosticField
          label="Số tiền yêu cầu"
          value={formatTransactionMoney(
            diagnostic.amount,
            diagnostic.currency,
          )}
        />
        <DiagnosticField
          label="Số tiền đã ghi nhận"
          value={
            diagnostic.paidAmount === null ||
            diagnostic.paidAmount === undefined
              ? "Chưa ghi nhận"
              : formatTransactionMoney(
                  diagnostic.paidAmount,
                  diagnostic.currency,
                )
          }
        />
        <DiagnosticField
          label="Trạng thái nhà cung cấp"
          value={diagnostic.providerStatus}
        />
        <DiagnosticField
          label="Số lần thử"
          value={`${diagnostic.retryCount}/${diagnostic.maxRetries}`}
        />
        <DiagnosticField
          label="Mã đơn phía nhà cung cấp"
          value={diagnostic.providerOrderCode}
        />
        <DiagnosticField
          label="Mã giao dịch phía nhà cung cấp"
          value={diagnostic.providerTransactionId}
        />
        <DiagnosticField
          label="Yêu cầu lúc"
          value={formatTransactionDate(diagnostic.requestedAt)}
        />
        <DiagnosticField
          label="Lần thử gần nhất"
          value={formatTransactionDate(diagnostic.lastAttemptAt)}
        />
        {diagnostic.nextRetryAt ? (
          <DiagnosticField
            label="Thử lại dự kiến"
            value={formatTransactionDate(diagnostic.nextRetryAt)}
          />
        ) : null}
        {diagnostic.expiresAt ? (
          <DiagnosticField
            label="Hết hạn lúc"
            value={formatTransactionDate(diagnostic.expiresAt)}
          />
        ) : null}
      </div>

      {diagnostic.lastErrorCode || diagnostic.lastErrorMessage ? (
        <div className="flex gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            {[diagnostic.lastErrorCode, diagnostic.lastErrorMessage]
              .filter(Boolean)
              .join(": ")}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function PaymentDiagnosticsPanel({ orderId }: { orderId: string }) {
  const { effectiveAccess } = useAuth();
  const canViewDiagnostics = hasEffectivePermission(
    effectiveAccess,
    "operations.diagnostics",
  );
  const state = usePaymentDiagnostics(orderId, canViewDiagnostics);

  if (!canViewDiagnostics) return null;

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <CreditCard className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Chẩn đoán thanh toán
            </p>
            <p className="text-xs text-muted-foreground">
              Bằng chứng provider và retry do backend ghi nhận. Payload thô được ẩn.
            </p>
          </div>
        </div>
        {state.diagnostics.length > 0 ? (
          <Badge variant="outline">{state.diagnostics.length} giao dịch</Badge>
        ) : null}
      </div>

      {state.isLoading ? (
        <div className="space-y-2" aria-label="Đang tải chẩn đoán thanh toán">
          <div className="h-24 animate-pulse rounded-lg bg-muted/40" />
        </div>
      ) : state.errorMessage ? (
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{state.errorMessage}</p>
          </div>
          <Button variant="outline" size="sm" onClick={state.retry}>
            <RefreshCw className="size-4" />
            Thử lại
          </Button>
        </div>
      ) : state.diagnostics.length === 0 ? (
        <p className="rounded-lg bg-muted/20 p-4 text-sm text-muted-foreground">
          Đơn hàng chưa có giao dịch thanh toán để chẩn đoán.
        </p>
      ) : (
        <div className="space-y-3">
          {state.diagnostics.map((diagnostic) => (
            <PaymentDiagnostic
              key={diagnostic.paymentTransactionId}
              diagnostic={diagnostic}
            />
          ))}
        </div>
      )}
    </section>
  );
}
