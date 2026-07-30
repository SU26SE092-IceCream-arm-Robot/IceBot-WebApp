import type {
  KioskLifecycleStatus,
  KioskOperationalState,
} from "@/types/kiosk-management";

export type {
  KioskConnectivityStatus,
  KioskLifecycleStatus,
  KioskOperationalState,
  KioskResult,
  ManagementKiosksQuery,
  ManagementStoresQuery,
  StoreResult,
} from "@/types/kiosk-management";

export type BackendRoleCode =
  | "SystemAdmin"
  | "OrgAdmin"
  | "Manager"
  | "Staff"
  | "Technician";

export type DashboardRole = BackendRoleCode;

export type Role = DashboardRole;

export type DashboardRoutePath =
  | "/dashboard"
  | "/readiness"
  | "/organizations"
  | "/kiosks"
  | "/inventory"
  | "/transactions"
  | "/menu"
  | "/reports"
  | "/users"
  | "/roles"
  | "/maintenance"
  | "/alerts"
  | "/platform/exceptions"
  | "/settings/payment-methods";

export type DashboardPermission =
  | "dashboard.view"
  | "organizations.view"
  | "organizations.manage"
  | "organizations.update"
  | "stores.view"
  | "stores.manage"
  | "stores.update"
  | "kiosks.view"
  | "kiosks.manage"
  | "kiosks.update"
  | "devices.view"
  | "devices.manage"
  | "device-catalog.read"
  | "inventory.view"
  | "inventory.manage"
  | "inventory.configure"
  | "orders.view"
  | "orders.manage"
  | "refunds.manage"
  | "products.manage"
  | "product-categories.manage"
  | "ingredients.manage"
  | "device-catalog.manage"
  | "product-templates.manage"
  | "package.manage"
  | "sync-dead-letters.manage"
  | "menus.manage"
  | "ingredients.read"
  | "reports.view"
  | "accounts.read"
  | "accounts.manage"
  | "roles.view"
  | "role-scope-options.view"
  | "tenant-tree.view"
  | "maintenance.view"
  | "maintenance.create"
  | "maintenance.manage"
  | "alerts.view"
  | "alerts.manage"
  | "payments.manage"
  | "payment-methods.manage"
  | "operations.view"
  | "operations.diagnostics"
  | "notifications.view"
  | "notifications.manage"
  | "artifact.read"
  | "artifact.upload"
  | "artifact-template.read"
  | "program.read"
  | "program.manage"
  | "release.read"
  | "release.publish"
  | "release.deploy"
  | "release.rollback"
  | "deployment.read"
  | "package.read"
  | "package.install"
  | "package.fork";

export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  primaryRole: DashboardRole;
  avatarInitials: string;
}

export interface ApiResult<T> {
  succeeded: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  details?: Record<string, unknown>;
  validationErrors?: Record<string, string[]>;
  businessError?: string;
  systemError?: string;
}

export interface AccountRoleScope {
  roleCode: BackendRoleCode;
  organizationId?: string | null;
  storeId?: string | null;
  kioskId?: string | null;
}

export interface AuthSessionAccount {
  id: string;
  userName: string;
  email: string;
  fullName?: string | null;
  imageUrl?: string | null;
  roles: AccountRoleScope[];
  status: string;
  localLoginEnabled: boolean;
  googleLoginEnabled: boolean;
}

export interface AuthenticatedAccountResult extends AuthSessionAccount {
  accessToken: string;
  refreshToken: string;
  fullName: string;
  address?: string | null;
  gender: string;
}

export interface CurrentAccountResult extends AuthSessionAccount {
  emailConfirmed: boolean;
  phoneNumber?: string | null;
  phoneNumberConfirmed: boolean;
  address?: string | null;
  gender: string;
  googleEmail?: string | null;
  lastLoginAt?: string | null;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  account: AuthSessionAccount;
}

export interface DashboardNavItem {
  href: DashboardRoutePath;
  label: string;
}

export type KioskStatus = "ONLINE" | "OFFLINE" | "MAINTENANCE" | "ERROR";

export type RobotArmStatus = "READY" | "BUSY" | "IDLE" | "ERROR";

export interface KioskHardwareState {
  robotArmStatus: RobotArmStatus;
  freezerTemperature: number;
  cupsRemaining: number;
  vanillaSyrupLevel: number;
  chocolateSyrupLevel: number;
  toppingLevel: number;
  lastHeartbeat: string;
  errorCode?: string;
}

export interface Kiosk {
  managementId?: string;
  kioskId: string;
  name: string;
  organizationId?: string;
  locationId: string;
  locationName: string;
  address?: string | null;
  serialNumber?: string | null;
  lifecycleStatus?: KioskLifecycleStatus;
  lastOnlineAt?: string | null;
  status: KioskStatus;
  hardwareState: KioskHardwareState;
  currentOrderId?: string;
}

export interface KioskFleetItem {
  managementId: string;
  kioskId: string;
  name: string;
  organizationId: string;
  locationId: string;
  locationName: string;
  address?: string | null;
  serialNumber?: string | null;
  lifecycleStatus: KioskLifecycleStatus;
  operationalState: KioskOperationalState;
  operationalStateReason?: string | null;
  operationalStateChangedAt?: string | null;
  lastOnlineAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export type KioskStatusFilter = "ALL" | KioskLifecycleStatus;

export type KioskLocationFilter = "ALL" | string;

export interface KioskFilters {
  searchTerm: string;
  status: KioskStatusFilter;
  locationId: KioskLocationFilter;
}

export interface KioskLocationOption {
  locationId: string;
  locationName: string;
}

export interface KioskSummary {
  total: number;
  active: number;
  provisioning: number;
  maintenance: number;
  disabled: number;
}
