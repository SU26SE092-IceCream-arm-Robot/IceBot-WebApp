import type { DashboardPermission, DashboardRoutePath, Role } from "@/types";

export const PERMISSIONS: Record<DashboardPermission, readonly Role[]> = {
  "kiosks.view": ["ADMIN", "MANAGER", "LOCATION_OWNER"],
  "kiosks.control": ["ADMIN", "MANAGER"],
  "inventory.view": ["ADMIN", "MANAGER"],
  "inventory.edit": ["ADMIN", "MANAGER"],
  "transactions.view": ["ADMIN", "MANAGER", "LOCATION_OWNER"],
  "transactions.refund": ["ADMIN", "MANAGER"],
  "menu.view": ["ADMIN", "MANAGER"],
  "menu.edit": ["ADMIN", "MANAGER"],
  "reports.view": ["ADMIN", "MANAGER", "LOCATION_OWNER"],
  "users.view": ["ADMIN"],
  "users.edit": ["ADMIN"],
  "maintenance.view": ["ADMIN", "MANAGER"],
  "maintenance.edit": ["ADMIN", "MANAGER"],
};

export const ROUTE_PERMISSIONS: Record<DashboardRoutePath, DashboardPermission> = {
  "/kiosks": "kiosks.view",
  "/inventory": "inventory.view",
  "/transactions": "transactions.view",
  "/menu": "menu.view",
  "/reports": "reports.view",
  "/users": "users.view",
  "/maintenance": "maintenance.view",
};

const DASHBOARD_ROUTES: readonly DashboardRoutePath[] = [
  "/kiosks",
  "/inventory",
  "/transactions",
  "/menu",
  "/reports",
  "/users",
  "/maintenance",
];

const DASHBOARD_ROUTE_SET: ReadonlySet<string> = new Set(DASHBOARD_ROUTES);

export function hasPermission(role: Role, permission: DashboardPermission): boolean {
  return PERMISSIONS[permission].includes(role);
}

export function canAccessRoute(role: Role, routePath: DashboardRoutePath): boolean {
  return hasPermission(role, ROUTE_PERMISSIONS[routePath]);
}

export function getVisibleRoutes(role: Role): DashboardRoutePath[] {
  return DASHBOARD_ROUTES.filter((routePath) => canAccessRoute(role, routePath));
}

export function isDashboardRoutePath(pathname: string): pathname is DashboardRoutePath {
  return DASHBOARD_ROUTE_SET.has(pathname);
}
