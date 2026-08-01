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
  "kiosks.update": ["SystemAdmin", "OrgAdmin", "Manager", "Technician"],
  "devices.view": ["SystemAdmin", "OrgAdmin", "Manager", "Staff", "Technician"],
  "devices.manage": ["SystemAdmin", "OrgAdmin", "Manager", "Technician"],
  "device-catalog.read": ["SystemAdmin", "OrgAdmin", "Manager", "Staff", "Technician"],
  "inventory.view": ["SystemAdmin", "OrgAdmin", "Manager", "Staff", "Technician"],
  "inventory.manage": ["SystemAdmin", "Manager", "Staff", "Technician"],
  "inventory.configure": ["SystemAdmin", "Manager", "Technician"],
  "orders.view": ["SystemAdmin", "OrgAdmin", "Manager", "Staff"],
  "orders.manage": ["SystemAdmin", "OrgAdmin", "Manager", "Staff"],
  "refunds.manage": ["SystemAdmin", "Manager", "Staff"],
  "products.manage": ["SystemAdmin", "OrgAdmin", "Manager"],
  "product-categories.manage": ["SystemAdmin"],
  "ingredients.manage": ["SystemAdmin"],
  "device-catalog.manage": ["SystemAdmin"],
  "product-templates.manage": ["SystemAdmin"],
  "package.manage": ["SystemAdmin"],
  "sync-dead-letters.manage": ["SystemAdmin"],
  "menus.manage": ["SystemAdmin", "OrgAdmin", "Manager"],
  "ingredients.read": ["SystemAdmin", "OrgAdmin", "Manager"],
  "reports.view": ["SystemAdmin", "OrgAdmin", "Manager"],
  "accounts.read": ["SystemAdmin", "OrgAdmin"],
  "accounts.manage": ["SystemAdmin", "OrgAdmin"],
  "roles.view": ["SystemAdmin", "OrgAdmin", "Manager"],
  "role-scope-options.view": ["SystemAdmin", "OrgAdmin", "Manager"],
  "tenant-tree.view": ["SystemAdmin", "OrgAdmin", "Manager", "Technician"],
  "maintenance.view": ["SystemAdmin", "OrgAdmin", "Manager", "Staff", "Technician"],
  "maintenance.create": ["SystemAdmin", "OrgAdmin", "Manager", "Staff", "Technician"],
  "maintenance.manage": ["SystemAdmin", "OrgAdmin", "Manager", "Technician"],
  "alerts.view": ["SystemAdmin", "OrgAdmin", "Manager", "Staff", "Technician"],
  "alerts.manage": ["SystemAdmin", "OrgAdmin", "Manager", "Technician"],
  "payments.manage": ["SystemAdmin", "Manager"],
  "payment-methods.manage": ["SystemAdmin"],
  "operations.view": ["SystemAdmin", "OrgAdmin", "Manager", "Staff", "Technician"],
  "operations.diagnostics": ["SystemAdmin", "Technician"],
  "notifications.view": ["SystemAdmin", "OrgAdmin", "Manager", "Technician"],
  "notifications.manage": ["SystemAdmin", "OrgAdmin", "Manager", "Technician"],
  "artifact.read": ["SystemAdmin", "OrgAdmin"],
  "artifact.upload": ["SystemAdmin", "OrgAdmin"],
  "artifact-template.read": ["SystemAdmin", "OrgAdmin"],
  "program.read": ["SystemAdmin", "OrgAdmin", "Manager"],
  "program.manage": ["SystemAdmin", "OrgAdmin", "Manager"],
  "release.read": ["SystemAdmin", "OrgAdmin", "Manager"],
  "release.publish": ["SystemAdmin", "OrgAdmin"],
  "release.deploy": ["SystemAdmin", "OrgAdmin", "Manager"],
  "release.rollback": ["SystemAdmin", "OrgAdmin", "Manager"],
  "deployment.read": ["SystemAdmin", "OrgAdmin", "Manager", "Technician"],
  "package.read": ["SystemAdmin", "OrgAdmin", "Manager"],
  "package.install": ["SystemAdmin", "OrgAdmin", "Manager"],
  "package.fork": ["SystemAdmin", "OrgAdmin"],
};

export const ROUTE_PERMISSIONS: Record<
  DashboardRoutePath,
  DashboardPermission
> = {
  "/dashboard": "dashboard.view",
  "/readiness": "dashboard.view",
  "/production": "program.read",
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
  "/platform/exceptions": "sync-dead-letters.manage",
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

export function hasAnyRole(
  access: EffectiveAccessResult | null,
  roles: readonly BackendRoleCode[],
): boolean {
  if (!access) return false;
  const assignedRoles = effectiveRoles(access);
  return roles.some((role) => assignedRoles.has(role.toLocaleLowerCase()));
}

export function hasScopedRole(
  access: EffectiveAccessResult | null,
  roles: readonly BackendRoleCode[],
  scope: { organizationId: string; storeId?: string | null; kioskId?: string | null },
): boolean {
  if (!access) return false;
  if (access.isSystemAdmin && roles.includes("SystemAdmin")) return true;

  const allowed = new Set(roles.map((role) => role.toLocaleLowerCase()));
  return access.roleScopes.some((assignment) => {
    if (!allowed.has(assignment.roleCode.toLocaleLowerCase())) return false;
    if (assignment.kioskId) return assignment.kioskId === scope.kioskId;
    if (assignment.storeId) return assignment.storeId === scope.storeId;
    if (assignment.organizationId) {
      return assignment.organizationId === scope.organizationId;
    }
    return true;
  });
}

export function hasScopedPermission(
  access: EffectiveAccessResult | null,
  permission: DashboardPermission,
  scope: { organizationId: string; storeId?: string | null; kioskId?: string | null },
): boolean {
  return hasScopedRole(access, PERMISSION_ROLES[permission], scope);
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
