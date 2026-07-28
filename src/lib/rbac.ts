import type {
  BackendRoleCode,
  DashboardPermission,
  DashboardRoutePath,
} from "@/types";
import type { EffectiveAccessResult } from "@/types/accounts";

const PERMISSION_ROLES: Record<
  DashboardPermission,
  readonly BackendRoleCode[]
> = {
  "dashboard.view": ["SystemAdmin", "OrgAdmin", "Manager", "Technician"],
  "organizations.view": ["SystemAdmin", "OrgAdmin"],
  "organizations.manage": ["SystemAdmin"],
  "organizations.update": ["SystemAdmin", "OrgAdmin"],
  "stores.view": ["SystemAdmin", "OrgAdmin", "Manager"],
  "stores.manage": ["SystemAdmin", "OrgAdmin"],
  "stores.update": ["SystemAdmin", "OrgAdmin", "Manager"],
  "kiosks.view": ["SystemAdmin", "OrgAdmin", "Manager", "Technician"],
  "kiosks.manage": ["SystemAdmin", "OrgAdmin", "Manager", "Technician"],
  "devices.view": ["SystemAdmin", "OrgAdmin", "Manager", "Staff", "Technician"],
  "devices.manage": ["SystemAdmin", "OrgAdmin", "Manager", "Technician"],
  "inventory.view": ["SystemAdmin", "OrgAdmin", "Manager", "Staff", "Technician"],
  "inventory.manage": ["SystemAdmin", "Manager", "Staff", "Technician"],
  "inventory.configure": ["SystemAdmin", "Manager", "Technician"],
  "orders.view": ["SystemAdmin", "OrgAdmin", "Manager", "Staff"],
  "orders.manage": ["SystemAdmin", "OrgAdmin", "Manager", "Staff"],
  "refunds.manage": ["SystemAdmin", "Manager", "Staff"],
  "products.manage": ["SystemAdmin", "Manager"],
  "menus.manage": ["SystemAdmin", "Manager"],
  "reports.view": ["SystemAdmin", "OrgAdmin", "Manager"],
  "accounts.read": ["SystemAdmin", "OrgAdmin", "Manager"],
  "accounts.manage": ["SystemAdmin"],
  "roles.view": ["SystemAdmin", "OrgAdmin", "Manager"],
  "maintenance.view": ["SystemAdmin", "OrgAdmin", "Manager", "Staff", "Technician"],
  "maintenance.create": ["SystemAdmin", "OrgAdmin", "Manager", "Staff", "Technician"],
  "maintenance.manage": ["SystemAdmin", "OrgAdmin", "Manager", "Technician"],
  "alerts.view": ["SystemAdmin", "OrgAdmin", "Manager", "Staff", "Technician"],
  "alerts.manage": ["SystemAdmin", "OrgAdmin", "Manager", "Technician"],
  "payments.manage": ["SystemAdmin", "Manager"],
  "payment-methods.manage": ["SystemAdmin"],
  "operations.diagnostics": ["SystemAdmin", "Technician"],
};

export const ROUTE_PERMISSIONS: Record<
  DashboardRoutePath,
  DashboardPermission
> = {
  "/dashboard": "dashboard.view",
  "/readiness": "dashboard.view",
  "/organizations": "organizations.view",
  "/kiosks": "kiosks.view",
  "/inventory": "inventory.view",
  "/transactions": "orders.view",
  "/menu": "products.manage",
  "/reports": "reports.view",
  "/users": "accounts.read",
  "/roles": "roles.view",
  "/maintenance": "maintenance.view",
  "/alerts": "alerts.view",
  "/settings/payment-methods": "payments.manage",
};

const DASHBOARD_ROUTES = Object.keys(
  ROUTE_PERMISSIONS,
) as DashboardRoutePath[];
const DASHBOARD_ROUTE_SET: ReadonlySet<string> = new Set(DASHBOARD_ROUTES);

function effectiveRoles(access: EffectiveAccessResult): Set<string> {
  const roles = new Set(access.roles.map((role) => role.toLocaleLowerCase()));
  for (const scope of access.roleScopes) {
    roles.add(scope.roleCode.toLocaleLowerCase());
  }
  if (access.isSystemAdmin) {
    roles.add("systemadmin");
  }
  return roles;
}

export function hasPermission(
  access: EffectiveAccessResult | null,
  permission: DashboardPermission,
): boolean {
  if (!access) {
    return false;
  }

  const roles = effectiveRoles(access);
  return PERMISSION_ROLES[permission].some((role) =>
    roles.has(role.toLocaleLowerCase()),
  );
}

export const hasEffectivePermission = hasPermission;

export function canAccessRoute(
  access: EffectiveAccessResult | null,
  routePath: DashboardRoutePath,
): boolean {
  return hasPermission(access, ROUTE_PERMISSIONS[routePath]);
}

export function getVisibleRoutes(
  access: EffectiveAccessResult | null,
): DashboardRoutePath[] {
  return DASHBOARD_ROUTES.filter((routePath) =>
    canAccessRoute(access, routePath),
  );
}

export function isDashboardRoutePath(
  pathname: string,
): pathname is DashboardRoutePath {
  return DASHBOARD_ROUTE_SET.has(pathname);
}

export function getDashboardRoutePath(
  pathname: string,
): DashboardRoutePath | null {
  if (isDashboardRoutePath(pathname)) {
    return pathname;
  }

  return (
    DASHBOARD_ROUTES.find((routePath) =>
      pathname.startsWith(`${routePath}/`),
    ) ?? null
  );
}
