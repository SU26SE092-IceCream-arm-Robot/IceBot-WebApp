import { describe, expect, it } from "vitest";

import {
  findOrganizationIdentityConflict,
  hasDuplicateStoreName,
} from "@/lib/tenant-identity";

const organization = {
  id: "organization-1",
  code: "ICEBOT-01",
  name: "IceBot Viet Nam",
  taxCode: "0312-345-678",
  status: "Active" as const,
  createdAt: "2026-07-31T00:00:00.000Z",
};

const store = {
  id: "store-1",
  organizationId: "organization-1",
  code: "HCM-01",
  name: "IceBot Quận 10",
  storeType: "Retail",
  status: "Active" as const,
  timeZone: "Asia/Bangkok",
  openingHours: [],
  isSalesPaused: false,
  createdAt: "2026-07-31T00:00:00.000Z",
};

describe("tenant identity guards", () => {
  it("treats organization names as case and whitespace insensitive", () => {
    expect(
      findOrganizationIdentityConflict([organization], {
        name: "  icebot   viet nam ",
      }),
    ).toBe("name");
  });

  it("treats entered tax codes as equivalent when separators differ", () => {
    expect(
      findOrganizationIdentityConflict([organization], {
        name: "Một tổ chức khác",
        taxCode: "0312345678",
      }),
    ).toBe("taxCode");
  });

  it("allows an organization to retain its own name and tax code", () => {
    expect(
      findOrganizationIdentityConflict(
        [organization],
        { name: organization.name, taxCode: organization.taxCode },
        organization.id,
      ),
    ).toBeNull();
  });

  it("prevents duplicate store names within the loaded organization scope", () => {
    expect(hasDuplicateStoreName([store], "  icebot  quận 10 ")).toBe(true);
    expect(hasDuplicateStoreName([store], store.name, store.id)).toBe(false);
  });
});
