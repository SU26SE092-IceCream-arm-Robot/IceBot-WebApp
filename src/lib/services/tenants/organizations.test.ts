import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import {
  listManagementOrganizationStatusHistory,
  transitionManagementOrganizationLifecycle,
} from "@/lib/services/tenants/organizations";

vi.mock("@/lib/axios-client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const organization = {
  id: "org-1",
  code: "ICEBOT",
  name: "IceBot",
  status: "Suspended" as const,
  statusRevision: 2,
  createdAt: "2026-08-13T00:00:00Z",
};

describe("organization lifecycle contracts", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(["suspend", "resume", "deactivate", "reactivate"] as const)(
    "posts %s with concurrency and idempotency fields",
    async (action) => {
      vi.mocked(axiosClient.post).mockResolvedValue({
        data: { succeeded: true, data: organization },
      });
      const request = {
        reason: "Đã xác minh nghiệp vụ.",
        reasonCode: action === "suspend" ? "POLICY_REVIEW" : null,
        expectedRevision: 1,
        idempotencyKey: "request-1",
        readinessConfirmed: action === "reactivate",
      };

      await expect(
        transitionManagementOrganizationLifecycle("org-1", action, request),
      ).resolves.toEqual(organization);
      expect(axiosClient.post).toHaveBeenCalledWith(
        `/api/v1/management/organizations/org-1/${action}`,
        request,
      );
    },
  );

  it("loads status history from the organization-owned route", async () => {
    const history = [{
      id: "transition-1",
      fromStatus: "Active",
      toStatus: "Suspended",
      reason: "Kiểm tra chính sách.",
      changedByAccountId: "account-1",
      changedAt: "2026-08-13T00:00:00Z",
      organizationStatusRevision: 2,
    }];
    vi.mocked(axiosClient.get).mockResolvedValue({
      data: { succeeded: true, data: history },
    });

    await expect(
      listManagementOrganizationStatusHistory("org-1"),
    ).resolves.toEqual(history);
    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/management/organizations/org-1/status-history",
      { signal: undefined },
    );
  });
});
