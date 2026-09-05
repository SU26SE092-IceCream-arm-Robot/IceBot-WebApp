"use client";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
} from "lucide-react";

import {
  OrderActionDialog,
  RefundDetailDialog,
  TransactionDetailDialog,
} from "@/components/features/transactions/orders/transaction-dialogs";
import {
  CancelRefundDialog,
  ProcessRefundDialog,
  RejectRefundDialog,
  RequestRefundDialog,
} from "@/components/features/transactions/refunds/refund-action-dialogs";
import { OrderItemFulfillmentDialog } from "@/components/features/transactions/execution/order-item-fulfillment-dialog";
import { ProductionIncidentsPanel } from "@/components/features/transactions/incidents/production-incidents-panel";
import { PaymentInterventionsPanel } from "@/components/features/transactions/payments/payment-interventions-panel";
import {
  REFUND_STATUS_LABELS,
  RefundsTable,
} from "@/components/features/transactions/refunds/refunds-table";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  TransactionsTable,
} from "@/components/features/transactions/orders/transactions-table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/identity/use-auth";
import { useTransactions } from "@/hooks/transactions/use-transactions";
import { useOrderItemFulfillment } from "@/hooks/transactions/use-order-item-fulfillment";
import { hasPermission } from "@/lib/rbac";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  OrderStatus,
  OrderStatusFilter,
  PaymentStatus,
  PaymentStatusFilter,
  RefundStatus,
  RefundStatusFilter,
} from "@/types/transactions/transactions";
import { useState } from "react";

const ORDER_STATUS_OPTIONS: { value: OrderStatusFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả trạng thái đơn" },
  ...(Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][]).map(
    ([value, label]) => ({ value, label }),
  ),
];

const PAYMENT_STATUS_OPTIONS: { value: PaymentStatusFilter; label: string }[] =
  [
    { value: "ALL", label: "Tất cả thanh toán" },
    ...(Object.entries(PAYMENT_STATUS_LABELS) as [PaymentStatus, string][]).map(
      ([value, label]) => ({ value, label }),
    ),
  ];

const REFUND_STATUS_OPTIONS: { value: RefundStatusFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả trạng thái hoàn tiền" },
  ...(Object.entries(REFUND_STATUS_LABELS) as [RefundStatus, string][]).map(
    ([value, label]) => ({ value, label }),
  ),
];

function isOrderStatusFilter(value: string | null): value is OrderStatusFilter {
  return ORDER_STATUS_OPTIONS.some((option) => option.value === value);
}

function isPaymentStatusFilter(
  value: string | null,
): value is PaymentStatusFilter {
  return PAYMENT_STATUS_OPTIONS.some((option) => option.value === value);
}

function isRefundStatusFilter(
  value: string | null,
): value is RefundStatusFilter {
  return REFUND_STATUS_OPTIONS.some((option) => option.value === value);
}

type TransactionsTab =
  "orders" | "refunds" | "incidents" | "payment-interventions";

function TransactionsLoadingTable() {
  return (
    <div className="space-y-3 px-4 py-4 md:space-y-1 md:px-5 md:py-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`transactions-skeleton-${index}`}
          className="grid grid-cols-2 items-center gap-3 rounded-lg border border-border p-4 md:grid-cols-6 md:gap-4 md:rounded-none md:border-x-0 md:border-t-0 md:py-4 md:last:border-b-0"
        >
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-muted/50" />
            <div className="h-3 w-44 animate-pulse rounded bg-muted/30" />
          </div>
          <div className="h-4 w-20 animate-pulse justify-self-end rounded bg-muted/30 md:justify-self-auto" />
          <div className="h-5 w-24 animate-pulse rounded-full bg-muted/40" />
          <div className="h-5 w-24 animate-pulse justify-self-end rounded-full bg-muted/40 md:justify-self-auto" />
          <div className="hidden h-4 w-20 animate-pulse rounded bg-muted/30 md:block" />
          <div className="hidden h-8 w-8 animate-pulse rounded-lg bg-muted/40 md:block" />
        </div>
      ))}
    </div>
  );
}

export default function TransactionsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRequestRefundOpen, setIsRequestRefundOpen] = useState(false);
  const [isProcessRefundOpen, setIsProcessRefundOpen] = useState(false);
  const [isRejectRefundOpen, setIsRejectRefundOpen] = useState(false);
  const [isCancelRefundOpen, setIsCancelRefundOpen] = useState(false);
  const { effectiveAccess } = useAuth();
  const canManageRefunds = hasPermission(effectiveAccess, "refunds.manage");
  const canManagePayments = hasPermission(effectiveAccess, "payments.manage");
  const requestedTab = searchParams.get("tab");
  const activeTab: TransactionsTab =
    requestedTab === "refunds" && canManageRefunds
      ? "refunds"
      : requestedTab === "incidents"
        ? "incidents"
        : requestedTab === "payment-interventions" && canManagePayments
          ? "payment-interventions"
          : "orders";
  const setActiveTab = (nextTab: TransactionsTab) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", nextTab);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const {
    orders,
    refunds,
    statusHistory,
    filters,
    refundFilters,
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
    refreshWarningMessage,
    isRefreshRetrying,
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
    retryPostMutationRefresh,
    clearActionSuccessMessage,
    applyOrderUpdate,
    refresh,
  } = useTransactions({ canManageRefunds });
  const fulfillment = useOrderItemFulfillment(applyOrderUpdate);
  const canManageOrders = hasPermission(effectiveAccess, "orders.manage");
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

      {refreshWarningMessage ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>{refreshWarningMessage}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            isLoading={isRefreshRetrying}
            onClick={() => void retryPostMutationRefresh()}
          >
            <RefreshCw className="size-4" />
            Tải lại dữ liệu
          </Button>
        </div>
      ) : null}

      <PageHeader
        title="Giao dịch"
        description="Theo dõi đơn hàng, thanh toán, hoàn tiền và các ngoại lệ cần nhân sự xử lý."
        actions={
          <Button
            variant="outline"
            onClick={() => void refresh()}
            isLoading={orders.isLoading || refunds.isLoading}
          >
            <RefreshCw className="size-4" />
            Làm mới
          </Button>
        }
      />

      <div
        className="flex max-w-full overflow-x-auto border-b border-border"
        role="group"
        aria-label="Nhóm dữ liệu giao dịch"
      >
        <button
          type="button"
          aria-pressed={activeTab === "orders"}
          className={`min-h-11 shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "orders"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("orders")}
        >
          Đơn hàng
        </button>
        {canManageRefunds ? (
          <button
            type="button"
            aria-pressed={activeTab === "refunds"}
            className={`min-h-11 shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "refunds"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("refunds")}
          >
            Hoàn tiền
          </button>
        ) : null}
        <button
          type="button"
          aria-pressed={activeTab === "incidents"}
          className={`min-h-11 shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "incidents"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("incidents")}
        >
          Sự cố sản xuất
        </button>
        {canManagePayments ? (
          <button
            type="button"
            aria-pressed={activeTab === "payment-interventions"}
            className={`min-h-11 shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "payment-interventions"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("payment-interventions")}
          >
            Can thiệp thanh toán
          </button>
        ) : null}
      </div>

      {activeTab === "incidents" ? (
        <Card className="rounded-xl border border-border bg-card shadow-none">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-10 items-center justify-center rounded-xl border border-warning/20 bg-warning/10 text-warning">
                <ShieldAlert className="size-5" />
              </span>
              <CardTitle className="text-base">
                Điều phối sự cố sản xuất
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <ProductionIncidentsPanel enabled={activeTab === "incidents"} />
          </CardContent>
        </Card>
      ) : activeTab === "payment-interventions" ? (
        <Card className="rounded-xl border border-border bg-card shadow-none">
          <CardContent className="p-5">
            <PaymentInterventionsPanel enabled />
          </CardContent>
        </Card>
      ) : (
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
                    aria-label="Tìm kiếm đơn hàng"
                    type="search"
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
                  <SelectTrigger
                    aria-label="Lọc trạng thái đơn hàng"
                    className="h-9 w-full bg-card"
                  >
                    <SelectValue>
                      {ORDER_STATUS_OPTIONS.find(
                        (option) => option.value === filters.status,
                      )?.label ?? "Tất cả trạng thái đơn"}
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
                  <SelectTrigger
                    aria-label="Lọc trạng thái thanh toán"
                    className="h-9 w-full bg-card"
                  >
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
                    aria-label="Tìm kiếm hoàn tiền"
                    type="search"
                    value={refundFilters.searchTerm}
                    onChange={(event) =>
                      setRefundSearchTerm(event.target.value)
                    }
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
                  <SelectTrigger
                    aria-label="Lọc trạng thái hoàn tiền"
                    className="h-9 w-full bg-card"
                  >
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearRefundFilters}
                >
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
                  <p className="text-sm text-muted-foreground">
                    {orders.errorMessage}
                  </p>
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
                  <p className="text-sm text-muted-foreground">
                    {refunds.errorMessage}
                  </p>
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
                  <p className="text-base font-semibold tracking-tight text-foreground">
                    Không tìm thấy giao dịch
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Không có giao dịch nào phù hợp. Thử thay đổi từ khóa, trạng
                    thái đơn hoặc trạng thái thanh toán.
                  </p>
                </div>
              </div>
            ) : activeTab === "refunds" && refunds.data.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <span className="mb-4 flex size-14 items-center justify-center rounded-full border border-border bg-muted/20 text-muted-foreground shadow-sm">
                  <RotateCcw className="size-6 opacity-70" />
                </span>
                <div className="max-w-md space-y-1.5">
                  <p className="text-base font-semibold tracking-tight text-foreground">
                    Không tìm thấy hoàn tiền
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Không có dữ liệu hoàn tiền nào phù hợp. Thử thay đổi từ khóa
                    hoặc trạng thái hoàn tiền.
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
                {activeTab === "orders"
                  ? orders.pagination.page
                  : refunds.pagination.page}
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
                onClick={
                  activeTab === "orders" ? previousPage : previousRefundPage
                }
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
      )}

      <TransactionDetailDialog
        canRequestRefund={canManageRefunds}
        canManageFulfillment={canManageOrders}
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
        onFulfillmentClick={(item) => {
          if (selectedOrder) fulfillment.open(selectedOrder, item);
        }}
      />

      <OrderItemFulfillmentDialog
        key={fulfillment.intent?.item.id ?? "no-fulfillment-item"}
        item={fulfillment.intent?.item ?? null}
        open={fulfillment.isOpen}
        isSubmitting={fulfillment.isSubmitting}
        errorMessage={fulfillment.errorMessage}
        onOpenChange={fulfillment.setOpen}
        onSubmit={fulfillment.submit}
      />

      <RefundDetailDialog
        canManageRefunds={canManageRefunds}
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
