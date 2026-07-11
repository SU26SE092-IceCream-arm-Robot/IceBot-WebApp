import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardRecentOrder } from "@/types/dashboard-overview";

const ORDER_STATUS_LABELS: Record<string, string> = {
  Draft: "Nháp",
  PendingPayment: "Chờ thanh toán",
  Paid: "Đã thanh toán",
  ReadyForExecution: "Chờ xử lý",
  Accepted: "Đã tiếp nhận",
  Preparing: "Đang chuẩn bị",
  Ready: "Sẵn sàng nhận",
  Completed: "Hoàn tất",
  Cancelled: "Đã hủy",
  Failed: "Thất bại",
  ExecutionRejected: "Từ chối thực thi",
  RefundRequired: "Cần hoàn tiền",
  Refunded: "Đã hoàn tiền",
  Compensated: "Đã bù trừ",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  Unpaid: "Chưa thanh toán",
  Authorized: "Đã ủy quyền",
  Paid: "Đã thanh toán",
  PartiallyRefunded: "Hoàn tiền một phần",
  Refunded: "Đã hoàn tiền",
  Failed: "Thất bại",
  Cancelled: "Đã hủy",
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Không rõ";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getOrderStatusLabel(status: string) {
  return ORDER_STATUS_LABELS[status] ?? status;
}

function getPaymentStatusLabel(status: string) {
  return PAYMENT_STATUS_LABELS[status] ?? status;
}

interface DashboardRecentOrdersProps {
  orders: DashboardRecentOrder[];
}

export function DashboardRecentOrders({ orders }: DashboardRecentOrdersProps) {
  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          Đơn hàng gần đây
        </CardTitle>
        <p className="text-xs leading-5 text-muted-foreground">
          Dữ liệu lấy từ order overview của backend, không suy diễn trạng thái.
        </p>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/10 px-4 py-8 text-center text-sm text-muted-foreground">
            Chưa có đơn hàng gần đây trong phạm vi quản lý.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-3 pr-4 text-left font-semibold">Đơn hàng</th>
                  <th className="px-4 py-3 text-left font-semibold">Kiosk</th>
                  <th className="px-4 py-3 text-center font-semibold">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">
                    Thanh toán
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Tổng tiền
                  </th>
                  <th className="py-3 pl-4 text-right font-semibold">
                    Thời gian
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.orderId}>
                    <td className="py-3 pr-4 font-medium text-foreground">
                      {order.orderNumber || order.orderId}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {order.kioskCode || "Không rõ"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="secondary">
                        {getOrderStatusLabel(order.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline">
                        {getPaymentStatusLabel(order.paymentStatus)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-foreground">
                      {formatMoney(order.totalAmount)}
                    </td>
                    <td className="py-3 pl-4 text-right text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
