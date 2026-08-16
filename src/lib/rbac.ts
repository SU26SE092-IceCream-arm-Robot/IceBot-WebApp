import type {
  BackendRoleCode,
  DashboardPermission,
  DashboardRoutePath,
} from "@/types";
import type { EffectiveAccessResult } from "@/types/identity/accounts";
import { DASHBOARD_ROUTE_REGISTRY } from "@/lib/navigation/dashboard-routes";

export const ROUTE_PERMISSIONS = Object.fromEntries(
  DASHBOARD_ROUTE_REGISTRY.map((route) => [route.path, route.permission]),
) as Record<DashboardRoutePath, DashboardPermission>;

const DASHBOARD_ROUTES = DASHBOARD_ROUTE_REGISTRY.map((route) => route.path);
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
  if (!access || !hasPermission(access, permission)) return false;

  // A missing scope-evidence field can occur only with an older or malformed
  // access payload. Treat it as no authorization rather than throwing.
  const permissionScope = (access.permissionScopes ?? []).find(
    (item) => item.permissionCode === permission,
  );
  if (!permissionScope) return false;
  if (permissionScope.isGlobal) return true;

  return permissionScope.scopes.some((assignment) => {
    if (
      assignment.organizationId &&
      assignment.organizationId !== scope.organizationId
    ) {
      return false;
    }
    if (assignment.storeId && assignment.storeId !== scope.storeId) {
      return false;
    }
    if (assignment.kioskId && assignment.kioskId !== scope.kioskId) {
      return false;
    }
    return Boolean(
      assignment.organizationId || assignment.storeId || assignment.kioskId,
    );
  });
}

export function hasPermission(
  access: EffectiveAccessResult | null,
  permission: DashboardPermission,
): boolean {
  if (!access) {
    return false;
  }

  return access.permissionCodes.includes(permission);
}

export const hasEffectivePermission = hasPermission;

// Organization-specific operational routes forbidden for SystemAdmin:
// SystemAdmin is a platform-level role and does not manage organization orders, products, menus, or inventory.
const FORBIDDEN_SYSTEM_ADMIN_ROUTES: ReadonlySet<DashboardRoutePath> = new Set([
  "/transactions",
  "/menu-availability",
  "/inventory",
  "/products",
  "/menus",
  "/menu",
]);

export function canAccessRoute(
  access: EffectiveAccessResult | null,
  routePath: DashboardRoutePath,
): boolean {
  if (!access) {
    return false;
  }

  if (access.isSystemAdmin && FORBIDDEN_SYSTEM_ADMIN_ROUTES.has(routePath)) {
    return false;
  }

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
