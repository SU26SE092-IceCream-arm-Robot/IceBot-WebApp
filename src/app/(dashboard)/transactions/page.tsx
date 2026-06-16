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

import { TransactionDetailDialog } from "@/components/features/transactions/transaction-dialogs";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  TransactionsTable,
} from "@/components/features/transactions/transactions-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTransactions } from "@/hooks/use-transactions";
import type {
  OrderStatus,
  OrderStatusFilter,
  PaymentStatus,
  PaymentStatusFilter,
} from "@/types/transactions";

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

function isOrderStatusFilter(value: string | null): value is OrderStatusFilter {
  return ORDER_STATUS_OPTIONS.some((option) => option.value === value);
}

function isPaymentStatusFilter(
  value: string | null,
): value is PaymentStatusFilter {
  return PAYMENT_STATUS_OPTIONS.some((option) => option.value === value);
}

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
  supportingText,
  tone,
  value,
}: {
  icon: typeof ReceiptText;
  label: string;
  supportingText: string;
  tone: StatTone;
  value: number;
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
        <p className="mt-1 text-xs text-muted-foreground">{supportingText}</p>
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
  const {
    orders,
    statusHistory,
    filters,
    summary,
    selectedOrder,
    isDetailOpen,
    isDetailLoading,
    detailErrorMessage,
    setSearchTerm,
    setStatusFilter,
    setPaymentStatusFilter,
    clearFilters,
    previousPage,
    nextPage,
    previousHistoryPage,
    nextHistoryPage,
    openOrderDetail,
    setDetailOpen,
    refresh,
  } = useTransactions();

  return (
    <div className="space-y-7">
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
          label="Tổng giao dịch"
          value={summary.total}
          supportingText="Theo kết quả đang lọc"
          tone="primary"
        />
        <StatCard
          icon={CreditCard}
          label="Đã thanh toán"
          value={summary.paidOnPage}
          supportingText="Trong trang dữ liệu hiện tại"
          tone="success"
        />
        <StatCard
          icon={RotateCcw}
          label="Cần hoàn tiền"
          value={summary.refundRequiredOnPage}
          supportingText="Đơn cần xử lý thủ công"
          tone="warning"
        />
        <StatCard
          icon={XCircle}
          label="Thất bại / hủy"
          value={summary.failedOrCancelledOnPage}
          supportingText="Trong trang dữ liệu hiện tại"
          tone="destructive"
        />
      </section>

      <Card className="rounded-xl border border-border bg-card shadow-none">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <ReceiptText className="size-5" />
            </span>
            <div>
              <CardTitle className="text-base">Danh sách giao dịch</CardTitle>
              <CardDescription>
                Dữ liệu thật từ Management Orders API, chỉ hiển thị read-only trong phase này.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="border-b border-border p-4">
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
        </CardContent>

        <div>
          {orders.isLoading ? (
            <TransactionsLoadingTable />
          ) : orders.errorMessage ? (
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
          ) : orders.data.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted/20 text-muted-foreground">
                <ReceiptText className="size-5" />
              </span>
              <p className="text-sm font-medium text-foreground">
                Không có giao dịch phù hợp
              </p>
              <p className="text-sm text-muted-foreground">
                Thử thay đổi từ khóa, trạng thái đơn hoặc trạng thái thanh toán.
              </p>
            </div>
          ) : (
            <TransactionsTable
              orders={orders.data}
              onViewDetail={(orderId) => void openOrderDetail(orderId)}
            />
          )}
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-border px-5 py-4 text-sm sm:flex-row sm:items-center">
          <p className="text-muted-foreground">
            Trang{" "}
            <span className="tabular-nums font-medium text-foreground">
              {orders.pagination.page}
            </span>{" "}
            /{" "}
            <span className="tabular-nums font-medium text-foreground">
              {Math.max(orders.pagination.totalPages, 1)}
            </span>
            {" - "}
            <span className="tabular-nums font-medium text-foreground">
              {orders.pagination.totalCount}
            </span>{" "}
            giao dịch
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!orders.pagination.hasPrevious || orders.isLoading}
              onClick={previousPage}
            >
              <ChevronLeft className="size-4" />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!orders.pagination.hasNext || orders.isLoading}
              onClick={nextPage}
            >
              Sau
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </Card>

      <TransactionDetailDialog
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
      />
    </div>
  );
}
