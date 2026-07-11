import { Boxes, Monitor, RotateCcw, ShoppingBag } from "lucide-react";

import { DashboardKpiCard } from "@/components/features/dashboard/dashboard-kpi-card";
import type {
  DashboardMetrics,
  InventorySummary,
} from "@/types/dashboard-overview";

interface DashboardKpiGridProps {
  metrics: DashboardMetrics;
  inventory: InventorySummary;
}

export function DashboardKpiGrid({
  metrics,
  inventory,
}: DashboardKpiGridProps) {
  const inventoryAttentionCount = inventory.lowStockCount + inventory.emptyCount;

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardKpiCard
        icon={Monitor}
        label="Tổng số kiosk"
        value={metrics.kioskCount}
        description="Kiosk trong phạm vi quản lý"
        href="/kiosks"
      />
      <DashboardKpiCard
        icon={ShoppingBag}
        label="Đơn chờ thanh toán"
        value={metrics.pendingOrderCount}
        description="Đơn đang ở trạng thái PendingPayment"
        href="/transactions"
        tone="warning"
      />
      <DashboardKpiCard
        icon={RotateCcw}
        label="Cần hoàn tiền"
        value={metrics.refundRequiredOrderCount}
        description="Đơn cần xử lý hoàn tiền từ backend"
        href="/transactions"
        tone={metrics.refundRequiredOrderCount > 0 ? "destructive" : "neutral"}
      />
      <DashboardKpiCard
        icon={Boxes}
        label="Tồn kho cần chú ý"
        value={inventoryAttentionCount}
        description="Hết hàng hoặc sắp hết trong dispenser"
        href="/inventory"
        tone={inventoryAttentionCount > 0 ? "warning" : "neutral"}
      />
    </section>
  );
}
