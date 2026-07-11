import { Building2, CircleCheck, Monitor, Store } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardMetrics } from "@/types/dashboard-overview";

interface DashboardScopeSummaryProps {
  metrics: DashboardMetrics;
}

export function DashboardScopeSummary({ metrics }: DashboardScopeSummaryProps) {
  const items = [
    {
      label: "Tổ chức",
      value: metrics.organizationCount,
      icon: Building2,
    },
    {
      label: "Cửa hàng",
      value: metrics.storeCount,
      icon: Store,
    },
    {
      label: "Kiosk",
      value: metrics.kioskCount,
      icon: Monitor,
    },
    {
      label: "Kiosk active",
      value: metrics.activeKioskCount,
      icon: CircleCheck,
    },
  ];

  return (
    <Card className="h-full border-border/80 shadow-none">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          Phạm vi hệ thống
        </CardTitle>
        <p className="text-xs leading-5 text-muted-foreground">
          Tóm tắt quy mô dữ liệu vận hành hiện có.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted/10 px-3 py-3"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs text-muted-foreground">
                    {item.label}
                  </span>
                  <span className="block text-xl font-semibold tabular-nums text-foreground">
                    {item.value.toLocaleString("vi-VN")}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
