import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import { listOrganizationSalesSummaries } from "@/lib/services/platform/organization-sales";
import type { OrganizationSalesPage } from "@/types/platform/organization-sales";

vi.mock("@/lib/axios-client", () => ({ default: { get: vi.fn() } }));

function response(data: OrganizationSalesPage): AxiosResponse<OrganizationSalesPage> {
  return { data, status: 200, statusText: "OK", headers: {}, config: { headers: {} } } as AxiosResponse<OrganizationSalesPage>;
}

const pagination = {
  page: 1,
  pageSize: 20,
  totalCount: 1,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
};

describe("organization sales summary contract", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends the required UTC range and server-side filters", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue(response({
      succeeded: true,
      statusCode: 200,
      data: [],
      pagination,
    }));

    await listOrganizationSalesSummaries({
      from: "2026-08-01T00:00:00.000Z",
      to: "2026-08-14T00:00:00.000Z",
      organizationId: "org-1",
      search: " IceBot ",
      pageNumber: 1,
      pageSize: 20,
    });

    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/management/organizations/sales-summaries",
      {
        params: {
          from: "2026-08-01T00:00:00.000Z",
          to: "2026-08-14T00:00:00.000Z",
          organizationId: "org-1",
          search: "IceBot",
          pageNumber: 1,
          pageSize: 20,
        },
        signal: undefined,
      },
    );
  });

  it("accepts an empty successful aggregate page", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue(response({
      succeeded: true,
      statusCode: 200,
      data: [],
      pagination: { ...pagination, totalCount: 0 },
    }));

    const result = await listOrganizationSalesSummaries({
      from: "2026-08-01T00:00:00.000Z",
      to: "2026-08-14T00:00:00.000Z",
      pageNumber: 1,
      pageSize: 20,
    });

    expect(result.data).toEqual([]);
  });

  it("does not convert a failed envelope into an empty report", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue(response({
      succeeded: false,
      statusCode: 403,
      message: "Only system administrators can access organization sales summaries.",
      pagination,
    }));

    await expect(listOrganizationSalesSummaries({
      from: "2026-08-01T00:00:00.000Z",
      to: "2026-08-14T00:00:00.000Z",
      pageNumber: 1,
      pageSize: 20,
    })).rejects.toThrow("Only system administrators");
  });
});
