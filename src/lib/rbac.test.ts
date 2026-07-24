import { describe, expect, it } from "vitest";

import {
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
    expect(hasPermission("ADMIN", "payments.manage")).toBe(true);
    expect(hasPermission("MANAGER", "payments.manage")).toBe(true);
    expect(hasPermission("LOCATION_OWNER", "payments.manage")).toBe(false);
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
