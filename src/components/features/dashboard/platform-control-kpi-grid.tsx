import { Building2, CircleCheck, Monitor, Store } from "lucide-react";

import { DashboardKpiCard } from "@/components/features/dashboard/dashboard-kpi-card";
import type { DashboardMetrics } from "@/types/dashboard-overview";
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
        href={organizationHref}
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
        icon={CircleCheck}
        label="Kiosk đã kích hoạt"
        value={metrics?.activeKioskCount ?? null}
        description={
          metrics
            ? "Kiosk có vòng đời đang hoạt động"
            : "Nguồn dữ liệu chưa tải được"
        }
        href={kioskHref}
        tone="primary"
      />
    </section>
  );
}
