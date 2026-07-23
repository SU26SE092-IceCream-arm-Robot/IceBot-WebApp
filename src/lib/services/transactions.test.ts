import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import {
  getManagementOrderExecutionAttempts,
  listManagementOrders,
} from "@/lib/services/transactions";
import type { GraphQLResponse } from "@/types/dashboard-overview";
import type {
  ExecutionAttemptSummaryResult,
  ManagementOrderListItemResult,
} from "@/types/transactions";

vi.mock("@/lib/axios-client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

function graphQlResponse<T>(response: GraphQLResponse<T>): AxiosResponse<GraphQLResponse<T>> {
  return {
    data: response,
    status: 200,
    statusText: "OK",
    headers: {},
    config: { headers: {} },
  } as AxiosResponse<GraphQLResponse<T>>;
}

const pageInfo = {
  page: 1,
  pageSize: 20,
  totalCount: 1,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
};

describe("management transaction GraphQL contracts", () => {
  beforeEach(() => {
    vi.mocked(axiosClient.post).mockReset();
  });

  it("rejects a GraphQL response containing errors even when data is present", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue(
      graphQlResponse<{
        orders: {
          items: ManagementOrderListItemResult[];
          pageInfo: typeof pageInfo;
        };
      }>({
        data: {
          orders: {
            items: [],
            pageInfo: { ...pageInfo, totalCount: 0 },
          },
        },
        errors: [
          {
            message: "Không có quyền xem đơn hàng.",
            extensions: { code: "FORBIDDEN" },
          },
        ],
      }),
    );

    await expect(
      listManagementOrders({ pageNumber: 1, pageSize: 20 }),
    ).rejects.toMatchObject({
      message: "Không có quyền xem đơn hàng.",
      code: "FORBIDDEN",
    });
  });

  it("maps execution-attempt list items from the summary-only contract", async () => {
    const summary: ExecutionAttemptSummaryResult = {
      sourceCommandId: "11111111-1111-1111-1111-111111111111",
      dispatchAttemptNo: 1,
      commandStatus: "Accepted",
      createdAt: "2026-07-23T08:00:00Z",
      deliveredAt: null,
      respondedAt: null,
      rejectionCode: null,
      rejectionMessage: null,
      executionStatus: "Pending",
      observationStatus: "NotObserved",
      customerExecutionStatus: "Processing",
    };

    vi.mocked(axiosClient.post).mockResolvedValue(
      graphQlResponse({
        data: {
          orderExecutionAttempts: {
            items: [summary],
            pageInfo,
          },
        },
      }),
    );

    const result = await getManagementOrderExecutionAttempts(
      "22222222-2222-2222-2222-222222222222",
      { pageNumber: 1, pageSize: 20 },
    );

    expect(result.data).toEqual([summary]);
    expect(result.data[0]).not.toHaveProperty("deliveryAttempts");
    expect(result.data[0]).not.toHaveProperty("productionExecutions");
    expect(result.pagination).toEqual(pageInfo);
  });
});
