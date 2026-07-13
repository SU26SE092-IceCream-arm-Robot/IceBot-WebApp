import type { KioskResult, StoreResult } from "@/types/kiosk-management";
import type { MenuResult, ProductResult } from "@/types/menu-management";
import type { PaymentMethodResult } from "@/types/payments";
import type { OrganizationResult } from "@/types/tenant-management";

export type ReadinessCheckId =
  | "ORG_ACTIVE"
  | "STORE_ACTIVE"
  | "KIOSK_EXISTS"
  | "PRODUCT_EXISTS"
  | "VARIANT_EXISTS"
  | "MENU_EXISTS"
  | "MENU_ITEM_EXISTS"
  | "PAYMENT_ACTIVE";

export type ReadinessStatus = "complete" | "warning" | "missing" | "unknown";

export type ReadinessCheckGroup = "scope" | "kiosk" | "catalog" | "payment";

export type ReadinessOverallStatus =
  | "complete"
  | "needs_attention"
  | "missing_configuration"
  | "unknown";

export interface ReadinessEvidence {
  count?: number;
  entityName?: string;
  statusLabel?: string;
  detail?: string;
}

export interface ReadinessAction {
  label: string;
  href: string;
}

export interface ReadinessCheck {
  id: ReadinessCheckId;
  group: ReadinessCheckGroup;
  title: string;
  description: string;
  status: ReadinessStatus;
  isCritical: boolean;
  evidence?: ReadinessEvidence;
  action?: ReadinessAction;
}

export interface ReadinessSummary {
  overallStatus: ReadinessOverallStatus;
  completedCount: number;
  totalApplicableCount: number;
  warningCount: number;
  missingCount: number;
  unknownCount: number;
}

export interface SetupReadinessResult {
  organizationId: string;
  storeId: string;
  checks: ReadinessCheck[];
  summary: ReadinessSummary;
  nextActions: ReadinessCheck[];
  evaluatedAt: string;
}

export type ReadinessSource =
  | "organization"
  | "store"
  | "kiosks"
  | "products"
  | "menus"
  | "paymentMethods";

export interface ReadinessSourceFailure {
  source: ReadinessSource;
  message: string;
  statusCode?: number;
}

export interface SetupReadinessRawData {
  organizationId: string;
  storeId: string;
  organization?: OrganizationResult | null;
  store?: StoreResult | null;
  kiosks?: KioskResult[];
  products?: ProductResult[];
  menus?: MenuResult[];
  paymentMethods?: PaymentMethodResult[];
  failures?: ReadinessSourceFailure[];
  evaluatedAt?: string;
}

export interface SetupReadinessOrganizationOption {
  id: string;
  name?: string;
  code?: string;
  status?: string;
}

export interface SetupReadinessStoreOption {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  status: string;
}

export interface SetupReadinessScopeOptions {
  organizations: SetupReadinessOrganizationOption[];
  stores: SetupReadinessStoreOption[];
  failures: ReadinessSourceFailure[];
}
