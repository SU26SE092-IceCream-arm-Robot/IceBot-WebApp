import { describe, expect, it } from "vitest";

import { getOrganizationLifecycleActions } from "@/components/features/tenants/organizations/organization-lifecycle";

describe("organization lifecycle action presentation", () => {
  it("offers suspend and deactivate for an active organization", () => {
    expect(getOrganizationLifecycleActions("Active").map((item) => item.value))
      .toEqual(["suspend", "deactivate"]);
  });

  it("offers resume and deactivate for a suspended organization", () => {
    expect(getOrganizationLifecycleActions("Suspended").map((item) => item.value))
      .toEqual(["resume", "deactivate"]);
  });

  it("only offers reactivate for an inactive organization", () => {
    expect(getOrganizationLifecycleActions("Inactive").map((item) => item.value))
      .toEqual(["reactivate"]);
  });

  it.each(["Disabled", "Archived"] as const)(
    "does not invent an unsupported transition from %s",
    (status) => expect(getOrganizationLifecycleActions(status)).toEqual([]),
  );
});
