export type Role = "ADMIN" | "MANAGER" | "LOCATION_OWNER";

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
  role: Role;
  locationId?: string;
  locationIds?: string[];
  avatarInitials: string;
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
