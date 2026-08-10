import { describe, expect, it } from "vitest";

import {
  createConfigurationReleaseRouteDrafts,
  toConfigurationReleaseRouteRequests,
  validateConfigurationReleaseRouteDrafts,
} from "@/components/features/kiosks/configuration-release-routes";
import type { ConfigurationReleaseResult } from "@/types/production-operations";

const release = {
  id: "release-1",
  revision: "a".repeat(64),
  routes: [
    {
      id: "route-a",
      recipeId: "recipe-a",
      routeCode: "ROUTE-A",
      priority: 10,
      requiredCapabilities: [{ code: "ARM", required: true }],
      supportedOptionCodes: ["TOPPING"],
      robotBindings: [
        {
          id: "binding-a",
          productionProgramBindingId: "production-binding-a",
          robotProgramId: "program-a",
          bindingOrder: 2,
          requiredCapabilityCodes: ["ARM"],
        },
      ],
    },
    {
      id: "route-b",
      recipeId: "recipe-b",
      routeCode: "ROUTE-B",
      priority: 20,
      requiredCapabilities: [{ code: "DISPENSER", required: true }],
      supportedOptionCodes: [],
      robotBindings: [
        {
          id: "binding-b",
          robotProgramId: "program-b",
          bindingOrder: 1,
          requiredCapabilityCodes: ["DISPENSER"],
        },
      ],
    },
  ],
} as ConfigurationReleaseResult;

describe("configuration release route drafts", () => {
  it("preserves every existing route and typed technical requirement", () => {
    const requests = toConfigurationReleaseRouteRequests(
      createConfigurationReleaseRouteDrafts(release),
    );

    expect(requests).toHaveLength(2);
    expect(requests[0]).toMatchObject({
      routeCode: "ROUTE-A",
      requiredCapabilities: [{ code: "ARM", required: true }],
      supportedOptionCodes: ["TOPPING"],
    });
    expect(requests[1]).toMatchObject({ routeCode: "ROUTE-B" });
    expect(requests[0].robotBindings[0].bindingOrder).toBe(1);
    expect(requests[0].robotBindings[0].productionProgramBindingId).toBe(
      "production-binding-a",
    );
  });

  it("rejects duplicate routes and duplicate programs before submit", () => {
    const drafts = createConfigurationReleaseRouteDrafts(release);
    drafts[1].routeCode = "route-a";
    expect(validateConfigurationReleaseRouteDrafts(drafts)).toContain(
      "bị trùng",
    );

    drafts[1].routeCode = "ROUTE-B";
    drafts[1].robotBindings.push({ ...drafts[1].robotBindings[0] });
    expect(validateConfigurationReleaseRouteDrafts(drafts)).toContain(
      "dùng trùng",
    );
  });
});
