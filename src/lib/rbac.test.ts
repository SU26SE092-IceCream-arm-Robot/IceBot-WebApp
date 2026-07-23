import { describe, expect, it } from "vitest";

import { hasPermission } from "@/lib/rbac";

describe("payment method permissions", () => {
  it("allows configured management roles to view the Payment Methods route", () => {
    expect(hasPermission("ADMIN", "payments.manage")).toBe(true);
    expect(hasPermission("MANAGER", "payments.manage")).toBe(true);
    expect(hasPermission("LOCATION_OWNER", "payments.manage")).toBe(false);
  });

  it.todo(
    "uses a separate effective permission for viewing Payment Methods and toggling status",
  );
});
