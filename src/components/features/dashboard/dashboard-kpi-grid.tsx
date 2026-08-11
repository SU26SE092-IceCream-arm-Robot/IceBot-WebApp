import { Boxes, Monitor, RotateCcw, ShoppingBag } from "lucide-react";

import { DashboardKpiCard } from "@/components/features/dashboard/dashboard-kpi-card";
import type {
  DashboardMetrics,
  InventorySummary,
} from "@/types/dashboard/overview";
import type { DashboardRoutePath } from "@/types";

interface DashboardKpiGridProps {
  metrics?: DashboardMetrics | null;
  inventory?: InventorySummary | null;
  visibleRoutes: ReadonlySet<DashboardRoutePath>;
}

export function DashboardKpiGrid({
  metrics,
  inventory,
  visibleRoutes,
}: DashboardKpiGridProps) {
  const inventoryAttentionCount = inventory
    ? inventory.lowStockCount + inventory.emptyCount
    : null;

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardKpiCard
        icon={Monitor}
        label="Tổng số kiosk"
        value={metrics?.kioskCount ?? null}
        description={metrics ? "Kiosk trong phạm vi quản lý" : "Nguồn dữ liệu chưa tải được"}
        href={metrics && visibleRoutes.has("/kiosks") ? "/kiosks" : undefined}
      />
      <DashboardKpiCard
        icon={ShoppingBag}
        label="Đơn chờ thanh toán"
        value={metrics?.pendingOrderCount ?? null}
        description={metrics ? "Đơn chưa hoàn tất thanh toán" : "Nguồn dữ liệu chưa tải được"}
        href={metrics && visibleRoutes.has("/transactions") ? "/transactions" : undefined}
        tone="warning"
      />
      <DashboardKpiCard
        icon={RotateCcw}
        label="Cần hoàn tiền"
        value={metrics?.refundRequiredOrderCount ?? null}
        description={metrics ? "Đơn cần nhân sự xử lý hoàn tiền" : "Nguồn dữ liệu chưa tải được"}
        href={metrics && visibleRoutes.has("/transactions") ? "/transactions" : undefined}
        tone={(metrics?.refundRequiredOrderCount ?? 0) > 0 ? "destructive" : "neutral"}
      />
      <DashboardKpiCard
        icon={Boxes}
        label="Tồn kho cần chú ý"
        value={inventoryAttentionCount}
        description={inventory ? "Hết hàng hoặc sắp hết trong dispenser" : "Nguồn dữ liệu chưa tải được"}
        href={inventory && visibleRoutes.has("/inventory") ? "/inventory" : undefined}
        tone={(inventoryAttentionCount ?? 0) > 0 ? "warning" : "neutral"}
      />
    </section>
  );
}
