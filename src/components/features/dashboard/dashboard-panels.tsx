import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Building2,
  Clock3,
  Monitor,
  ReceiptText,
  RotateCcw,
  ServerCrash,
  Store,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type {
  DashboardMetrics,
  DashboardRecentOrder,
  DashboardStatusCount,
  InventorySummary,
  KioskStatusOverview,
  OrderOverview,
} from "@/types/dashboard-overview";

function formatTimestamp(value?: string | null): string {
  if (!value) {
    return "Chưa ghi nhận";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Chưa ghi nhận";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getKioskStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    Provisioning: "Đang cấu hình",
    Active: "Đang hoạt động",
    Offline: "Ngoại tuyến",
    Maintenance: "Bảo trì",
    Disabled: "Đã vô hiệu hóa",
    Retired: "Ngừng sử dụng",
  };

  return labels[status] ?? status;
}

function getKioskStatusBar(status: string): string {
  if (status === "Active") return "bg-primary";
  if (status === "Offline" || status === "Disabled") return "bg-destructive";
  if (status === "Maintenance") return "bg-warning";
  return "bg-muted-foreground";
}

function getInventoryStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    Unknown: "Chưa xác định",
    Low: "Sắp hết",
    Medium: "Trung bình",
    Full: "Đầy",
  };

  return labels[status] ?? status;
}

function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    Draft: "Nháp",
    PendingPayment: "Chờ thanh toán",
    Paid: "Đã thanh toán",
    ReadyForExecution: "Chờ thực hiện",
    Accepted: "Đã tiếp nhận",
    Preparing: "Đang chuẩn bị",
    Ready: "Sẵn sàng",
    Completed: "Hoàn tất",
    Cancelled: "Đã hủy",
    Failed: "Thất bại",
    ExecutionRejected: "Từ chối thực hiện",
    RefundRequired: "Cần hoàn tiền",
    Refunded: "Đã hoàn tiền",
    Compensated: "Đã bồi hoàn",
  };

  return labels[status] ?? status;
}

function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    Unpaid: "Chưa thanh toán",
    Authorized: "Đã xác thực",
    Paid: "Đã thanh toán",
    PartiallyRefunded: "Hoàn tiền một phần",
    Refunded: "Đã hoàn tiền",
    Failed: "Thất bại",
    Cancelled: "Đã hủy",
  };

  return labels[status] ?? status;
}

function getOrderStatusVariant(
  status: string,
): "default" | "destructive" | "secondary" | "outline" {
  if (status === "Completed" || status === "Paid") return "default";
  if (
    status === "Failed" ||
    status === "ExecutionRejected" ||
    status === "RefundRequired"
  ) {
    return "destructive";
  }
  if (status === "Cancelled" || status === "Refunded") return "secondary";
  return "outline";
}

function StatusSummary({
  items,
  total,
}: {
  items: DashboardStatusCount[];
  total: number;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có dữ liệu trạng thái.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const percentage = total > 0 ? (item.count / total) * 100 : 0;

        return (
          <div key={item.status} className="space-y-1.5">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-foreground">{getOrderStatusLabel(item.status)}</span>
              <span className="tabular-nums text-muted-foreground">
                {item.count.toLocaleString("vi-VN")} · {percentage.toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.max(0, Math.min(percentage, 100))}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface AttentionItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  value: number;
  tone: "neutral" | "warning" | "destructive";
}

const ATTENTION_TONES = {
  neutral: "border-border bg-muted/10 text-muted-foreground",
  warning: "border-warning/30 bg-warning/5 text-warning",
  destructive: "border-destructive/30 bg-destructive/5 text-destructive",
} as const;

function AttentionItem({ href, icon: Icon, label, value, tone }: AttentionItemProps) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 border-b border-border/70 px-5 py-4 transition-colors last:border-b-0 hover:bg-muted/20"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${ATTENTION_TONES[tone]}`}
        >
          <Icon className="size-4" />
        </span>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span
          className={cn(
            "tabular-nums text-lg font-semibold",
            tone === "destructive"
              ? "text-destructive"
              : tone === "warning"
                ? "text-warning"
                : "text-foreground",
          )}
        >
          {value.toLocaleString("vi-VN")}
        </span>
        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

export function OperationalAttentionPanel({
  metrics,
  inventory,
}: {
  metrics: DashboardMetrics;
  inventory: InventorySummary;
}) {
  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="size-4 text-warning" />
          Cần chú ý
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <AttentionItem
          href="/transactions"
          icon={Clock3}
          label="Đơn đang chờ thanh toán"
          value={metrics.pendingOrderCount}
          tone={metrics.pendingOrderCount > 0 ? "warning" : "neutral"}
        />
        <AttentionItem
          href="/transactions"
          icon={RotateCcw}
          label="Đơn cần xử lý hoàn tiền"
          value={metrics.refundRequiredOrderCount}
          tone={metrics.refundRequiredOrderCount > 0 ? "destructive" : "neutral"}
        />
        <AttentionItem
          href="/inventory"
          icon={Boxes}
          label="Hộp chứa sắp hết"
          value={inventory.lowStockCount}
          tone={inventory.lowStockCount > 0 ? "warning" : "neutral"}
        />
        <AttentionItem
          href="/inventory"
          icon={ServerCrash}
          label="Hộp chứa hết hoặc chưa xác định"
          value={inventory.emptyCount}
          tone={inventory.emptyCount > 0 ? "destructive" : "neutral"}
        />
        <AttentionItem
          href="/kiosks"
          icon={Monitor}
          label="Kiosk có vòng đời ngoại tuyến"
          value={metrics.offlineKioskCount}
          tone={metrics.offlineKioskCount > 0 ? "destructive" : "neutral"}
        />
        <AttentionItem
          href="/kiosks"
          icon={Wrench}
          label="Kiosk đang bảo trì"
          value={metrics.maintenanceKioskCount}
          tone={metrics.maintenanceKioskCount > 0 ? "warning" : "neutral"}
        />
      </CardContent>
    </Card>
  );
}

export function KioskLifecycleSummaryPanel({
  metrics,
  overview,
}: {
  metrics: DashboardMetrics;
  overview: KioskStatusOverview;
}) {
  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4 text-primary" />
            Phạm vi hệ thống
          </CardTitle>
          <Link
            href="/kiosks"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-muted-foreground",
            )}
          >
            Xem quản lý kiosk
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-muted/10 p-3">
            <Building2 className="size-4 text-muted-foreground" />
            <p className="mt-3 tabular-nums text-xl font-semibold text-foreground">
              {metrics.organizationCount.toLocaleString("vi-VN")}
            </p>
            <p className="text-xs text-muted-foreground">Tổ chức</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/10 p-3">
            <Store className="size-4 text-muted-foreground" />
            <p className="mt-3 tabular-nums text-xl font-semibold text-foreground">
              {metrics.storeCount.toLocaleString("vi-VN")}
            </p>
            <p className="text-xs text-muted-foreground">Cửa hàng</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/10 p-3">
            <Monitor className="size-4 text-muted-foreground" />
            <p className="mt-3 tabular-nums text-xl font-semibold text-foreground">
              {overview.totalCount.toLocaleString("vi-VN")}
            </p>
            <p className="text-xs text-muted-foreground">Kiosk</p>
          </div>
        </div>

        <div className="space-y-3">
          {overview.byStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có phân bổ vòng đời kiosk.
            </p>
          ) : (
            overview.byStatus.map((item) => {
              const percentage =
                overview.totalCount > 0
                  ? (item.count / overview.totalCount) * 100
                  : 0;

              return (
                <div key={item.status} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-foreground">
                      {getKioskStatusLabel(item.status)}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {item.count.toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${getKioskStatusBar(item.status)}`}
                      style={{ width: `${Math.max(0, Math.min(percentage, 100))}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function InventoryOverviewPanel({ summary }: { summary: InventorySummary }) {
  const attentionItems = summary.items
    .filter(
      (item) =>
        item.status === "Low" ||
        item.status === "Unknown" ||
        (item.estimatedQuantity !== null &&
          item.estimatedQuantity !== undefined &&
          item.estimatedQuantity <= 0),
    )
    .slice(0, 4);

  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Boxes className="size-4 text-primary" />
            Tồn kho ưu tiên
          </CardTitle>
          <Link
            href="/inventory"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-muted-foreground",
            )}
          >
            Xem tồn kho
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {attentionItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Không có hộp chứa cần chú ý.
          </p>
        ) : (
          <div className="space-y-3">
            {attentionItems.map((item) => (
              <div
                key={item.dispenserStateId}
                className="flex items-center justify-between gap-4 border-b border-border/70 pb-3 last:border-b-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.ingredientName}
                  </p>
                  <p className="text-xs text-muted-foreground">Kiosk {item.kioskCode}</p>
                </div>
                <div className="shrink-0 text-right">
                  <Badge
                    variant={
                      item.status === "Unknown" ||
                      (item.estimatedQuantity !== null &&
                        item.estimatedQuantity !== undefined &&
                        item.estimatedQuantity <= 0)
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {item.status === "Unknown"
                      ? "Hết/chưa xác định"
                      : getInventoryStatusLabel(item.status)}
                  </Badge>
                  <p className="mt-1 tabular-nums text-xs text-muted-foreground">
                    {item.estimatedQuantity === null ||
                    item.estimatedQuantity === undefined
                      ? "Chưa có ước tính"
                      : `${item.estimatedQuantity.toLocaleString("vi-VN")} ${item.unit}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentOrders({ orders }: { orders: DashboardRecentOrder[] }) {
  if (orders.length === 0) {
    return <p className="p-8 text-center text-sm text-muted-foreground">Chưa có đơn hàng gần đây.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5">Đơn hàng</TableHead>
            <TableHead>Kiosk</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Thanh toán</TableHead>
            <TableHead className="pr-5">Thời gian</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.orderId}>
              <TableCell className="pl-5 font-medium text-foreground">
                {order.orderNumber}
                {order.requiresStaffSupport ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                    <AlertTriangle className="size-3" />
                    Cần nhân viên hỗ trợ
                  </p>
                ) : null}
              </TableCell>
              <TableCell>{order.kioskCode}</TableCell>
              <TableCell>
                <Badge variant={getOrderStatusVariant(order.status)}>
                  {getOrderStatusLabel(order.status)}
                </Badge>
              </TableCell>
              <TableCell>{getPaymentStatusLabel(order.paymentStatus)}</TableCell>
              <TableCell className="pr-5 tabular-nums text-xs text-muted-foreground">
                {formatTimestamp(order.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function OrderOverviewPanel({ overview }: { overview: OrderOverview }) {
  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ReceiptText className="size-4 text-primary" />
            Hoạt động đơn hàng
          </CardTitle>
          <Link
            href="/transactions"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-muted-foreground",
            )}
          >
            Xem giao dịch
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 p-5 lg:grid-cols-[0.34fr_0.66fr]">
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground">Tổng số đơn</p>
            <p className="mt-1 tabular-nums text-2xl font-semibold text-foreground">
              {overview.totalCount.toLocaleString("vi-VN")}
            </p>
          </div>
          <StatusSummary items={overview.byStatus} total={overview.totalCount} />
        </div>
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex items-center gap-2 border-b border-border bg-muted/10 px-5 py-3">
            <Clock3 className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Đơn gần đây</p>
          </div>
          <RecentOrders orders={overview.recentOrders} />
        </div>
      </CardContent>
    </Card>
  );
}
