export type DashboardRole = "ADMIN" | "MANAGER" | "LOCATION_OWNER";

export type Role = DashboardRole;

export type BackendRoleCode =
  | "SystemAdmin"
  | "Manager"
  | "LocationOwner"
  | "Staff"
  | "Technician";

export type DashboardRoutePath =
  | "/kiosks"
  | "/inventory"
  | "/transactions"
  | "/menu"
  | "/reports"
  | "/users"
  | "/maintenance";

export type DashboardPermission =
  | "kiosks.view"
  | "kiosks.control"
  | "inventory.view"
  | "inventory.edit"
  | "transactions.view"
  | "transactions.refund"
  | "menu.view"
  | "menu.edit"
  | "reports.view"
  | "users.view"
  | "users.edit"
  | "maintenance.view"
  | "maintenance.edit";

export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  role: DashboardRole;
  locationId?: string;
  locationIds?: string[];
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
  kioskId: string;
  name: string;
  locationId: string;
  locationName: string;
  status: KioskStatus;
  hardwareState: KioskHardwareState;
  currentOrderId?: string;
}

export type KioskStatusFilter = "ALL" | KioskStatus;

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
  online: number;
  error: number;
  maintenance: number;
}
