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
import { PlatformKioskStatusOverview } from "@/components/features/dashboard/platform-kiosk-status-overview";
import { useDashboardOverview } from "@/hooks/dashboard/use-dashboard-overview";
import { useAuth } from "@/hooks/identity/use-auth";
import { useDashboardRealtime } from "@/hooks/realtime/use-dashboard-realtime";
import { canAccessRoute, getVisibleRoutes } from "@/lib/rbac";
import type { DashboardScope } from "@/types/realtime/signalr-events";

export default function DashboardPage() {
  const { effectiveAccess } = useAuth();
  const canViewOrders = canAccessRoute(effectiveAccess, "/transactions");
  const {
    data,
    warnings,
    lastUpdatedAt,
    isLoading,
    isRefreshing,
    errorMessage,
    refresh,
  } = useDashboardOverview({ includeOrderOverview: canViewOrders });

  const isSystemAdmin = effectiveAccess?.isSystemAdmin ?? false;
  const scope: DashboardScope = isSystemAdmin
    ? "system"
    : effectiveAccess?.effectiveScope?.storeIds?.[0]
      ? "store"
      : "organization";
  const organizationId =
    effectiveAccess?.effectiveScope?.organizationIds?.[0] ?? null;
  const storeId = effectiveAccess?.effectiveScope?.storeIds?.[0] ?? null;

  const realtimeStatus = useDashboardRealtime({
    scope,
    organizationId,
    storeId,
    enabled: Boolean(effectiveAccess),
    onInvalidated: () => {
      void refresh();
    },
  });

  const visibleRoutes = new Set(getVisibleRoutes(effectiveAccess));
  const hasAllRoots = Boolean(
    data?.dashboard &&
    data.kioskStatusOverview &&
    data.inventorySummary &&
    (!canViewOrders || data.orderOverview),
  );

  const isEmpty =
    hasAllRoots &&
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
    <div className="space-y-5">
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
        realtimeStatus={isSystemAdmin ? realtimeStatus : undefined}
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

          {isSystemAdmin ? (
            <>
              <section className="grid items-start gap-4 xl:grid-cols-12">
                <div className="xl:col-span-7">
                  <PlatformInterventionList
                    metrics={data.dashboard}
                    kioskStatus={data.kioskStatusOverview}
                    inventory={data.inventorySummary}
                    visibleRoutes={visibleRoutes}
                  />
                </div>
                <div className="xl:col-span-5">
                  {data.kioskStatusOverview ? (
                    <PlatformKioskStatusOverview
                      lifecycleItems={
                        data.kioskStatusOverview.byLifecycleStatus
                      }
                      connectivityItems={
                        data.kioskStatusOverview.byConnectivityStatus
                      }
                      total={data.kioskStatusOverview.totalCount}
                    />
                  ) : (
                    <DashboardSectionUnavailable label="Trạng thái kiosk" />
                  )}
                </div>
              </section>
              <PlatformControlShortcuts visibleRoutes={visibleRoutes} />
            </>
          ) : (
            <>
              <section className="grid items-stretch gap-4 xl:grid-cols-12">
                <div className="xl:col-span-7">
                  <DashboardAttentionList
                    metrics={data.dashboard}
                    inventory={data.inventorySummary}
                    visibleRoutes={visibleRoutes}
                  />
                </div>
                <div className="xl:col-span-5">
                  {data.dashboard ? (
                    <DashboardScopeSummary metrics={data.dashboard} />
                  ) : (
                    <DashboardSectionUnavailable label="Phạm vi hệ thống" />
                  )}
                </div>
              </section>

              <section
                className={`grid items-stretch gap-4 ${
                  canViewOrders ? "xl:grid-cols-3" : "xl:grid-cols-2"
                }`}
              >
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
                  <DashboardRecentOrders
                    orders={data.orderOverview.recentOrders}
                  />
                ) : (
                  <DashboardSectionUnavailable label="Đơn hàng gần đây" />
                )
              ) : null}

              <OperationalShortcuts />
            </>
          )}
        </>
      )}
    </div>
  );
}
