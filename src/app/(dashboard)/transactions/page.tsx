"use client";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react";

import {
  OrderActionDialog,
  RefundDetailDialog,
  TransactionDetailDialog,
} from "@/components/features/transactions/transaction-dialogs";
import {
  CancelRefundDialog,
  ProcessRefundDialog,
  RejectRefundDialog,
  RequestRefundDialog,
} from "@/components/features/transactions/refund-action-dialogs";
import {
  REFUND_STATUS_LABELS,
  RefundsTable,
} from "@/components/features/transactions/refunds-table";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  TransactionsTable,
} from "@/components/features/transactions/transactions-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useTransactions } from "@/hooks/use-transactions";
import type {
  OrderStatus,
  OrderStatusFilter,
  PaymentStatus,
  PaymentStatusFilter,
  RefundStatus,
  RefundStatusFilter,
} from "@/types/transactions";
import { useState } from "react";

const ORDER_STATUS_OPTIONS: { value: OrderStatusFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả trạng thái đơn" },
  ...(
    Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][]
  ).map(([value, label]) => ({ value, label })),
];

const PAYMENT_STATUS_OPTIONS: { value: PaymentStatusFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả thanh toán" },
  ...(
    Object.entries(PAYMENT_STATUS_LABELS) as [PaymentStatus, string][]
  ).map(([value, label]) => ({ value, label })),
];

const REFUND_STATUS_OPTIONS: { value: RefundStatusFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả trạng thái hoàn tiền" },
  ...(
    Object.entries(REFUND_STATUS_LABELS) as [RefundStatus, string][]
  ).map(([value, label]) => ({ value, label })),
];

function isOrderStatusFilter(value: string | null): value is OrderStatusFilter {
  return ORDER_STATUS_OPTIONS.some((option) => option.value === value);
}

function isPaymentStatusFilter(
  value: string | null,
): value is PaymentStatusFilter {
  return PAYMENT_STATUS_OPTIONS.some((option) => option.value === value);
}

function isRefundStatusFilter(value: string | null): value is RefundStatusFilter {
  return REFUND_STATUS_OPTIONS.some((option) => option.value === value);
}

type TransactionsTab = "orders" | "refunds";

type StatTone = "primary" | "success" | "warning" | "destructive";

const STAT_TONES: Record<StatTone, { iconClassName: string; valueClassName: string }> = {
  primary: {
    iconClassName: "border-primary/20 bg-primary/10 text-primary",
    valueClassName: "text-foreground",
  },
  success: {
    iconClassName: "border-success/20 bg-success/10 text-success",
    valueClassName: "text-success",
  },
  warning: {
    iconClassName: "border-warning/20 bg-warning/10 text-warning",
    valueClassName: "text-warning",
  },
  destructive: {
    iconClassName: "border-destructive/20 bg-destructive/10 text-destructive",
    valueClassName: "text-destructive",
  },
};

function StatCard({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: typeof ReceiptText;
  label: string;
  tone: StatTone;
  value: number | string;
}) {
  const toneClasses = STAT_TONES[tone];

  return (
    <Card className="rounded-xl border border-border/80 bg-card shadow-none">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${toneClasses.iconClassName}`}
          >
            <Icon className="size-5" />
          </span>
        </div>
        <p className={`tabular-nums text-3xl font-semibold tracking-tight ${toneClasses.valueClassName}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function TransactionsLoadingTable() {
  return (
    <div className="space-y-1 px-5 py-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`transactions-skeleton-${index}`}
          className="grid grid-cols-6 items-center gap-4 border-b border-border py-4 last:border-0"
        >
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-muted/50" />
            <div className="h-3 w-44 animate-pulse rounded bg-muted/30" />
          </div>
          <div className="h-4 w-20 animate-pulse rounded bg-muted/30" />
          <div className="h-5 w-24 animate-pulse rounded-full bg-muted/40" />
          <div className="h-5 w-24 animate-pulse rounded-full bg-muted/40" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted/30" />
          <div className="h-8 w-8 animate-pulse rounded-lg bg-muted/40" />
        </div>
      ))}
    </div>
  );
}

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState<TransactionsTab>("orders");
  const [isRequestRefundOpen, setIsRequestRefundOpen] = useState(false);
  const [isProcessRefundOpen, setIsProcessRefundOpen] = useState(false);
  const [isRejectRefundOpen, setIsRejectRefundOpen] = useState(false);
  const [isCancelRefundOpen, setIsCancelRefundOpen] = useState(false);
  const { currentUser } = useAuth();
  const {
    orders,
    refunds,
    statusHistory,
    filters,
    refundFilters,
    summary,
    refundsSummary,
    selectedOrder,
    selectedRefund,
    isDetailOpen,
    isDetailLoading,
    detailErrorMessage,
    isRefundDetailOpen,
    isRefundDetailLoading,
    refundDetailErrorMessage,
    orderPendingAction,
    actionReason,
    actionErrorMessage,
    actionSuccessMessage,
    isCancelOpen,
    isRefundRequiredOpen,
    isActionSubmitting,
    setSearchTerm,
    setStatusFilter,
    setPaymentStatusFilter,
    setRefundSearchTerm,
    setRefundStatusFilter,
    clearFilters,
    clearRefundFilters,
    previousPage,
    nextPage,
    previousRefundPage,
    nextRefundPage,
    previousHistoryPage,
    nextHistoryPage,
    openOrderDetail,
    openRefundDetail,
    setDetailOpen,
    setRefundDetailOpen,
    requestCancelOrder,
    requestRefundRequired,
    setActionReason,
    setCancelOpen,
    setRefundRequiredOpen,
    confirmCancelOrder,
    confirmRefundRequired,
    submitRefundRequest,
    submitRefundProcessed,
    submitRefundReject,
    submitRefundCancel,
    clearActionSuccessMessage,
    refresh,
  } = useTransactions();
  const canManageOrders =
    currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";
  return (
    <div className="space-y-7">
      {actionSuccessMessage ? (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success"
        >
          <span>{actionSuccessMessage}</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-success hover:bg-success/10 hover:text-success"
            onClick={clearActionSuccessMessage}
          >
            Đóng
          </Button>
        </div>
      ) : null}

      <section className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Giao dịch
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Theo dõi đơn hàng, thanh toán và trạng thái xử lý trong hệ thống IceBot.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void refresh()}
          isLoading={orders.isLoading}
        >
          <RefreshCw className="size-4" />
          Làm mới
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ReceiptText}
          label={activeTab === "orders" ? "Tổng giao dịch" : "Tổng hoàn tiền"}
          value={activeTab === "orders" ? summary.total : refundsSummary.total}
          tone="primary"
        />
        <StatCard
          icon={CreditCard}
          label={activeTab === "orders" ? "Đã thanh toán" : "Đã xử lý"}
          value={
            activeTab === "orders"
              ? summary.paidOnPage
              : refundsSummary.processedOnPage
          }
          tone="success"
        />
        <StatCard
          icon={RotateCcw}
          label={activeTab === "orders" ? "Cần hoàn tiền" : "Đã yêu cầu"}
          value={
            activeTab === "orders"
              ? summary.refundRequiredOnPage
              : refundsSummary.requestedOnPage
          }
          tone="warning"
        />
        <StatCard
          icon={XCircle}
          label={activeTab === "orders" ? "Thất bại / hủy" : "Lỗi / từ chối"}
          value={
            activeTab === "orders"
              ? summary.failedOrCancelledOnPage
              : refundsSummary.failedOrRejectedOnPage
          }
          tone="destructive"
        />
      </section>

      <div className="inline-flex w-fit rounded-lg border border-border bg-card p-1">
        <button
          type="button"
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "orders"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          }`}
          onClick={() => setActiveTab("orders")}
        >
          Đơn hàng
        </button>
        <button
          type="button"
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "refunds"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          }`}
          onClick={() => setActiveTab("refunds")}
        >
          Hoàn tiền
        </button>
      </div>

      <Card className="rounded-xl border border-border bg-card shadow-none">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <ReceiptText className="size-5" />
            </span>
            <div>
              <CardTitle className="text-base">Danh sách giao dịch</CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="border-b border-border p-4">
          {activeTab === "orders" ? (
            <div className="grid gap-2 xl:grid-cols-[minmax(260px,1fr)_220px_220px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={filters.searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Tìm mã đơn, kiosk hoặc trạng thái..."
                  className="h-9 bg-card pl-9 text-sm"
                />
              </div>
              <Select
                value={filters.status}
                onValueChange={(value) => {
                  if (isOrderStatusFilter(value)) {
                    setStatusFilter(value);
                  }
                }}
              >
                <SelectTrigger className="h-9 w-full bg-card">
                  <SelectValue>
                    {ORDER_STATUS_OPTIONS.find((option) => option.value === filters.status)?.label ??
                      "Tất cả trạng thái đơn"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.paymentStatus}
                onValueChange={(value) => {
                  if (isPaymentStatusFilter(value)) {
                    setPaymentStatusFilter(value);
                  }
                }}
              >
                <SelectTrigger className="h-9 w-full bg-card">
                  <SelectValue>
                    {PAYMENT_STATUS_OPTIONS.find(
                      (option) => option.value === filters.paymentStatus,
                    )?.label ?? "Tất cả thanh toán"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Xóa lọc
              </Button>
            </div>
          ) : (
            <div className="grid gap-2 lg:grid-cols-[minmax(260px,1fr)_260px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={refundFilters.searchTerm}
                  onChange={(event) => setRefundSearchTerm(event.target.value)}
                  placeholder="Tìm mã hoàn tiền, đơn hàng hoặc lý do..."
                  className="h-9 bg-card pl-9 text-sm"
                />
              </div>
              <Select
                value={refundFilters.status}
                onValueChange={(value) => {
                  if (isRefundStatusFilter(value)) {
                    setRefundStatusFilter(value);
                  }
                }}
              >
                <SelectTrigger className="h-9 w-full bg-card">
                  <SelectValue>
                    {REFUND_STATUS_OPTIONS.find(
                      (option) => option.value === refundFilters.status,
                    )?.label ?? "Tất cả trạng thái hoàn tiền"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {REFUND_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={clearRefundFilters}>
                Xóa lọc
              </Button>
            </div>
          )}
        </CardContent>

        <div>
          {activeTab === "orders" && orders.isLoading ? (
            <TransactionsLoadingTable />
          ) : activeTab === "refunds" && refunds.isLoading ? (
            <TransactionsLoadingTable />
          ) : activeTab === "orders" && orders.errorMessage ? (
            <div className="flex flex-col items-center gap-4 p-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="size-5" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">
                  Không thể tải giao dịch
                </p>
                <p className="text-sm text-muted-foreground">{orders.errorMessage}</p>
              </div>
              <Button variant="destructive" onClick={() => void refresh()}>
                Thử lại
              </Button>
            </div>
          ) : activeTab === "refunds" && refunds.errorMessage ? (
            <div className="flex flex-col items-center gap-4 p-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="size-5" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">
                  Không thể tải hoàn tiền
                </p>
                <p className="text-sm text-muted-foreground">{refunds.errorMessage}</p>
              </div>
              <Button variant="destructive" onClick={() => void refresh()}>
                Thử lại
              </Button>
            </div>
          ) : activeTab === "orders" && orders.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <span className="mb-4 flex size-14 items-center justify-center rounded-full border border-border bg-muted/20 text-muted-foreground shadow-sm">
                <ReceiptText className="size-6 opacity-70" />
              </span>
              <div className="max-w-md space-y-1.5">
                <p className="text-base font-semibold tracking-tight text-foreground">Không tìm thấy giao dịch</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Không có giao dịch nào phù hợp. Thử thay đổi từ khóa, trạng thái đơn hoặc trạng thái thanh toán.
                </p>
              </div>
            </div>
          ) : activeTab === "refunds" && refunds.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <span className="mb-4 flex size-14 items-center justify-center rounded-full border border-border bg-muted/20 text-muted-foreground shadow-sm">
                <RotateCcw className="size-6 opacity-70" />
              </span>
              <div className="max-w-md space-y-1.5">
                <p className="text-base font-semibold tracking-tight text-foreground">Không tìm thấy hoàn tiền</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Không có dữ liệu hoàn tiền nào phù hợp. Thử thay đổi từ khóa hoặc trạng thái hoàn tiền.
                </p>
              </div>
            </div>
          ) : activeTab === "orders" ? (
            <TransactionsTable
              orders={orders.data}
              canManageOrders={canManageOrders}
              onCancelOrder={requestCancelOrder}
              onMarkRefundRequired={requestRefundRequired}
              onViewDetail={(orderId) => void openOrderDetail(orderId)}
            />
          ) : (
            <RefundsTable
              refunds={refunds.data}
              onViewDetail={(refundId) => void openRefundDetail(refundId)}
            />
          )}
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-border px-5 py-4 text-sm sm:flex-row sm:items-center">
          <p className="text-muted-foreground">
            Trang{" "}
            <span className="tabular-nums font-medium text-foreground">
              {activeTab === "orders" ? orders.pagination.page : refunds.pagination.page}
            </span>{" "}
            /{" "}
            <span className="tabular-nums font-medium text-foreground">
              {Math.max(
                activeTab === "orders"
                  ? orders.pagination.totalPages
                  : refunds.pagination.totalPages,
                1,
              )}
            </span>
            {" - "}
            <span className="tabular-nums font-medium text-foreground">
              {activeTab === "orders"
                ? orders.pagination.totalCount
                : refunds.pagination.totalCount}
            </span>{" "}
            {activeTab === "orders" ? "giao dịch" : "hoàn tiền"}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={
                activeTab === "orders"
                  ? !orders.pagination.hasPrevious || orders.isLoading
                  : !refunds.pagination.hasPrevious || refunds.isLoading
              }
              onClick={activeTab === "orders" ? previousPage : previousRefundPage}
            >
              <ChevronLeft className="size-4" />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={
                activeTab === "orders"
                  ? !orders.pagination.hasNext || orders.isLoading
                  : !refunds.pagination.hasNext || refunds.isLoading
              }
              onClick={activeTab === "orders" ? nextPage : nextRefundPage}
            >
              Sau
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </Card>

      <TransactionDetailDialog
        canRequestRefund={canManageOrders}
        order={selectedOrder}
        errorMessage={detailErrorMessage}
        isLoading={isDetailLoading}
        open={isDetailOpen}
        statusHistory={statusHistory.data}
        statusHistoryErrorMessage={statusHistory.errorMessage}
        statusHistoryIsLoading={statusHistory.isLoading}
        statusHistoryPagination={statusHistory.pagination}
        onOpenChange={setDetailOpen}
        onPreviousHistoryPage={previousHistoryPage}
        onNextHistoryPage={nextHistoryPage}
        onRequestRefundClick={() => setIsRequestRefundOpen(true)}
      />

      <RefundDetailDialog
        canManageRefunds={canManageOrders}
        open={isRefundDetailOpen}
        refund={selectedRefund}
        isLoading={isRefundDetailLoading}
        errorMessage={refundDetailErrorMessage}
        onOpenChange={setRefundDetailOpen}
        onProcessClick={() => setIsProcessRefundOpen(true)}
        onRejectClick={() => setIsRejectRefundOpen(true)}
        onCancelClick={() => setIsCancelRefundOpen(true)}
      />

      <OrderActionDialog
        action="cancel"
        errorMessage={actionErrorMessage}
        isSubmitting={isActionSubmitting}
        open={isCancelOpen}
        order={orderPendingAction}
        reason={actionReason}
        onConfirm={() => void confirmCancelOrder()}
        onOpenChange={setCancelOpen}
        onReasonChange={setActionReason}
      />

      <OrderActionDialog
        action="refund-required"
        errorMessage={actionErrorMessage}
        isSubmitting={isActionSubmitting}
        open={isRefundRequiredOpen}
        order={orderPendingAction}
        reason={actionReason}
        onConfirm={confirmRefundRequired}
        onOpenChange={setRefundRequiredOpen}
        onReasonChange={setActionReason}
      />

      <RequestRefundDialog
        open={isRequestRefundOpen}
        onOpenChange={setIsRequestRefundOpen}
        order={selectedOrder}
        onSubmit={submitRefundRequest}
      />
      <ProcessRefundDialog
        open={isProcessRefundOpen}
        onOpenChange={setIsProcessRefundOpen}
        refund={selectedRefund}
        onSubmit={submitRefundProcessed}
      />
      <RejectRefundDialog
        open={isRejectRefundOpen}
        onOpenChange={setIsRejectRefundOpen}
        refund={selectedRefund}
        onSubmit={submitRefundReject}
      />
      <CancelRefundDialog
        open={isCancelRefundOpen}
        onOpenChange={setIsCancelRefundOpen}
        refund={selectedRefund}
        onSubmit={submitRefundCancel}
      />
    </div>
  );
}
