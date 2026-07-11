import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStatusCount } from "@/types/dashboard-overview";

type DistributionKind = "kiosk" | "order";

const BAR_TONES = [
  "bg-primary",
  "bg-success",
  "bg-warning",
  "bg-destructive",
  "bg-muted-foreground",
  "bg-accent-foreground",
];

function getKioskStatusLabel(status: string) {
  const labels: Record<string, string> = {
    Active: "Đang hoạt động",
    Offline: "Ngoại tuyến",
    Maintenance: "Bảo trì",
    Disabled: "Đã vô hiệu",
  };

  return labels[status] ?? status;
}

function getOrderStatusLabel(status: string) {
  const labels: Record<string, string> = {
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

  return labels[status] ?? status;
}

function getStatusLabel(kind: DistributionKind, status: string) {
  return kind === "kiosk"
    ? getKioskStatusLabel(status)
    : getOrderStatusLabel(status);
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
    <Card className="h-full border-border/80 shadow-none">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          {title}
        </CardTitle>
        <p className="text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </CardHeader>
      <CardContent>
        {total <= 0 || visibleItems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex h-2 overflow-hidden rounded-full bg-muted">
              {visibleItems.map((item, index) => {
                const ratio = Math.max((item.count / total) * 100, 2);

                return (
                  <span
                    key={item.status}
                    className={BAR_TONES[index % BAR_TONES.length]}
                    style={{ width: `${ratio}%` }}
                    title={`${getStatusLabel(kind, item.status)}: ${item.count.toLocaleString("vi-VN")}`}
                  />
                );
              })}
            </div>

            <div className="space-y-3">
              {visibleItems.map((item, index) => {
                const percent = total > 0 ? (item.count / total) * 100 : 0;

                return (
                  <div
                    key={item.status}
                    className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={`size-2.5 shrink-0 rounded-full ${BAR_TONES[index % BAR_TONES.length]}`}
                      />
                      <span className="truncate text-foreground">
                        {getStatusLabel(kind, item.status)}
                      </span>
                    </div>
                    <span className="tabular-nums text-muted-foreground">
                      {item.count.toLocaleString("vi-VN")}
                    </span>
                    <span className="w-14 text-right tabular-nums text-xs text-muted-foreground">
                      {percent.toLocaleString("vi-VN", {
                        maximumFractionDigits: 1,
                      })}
                      %
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
