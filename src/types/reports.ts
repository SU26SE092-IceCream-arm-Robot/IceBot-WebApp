import type { DispenserStateResult, StockMovementResult } from "@/types/inventory-management";
import type { KioskResult, StoreResult } from "@/types/kiosk-management";
import type { MaintenanceTicketResult } from "@/types/maintenance";
import type { MenuResult, ProductResult } from "@/types/menu-management";
import type {
  ManagementOrderListItemResult,
  RefundResult,
} from "@/types/transactions";

export type ReportsRangeDays = 7 | 30 | 90;

export interface ReportsFilters {
  rangeDays: ReportsRangeDays;
  storeId: string;
  kioskId: string;
}

export type ReportsSourceStatus = "complete" | "partial" | "failed" | "skipped";

export interface ReportsCoverage {
  status: ReportsSourceStatus;
  loadedCount: number;
  totalCount: number;
  isComplete: boolean;
  message?: string;
}

export interface ReportsSourceState<T> {
  items: T[];
  coverage: ReportsCoverage;
}

export interface ReportsSourceBundle {
  stores: ReportsSourceState<StoreResult>;
  kiosks: ReportsSourceState<KioskResult>;
  orders: ReportsSourceState<ManagementOrderListItemResult>;
  refunds: ReportsSourceState<RefundResult>;
  products: ReportsSourceState<ProductResult>;
  menus: ReportsSourceState<MenuResult>;
  dispensers: ReportsSourceState<DispenserStateResult>;
  movements: ReportsSourceState<StockMovementResult>;
  maintenance: ReportsSourceState<MaintenanceTicketResult>;
}

export interface ReportsAccess {
  catalog: boolean;
  inventory: boolean;
  maintenance: boolean;
}

export interface ReportCurrencyAmount {
  currency: string;
  amount: number;
}

export interface ReportStatusBucket {
  id: string;
  label: string;
  count: number;
  percentage: number;
  tone: "primary" | "success" | "warning" | "destructive" | "muted";
}

export interface ReportTrendBucket {
  id: string;
  label: string;
  orderCount: number;
  revenue: ReportCurrencyAmount[];
}

export interface ReportKpis {
  orderCount: number;
  collectedRevenue: ReportCurrencyAmount[];
  completedOrderCount: number;
  completionRate: number;
  attentionOrderCount: number;
  coverageLabel: string;
  isComplete: boolean;
}

export interface ReportKioskAttentionRow {
  kioskId: string;
  kioskCode: string;
  kioskName: string;
  storeName: string;
  lifecycleStatus: KioskResult["status"];
  operationalState: KioskResult["operationalState"];
  lastOnlineAt?: string | null;
  inventoryIssueCount: number;
  maintenanceIssueCount: number;
  criticalMaintenanceCount: number;
  attentionOrderCount: number;
  reasons: string[];
  level: "critical" | "warning";
}

export interface ReportSignalItem {
  id: string;
  label: string;
  value: number;
  tone: "default" | "success" | "warning" | "destructive" | "muted";
}

export interface ReportSignalPanel {
  id: "catalog" | "inventory" | "operations";
  title: string;
  description: string;
  items: ReportSignalItem[];
  coverage: ReportsCoverage[];
}

export type ReportActivityType = "order" | "refund" | "maintenance" | "inventory";

export interface ReportActivityItem {
  id: string;
  type: ReportActivityType;
  occurredAt: string;
  entity: string;
  summary: string;
  status: string;
  tone: "primary" | "success" | "warning" | "destructive" | "muted";
}

export interface ReportStoreOption {
  id: string;
  label: string;
}

export interface ReportKioskOption {
  id: string;
  storeId: string;
  label: string;
}

export interface ReportsSnapshot {
  rangeStart: string;
  rangeEnd: string;
  kpis: ReportKpis;
  statusBreakdown: ReportStatusBucket[];
  trend: ReportTrendBucket[];
  kioskAttention: ReportKioskAttentionRow[];
  signalPanels: ReportSignalPanel[];
  recentActivity: ReportActivityItem[];
  dataQualityMessages: string[];
  storeOptions: ReportStoreOption[];
  kioskOptions: ReportKioskOption[];
  availability: {
    orders: boolean;
    orderStatuses: boolean;
    kiosks: boolean;
    activity: boolean;
  };
  hasUsableData: boolean;
}
