"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { hasPermission } from "@/lib/rbac";
import {
  buildReportsSnapshot,
  failedReportsSource,
  loadReportDispensers,
  loadReportKiosks,
  loadReportMaintenance,
  loadReportMenus,
  loadReportMovements,
  loadReportOrders,
  loadReportProducts,
  loadReportRefunds,
  loadReportStores,
  skippedReportsSource,
} from "@/lib/services/reports";
import type {
  ReportsFilters,
  ReportsRangeDays,
  ReportsSnapshot,
  ReportsSourceBundle,
  ReportsSourceState,
} from "@/types/reports";
import type { DispenserStateResult, StockMovementResult } from "@/types/inventory-management";
import type { MaintenanceTicketResult } from "@/types/maintenance";
import type { MenuResult, ProductResult } from "@/types/menu-management";

const INITIAL_FILTERS: ReportsFilters = {
  rangeDays: 30,
  storeId: "ALL",
  kioskId: "ALL",
};

function resolveSource<T>(
  result: PromiseSettledResult<ReportsSourceState<T>>,
  fallback: string,
): ReportsSourceState<T> {
  return result.status === "fulfilled"
    ? result.value
    : failedReportsSource<T>(result.reason, fallback);
}

export function useReports() {
  const { currentUser, status: authStatus } = useAuth();
  const [filters, setFilters] = useState<ReportsFilters>(INITIAL_FILTERS);
  const [snapshot, setSnapshot] = useState<ReportsSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const hasLoadedRef = useRef(false);

  const role = currentUser?.role;
  const canViewCatalog = role ? hasPermission(role, "menu.view") : false;
  const canViewInventory = role ? hasPermission(role, "inventory.view") : false;
  const canViewMaintenance = role
    ? hasPermission(role, "maintenance.view")
    : false;

  const loadReports = useCallback(
    async (signal?: AbortSignal) => {
      const isInitialLoad = !hasLoadedRef.current;
      if (isInitialLoad) setIsLoading(true);
      else setIsRefreshing(true);

      const catalogUnavailable =
        "Vai trò hiện tại không có quyền xem danh mục và thực đơn.";
      const inventoryUnavailable =
        "Vai trò hiện tại không có quyền xem dữ liệu tồn kho.";
      const maintenanceUnavailable =
        "Vai trò hiện tại không có quyền xem dữ liệu bảo trì.";

      const results = await Promise.allSettled([
        loadReportStores(signal),
        loadReportKiosks(signal),
        loadReportOrders(filters, signal),
        loadReportRefunds(filters, signal),
        canViewCatalog
          ? loadReportProducts(signal)
          : Promise.resolve(
              skippedReportsSource<ProductResult>(catalogUnavailable),
            ),
        canViewCatalog
          ? loadReportMenus(signal)
          : Promise.resolve(skippedReportsSource<MenuResult>(catalogUnavailable)),
        canViewInventory
          ? loadReportDispensers(filters, signal)
          : Promise.resolve(
              skippedReportsSource<DispenserStateResult>(inventoryUnavailable),
            ),
        canViewInventory
          ? loadReportMovements(filters, signal)
          : Promise.resolve(
              skippedReportsSource<StockMovementResult>(inventoryUnavailable),
            ),
        canViewMaintenance
          ? loadReportMaintenance(filters, signal)
          : Promise.resolve(
              skippedReportsSource<MaintenanceTicketResult>(
                maintenanceUnavailable,
              ),
            ),
      ] as const);

      if (signal?.aborted) return;

      const sources: ReportsSourceBundle = {
        stores: resolveSource(results[0], "Không thể tải dữ liệu cửa hàng."),
        kiosks: resolveSource(results[1], "Không thể tải dữ liệu kiosk."),
        orders: resolveSource(results[2], "Không thể tải dữ liệu đơn hàng."),
        refunds: resolveSource(results[3], "Không thể tải dữ liệu hoàn tiền."),
        products: resolveSource(results[4], "Không thể tải dữ liệu sản phẩm."),
        menus: resolveSource(results[5], "Không thể tải dữ liệu thực đơn."),
        dispensers: resolveSource(results[6], "Không thể tải trạng thái tồn kho."),
        movements: resolveSource(results[7], "Không thể tải biến động tồn kho."),
        maintenance: resolveSource(results[8], "Không thể tải dữ liệu bảo trì."),
      };

      setSnapshot(buildReportsSnapshot(sources, filters));
      setLastUpdatedAt(new Date());
      hasLoadedRef.current = true;
      setIsLoading(false);
      setIsRefreshing(false);
    }, [
      canViewCatalog,
      canViewInventory,
      canViewMaintenance,
      filters,
    ],
  );

  useEffect(() => {
    if (authStatus !== "authenticated" || !role) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void loadReports(controller.signal).catch((error) => {
        if (!axios.isCancel(error) && !controller.signal.aborted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [authStatus, loadReports, refreshVersion, role]);

  const setRangeDays = useCallback((rangeDays: ReportsRangeDays) => {
    setFilters((current) => ({ ...current, rangeDays }));
  }, []);

  const setStoreId = useCallback((storeId: string) => {
    setFilters((current) => ({ ...current, storeId, kioskId: "ALL" }));
  }, []);

  const setKioskId = useCallback((kioskId: string) => {
    setFilters((current) => ({ ...current, kioskId }));
  }, []);

  const kioskOptions = useMemo(
    () =>
      (snapshot?.kioskOptions ?? []).filter(
        (kiosk) => filters.storeId === "ALL" || kiosk.storeId === filters.storeId,
      ),
    [filters.storeId, snapshot?.kioskOptions],
  );

  return {
    filters,
    snapshot,
    kioskOptions,
    isLoading,
    isRefreshing,
    lastUpdatedAt,
    setRangeDays,
    setStoreId,
    setKioskId,
    refresh: () => setRefreshVersion((current) => current + 1),
  };
}
