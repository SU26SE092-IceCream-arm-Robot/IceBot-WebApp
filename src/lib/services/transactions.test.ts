import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import {
  getManagementOrderById,
  getManagementOrderExecutionAttempts,
  listManagementProductionIncidents,
  listManagementOrders,
  recordManualOrderItemFulfillment,
  selectManagementProductionIncidentResolution,
  setPackagedOrderItemFulfillment,
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
    vi.mocked(axiosClient.get).mockReset();
    vi.mocked(axiosClient.post).mockReset();
    vi.mocked(axiosClient.patch).mockReset();
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

  it("maps the authoritative fulfillment type in order detail", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue(
      graphQlResponse({
        data: {
          order: {
            id: "order-1",
            organizationId: null,
            storeId: null,
            kioskId: "kiosk-1",
            orderNumber: "ORD-001",
            clientOrderId: null,
            channel: "KIOSK",
            externalChannel: null,
            status: "READY_FOR_FULFILLMENT",
            paymentStatus: "PAID",
            currency: "VND",
            subtotalAmount: 50000,
            discountAmount: 0,
            taxAmount: 0,
            totalAmount: 50000,
            paidAmount: 50000,
            customerName: null,
            customerPhoneNumber: null,
            notes: null,
            placedAt: "2026-07-28T08:00:00Z",
            paidAt: "2026-07-28T08:01:00Z",
            completedAt: null,
            cancelledAt: null,
            customerStatus: "Preparing",
            customerStatusMessage: "Đang chuẩn bị",
            canRetryPayment: false,
            requiresStaffSupport: false,
            items: [
              {
                id: "item-1",
                menuItemId: "menu-item-1",
                productId: "product-1",
                productVariantId: "variant-1",
                recipeId: null,
                clientLineId: null,
                menuItemCode: "MI-001",
                menuItemName: "Kem ly",
                productCode: "P-001",
                productName: "Kem vani",
                productVariantCode: "DEFAULT",
                productVariantName: "Mặc định",
                recipeVersion: null,
                quantity: 1,
                unitPrice: 50000,
                discountAmount: 0,
                totalAmount: 50000,
                status: "PENDING",
                fulfillmentType: "MACHINE_PRODUCED",
                selectedOptions: [],
              },
            ],
          },
        },
      }),
    );

    const result = await getManagementOrderById("order-1");

    expect(result.items[0].fulfillmentType).toBe("MachineProduced");
    expect(vi.mocked(axiosClient.post).mock.calls[0][1]).toMatchObject({
      query: expect.stringContaining("fulfillmentType"),
    });
  });

  it("uses exact item-owned fulfillment routes and preserves event identity", async () => {
    const order = { id: "order-1", orderNumber: "ORD-001" };
    vi.mocked(axiosClient.post).mockResolvedValue({
      data: { succeeded: true, statusCode: 200, data: order },
    } as AxiosResponse);

    await recordManualOrderItemFulfillment("order-1", "item-1", {
      fulfillmentEventId: "event-1",
      eventType: "Preparing",
      reason: null,
    });
    await setPackagedOrderItemFulfillment("order-1", "item-2", "fulfill", {
      fulfillmentEventId: "event-2",
      reason: null,
    });

    expect(axiosClient.post).toHaveBeenNthCalledWith(
      1,
      "/api/v1/management/orders/order-1/items/item-1/manual-fulfillment-events",
      { fulfillmentEventId: "event-1", eventType: "Preparing", reason: null },
    );
    expect(axiosClient.post).toHaveBeenNthCalledWith(
      2,
      "/api/v1/management/orders/order-1/items/item-2/fulfill",
      { fulfillmentEventId: "event-2", reason: null },
    );
  });

  it("uses scoped incident reads and the exact incident resolution route", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue({
      data: {
        succeeded: true,
        statusCode: 200,
        data: [],
        pagination: pageInfo,
      },
    } as AxiosResponse);
    vi.mocked(axiosClient.post).mockResolvedValue({
      data: {
        succeeded: true,
        statusCode: 200,
        data: { id: "incident-1" },
      },
    } as AxiosResponse);

    await listManagementProductionIncidents({
      status: "AwaitingInspection",
      pageNumber: 1,
      pageSize: 10,
    });
    await selectManagementProductionIncidentResolution(
      "order-1",
      "incident-1",
      {
        resolutionRequestId: "resolution-1",
        resolution: "RequestRemake",
        reason: "Sản phẩm lỗi đã được xác nhận",
        acknowledgeFullOrderCompensation: false,
      },
    );

    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/management/production-incidents",
      expect.objectContaining({
        params: expect.objectContaining({ status: "AwaitingInspection" }),
      }),
    );
    expect(axiosClient.post).toHaveBeenCalledWith(
      "/api/v1/management/orders/order-1/production-incidents/incident-1/resolution",
      expect.objectContaining({
        resolution: "RequestRemake",
        resolutionRequestId: "resolution-1",
      }),
    );
  });
});
