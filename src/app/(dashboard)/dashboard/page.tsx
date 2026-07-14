"use client";

import { AlertTriangle } from "lucide-react";

import { DashboardAttentionList } from "@/components/features/dashboard/dashboard-attention-list";
import { DashboardHeader } from "@/components/features/dashboard/dashboard-header";
import { DashboardKpiGrid } from "@/components/features/dashboard/dashboard-kpi-grid";
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
} from "@/components/features/dashboard/dashboard-overview-states";
import { DashboardRecentOrders } from "@/components/features/dashboard/dashboard-recent-orders";
import { DashboardScopeSummary } from "@/components/features/dashboard/dashboard-scope-summary";
import { DashboardStatusDistribution } from "@/components/features/dashboard/dashboard-status-distribution";
import { OperationalShortcuts } from "@/components/features/dashboard/operational-shortcuts";
import { useDashboardOverview } from "@/hooks/use-dashboard-overview";

export default function DashboardPage() {
  const {
    data,
    warnings,
    lastUpdatedAt,
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
      <DashboardHeader
        lastUpdatedAt={lastUpdatedAt}
        isRefreshing={isRefreshing}
        onRefresh={() => void refresh()}
      />

      {isLoading ? (
        <DashboardLoadingState />
      ) : errorMessage || !data ? (
        <DashboardErrorState
          message={errorMessage ?? "Không thể tải dữ liệu tổng quan."}
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

          <DashboardKpiGrid
            metrics={data.dashboard}
            inventory={data.inventorySummary}
          />

          <section className="grid items-start gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <DashboardAttentionList
                metrics={data.dashboard}
                inventory={data.inventorySummary}
              />
            </div>
            <div className="xl:col-span-5">
              <DashboardScopeSummary metrics={data.dashboard} />
            </div>
          </section>

          <section className="grid items-start gap-4 xl:grid-cols-2">
            <DashboardStatusDistribution
              title="Phân bố trạng thái kiosk"
              description="Trạng thái quản lý của kiosk, không phải kết nối thời gian thực."
              kind="kiosk"
              items={data.kioskStatusOverview.byStatus}
              total={data.kioskStatusOverview.totalCount}
              emptyMessage="Chưa có kiosk để phân bố trạng thái."
            />
            <DashboardStatusDistribution
              title="Phân bố trạng thái đơn hàng"
              description="Tỷ lệ được tính từ tổng số đơn hàng hiện có."
              kind="order"
              items={data.orderOverview.byStatus}
              total={data.orderOverview.totalCount}
              emptyMessage="Chưa có đơn hàng để phân bố trạng thái."
            />
          </section>

          <DashboardRecentOrders orders={data.orderOverview.recentOrders} />

          <OperationalShortcuts />
        </>
      )}
    </div>
  );
}
