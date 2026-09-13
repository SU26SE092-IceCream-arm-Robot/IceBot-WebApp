import { Building2, Monitor, Store, WifiOff } from "lucide-react";

import { DashboardKpiCard } from "@/components/features/dashboard/dashboard-kpi-card";
import { MetricStrip } from "@/components/shared/metric-strip";
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
    <MetricStrip>
      <DashboardKpiCard
        icon={Building2}
        label="Tổ chức"
        value={metrics?.organizationCount ?? null}
        description={
          metrics ? "Mở danh sách tổ chức" : "Nguồn dữ liệu chưa tải được"
        }
        href={organizationHref}
      />
      <DashboardKpiCard
        icon={Store}
        label="Cửa hàng"
        value={metrics?.storeCount ?? null}
        description={
          metrics ? "Mở danh sách cửa hàng" : "Nguồn dữ liệu chưa tải được"
        }
        href={storeHref}
      />
      <DashboardKpiCard
        icon={Monitor}
        label="Kiosk"
        value={metrics?.kioskCount ?? null}
        description={
          metrics ? "Mở đội kiosk toàn hệ thống" : "Nguồn dữ liệu chưa tải được"
        }
        href={kioskHref}
      />
      <DashboardKpiCard
        icon={WifiOff}
        label="Kiosk mất kết nối"
        value={metrics?.offlineKioskCount ?? null}
        description={
          metrics
            ? "Connectivity đang ở trạng thái Unreachable"
            : "Nguồn dữ liệu chưa tải được"
        }
        href={kioskHref}
        tone={metrics?.offlineKioskCount ? "destructive" : "neutral"}
      />
    </MetricStrip>
  );
}
