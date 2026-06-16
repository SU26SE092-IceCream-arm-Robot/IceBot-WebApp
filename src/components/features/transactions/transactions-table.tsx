import { Eye, Headset, ReceiptText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  OrderResult,
  OrderStatus,
  PaymentStatus,
} from "@/types/transactions";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  Draft: "Nháp",
  PendingPayment: "Chờ thanh toán",
  Paid: "Đã thanh toán",
  ReadyForExecution: "Sẵn sàng xử lý",
  Accepted: "Đã nhận",
  Preparing: "Đang chuẩn bị",
  Ready: "Sẵn sàng",
  Completed: "Hoàn tất",
  Cancelled: "Đã hủy",
  Failed: "Thất bại",
  ExecutionRejected: "Từ chối xử lý",
  RefundRequired: "Cần hoàn tiền",
  Refunded: "Đã hoàn tiền",
  Compensated: "Đã bồi hoàn",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  Unpaid: "Chưa thanh toán",
  Authorized: "Đã xác thực",
  Paid: "Đã thanh toán",
  PartiallyRefunded: "Hoàn tiền một phần",
  Refunded: "Đã hoàn tiền",
  Failed: "Thất bại",
  Cancelled: "Đã hủy",
};

const ORDER_STATUS_CLASS_NAMES: Record<OrderStatus, string> = {
  Draft: "border-border bg-muted/20 text-muted-foreground",
  PendingPayment: "border-warning/20 bg-warning/10 text-warning",
  Paid: "border-primary/20 bg-primary/10 text-primary",
  ReadyForExecution: "border-primary/20 bg-primary/10 text-primary",
  Accepted: "border-primary/20 bg-primary/10 text-primary",
  Preparing: "border-warning/20 bg-warning/10 text-warning",
  Ready: "border-success/20 bg-success/10 text-success",
  Completed: "border-success/20 bg-success/10 text-success",
  Cancelled: "border-border bg-muted/20 text-muted-foreground",
  Failed: "border-destructive/20 bg-destructive/10 text-destructive",
  ExecutionRejected: "border-destructive/20 bg-destructive/10 text-destructive",
  RefundRequired: "border-warning/20 bg-warning/10 text-warning",
  Refunded: "border-primary/20 bg-primary/10 text-primary",
  Compensated: "border-success/20 bg-success/10 text-success",
};

const PAYMENT_STATUS_CLASS_NAMES: Record<PaymentStatus, string> = {
  Unpaid: "border-warning/20 bg-warning/10 text-warning",
  Authorized: "border-primary/20 bg-primary/10 text-primary",
  Paid: "border-success/20 bg-success/10 text-success",
  PartiallyRefunded: "border-warning/20 bg-warning/10 text-warning",
  Refunded: "border-primary/20 bg-primary/10 text-primary",
  Failed: "border-destructive/20 bg-destructive/10 text-destructive",
  Cancelled: "border-border bg-muted/20 text-muted-foreground",
};

export function formatTransactionMoney(
  value: number,
  currency = "VND",
): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
  }).format(value);
}

export function formatTransactionDate(value: string | null | undefined): string {
  if (!value) {
    return "Chưa có";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge
      variant="outline"
      className={`h-6 rounded-full px-2.5 ${ORDER_STATUS_CLASS_NAMES[status]}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge
      variant="outline"
      className={`h-6 rounded-full px-2.5 ${PAYMENT_STATUS_CLASS_NAMES[status]}`}
    >
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  );
}

interface TransactionsTableProps {
  orders: OrderResult[];
  onViewDetail: (orderId: string) => void;
}

export function TransactionsTable({
  orders,
  onViewDetail,
}: TransactionsTableProps) {
  return (
    <Table className="min-w-[1120px] table-fixed">
      <TableHeader className="bg-muted/40">
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[22%] px-4">Đơn hàng</TableHead>
          <TableHead className="w-[13%] text-center">Kiosk</TableHead>
          <TableHead className="w-[15%] text-center">Trạng thái</TableHead>
          <TableHead className="w-[15%] text-center">Thanh toán</TableHead>
          <TableHead className="w-[13%] text-right">Tổng tiền</TableHead>
          <TableHead className="w-[14%] text-center">Hỗ trợ</TableHead>
          <TableHead className="w-[8%] px-4 text-center">Chi tiết</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id} className="hover:bg-muted/30">
            <TableCell className="h-16 px-4 py-2.5">
              <div className="min-w-0 space-y-0.5">
                <p className="truncate font-medium text-foreground">
                  {order.orderNumber}
                </p>
                <p className="truncate text-xs tabular-nums text-muted-foreground">
                  {formatTransactionDate(order.placedAt)}
                </p>
              </div>
            </TableCell>
            <TableCell className="py-2.5 text-center">
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {order.kioskId.slice(0, 8)}
              </span>
            </TableCell>
            <TableCell className="py-2.5 text-center">
              <div className="flex justify-center">
                <OrderStatusBadge status={order.status} />
              </div>
            </TableCell>
            <TableCell className="py-2.5 text-center">
              <div className="flex justify-center">
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
            </TableCell>
            <TableCell className="py-2.5 text-right font-medium tabular-nums">
              {formatTransactionMoney(order.totalAmount, order.currency)}
            </TableCell>
            <TableCell className="py-2.5 text-center">
              {order.requiresStaffSupport ? (
                <Badge
                  variant="outline"
                  className="gap-1 border-warning/20 bg-warning/10 text-warning"
                >
                  <Headset className="size-3" />
                  Cần hỗ trợ
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="gap-1 border-success/20 bg-success/10 text-success"
                >
                  <ReceiptText className="size-3" />
                  Ổn định
                </Badge>
              )}
            </TableCell>
            <TableCell className="px-4 py-2.5 text-center">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                title={`Xem chi tiết ${order.orderNumber}`}
                aria-label={`Xem chi tiết ${order.orderNumber}`}
                onClick={() => onViewDetail(order.id)}
              >
                <Eye className="size-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
