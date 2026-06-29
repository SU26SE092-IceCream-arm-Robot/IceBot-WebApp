export interface DashboardMetrics {
  organizationCount: number;
  storeCount: number;
  kioskCount: number;
  activeKioskCount: number;
  offlineKioskCount: number;
  maintenanceKioskCount: number;
  pendingOrderCount: number;
  paidOrderCount: number;
  refundRequiredOrderCount: number;
  lowStockDispenserCount: number;
  latestDeviceEventCount: number;
}

export interface DashboardStatusCount {
  status: string;
  count: number;
}

export interface DashboardKioskStatusItem {
  kioskId: string;
  kioskCode: string;
  kioskName: string;
  organizationId: string;
  storeId: string;
  storeName: string;
  status: string;
  lastHeartbeatAt?: string | null;
  lastEventSeverity?: string | null;
  lastEventAt?: string | null;
}

export interface KioskStatusOverview {
  totalCount: number;
  byStatus: DashboardStatusCount[];
  items: DashboardKioskStatusItem[];
}

export interface DashboardInventoryItem {
  dispenserStateId: string;
  kioskId?: string | null;
  kioskCode: string;
  ingredientName: string;
  estimatedQuantity?: number | null;
  capacity?: number | null;
  unit: string;
  status: string;
  updatedAt: string;
}

export interface InventorySummary {
  totalDispenserCount: number;
  lowStockCount: number;
  emptyCount: number;
  items: DashboardInventoryItem[];
}

export interface DashboardRecentOrder {
  orderId: string;
  orderNumber: string;
  kioskId: string;
  kioskCode: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  customerStatus?: string | null;
  customerStatusMessage?: string | null;
  requiresStaffSupport: boolean;
}

export interface OrderOverview {
  totalCount: number;
  byStatus: DashboardStatusCount[];
  recentOrders: DashboardRecentOrder[];
}

export interface DashboardOverviewData {
  dashboard: DashboardMetrics;
  kioskStatusOverview: KioskStatusOverview;
  inventorySummary: InventorySummary;
  orderOverview: OrderOverview;
}

export interface DashboardOverviewResult {
  data: DashboardOverviewData;
  warnings: string[];
}

export interface GraphQLErrorItem {
  message: string;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
}

export interface GraphQLResponse<T> {
  data?: T | null;
  errors?: GraphQLErrorItem[];
}
