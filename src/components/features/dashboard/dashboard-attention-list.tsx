import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  MonitorOff,
  RotateCcw,
  ShoppingBag,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  DashboardMetrics,
  InventorySummary,
} from "@/types/dashboard-overview";
import type { DashboardRoutePath } from "@/types";

type AttentionTone = "warning" | "destructive" | "primary";

const TONES: Record<AttentionTone, string> = {
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  primary: "bg-primary/10 text-primary",
};

interface AttentionItem {
  label: string;
  description: string;
  count: number;
  href: DashboardRoutePath;
  icon: LucideIcon;
  tone: AttentionTone;
}

interface DashboardAttentionListProps {
  metrics?: DashboardMetrics | null;
  inventory?: InventorySummary | null;
  visibleRoutes: ReadonlySet<DashboardRoutePath>;
}

export function DashboardAttentionList({
  metrics,
  inventory,
  visibleRoutes,
}: DashboardAttentionListProps) {
  const allItems: AttentionItem[] = [
    {
      label: "Đơn chờ thanh toán",
      description: "Cần theo dõi trạng thái thanh toán.",
      count: metrics?.pendingOrderCount ?? 0,
      href: "/transactions",
      icon: ShoppingBag,
      tone: "warning",
    },
    {
      label: "Đơn cần hoàn tiền",
      description: "Cần xử lý theo quy trình hoàn tiền.",
      count: metrics?.refundRequiredOrderCount ?? 0,
      href: "/transactions",
      icon: RotateCcw,
      tone: "destructive",
    },
    {
      label: "Tồn kho sắp hết",
      description: "Bộ phân phối đang ở mức cảnh báo thấp.",
      count: inventory?.lowStockCount ?? 0,
      href: "/inventory",
      icon: Boxes,
      tone: "warning",
    },
    {
      label: "Tồn kho đã hết",
      description: "Bộ phân phối cần được kiểm tra trước khi bán tiếp.",
      count: inventory?.emptyCount ?? 0,
      href: "/inventory",
      icon: AlertTriangle,
      tone: "destructive",
    },
    {
      label: "Kiosk mất kết nối",
      description: "Connectivity backend ghi nhận trạng thái không thể kết nối.",
      count: metrics?.offlineKioskCount ?? 0,
      href: "/kiosks",
      icon: MonitorOff,
      tone: "destructive",
    },
    {
      label: "Kiosk bảo trì",
      description: "Kiosk đang ở trạng thái bảo trì.",
      count: metrics?.maintenanceKioskCount ?? 0,
      href: "/kiosks",
      icon: Wrench,
      tone: "warning",
    },
  ];
  const items = allItems.filter((item) => item.count > 0);
  const hasUnavailableSource = !metrics || !inventory;

  return (
    <Card className="h-full border-border/80 shadow-none">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          Cần chú ý
        </CardTitle>
        <p className="text-xs leading-5 text-muted-foreground">
          Chỉ hiển thị các vấn đề có số lượng lớn hơn 0.
        </p>
      </CardHeader>
      <CardContent>
        {items.length === 0 && !hasUnavailableSource ? (
          <div className="flex items-center gap-3 rounded-lg border border-success/20 bg-success/5 px-4 py-4 text-sm text-success">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="size-4" />
            </span>
            <p className="font-medium">
              Hệ thống hiện không có vấn đề cần xử lý.
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-4 text-sm text-warning">
            Chưa thể xác định đầy đủ vì một số nguồn dữ liệu chưa tải được.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => {
              const Icon = item.icon;
              const content = (
                <>
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${TONES[item.tone]}`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground group-hover:text-primary">
                      {item.label}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-sm font-semibold tabular-nums text-foreground">
                    {item.count.toLocaleString("vi-VN")}
                  </span>
                </>
              );

              return visibleRoutes.has(item.href) ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={item.label}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
