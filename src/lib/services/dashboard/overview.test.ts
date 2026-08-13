import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import { getDashboardOverview } from "@/lib/services/dashboard/overview";
import type {
  DashboardMetrics,
  DashboardOverviewData,
  GraphQLResponse,
} from "@/types/dashboard/overview";

vi.mock("@/lib/axios-client", () => ({
  default: { post: vi.fn() },
}));

function graphQlResponse(
  response: GraphQLResponse<DashboardOverviewData>,
): AxiosResponse<GraphQLResponse<DashboardOverviewData>> {
  return {
    data: response,
    status: 200,
    statusText: "OK",
    headers: {},
    config: { headers: {} },
  } as AxiosResponse<GraphQLResponse<DashboardOverviewData>>;
}

const metrics: DashboardMetrics = {
  organizationCount: 1,
  storeCount: 1,
  kioskCount: 1,
  activeKioskCount: 1,
  offlineKioskCount: 0,
  maintenanceKioskCount: 0,
  pendingOrderCount: 0,
  paidOrderCount: 0,
  refundRequiredOrderCount: 0,
  lowStockDispenserCount: 0,
  latestDeviceEventCount: 0,
};

describe("dashboard GraphQL partial-root contract", () => {
  beforeEach(() => {
    vi.mocked(axiosClient.post).mockReset();
  });

  it("preserves usable roots and exposes independent root errors as warnings", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue(
      graphQlResponse({
        data: {
          dashboard: metrics,
          kioskStatusOverview: null,
          inventorySummary: null,
          orderOverview: null,
        },
        errors: [
          {
            message: "Không thể tải tồn kho.",
            path: ["inventorySummary"],
          },
        ],
      }),
    );

    await expect(getDashboardOverview()).resolves.toEqual({
      data: {
        dashboard: metrics,
        kioskStatusOverview: null,
        inventorySummary: null,
        orderOverview: null,
      },
      warnings: ["Không thể tải tồn kho."],
    });
  });

  it("rejects a response when every dashboard root is unavailable", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue(
      graphQlResponse({
        data: {
          dashboard: null,
          kioskStatusOverview: null,
          inventorySummary: null,
          orderOverview: null,
        },
        errors: [{ message: "Không thể tải tổng quan." }],
      }),
    );

    await expect(getDashboardOverview()).rejects.toThrow(
      "Không thể tải tổng quan.",
    );
  });

  it("does not request order overview when the account lacks orders.view", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue(
      graphQlResponse({ data: { dashboard: metrics } }),
    );

    await getDashboardOverview(undefined, { includeOrderOverview: false });

    const payload = vi.mocked(axiosClient.post).mock.calls[0]?.[1] as {
      query: string;
      variables: Record<string, unknown>;
    };
    expect(payload.query).not.toContain("orderOverview");
    expect(payload.variables).toEqual({});
  });

  it("requests order overview only when explicitly authorized", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue(
      graphQlResponse({ data: { dashboard: metrics, orderOverview: null } }),
    );

    await getDashboardOverview(undefined, { includeOrderOverview: true });

    const payload = vi.mocked(axiosClient.post).mock.calls[0]?.[1] as {
      query: string;
      variables: Record<string, unknown>;
    };
    expect(payload.query).toContain("orderOverview(take: $orderTake)");
    expect(payload.variables).toEqual({ orderTake: 8 });
  });
});
