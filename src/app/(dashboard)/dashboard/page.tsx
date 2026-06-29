"use client";

import {
  AlertTriangle,
  Activity,
  Boxes,
  Monitor,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";

import { DashboardKpiCard } from "@/components/features/dashboard/dashboard-kpi-card";
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
} from "@/components/features/dashboard/dashboard-overview-states";
import {
  InventoryOverviewPanel,
  KioskLifecycleSummaryPanel,
  OperationalAttentionPanel,
  OrderOverviewPanel,
} from "@/components/features/dashboard/dashboard-panels";
import { OperationalShortcuts } from "@/components/features/dashboard/operational-shortcuts";
import { Button } from "@/components/ui/button";
import { useDashboardOverview } from "@/hooks/use-dashboard-overview";

export default function DashboardPage() {
  const {
    data,
    warnings,
    isLoading,
    isRefreshing,
    errorMessage,
    refresh,
  } = useDashboardOverview();

  const isEmpty =
    data !== null &&
    data.dashboard.organizationCount === 0 &&
    data.dashboard.storeCount === 0 &&
    data.dashboard.kioskCount === 0 &&
    data.orderOverview.totalCount === 0 &&
    data.inventorySummary.totalDispenserCount === 0;

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Tổng quan vận hành
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Theo dõi nhanh trạng thái kiosk, tồn kho và đơn hàng trong phạm vi quản lý.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void refresh()}
          isLoading={isRefreshing}
        >
          <RefreshCw className="size-4" />
          Làm mới
        </Button>
      </section>

      {isLoading ? (
        <DashboardLoadingState />
      ) : errorMessage || !data ? (
        <DashboardErrorState
          message={errorMessage ?? "Backend không trả về dữ liệu tổng quan."}
          onRetry={() => void refresh()}
        />
      ) : isEmpty ? (
        <>
          <DashboardEmptyState />
          <OperationalShortcuts />
        </>
      ) : (
        <>
          {warnings.length > 0 ? (
            <div
              className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3"
              role="status"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                <div className="space-y-1 text-xs text-warning">
                  <p className="font-medium">
                    Một phần dữ liệu tổng quan chưa tải được
                  </p>
                  {warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardKpiCard
              icon={Monitor}
              label="Tổng số kiosk"
              value={data.dashboard.kioskCount}
            />
            <DashboardKpiCard
              icon={ShoppingBag}
              label="Đơn chờ thanh toán"
              value={data.dashboard.pendingOrderCount}
              tone="warning"
            />
            <DashboardKpiCard
              icon={Boxes}
              label="Hộp chứa sắp hết"
              value={data.dashboard.lowStockDispenserCount}
              tone="warning"
            />
            <DashboardKpiCard
              icon={Activity}
              label="Sự kiện thiết bị 24 giờ"
              value={data.dashboard.latestDeviceEventCount}
              tone="primary"
            />
          </section>

          <section className="grid items-start gap-4 xl:grid-cols-[0.58fr_0.42fr]">
            <OperationalAttentionPanel
              metrics={data.dashboard}
              inventory={data.inventorySummary}
            />
            <div className="space-y-4">
              <KioskLifecycleSummaryPanel
                metrics={data.dashboard}
                overview={data.kioskStatusOverview}
              />
              <InventoryOverviewPanel summary={data.inventorySummary} />
            </div>
          </section>

          <OperationalShortcuts />
          <OrderOverviewPanel overview={data.orderOverview} />
        </>
      )}
    </div>
  );
}
