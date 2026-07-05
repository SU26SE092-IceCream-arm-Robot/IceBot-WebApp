import type { DashboardPermission, DashboardRole, DashboardRoutePath } from "@/types";

export const PERMISSIONS: Record<DashboardPermission, readonly DashboardRole[]> = {
  "dashboard.view": ["ADMIN", "MANAGER", "LOCATION_OWNER"],
  "organizations.view": ["ADMIN", "LOCATION_OWNER"],
  "organizations.edit": ["ADMIN", "LOCATION_OWNER"],
  "kiosks.view": ["ADMIN", "MANAGER", "LOCATION_OWNER"],
  "kiosks.control": ["ADMIN", "MANAGER"],
  "inventory.view": ["ADMIN", "MANAGER"],
  "inventory.edit": ["ADMIN", "MANAGER"],
  "transactions.view": ["ADMIN", "MANAGER", "LOCATION_OWNER"],
  "transactions.edit": ["ADMIN", "MANAGER"],
  "transactions.refund": ["ADMIN", "MANAGER"],
  "menu.view": ["ADMIN", "MANAGER"],
  "menu.edit": ["ADMIN", "MANAGER"],
  "reports.view": ["ADMIN", "MANAGER", "LOCATION_OWNER"],
  "users.view": ["ADMIN"],
  "users.edit": ["ADMIN"],
  "maintenance.view": ["ADMIN", "MANAGER"],
  "maintenance.edit": ["ADMIN", "MANAGER"],
  "alerts.view": ["ADMIN", "MANAGER", "LOCATION_OWNER"],
  "alerts.manage": ["ADMIN", "MANAGER"],
  // Backend payments.manage currently allows only SystemAdmin and Manager.
  "payments.manage": ["ADMIN", "MANAGER"],
};

export const ROUTE_PERMISSIONS: Record<DashboardRoutePath, DashboardPermission> = {
  "/dashboard": "dashboard.view",
  "/organizations": "organizations.view",
  "/kiosks": "kiosks.view",
  "/inventory": "inventory.view",
  "/transactions": "transactions.view",
  "/menu": "menu.view",
  "/reports": "reports.view",
  "/users": "users.view",
  "/maintenance": "maintenance.view",
  "/alerts": "alerts.view",
  "/settings/payment-methods": "payments.manage",
};

const DASHBOARD_ROUTES: readonly DashboardRoutePath[] = [
  "/dashboard",
  "/organizations",
  "/kiosks",
  "/inventory",
  "/transactions",
  "/menu",
  "/reports",
  "/users",
  "/maintenance",
  "/alerts",
  "/settings/payment-methods",
];

const DASHBOARD_ROUTE_SET: ReadonlySet<string> = new Set(DASHBOARD_ROUTES);

export function hasPermission(role: DashboardRole, permission: DashboardPermission): boolean {
  return PERMISSIONS[permission].includes(role);
}

export function canAccessRoute(role: DashboardRole, routePath: DashboardRoutePath): boolean {
  return hasPermission(role, ROUTE_PERMISSIONS[routePath]);
}

export function getVisibleRoutes(role: DashboardRole): DashboardRoutePath[] {
  return DASHBOARD_ROUTES.filter((routePath) => canAccessRoute(role, routePath));
}

export function isDashboardRoutePath(pathname: string): pathname is DashboardRoutePath {
  return DASHBOARD_ROUTE_SET.has(pathname);
}
