import { describe, expect, it } from "vitest";

import {
  canAccessRoute,
  getDashboardRoutePath,
  getVisibleRoutes,
  hasAnyRole,
  hasScopedPermission,
  hasScopedRole,
  hasPermission,
} from "@/lib/rbac";
import type { DashboardPermission } from "@/types";
import type {
  EffectiveAccessResult,
  PermissionScopeAccessResult,
} from "@/types/identity/accounts";

const organizationScope = {
  organizationId: "org-1",
  storeId: "store-1",
  kioskId: "kiosk-1",
};

function accessFor(
  permissionCodes: DashboardPermission[] = [],
  permissionScopes: PermissionScopeAccessResult[] = [],
  roles: string[] = [],
): EffectiveAccessResult {
  return {
    accountId: "11111111-1111-1111-1111-111111111111",
    isSystemAdmin: false,
    roles,
    permissionCodes,
    permissionScopes,
    roleScopes: [],
    effectiveScope: {
      organizationIds: [],
      storeIds: [],
      kioskIds: [],
    },
  };
}

function scopedPermission(
  permissionCode: DashboardPermission,
  scopes: PermissionScopeAccessResult["scopes"],
): PermissionScopeAccessResult {
  return {
    permissionCode,
    scopeRequired: true,
    isGlobal: false,
    scopes,
  };
}

describe("permission-code access", () => {
  it("uses permissionCodes as the capability authority", () => {
    const access = accessFor(["dashboard.view"]);

    expect(hasPermission(access, "dashboard.view")).toBe(true);
    expect(hasPermission(access, "payment-methods.manage")).toBe(false);
  });

  it("keeps route visibility tied to backend permission codes", () => {
    const access = accessFor(["products.manage", "menus.manage"]);

    expect(canAccessRoute(access, "/products")).toBe(true);
    expect(canAccessRoute(access, "/menus")).toBe(true);
    expect(canAccessRoute(access, "/users")).toBe(false);
    expect(getVisibleRoutes(access)).toContain("/products");
    expect(getVisibleRoutes(access)).not.toContain("/users");
  });
});

describe("permission-scope access", () => {
  it("allows an organization-scoped permission for a descendant store and kiosk", () => {
    const access = accessFor(
      ["release.publish"],
      [scopedPermission("release.publish", [{ organizationId: "org-1" }])],
    );

    expect(
      hasScopedPermission(access, "release.publish", organizationScope),
    ).toBe(true);
  });

  it("requires store and kiosk assignments to match their exact scope", () => {
    const access = accessFor(
      ["release.deploy"],
      [scopedPermission("release.deploy", [
        { organizationId: "org-1", storeId: "store-1", kioskId: "kiosk-1" },
      ])],
    );

    expect(
      hasScopedPermission(access, "release.deploy", organizationScope),
    ).toBe(true);
    expect(
      hasScopedPermission(access, "release.deploy", {
        ...organizationScope,
        kioskId: "kiosk-2",
      }),
    ).toBe(false);
  });

  it("does not borrow an organization scope from a different permission", () => {
    const access = accessFor(
      ["release.publish", "release.deploy"],
      [
        scopedPermission("release.publish", [{ organizationId: "org-1" }]),
        scopedPermission("release.deploy", [{ organizationId: "org-2" }]),
      ],
    );

    expect(
      hasScopedPermission(access, "release.publish", organizationScope),
    ).toBe(true);
    expect(
      hasScopedPermission(access, "release.deploy", organizationScope),
    ).toBe(false);
  });

  it("allows global permission evidence without inferring a role", () => {
    const access = accessFor(
      ["device-catalog.read"],
      [{
        permissionCode: "device-catalog.read",
        scopeRequired: false,
        isGlobal: true,
        scopes: [],
      }],
    );

    expect(
      hasScopedPermission(access, "device-catalog.read", organizationScope),
    ).toBe(true);
  });

  it("fails closed when a scoped permission has no backend scope evidence", () => {
    const access = accessFor(["devices.manage"]);

    expect(
      hasScopedPermission(access, "devices.manage", organizationScope),
    ).toBe(false);
  });
});

describe("role presentation helpers", () => {
  it("retains role helpers for role-specific presentation only", () => {
    const access = accessFor([], [], ["Technician"]);
    access.roleScopes = [{ roleCode: "Manager", organizationId: "org-1" }];

    expect(hasAnyRole(access, ["Technician"])).toBe(true);
    expect(
      hasScopedRole(access, ["Manager"], organizationScope),
    ).toBe(true);
  });
});

describe("route path resolution", () => {
  it("resolves dashboard detail paths to their owning route", () => {
    expect(getDashboardRoutePath("/kiosks/kiosk-1")).toBe("/kiosks");
    expect(getDashboardRoutePath("/organizations/org-1")).toBe("/organizations");
    expect(getDashboardRoutePath("/outside-dashboard")).toBeNull();
  });
});
