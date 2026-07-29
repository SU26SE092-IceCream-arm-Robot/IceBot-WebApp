import { describe, expect, it } from "vitest";

import { evaluateReadiness } from "@/lib/readiness/evaluate-readiness";

describe("evaluateReadiness", () => {
  it("excludes inaccessible catalog and payment sources from the readiness result", () => {
    const result = evaluateReadiness({
      organizationId: "organization-1",
      storeId: "store-1",
      excludedSources: ["products", "menus", "paymentMethods"],
    });

    expect(result.checks.map((check) => check.id)).toEqual([
      "ORG_ACTIVE",
      "STORE_ACTIVE",
      "KIOSK_EXISTS",
    ]);
    expect(result.summary.totalApplicableCount).toBe(3);
    expect(result.summary.unknownCount).toBe(0);
  });
});
