import type {
  DashboardPermission,
  DashboardRole,
  DashboardRoutePath,
} from "@/types";
import type { EffectiveAccessResult } from "@/types/accounts";

export type EffectivePermission =
  | "payments.manage"
  | "payment-methods.manage"
  | "operations.diagnostics";

const EFFECTIVE_PERMISSION_ROLES: Record<
  EffectivePermission,
  readonly string[]
> = {
  "payments.manage": ["SystemAdmin", "Manager"],
  "payment-methods.manage": ["SystemAdmin"],
  "operations.diagnostics": ["SystemAdmin", "Technician"],
};

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
  "alerts.manage": ["ADMIN", "MANAGER", "LOCATION_OWNER"],
  // Backend payments.manage currently allows only SystemAdmin and Manager.
  "payments.manage": ["ADMIN", "MANAGER"],
};

export const ROUTE_PERMISSIONS: Record<DashboardRoutePath, DashboardPermission> = {
  "/dashboard": "dashboard.view",
  "/readiness": "dashboard.view",
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
  "/readiness",
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

export function hasEffectivePermission(
  access: EffectiveAccessResult | null,
  permission: EffectivePermission,
): boolean {
  if (!access) {
    return false;
  }

  if (access.isSystemAdmin) {
    return true;
  }

  const allowedRoles = EFFECTIVE_PERMISSION_ROLES[permission];
  const normalizedRoles = new Set(
    access.roles.map((role) => role.toLocaleLowerCase()),
  );
  return allowedRoles.some((role) =>
    normalizedRoles.has(role.toLocaleLowerCase()),
  );
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
