"use client";

import { AlertTriangle } from "lucide-react";

import { DashboardAttentionList } from "@/components/features/dashboard/dashboard-attention-list";
import { DashboardHeader } from "@/components/features/dashboard/dashboard-header";
import { DashboardKpiGrid } from "@/components/features/dashboard/dashboard-kpi-grid";
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
  DashboardSectionUnavailable,
} from "@/components/features/dashboard/dashboard-overview-states";
import { DashboardRecentOrders } from "@/components/features/dashboard/dashboard-recent-orders";
import { DashboardScopeSummary } from "@/components/features/dashboard/dashboard-scope-summary";
import { DashboardStatusDistribution } from "@/components/features/dashboard/dashboard-status-distribution";
import { OperationalShortcuts } from "@/components/features/dashboard/operational-shortcuts";
import { PlatformControlKpiGrid } from "@/components/features/dashboard/platform-control-kpi-grid";
import { PlatformControlShortcuts } from "@/components/features/dashboard/platform-control-shortcuts";
import { PlatformInterventionList } from "@/components/features/dashboard/platform-intervention-list";
import { useDashboardOverview } from "@/hooks/dashboard/use-dashboard-overview";
import { useAuth } from "@/hooks/identity/use-auth";
import { getVisibleRoutes, hasPermission } from "@/lib/rbac";

export default function DashboardPage() {
  const { effectiveAccess } = useAuth();
  const canViewOrders = hasPermission(effectiveAccess, "orders.view");
  const {
    data,
    warnings,
    lastUpdatedAt,
    isLoading,
    isRefreshing,
    errorMessage,
    refresh,
  } = useDashboardOverview({ includeOrderOverview: canViewOrders });
  const visibleRoutes = new Set(getVisibleRoutes(effectiveAccess));
  const isSystemAdmin = effectiveAccess?.isSystemAdmin ?? false;
  const hasAllRoots = Boolean(
      data?.dashboard &&
      data.kioskStatusOverview &&
      data.inventorySummary &&
      (!canViewOrders || data.orderOverview),
  );

  const isEmpty = hasAllRoots &&
    (isSystemAdmin
      ? data?.dashboard?.organizationCount === 0 &&
        data?.dashboard?.storeCount === 0 &&
        data?.dashboard?.kioskCount === 0
      : data?.dashboard?.organizationCount === 0 &&
        data?.dashboard?.storeCount === 0 &&
        data?.dashboard?.kioskCount === 0 &&
        (!canViewOrders || data.orderOverview?.totalCount === 0) &&
        data.inventorySummary?.totalDispenserCount === 0);

  return (
    <div className="space-y-7">
      <DashboardHeader
        lastUpdatedAt={lastUpdatedAt}
        isRefreshing={isRefreshing}
        onRefresh={() => void refresh()}
        title={isSystemAdmin ? "Kiểm soát nền tảng" : undefined}
        description={
          isSystemAdmin
            ? "Theo dõi phạm vi toàn hệ thống, sức khỏe đội kiosk và các điều kiện cần can thiệp."
            : undefined
        }
        refreshTitle={
          isSystemAdmin ? "Làm mới dữ liệu kiểm soát nền tảng" : undefined
        }
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
          {isSystemAdmin ? (
            <PlatformControlShortcuts visibleRoutes={visibleRoutes} />
          ) : (
            <OperationalShortcuts />
          )}
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

          {isSystemAdmin ? (
            <PlatformControlKpiGrid
              metrics={data.dashboard}
              visibleRoutes={visibleRoutes}
            />
          ) : (
            <DashboardKpiGrid
              metrics={data.dashboard}
              inventory={data.inventorySummary}
              visibleRoutes={visibleRoutes}
            />
          )}

          <section className="grid items-start gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7">
              {isSystemAdmin ? (
                <PlatformInterventionList
                  metrics={data.dashboard}
                  inventory={data.inventorySummary}
                  visibleRoutes={visibleRoutes}
                />
              ) : (
                <DashboardAttentionList
                  metrics={data.dashboard}
                  inventory={data.inventorySummary}
                  visibleRoutes={visibleRoutes}
                />
              )}
            </div>
            <div className="xl:col-span-5">
              {data.dashboard ? (
                <DashboardScopeSummary metrics={data.dashboard} />
              ) : (
                <DashboardSectionUnavailable label="Phạm vi hệ thống" />
              )}
            </div>
          </section>

          <section className="grid items-start gap-4 xl:grid-cols-2">
            {data.kioskStatusOverview ? (
              <>
                <DashboardStatusDistribution
                  title="Vòng đời kiosk"
                  description="Trạng thái quản lý của kiosk, tách biệt với trạng thái kết nối."
                  kind="kioskLifecycle"
                  items={data.kioskStatusOverview.byLifecycleStatus}
                  total={data.kioskStatusOverview.totalCount}
                  emptyMessage="Chưa có kiosk để phân bố vòng đời."
                />
                <DashboardStatusDistribution
                  title="Kết nối kiosk"
                  description="Trạng thái từ dữ liệu connectivity do backend cung cấp."
                  kind="kioskConnectivity"
                  items={data.kioskStatusOverview.byConnectivityStatus}
                  total={data.kioskStatusOverview.totalCount}
                  emptyMessage="Chưa có dữ liệu kết nối kiosk."
                />
              </>
            ) : (
              <DashboardSectionUnavailable label="Trạng thái kiosk" />
            )}
            {canViewOrders && data.orderOverview ? (
              <DashboardStatusDistribution
                title="Phân bố trạng thái đơn hàng"
                description="Tỷ lệ được tính từ tổng số đơn hàng hiện có."
                kind="order"
                items={data.orderOverview.byStatus}
                total={data.orderOverview.totalCount}
                emptyMessage="Chưa có đơn hàng để phân bố trạng thái."
              />
            ) : canViewOrders ? (
              <DashboardSectionUnavailable label="Trạng thái đơn hàng" />
            ) : null}
          </section>

          {canViewOrders ? (
            data.orderOverview ? (
              <DashboardRecentOrders orders={data.orderOverview.recentOrders} />
            ) : (
              <DashboardSectionUnavailable label="Đơn hàng gần đây" />
            )
          ) : null}

          {isSystemAdmin ? (
            <PlatformControlShortcuts visibleRoutes={visibleRoutes} />
          ) : (
            <OperationalShortcuts />
          )}
        </>
      )}
    </div>
  );
}
