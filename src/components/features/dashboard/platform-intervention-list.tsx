import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  MonitorOff,
  RotateCcw,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardRoutePath } from "@/types";
import type {
  DashboardMetrics,
  InventorySummary,
} from "@/types/dashboard-overview";

type InterventionTone = "warning" | "destructive";

const TONES: Record<InterventionTone, string> = {
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

interface InterventionItem {
  label: string;
  description: string;
  count: number;
  href: DashboardRoutePath;
  icon: LucideIcon;
  tone: InterventionTone;
}

interface PlatformInterventionListProps {
  metrics?: DashboardMetrics | null;
  inventory?: InventorySummary | null;
  visibleRoutes: ReadonlySet<DashboardRoutePath>;
}

export function PlatformInterventionList({
  metrics,
  inventory,
  visibleRoutes,
}: PlatformInterventionListProps) {
  const allItems: InterventionItem[] = [
    {
      label: "Kiosk mất kết nối",
      description: "Connectivity backend ghi nhận Unreachable.",
      count: metrics?.offlineKioskCount ?? 0,
      href: "/kiosks",
      icon: MonitorOff,
      tone: "destructive",
    },
    {
      label: "Kiosk đang bảo trì",
      description: "Vòng đời kiosk đang ở trạng thái bảo trì.",
      count: metrics?.maintenanceKioskCount ?? 0,
      href: "/kiosks",
      icon: Wrench,
      tone: "warning",
    },
    {
      label: "Đơn cần hoàn tiền",
      description: "Can thiệp tài chính đang chờ xử lý.",
      count: metrics?.refundRequiredOrderCount ?? 0,
      href: "/transactions",
      icon: RotateCcw,
      tone: "destructive",
    },
    {
      label: "Bộ phân phối sắp hết",
      description: "Tồn kho đã xuống mức cảnh báo thấp.",
      count: inventory?.lowStockCount ?? 0,
      href: "/inventory",
      icon: Boxes,
      tone: "warning",
    },
    {
      label: "Bộ phân phối đã hết",
      description: "Tồn kho cần được xử lý trước khi bán tiếp.",
      count: inventory?.emptyCount ?? 0,
      href: "/inventory",
      icon: AlertTriangle,
      tone: "destructive",
    },
  ];
  const items = allItems.filter((item) => item.count > 0);
  const hasUnavailableSource = !metrics || !inventory;

  return (
    <Card className="h-full border-border/80 shadow-none">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          Can thiệp cấp nền tảng
        </CardTitle>
        <p className="text-xs leading-5 text-muted-foreground">
          Các điều kiện có bằng chứng và cần được định tuyến tới module sở hữu.
        </p>
      </CardHeader>
      <CardContent>
        {items.length === 0 && !hasUnavailableSource ? (
          <div className="flex items-center gap-3 rounded-lg border border-success/20 bg-success/5 px-4 py-4 text-sm text-success">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="size-4" />
            </span>
            <p className="font-medium">
              Chưa có điều kiện nào cần can thiệp trên toàn hệ thống.
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
                    <span className="block text-sm font-medium text-foreground group-hover:text-primary">
                      {item.label}
                    </span>
                    <span className="block text-xs leading-5 text-muted-foreground">
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
