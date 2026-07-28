import { describe, expect, it } from "vitest";

import {
  mapAccountToDashboardUser,
  resolveDashboardRole,
} from "@/lib/auth-session";
import type { AuthSessionAccount } from "@/types";

function accountWithRoles(...roleCodes: string[]): AuthSessionAccount {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    userName: "operator",
    fullName: "IceBot Operator",
    email: "operator@example.com",
    imageUrl: null,
    roles: roleCodes.map((roleCode, index) => ({
      roleCode,
      organizationId: index === 0 ? "org-1" : "org-2",
    })),
    status: "Active",
    localLoginEnabled: true,
    googleLoginEnabled: false,
  };
}

describe("exact current-account role mapping", () => {
  it.each(["SystemAdmin", "OrgAdmin", "Manager", "Staff", "Technician"] as const)(
    "keeps backend role %s as the presentation role",
    (roleCode) => {
      expect(
        mapAccountToDashboardUser(accountWithRoles(roleCode))?.primaryRole,
      ).toBe(roleCode);
    },
  );

  it("uses priority only for presentation without rewriting role assignments", () => {
    const roles = accountWithRoles("Staff", "Manager", "OrgAdmin").roles;

    expect(resolveDashboardRole(roles)).toBe("OrgAdmin");
    expect(roles.map((role) => role.roleCode)).toEqual([
      "Staff",
      "Manager",
      "OrgAdmin",
    ]);
  });

  it("rejects unknown role codes instead of granting a role", () => {
    expect(mapAccountToDashboardUser(accountWithRoles("UnknownRole"))).toBeNull();
  });
});
