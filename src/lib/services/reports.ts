import { listDispenserStates, listStockMovements } from "@/lib/services/inventory";
import { getManagementKiosks } from "@/lib/services/kiosk-management";
import { listManagementMaintenanceTickets } from "@/lib/services/maintenance";

import { getManagementStores } from "@/lib/services/stores";
import {
  listManagementOrders,
  listManagementRefunds,
} from "@/lib/services/transactions";
import type { PaginationMeta } from "@/types/accounts";
import type { DispenserStateResult, StockMovementResult } from "@/types/inventory-management";
import type { KioskResult, StoreResult } from "@/types/kiosk-management";
import type { MaintenanceTicketResult } from "@/types/maintenance";
import type { MenuResult, ProductResult } from "@/types/menu-management";
import type {
  ReportActivityItem,
  ReportCurrencyAmount,
  ReportKioskAttentionRow,
  ReportsCoverage,
  ReportsFilters,
  ReportsSnapshot,
  ReportsSourceBundle,
  ReportsSourceState,
} from "@/types/reports";
import type {
  ManagementOrderListItemResult,
  RefundResult,
} from "@/types/transactions";

export const REPORTS_PAGE_SIZE = 50;
export const REPORTS_MAX_ROWS = 1000;

interface PagedResponse<T> {
  data?: T[];
  pagination: PaginationMeta;
}

type PageFetcher<T> = (
  pageNumber: number,
  pageSize: number,
  signal?: AbortSignal,
) => Promise<PagedResponse<T>>;

const ORDER_STATUS_BUCKETS = [
  {
    id: "pending-payment",
    label: "Chờ thanh toán",
    statuses: ["Draft", "PendingPayment"],
    tone: "warning" as const,
  },
  {
    id: "processing",
    label: "Đang xử lý",
    statuses: ["Paid", "ReadyForExecution", "Accepted", "Preparing", "Ready"],
    tone: "primary" as const,
  },
  {
    id: "completed",
    label: "Hoàn tất",
    statuses: ["Completed"],
    tone: "success" as const,
  },
  {
    id: "failed-cancelled",
    label: "Thất bại / hủy",
    statuses: ["Failed", "ExecutionRejected", "Cancelled"],
    tone: "destructive" as const,
  },
  {
    id: "refund",
    label: "Hoàn tiền",
    statuses: ["RefundRequired", "Refunded", "Compensated"],
    tone: "warning" as const,
  },
] as const;

const ACTIVE_MAINTENANCE_STATUSES = new Set([
  "Open",
  "Assigned",
  "InProgress",
]);
const ATTENTION_ORDER_STATUSES = new Set([
  "Failed",
  "ExecutionRejected",
  "RefundRequired",
]);

function selectedId(value: string): string | undefined {
  return value === "ALL" ? undefined : value;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function createCoverage(
  status: ReportsCoverage["status"],
  loadedCount: number,
  totalCount: number,
  message?: string,
): ReportsCoverage {
  return {
    status,
    loadedCount,
    totalCount,
    isComplete: status === "complete",
    message,
  };
}

export function skippedReportsSource<T>(message: string): ReportsSourceState<T> {
  return {
    items: [],
    coverage: createCoverage("skipped", 0, 0, message),
  };
}

export function failedReportsSource<T>(
  error: unknown,
  fallback: string,
): ReportsSourceState<T> {
  return {
    items: [],
    coverage: createCoverage("failed", 0, 0, errorMessage(error, fallback)),
  };
}

function completeUnpagedSource<T>(items: T[]): ReportsSourceState<T> {
  return {
    items,
    coverage: createCoverage("complete", items.length, items.length),
  };
}

async function loadPagedSource<T>(
  fetchPage: PageFetcher<T>,
  signal?: AbortSignal,
): Promise<ReportsSourceState<T>> {
  const items: T[] = [];
  let page = 1;
  let totalCount = 0;

  while (items.length < REPORTS_MAX_ROWS) {
    try {
      const result = await fetchPage(page, REPORTS_PAGE_SIZE, signal);
      const pageItems = result.data ?? [];
      totalCount = result.pagination.totalCount;
      items.push(...pageItems.slice(0, REPORTS_MAX_ROWS - items.length));

      if (!result.pagination.hasNext || pageItems.length === 0) {
        return {
          items,
          coverage: createCoverage("complete", items.length, totalCount),
        };
      }

      page += 1;
    } catch (error) {
      if (items.length === 0) {
        throw error;
      }

      return {
        items,
        coverage: createCoverage(
          "partial",
          items.length,
          totalCount || items.length,
          `Chỉ tải được ${items.length} dòng dữ liệu trước khi nguồn dữ liệu gặp lỗi.`,
        ),
      };
    }
  }

  return {
    items,
    coverage: createCoverage(
      totalCount > items.length ? "partial" : "complete",
      items.length,
      totalCount || items.length,
      totalCount > items.length
        ? `Đã đạt giới hạn ${REPORTS_MAX_ROWS.toLocaleString("vi-VN")} dòng dữ liệu.`
        : undefined,
    ),
  };
}

export async function loadReportStores(
  signal?: AbortSignal,
): Promise<ReportsSourceState<StoreResult>> {
  return completeUnpagedSource(await getManagementStores({}, signal));
}

export async function loadReportKiosks(
  signal?: AbortSignal,
): Promise<ReportsSourceState<KioskResult>> {
  return completeUnpagedSource(await getManagementKiosks({}, signal));
}

export function loadReportOrders(
  filters: ReportsFilters,
  signal?: AbortSignal,
): Promise<ReportsSourceState<ManagementOrderListItemResult>> {
  return loadPagedSource(
    (pageNumber, pageSize, requestSignal) =>
      listManagementOrders(
        {
          storeId: selectedId(filters.storeId),
          kioskId: selectedId(filters.kioskId),
          pageNumber,
          pageSize,
        },
        requestSignal,
      ),
    signal,
  );
}

export function loadReportRefunds(
  filters: ReportsFilters,
  signal?: AbortSignal,
): Promise<ReportsSourceState<RefundResult>> {
  return loadPagedSource(
    (pageNumber, pageSize, requestSignal) =>
      listManagementRefunds(
        {
          storeId: selectedId(filters.storeId),
          kioskId: selectedId(filters.kioskId),
          pageNumber,
          pageSize,
        },
        requestSignal,
      ),
    signal,
  );
}

export function loadReportProducts(
  signal?: AbortSignal,
): Promise<ReportsSourceState<ProductResult>> {
  void signal;
  return Promise.resolve(
    skippedReportsSource<ProductResult>(
      "Danh mục sản phẩm không thể tổng hợp khi quản lý nhiều tổ chức.",
    ),
  );
}

export function loadReportMenus(
  signal?: AbortSignal,
): Promise<ReportsSourceState<MenuResult>> {
  void signal;
  return Promise.resolve(
    skippedReportsSource<MenuResult>(
      "Thực đơn không thể tổng hợp khi quản lý nhiều tổ chức.",
    ),
  );
}

export function loadReportDispensers(
  filters: ReportsFilters,
  signal?: AbortSignal,
): Promise<ReportsSourceState<DispenserStateResult>> {
  return loadPagedSource(
    (pageNumber, pageSize, requestSignal) =>
      listDispenserStates(
        {
          storeId: selectedId(filters.storeId),
          kioskId: selectedId(filters.kioskId),
          pageNumber,
          pageSize,
        },
        requestSignal,
      ),
    signal,
  );
}

export function loadReportMovements(
  filters: ReportsFilters,
  signal?: AbortSignal,
): Promise<ReportsSourceState<StockMovementResult>> {
  return loadPagedSource(
    (pageNumber, pageSize, requestSignal) =>
      listStockMovements(
        {
          storeId: selectedId(filters.storeId),
          kioskId: selectedId(filters.kioskId),
          pageNumber,
          pageSize,
        },
        requestSignal,
      ),
    signal,
  );
}

export function loadReportMaintenance(
  filters: ReportsFilters,
  signal?: AbortSignal,
): Promise<ReportsSourceState<MaintenanceTicketResult>> {
  return loadPagedSource(
    (pageNumber, pageSize, requestSignal) =>
      listManagementMaintenanceTickets(
        {
          storeId: selectedId(filters.storeId),
          kioskId: selectedId(filters.kioskId),
          pageNumber,
          pageSize,
        },
        requestSignal,
      ),
    signal,
  );
}

function startOfRange(now: Date, days: number): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return start;
}

function inRange(value: string | null | undefined, start: Date, end: Date): boolean {
  if (!value) {
    return false;
  }
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time >= start.getTime() && time <= end.getTime();
}

function matchesScope(
  storeId: string | null | undefined,
  kioskId: string | null | undefined,
  filters: ReportsFilters,
): boolean {
  return (
    (filters.storeId === "ALL" || storeId === filters.storeId) &&
    (filters.kioskId === "ALL" || kioskId === filters.kioskId)
  );
}

function sumCurrencies(
  values: Array<{ currency: string; amount: number }>,
): ReportCurrencyAmount[] {
  const totals = new Map<string, number>();
  for (const value of values) {
    const currency = value.currency?.trim().toUpperCase() || "VND";
    totals.set(currency, (totals.get(currency) ?? 0) + value.amount);
  }
  return [...totals.entries()]
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((left, right) => left.currency.localeCompare(right.currency));
}

function coverageLabel(coverage: ReportsCoverage): string {
  if (coverage.isComplete) {
    return `Đủ dữ liệu (${coverage.loadedCount.toLocaleString("vi-VN")} dòng dữ liệu)`;
  }
  if (coverage.status === "skipped") {
    return "Không có quyền truy cập nguồn dữ liệu";
  }
  if (coverage.status === "failed") {
    return "Nguồn dữ liệu không khả dụng";
  }
  return `Tạm tính từ ${coverage.loadedCount.toLocaleString("vi-VN")}/${coverage.totalCount.toLocaleString("vi-VN")} dòng dữ liệu`;
}

function dayKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function buildTrend(
  orders: ManagementOrderListItemResult[],
  start: Date,
  end: Date,
  days: number,
) {
  const bucketDays = days === 90 ? 7 : 1;
  const buckets: Array<{
    id: string;
    label: string;
    start: Date;
    end: Date;
    orders: ManagementOrderListItemResult[];
  }> = [];

  for (let cursor = new Date(start); cursor <= end; ) {
    const bucketStart = new Date(cursor);
    const bucketEnd = new Date(cursor);
    bucketEnd.setDate(bucketEnd.getDate() + bucketDays - 1);
    bucketEnd.setHours(23, 59, 59, 999);
    if (bucketEnd > end) bucketEnd.setTime(end.getTime());

    buckets.push({
      id: dayKey(bucketStart),
      label:
        bucketDays === 1
          ? bucketStart.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
          : `${bucketStart.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} - ${bucketEnd.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}`,
      start: bucketStart,
      end: bucketEnd,
      orders: [],
    });
    cursor = new Date(bucketEnd);
    cursor.setMilliseconds(cursor.getMilliseconds() + 1);
  }

  for (const order of orders) {
    const placedAt = new Date(order.placedAt).getTime();
    const bucket = buckets.find(
      (candidate) =>
        placedAt >= candidate.start.getTime() && placedAt <= candidate.end.getTime(),
    );
    bucket?.orders.push(order);
  }

  return buckets.map((bucket) => ({
    id: bucket.id,
    label: bucket.label,
    orderCount: bucket.orders.length,
    revenue: sumCurrencies(
      bucket.orders.map((order) => ({ currency: order.currency, amount: order.paidAmount })),
    ),
  }));
}

function kioskAttentionRows(
  kiosks: KioskResult[],
  stores: StoreResult[],
  dispensers: DispenserStateResult[],
  tickets: MaintenanceTicketResult[],
  orders: ManagementOrderListItemResult[],
): ReportKioskAttentionRow[] {
  const storeNames = new Map(stores.map((store) => [store.id, store.name]));
  const lifecycleReasons: Partial<Record<KioskResult["status"], string>> = {
    Provisioning: "Đang thiết lập",
    Offline: "Đang ngoại tuyến",
    Maintenance: "Đang bảo trì",
    Disabled: "Đã vô hiệu hóa",
  };

  return kiosks
    // Retired kiosks are intentionally excluded because they are no longer an operational target.
    .filter((kiosk) => kiosk.status !== "Retired")
    .map((kiosk) => {
      const kioskDispensers = dispensers.filter((item) => item.kioskId === kiosk.id);
      const inventoryIssueCount = kioskDispensers.filter(
        (item) => item.currentLevelStatus === "Low" || item.currentLevelStatus === "Unknown",
      ).length;
      const activeTickets = tickets.filter(
        (ticket) =>
          ticket.kioskId === kiosk.id && ACTIVE_MAINTENANCE_STATUSES.has(ticket.status),
      );
      const criticalMaintenanceCount = activeTickets.filter(
        (ticket) => ticket.priority === "Critical",
      ).length;
      const attentionOrderCount = orders.filter(
        (order) =>
          order.kioskId === kiosk.id &&
          (ATTENTION_ORDER_STATUSES.has(order.status) ||
            order.requiresStaffSupport),
      ).length;
      const reasons: string[] = [];

      if (kiosk.status !== "Active") {
        reasons.push(lifecycleReasons[kiosk.status] ?? `Trạng thái ${kiosk.status}`);
      }
      // lastOnlineAt is displayed for context, but no stale threshold is inferred without a backend SLA.
      if (inventoryIssueCount > 0) reasons.push(`${inventoryIssueCount} ngăn nguyên liệu cần kiểm tra`);
      if (activeTickets.length > 0) reasons.push(`${activeTickets.length} phiếu bảo trì đang mở`);
      if (attentionOrderCount > 0) reasons.push(`${attentionOrderCount} đơn cần xử lý`);

      return {
        kioskId: kiosk.id,
        kioskCode: kiosk.code,
        kioskName: kiosk.name,
        storeName: storeNames.get(kiosk.storeId) ?? "Chưa xác định cửa hàng",
        lifecycleStatus: kiosk.status,
        lastOnlineAt: kiosk.lastOnlineAt,
        inventoryIssueCount,
        maintenanceIssueCount: activeTickets.length,
        criticalMaintenanceCount,
        attentionOrderCount,
        reasons,
        level:
          kiosk.status === "Offline" ||
          kiosk.status === "Disabled" ||
          criticalMaintenanceCount > 0 ||
          attentionOrderCount > 0
            ? "critical"
            : "warning",
      } satisfies ReportKioskAttentionRow;
    })
    .filter((row) => row.reasons.length > 0)
    .sort((left, right) => {
      if (left.level !== right.level) return left.level === "critical" ? -1 : 1;
      return right.reasons.length - left.reasons.length;
    });
}

function activityItems(
  orders: ManagementOrderListItemResult[],
  refunds: RefundResult[],
  tickets: MaintenanceTicketResult[],
  movements: StockMovementResult[],
  start: Date,
  end: Date,
): ReportActivityItem[] {
  const activities: ReportActivityItem[] = [];

  for (const order of orders) {
    activities.push({
      id: `order-${order.id}`,
      type: "order",
      occurredAt: order.placedAt,
      entity: order.orderNumber,
      summary: "Đơn hàng tại kiosk",
      status: order.status,
      tone: ATTENTION_ORDER_STATUSES.has(order.status) || order.requiresStaffSupport
        ? "destructive"
        : order.status === "Completed"
          ? "success"
          : "primary",
    });
  }

  for (const refund of refunds) {
    activities.push({
      id: `refund-${refund.id}`,
      type: "refund",
      occurredAt: refund.requestedAt,
      entity: refund.refundNumber,
      summary: `Hoàn tiền cho đơn ${refund.orderNumber}`,
      status: refund.status,
      tone: refund.status === "Processed" ? "success" : refund.status === "Failed" || refund.status === "Rejected" ? "destructive" : "warning",
    });
  }

  for (const ticket of tickets) {
    activities.push({
      id: `maintenance-${ticket.id}`,
      type: "maintenance",
      occurredAt: ticket.reportedAt,
      entity: ticket.ticketNumber,
      summary: ticket.title,
      status: ticket.status,
      tone: ticket.priority === "Critical" ? "destructive" : ACTIVE_MAINTENANCE_STATUSES.has(ticket.status) ? "warning" : "muted",
    });
    if (ticket.resolvedAt) {
      activities.push({
        id: `maintenance-resolved-${ticket.id}`,
        type: "maintenance",
        occurredAt: ticket.resolvedAt,
        entity: ticket.ticketNumber,
        summary: `Đã xử lý: ${ticket.title}`,
        status: "Resolved",
        tone: "success",
      });
    }
  }

  for (const movement of movements) {
    activities.push({
      id: `inventory-${movement.id}`,
      type: "inventory",
      occurredAt: movement.occurredAt,
      entity: movement.kioskName ?? movement.containerCode,
      summary: `${movement.movementType}: ${movement.quantity.toLocaleString("vi-VN")} ${movement.unit}`,
      status: movement.reasonCode ?? movement.movementType,
      tone: movement.quantity < 0 ? "warning" : "muted",
    });
  }

  return activities
    .filter((item) => inRange(item.occurredAt, start, end))
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
    .slice(0, 15);
}

function qualityMessages(sources: ReportsSourceBundle): string[] {
  const labels: Record<keyof ReportsSourceBundle, string> = {
    stores: "Cửa hàng",
    kiosks: "Kiosk",
    orders: "Đơn hàng",
    refunds: "Hoàn tiền",
    products: "Sản phẩm",
    menus: "Thực đơn",
    dispensers: "Tồn kho hiện tại",
    movements: "Biến động tồn kho",
    maintenance: "Bảo trì",
  };

  const messages = (Object.keys(sources) as Array<keyof ReportsSourceBundle>)
    .filter((key) => !sources[key].coverage.isComplete)
    .map((key) => {
      const coverage = sources[key].coverage;
      return `${labels[key]}: ${coverage.message ?? coverageLabel(coverage)}.`;
    });

  return messages;
}

function sourceAvailable(coverage: ReportsCoverage): boolean {
  return coverage.status === "complete" || coverage.status === "partial";
}

export function buildReportsSnapshot(
  sources: ReportsSourceBundle,
  filters: ReportsFilters,
  now = new Date(),
): ReportsSnapshot {
  const rangeStart = startOfRange(now, filters.rangeDays);
  const scopedKiosks = sources.kiosks.items.filter(
    (kiosk) => matchesScope(kiosk.storeId, kiosk.id, filters),
  );
  const kioskIds = new Set(scopedKiosks.map((kiosk) => kiosk.id));
  const scopedOrders = sources.orders.items.filter(
    (order) =>
      matchesScope(order.storeId, order.kioskId, filters) &&
      inRange(order.placedAt, rangeStart, now),
  );
  const scopedRefunds = sources.refunds.items.filter(
    (refund) => inRange(refund.requestedAt, rangeStart, now),
  );
  const scopedTickets = sources.maintenance.items.filter(
    (ticket) =>
      matchesScope(ticket.storeId, ticket.kioskId, filters) &&
      (kioskIds.size === 0 || kioskIds.has(ticket.kioskId)),
  );
  const scopedDispensers = sources.dispensers.items.filter(
    (item) => filters.kioskId === "ALL" || item.kioskId === filters.kioskId,
  );
  const scopedMovements = sources.movements.items.filter(
    (item) => filters.kioskId === "ALL" || item.kioskId === filters.kioskId,
  );
  const ordersWithStatus = scopedOrders;
  const attentionOrders = scopedOrders.filter(
    (order) => ATTENTION_ORDER_STATUSES.has(order.status) || order.requiresStaffSupport,
  );
  const completedOrders = ordersWithStatus.filter((order) => order.status === "Completed");

  const statusBreakdown = ORDER_STATUS_BUCKETS.map((bucket) => {
    const count = ordersWithStatus.filter((order) =>
      (bucket.statuses as readonly string[]).includes(order.status),
    ).length;
    return {
      id: bucket.id,
      label: bucket.label,
      count,
      percentage: ordersWithStatus.length === 0 ? 0 : (count / ordersWithStatus.length) * 100,
      tone: bucket.tone,
    };
  });

  const products = sources.products.items;
  const menus = sources.menus.items;
  const allVariants = products.flatMap((product) => product.variants);
  const allMenuItems = menus.flatMap((menu) => menu.items);
  const activeTickets = scopedTickets.filter((ticket) =>
    ACTIVE_MAINTENANCE_STATUSES.has(ticket.status),
  );
  const rangedMovements = scopedMovements.filter((movement) =>
    inRange(movement.occurredAt, rangeStart, now),
  );

  return {
    rangeStart: rangeStart.toISOString(),
    rangeEnd: now.toISOString(),
    kpis: {
      orderCount: scopedOrders.length,
      collectedRevenue: sumCurrencies(
        scopedOrders.map((order) => ({ currency: order.currency, amount: order.paidAmount })),
      ),
      completedOrderCount: completedOrders.length,
      completionRate:
        ordersWithStatus.length === 0 ? 0 : (completedOrders.length / ordersWithStatus.length) * 100,
      attentionOrderCount: attentionOrders.length,
      coverageLabel: coverageLabel(sources.orders.coverage),
      isComplete: sources.orders.coverage.isComplete,
    },
    statusBreakdown,
    trend: buildTrend(scopedOrders, rangeStart, now, filters.rangeDays),
    kioskAttention: kioskAttentionRows(
      scopedKiosks,
      sources.stores.items,
      scopedDispensers,
      scopedTickets,
      scopedOrders,
    ),
    signalPanels: [
      {
        id: "catalog",
        title: "Danh mục và thực đơn",
        description: "Mức độ sẵn sàng của sản phẩm đang cấu hình.",
        items: [
          { id: "products", label: "Tổng sản phẩm", value: sources.products.coverage.totalCount, tone: "default" },
          { id: "products-unavailable", label: "Sản phẩm tạm ngưng", value: products.filter((item) => !item.isAvailable).length, tone: "warning" },
          { id: "variants", label: "Tổng phiên bản sản phẩm đã tải", value: allVariants.length, tone: "default" },
          { id: "variants-unavailable", label: "Phiên bản sản phẩm tạm ngưng", value: allVariants.filter((item) => !item.isAvailable).length, tone: "warning" },
          { id: "menus-active", label: "Thực đơn đang hoạt động", value: menus.filter((item) => item.status === "Active").length, tone: "success" },
          { id: "menus-draft-paused", label: "Thực đơn nháp/tạm dừng", value: menus.filter((item) => item.status === "Draft" || item.status === "Paused").length, tone: "warning" },
          { id: "menu-items-active", label: "Món đang hoạt động", value: allMenuItems.filter((item) => item.status === "Active").length, tone: "success" },
          { id: "menu-items-unavailable", label: "Món không khả dụng", value: allMenuItems.filter((item) => item.status === "Unavailable").length, tone: "warning" },
        ],
        coverage: [sources.products.coverage, sources.menus.coverage],
      },
      {
        id: "inventory",
        title: "Tồn kho",
        description: "Tín hiệu thực từ trạng thái bộ phân phối nguyên liệu.",
        items: [
          { id: "dispensers-low", label: "Mức thấp", value: scopedDispensers.filter((item) => item.currentLevelStatus === "Low").length, tone: "warning" },
          { id: "dispensers-unknown", label: "Chưa xác định", value: scopedDispensers.filter((item) => item.currentLevelStatus === "Unknown").length, tone: "destructive" },
          { id: "stock-movements", label: "Biến động trong kỳ", value: rangedMovements.length, tone: "default" },
        ],
        coverage: [sources.dispensers.coverage, sources.movements.coverage],
      },
      {
        id: "operations",
        title: "Vận hành",
        description: "Bảo trì đang mở và yêu cầu hoàn tiền trong kỳ.",
        items: [
          { id: "maintenance-open", label: "Phiếu bảo trì đang mở", value: activeTickets.length, tone: "warning" },
          { id: "maintenance-critical", label: "Bảo trì khẩn cấp", value: activeTickets.filter((item) => item.priority === "Critical").length, tone: "destructive" },
          { id: "refunds-requested", label: "Hoàn tiền chờ xử lý", value: scopedRefunds.filter((item) => item.status === "Requested" || item.status === "Processing").length, tone: "warning" },
          { id: "refunds-failed", label: "Hoàn tiền lỗi/từ chối", value: scopedRefunds.filter((item) => item.status === "Failed" || item.status === "Rejected").length, tone: "destructive" },
        ],
        coverage: [sources.maintenance.coverage, sources.refunds.coverage],
      },
    ],
    recentActivity: activityItems(
      scopedOrders,
      scopedRefunds,
      scopedTickets,
      scopedMovements,
      rangeStart,
      now,
    ),
    dataQualityMessages: qualityMessages(sources),
    storeOptions: sources.stores.items
      .map((store) => ({ id: store.id, label: `${store.code} - ${store.name}` }))
      .sort((left, right) => left.label.localeCompare(right.label, "vi")),
    kioskOptions: sources.kiosks.items
      .map((kiosk) => ({ id: kiosk.id, storeId: kiosk.storeId, label: `${kiosk.code} - ${kiosk.name}` }))
      .sort((left, right) => left.label.localeCompare(right.label, "vi")),
    availability: {
      orders: sourceAvailable(sources.orders.coverage),
      orderStatuses:
        sourceAvailable(sources.orders.coverage) &&
        sourceAvailable(sources.orders.coverage),
      kiosks: sourceAvailable(sources.kiosks.coverage),
      activity: [
        sources.orders.coverage,
        sources.refunds.coverage,
        sources.maintenance.coverage,
        sources.movements.coverage,
      ].some(sourceAvailable),
    },
    hasUsableData: Object.values(sources).some(
      (source) => source.coverage.status === "complete" || source.coverage.status === "partial",
    ),
  };
}
