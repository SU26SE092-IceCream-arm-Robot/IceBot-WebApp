import { Building2, Monitor, Store, WifiOff } from "lucide-react";

import { DashboardKpiCard } from "@/components/features/dashboard/dashboard-kpi-card";
import type { DashboardMetrics } from "@/types/dashboard/overview";
import type { DashboardRoutePath } from "@/types";

interface PlatformControlKpiGridProps {
  metrics?: DashboardMetrics | null;
  visibleRoutes: ReadonlySet<DashboardRoutePath>;
}

export function PlatformControlKpiGrid({
  metrics,
  visibleRoutes,
}: PlatformControlKpiGridProps) {
  const organizationHref =
    metrics && visibleRoutes.has("/organizations")
      ? "/organizations"
      : undefined;
  const storeHref =
    metrics && visibleRoutes.has("/stores") ? "/stores" : undefined;
  const kioskHref =
    metrics && visibleRoutes.has("/kiosks") ? "/kiosks" : undefined;

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardKpiCard
        icon={Building2}
        label="Tổ chức"
        value={metrics?.organizationCount ?? null}
        description={
          metrics
            ? "Tổ chức hiện có trên nền tảng"
            : "Nguồn dữ liệu chưa tải được"
        }
        href={organizationHref}
      />
      <DashboardKpiCard
        icon={Store}
        label="Cửa hàng"
        value={metrics?.storeCount ?? null}
        description={
          metrics
            ? "Cửa hàng thuộc các tổ chức"
            : "Nguồn dữ liệu chưa tải được"
        }
        href={storeHref}
      />
      <DashboardKpiCard
        icon={Monitor}
        label="Kiosk"
        value={metrics?.kioskCount ?? null}
        description={
          metrics
            ? "Kiosk trong toàn hệ thống"
            : "Nguồn dữ liệu chưa tải được"
        }
        href={kioskHref}
      />
      <DashboardKpiCard
        icon={WifiOff}
        label="Kiosk mất kết nối"
        value={metrics?.offlineKioskCount ?? null}
        description={
          metrics
            ? "Kiosk có trạng thái kết nối không thể truy cập"
            : "Nguồn dữ liệu chưa tải được"
        }
        href={kioskHref}
        tone={metrics?.offlineKioskCount ? "destructive" : "neutral"}
      />
    </section>
  );
}
