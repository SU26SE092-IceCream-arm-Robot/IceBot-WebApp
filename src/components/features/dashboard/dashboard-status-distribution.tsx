import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getKioskConnectivityLabel,
  getKioskLifecycleLabel,
} from "@/lib/presenters/kiosk-state-labels";
import type { DashboardStatusCount } from "@/types/dashboard/overview";

type DistributionKind = "kioskLifecycle" | "kioskConnectivity" | "order";

const BAR_TONES = [
  "bg-primary",
  "bg-success",
  "bg-warning",
  "bg-destructive",
  "bg-muted-foreground",
] as const;

function getOrderStatusLabel(status: string) {
  const labels: Record<string, string> = {
    Draft: "Nháp",
    PendingPayment: "Chờ thanh toán",
    Paid: "Đã thanh toán",
    ReadyForFulfillment: "Sẵn sàng hoàn tất đơn",
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
    FulfillmentIssue: "Có sự cố khi hoàn tất đơn",
  };

  return labels[status] ?? status;
}

function getStatusLabel(kind: DistributionKind, status: string) {
  if (kind === "kioskLifecycle") return getKioskLifecycleLabel(status);
  if (kind === "kioskConnectivity") return getKioskConnectivityLabel(status);
  return getOrderStatusLabel(status);
}

interface DashboardStatusDistributionProps {
  title: string;
  description: string;
  kind: DistributionKind;
  items: DashboardStatusCount[];
  total: number;
  emptyMessage: string;
}

export function DashboardStatusDistribution({
  title,
  description,
  kind,
  items,
  total,
  emptyMessage,
}: DashboardStatusDistributionProps) {
  const visibleItems = items.filter((item) => item.count > 0);

  return (
    <Card className="h-full gap-3 border-border py-0 shadow-none">
      <CardHeader className="border-b border-border px-4 py-3.5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">
              {title}
            </CardTitle>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          </div>
          <span className="tabular-nums text-xl font-semibold text-foreground">
            {total.toLocaleString("vi-VN")}
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {total <= 0 || visibleItems.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-muted/10 px-4 py-5 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleItems.map((item, index) => {
              const percent = total > 0 ? (item.count / total) * 100 : 0;
              return (
                <div key={item.status} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <span className="truncate font-medium text-foreground">
                      {getStatusLabel(kind, item.status)}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {item.count.toLocaleString("vi-VN")} ·{" "}
                      {percent.toLocaleString("vi-VN", {
                        maximumFractionDigits: 1,
                      })}
                      %
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${BAR_TONES[index % BAR_TONES.length]}`}
                      style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
