import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  CircleHelp,
  MonitorOff,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import {
  buildPlatformInterventions,
  type PlatformInterventionKind,
  type PlatformInterventionTone,
} from "@/components/features/dashboard/platform-dashboard-model";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardRoutePath } from "@/types";
import type {
  DashboardMetrics,
  InventorySummary,
  KioskStatusOverview,
} from "@/types/dashboard/overview";

const TONES: Record<PlatformInterventionTone, string> = {
  warning: "border-warning/20 bg-warning/5 text-warning",
  destructive: "border-destructive/20 bg-destructive/5 text-destructive",
};

const ICONS: Record<PlatformInterventionKind, LucideIcon> = {
  connectivity: MonitorOff,
  maintenance: Wrench,
  emptyInventory: AlertTriangle,
  lowInventory: Boxes,
};

interface PlatformInterventionListProps {
  metrics?: DashboardMetrics | null;
  kioskStatus?: KioskStatusOverview | null;
  inventory?: InventorySummary | null;
  visibleRoutes: ReadonlySet<DashboardRoutePath>;
}

export function PlatformInterventionList({
  metrics,
  kioskStatus,
  inventory,
  visibleRoutes,
}: PlatformInterventionListProps) {
  const items = buildPlatformInterventions({
    metrics,
    kioskStatus,
    inventory,
  });
  const visibleItems = items.slice(0, 5);
  const hasUnavailableSource = !metrics || !kioskStatus || !inventory;

  return (
    <Card className="h-full border-border/80 shadow-none">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          Cần xử lý ngay
        </CardTitle>
        <p className="text-xs leading-5 text-muted-foreground">
          Sự cố được ưu tiên theo ảnh hưởng và bằng chứng gần nhất.
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
          <div className="space-y-2.5">
            {visibleItems.map((item) => {
              const Icon = ICONS[item.kind] ?? CircleHelp;
              const content = (
                <>
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${TONES[item.tone]}`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground group-hover:text-primary">
                      {item.label}
                    </span>
                    <span className="block text-xs leading-5 text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {item.count > 1 ? (
                      <span className="rounded-full bg-muted px-2.5 py-1 text-sm font-semibold tabular-nums text-foreground">
                        {item.count.toLocaleString("vi-VN")}
                      </span>
                    ) : null}
                    {visibleRoutes.has(item.routePath) ? (
                      <span className="hidden items-center gap-1 text-xs font-medium text-primary sm:inline-flex">
                        {item.actionLabel}
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </span>
                    ) : null}
                  </span>
                </>
              );

              return visibleRoutes.has(item.routePath) ? (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-muted/5 px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={item.id}
                  className="grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-muted/5 px-3 py-2.5"
                >
                  {content}
                </div>
              );
            })}
            {items.length > visibleItems.length ? (
              <p className="pt-1 text-center text-xs text-muted-foreground">
                Còn {items.length - visibleItems.length} điều kiện khác trong
                các module sở hữu.
              </p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
