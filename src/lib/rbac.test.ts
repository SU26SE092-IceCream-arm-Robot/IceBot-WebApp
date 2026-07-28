import { describe, expect, it } from "vitest";

import {
  canAccessRoute,
  getDashboardRoutePath,
  getVisibleRoutes,
  hasEffectivePermission,
  hasPermission,
} from "@/lib/rbac";
import type { EffectiveAccessResult } from "@/types/accounts";

function accessFor(...roles: string[]): EffectiveAccessResult {
  return {
    accountId: "11111111-1111-1111-1111-111111111111",
    isSystemAdmin: roles.includes("SystemAdmin"),
    roles,
    roleScopes: [],
    effectiveScope: {
      organizationIds: [],
      storeIds: [],
      kioskIds: [],
    },
  };
}

describe("payment method permissions", () => {
  it("allows configured management roles to view the Payment Methods route", () => {
    expect(hasPermission(accessFor("SystemAdmin"), "payments.manage")).toBe(true);
    expect(hasPermission(accessFor("Manager"), "payments.manage")).toBe(true);
    expect(hasPermission(accessFor("OrgAdmin"), "payments.manage")).toBe(false);
  });

  it("uses separate effective permissions for viewing and toggling Payment Methods", () => {
    const systemAdmin = accessFor("SystemAdmin");
    const manager = accessFor("Manager");

    expect(hasEffectivePermission(systemAdmin, "payments.manage")).toBe(true);
    expect(
      hasEffectivePermission(systemAdmin, "payment-methods.manage"),
    ).toBe(true);
    expect(hasEffectivePermission(manager, "payments.manage")).toBe(true);
    expect(
      hasEffectivePermission(manager, "payment-methods.manage"),
    ).toBe(false);
  });

  it("denies effective permissions when current access is unavailable", () => {
    expect(
      hasEffectivePermission(null, "payment-methods.manage"),
    ).toBe(false);
    expect(
      hasEffectivePermission(null, "operations.diagnostics"),
    ).toBe(false);
  });
});

describe("Phase 3 tenant and kiosk operation permissions", () => {
  it("keeps Store lifecycle and sales management out of the Manager role", () => {
    expect(hasPermission(accessFor("Manager"), "stores.update")).toBe(true);
    expect(hasPermission(accessFor("Manager"), "stores.manage")).toBe(false);
    expect(hasPermission(accessFor("OrgAdmin"), "stores.manage")).toBe(true);
  });

  it("allows Manager operational Kiosk management and advanced Device access", () => {
    expect(hasPermission(accessFor("Manager"), "kiosks.manage")).toBe(true);
    expect(hasPermission(accessFor("Manager"), "devices.manage")).toBe(true);
    expect(hasPermission(accessFor("Staff"), "devices.manage")).toBe(false);
  });

  it("limits inventory topology configuration to the backend policy roles", () => {
    expect(hasPermission(accessFor("SystemAdmin"), "inventory.configure")).toBe(
      true,
    );
    expect(hasPermission(accessFor("Manager"), "inventory.configure")).toBe(
      true,
    );
    expect(
      hasPermission(accessFor("Technician"), "inventory.configure"),
    ).toBe(true);
    expect(hasPermission(accessFor("OrgAdmin"), "inventory.configure")).toBe(
      false,
    );
    expect(hasPermission(accessFor("Staff"), "inventory.configure")).toBe(
      false,
    );
  });
});

describe("exact backend roles and route visibility", () => {
  it("preserves Staff and Technician permissions instead of dropping their session", () => {
    expect(hasPermission(accessFor("Staff"), "orders.view")).toBe(true);
    expect(hasPermission(accessFor("Staff"), "dashboard.view")).toBe(false);
    expect(hasPermission(accessFor("Technician"), "dashboard.view")).toBe(true);
    expect(hasPermission(accessFor("Technician"), "operations.diagnostics")).toBe(true);
  });

  it("guards detail routes with the permission of their owning module", () => {
    expect(getDashboardRoutePath("/kiosks/kiosk-1")).toBe("/kiosks");
    expect(getDashboardRoutePath("/organizations/org-1")).toBe("/organizations");
    expect(getDashboardRoutePath("/outside-dashboard")).toBeNull();
  });

  it("routes Staff to permitted work instead of an inaccessible dashboard", () => {
    const access = accessFor("Staff");
    const routes = getVisibleRoutes(access);

    expect(canAccessRoute(access, "/dashboard")).toBe(false);
    expect(routes).toContain("/inventory");
    expect(routes).toContain("/transactions");
    expect(routes).not.toContain("/dashboard");
  });

  it("separates maintenance creation from maintenance management", () => {
    const staffAccess = accessFor("Staff");

    expect(hasPermission(staffAccess, "maintenance.create")).toBe(true);
    expect(hasPermission(staffAccess, "maintenance.manage")).toBe(false);
  });

  it("combines all role scopes instead of authorizing from one display role", () => {
    const access = accessFor("Manager");
    access.roleScopes = [
      { roleCode: "OrgAdmin", organizationId: "org-1" },
    ];

    expect(hasPermission(access, "products.manage")).toBe(true);
    expect(hasPermission(access, "organizations.update")).toBe(true);
    expect(hasPermission(access, "organizations.manage")).toBe(false);
  });
});

describe("operations diagnostics permission", () => {
  it("matches the backend SystemAdmin and Technician policy", () => {
    expect(
      hasEffectivePermission(accessFor("SystemAdmin"), "operations.diagnostics"),
    ).toBe(true);
    expect(
      hasEffectivePermission(accessFor("Technician"), "operations.diagnostics"),
    ).toBe(true);
    expect(
      hasEffectivePermission(accessFor("Manager"), "operations.diagnostics"),
    ).toBe(false);
  });
});
