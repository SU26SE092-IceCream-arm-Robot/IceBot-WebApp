"use client";

import {
  AlertTriangle,
  Ban,
  CalendarClock,
  History,
  PackageCheck,
  ReceiptText,
  RotateCcw,
} from "lucide-react";

import { RefundStatusBadge } from "@/components/features/transactions/refunds-table";
import {
  ORDER_STATUS_LABELS,
  OrderStatusBadge,
  PaymentStatusBadge,
  formatTransactionDate,
  formatTransactionMoney,
} from "@/components/features/transactions/transactions-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  OrderResult,
  OrderStatusHistoryResult,
  RefundResult,
  TransactionsPaginationMeta,
} from "@/types/transactions";

interface TransactionDetailDialogProps {
  order: OrderResult | null;
  errorMessage: string | null;
  isLoading: boolean;
  open: boolean;
  statusHistory: OrderStatusHistoryResult[];
  statusHistoryErrorMessage: string | null;
  statusHistoryIsLoading: boolean;
  statusHistoryPagination: TransactionsPaginationMeta;
  onOpenChange: (open: boolean) => void;
  onPreviousHistoryPage: () => void;
  onNextHistoryPage: () => void;
}

interface OrderActionDialogProps {
  action: "cancel" | "refund-required";
  errorMessage: string | null;
  isSubmitting: boolean;
  open: boolean;
  order: OrderResult | null;
  reason: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  onReasonChange: (value: string) => void;
}

interface RefundDetailDialogProps {
  errorMessage: string | null;
  isLoading: boolean;
  open: boolean;
  refund: RefundResult | null;
  onOpenChange: (open: boolean) => void;
}

function DetailTile({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

export function TransactionDetailDialog({
  order,
  errorMessage,
  isLoading,
  open,
  statusHistory,
  statusHistoryErrorMessage,
  statusHistoryIsLoading,
  statusHistoryPagination,
  onOpenChange,
  onPreviousHistoryPage,
  onNextHistoryPage,
}: TransactionDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader className="gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <ReceiptText className="size-5" />
            </span>
            <div className="min-w-0 space-y-1">
              <DialogTitle>Chi tiết giao dịch</DialogTitle>
              <DialogDescription>
                Thông tin đơn hàng và lịch sử trạng thái.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`transaction-detail-skeleton-${index}`} className="space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-5 w-full animate-pulse rounded bg-muted/60" />
              </div>
            ))}
          </div>
        ) : errorMessage ? (
          <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{errorMessage}</p>
          </div>
        ) : order ? (
          <div className="space-y-4 py-1">
            <div className="rounded-xl border border-border bg-muted/15 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-base font-semibold text-foreground">
                    {order.orderNumber}
                  </p>
                  <p className="font-mono text-xs tabular-nums text-muted-foreground">
                    {order.id}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge status={order.paymentStatus} />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <DetailTile
                label="Tổng tiền"
                value={
                  <span className="tabular-nums">
                    {formatTransactionMoney(order.totalAmount, order.currency)}
                  </span>
                }
              />
              <DetailTile
                label="Đã thanh toán"
                value={
                  <span className="tabular-nums">
                    {formatTransactionMoney(order.paidAmount, order.currency)}
                  </span>
                }
              />
              <DetailTile
                label="Kiosk"
                value={
                  <span className="font-mono text-xs tabular-nums">
                    {order.kioskId}
                  </span>
                }
              />
              <DetailTile label="Ngày đặt" value={formatTransactionDate(order.placedAt)} />
              <DetailTile label="Ngày thanh toán" value={formatTransactionDate(order.paidAt)} />
              <DetailTile
                label="Ngày hoàn tất"
                value={formatTransactionDate(order.completedAt)}
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <PackageCheck className="size-4" />
                </span>
                <p className="text-sm font-semibold text-foreground">Món trong đơn</p>
              </div>
              {order.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Đơn hàng chưa có món.</p>
              ) : (
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-2 rounded-lg border border-border bg-muted/15 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {item.productNameSnapshot} · {item.productVariantNameSnapshot}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.menuItemNameSnapshot} · SL {item.quantity}
                        </p>
                      </div>
                      <span className="text-sm font-medium tabular-nums text-foreground">
                        {formatTransactionMoney(item.totalAmount, order.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <History className="size-4" />
                  </span>
                  <p className="text-sm font-semibold text-foreground">
                    Lịch sử trạng thái
                  </p>
                </div>
                {statusHistoryPagination.totalCount > 0 ? (
                  <Badge variant="outline" className="bg-muted/20 text-muted-foreground">
                    {statusHistoryPagination.totalCount} dòng
                  </Badge>
                ) : null}
              </div>

              {statusHistoryIsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={`history-skeleton-${index}`}
                      className="h-12 animate-pulse rounded-lg bg-muted/40"
                    />
                  ))}
                </div>
              ) : statusHistoryErrorMessage ? (
                <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                  <p className="text-sm text-destructive">
                    {statusHistoryErrorMessage}
                  </p>
                </div>
              ) : statusHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có lịch sử trạng thái.
                </p>
              ) : (
                <div className="space-y-2">
                  {statusHistory.map((history) => (
                    <div
                      key={history.id}
                      className="flex flex-col gap-2 rounded-lg border border-border bg-muted/15 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <CalendarClock className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {history.fromStatus
                              ? `${ORDER_STATUS_LABELS[history.fromStatus]} -> `
                              : ""}
                            {ORDER_STATUS_LABELS[history.toStatus]}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {history.reason || "Không có ghi chú"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatTransactionDate(history.changedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    !statusHistoryPagination.hasPrevious || statusHistoryIsLoading
                  }
                  onClick={onPreviousHistoryPage}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!statusHistoryPagination.hasNext || statusHistoryIsLoading}
                  onClick={onNextHistoryPage}
                >
                  Sau
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter className="bg-background" showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

export function OrderActionDialog({
  action,
  errorMessage,
  isSubmitting,
  open,
  order,
  reason,
  onConfirm,
  onOpenChange,
  onReasonChange,
}: OrderActionDialogProps) {
  const isRefundRequired = action === "refund-required";
  const Icon = isRefundRequired ? RotateCcw : Ban;
  const title = isRefundRequired
    ? "Đánh dấu cần hoàn tiền?"
    : "Hủy giao dịch?";
  const description = isRefundRequired
    ? "Giao dịch đã thanh toán sẽ chuyển sang trạng thái cần hoàn tiền để xử lý thủ công."
    : "Giao dịch chưa thanh toán sẽ bị hủy và không tiếp tục xử lý.";
  const buttonLabel = isRefundRequired ? "Đánh dấu" : "Hủy giao dịch";
  const toneClassName = isRefundRequired
    ? "border-warning/20 bg-warning/10 text-warning"
    : "border-destructive/20 bg-destructive/10 text-destructive";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isSubmitting}>
        <DialogHeader className="gap-3">
          <span
            className={`flex size-10 items-center justify-center rounded-xl border ${toneClassName}`}
          >
            <Icon className="size-5" />
          </span>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
            {order ? (
              <>
                {" "}
                Đơn{" "}
                <span className="font-medium text-foreground">
                  {order.orderNumber}
                </span>
                .
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label
            htmlFor={`transaction-${action}-reason`}
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Lý do {isRefundRequired ? "bắt buộc" : "tùy chọn"}
          </label>
          <textarea
            id={`transaction-${action}-reason`}
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder={
              isRefundRequired
                ? "Nhập lý do cần hoàn tiền..."
                : "Nhập lý do hủy nếu cần..."
            }
            className="min-h-24 w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
          />
        </div>

        {errorMessage ? (
          <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{errorMessage}</p>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Đóng
          </Button>
          <Button
            variant={isRefundRequired ? "default" : "destructive"}
            isLoading={isSubmitting}
            onClick={onConfirm}
          >
            {buttonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RefundDetailDialog({
  errorMessage,
  isLoading,
  open,
  refund,
  onOpenChange,
}: RefundDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-warning/20 bg-warning/10 text-warning">
              <RotateCcw className="size-5" />
            </span>
            <div className="min-w-0 space-y-1">
              <DialogTitle>Chi tiết hoàn tiền</DialogTitle>
              <DialogDescription>
                Thông tin yêu cầu hoàn tiền.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={`refund-detail-skeleton-${index}`} className="space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-5 w-full animate-pulse rounded bg-muted/60" />
              </div>
            ))}
          </div>
        ) : errorMessage ? (
          <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{errorMessage}</p>
          </div>
        ) : refund ? (
          <div className="space-y-4 py-1">
            <div className="rounded-xl border border-border bg-muted/15 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-base font-semibold text-foreground">
                    {refund.refundNumber}
                  </p>
                  <p className="font-mono text-xs tabular-nums text-muted-foreground">
                    {refund.id}
                  </p>
                </div>
                <RefundStatusBadge status={refund.status} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailTile
                label="Số tiền"
                value={
                  <span className="tabular-nums">
                    {formatTransactionMoney(refund.amount, refund.currency)}
                  </span>
                }
              />
              <DetailTile label="Phương thức" value={refund.refundMethod} />
              <DetailTile label="Đơn hàng" value={refund.orderNumber} />
              <DetailTile label="Yêu cầu lúc" value={formatTransactionDate(refund.requestedAt)} />
              <DetailTile label="Đã xử lý lúc" value={formatTransactionDate(refund.processedAt)} />
              <DetailTile label="Từ chối lúc" value={formatTransactionDate(refund.rejectedAt)} />
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Lý do
              </p>
              <p className="mt-2 text-sm text-foreground">{refund.reason}</p>
              {refund.note ? (
                <p className="mt-2 text-sm text-muted-foreground">{refund.note}</p>
              ) : null}
            </div>

            {refund.lastErrorCode || refund.lastErrorMessage ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-destructive">
                  Lỗi gần nhất
                </p>
                <p className="mt-2 text-sm text-destructive">
                  {refund.lastErrorCode ? `${refund.lastErrorCode}: ` : ""}
                  {refund.lastErrorMessage || "Không có mô tả lỗi."}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <DialogFooter className="bg-background" showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
