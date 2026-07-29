import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import { listNotificationDeliveries, requeueNotificationDelivery } from "@/lib/services/notification-deliveries";
import type { ApiResult } from "@/types";
import type { NotificationDeliveriesPage, NotificationDeliveryResult } from "@/types/notification-deliveries";

vi.mock("@/lib/axios-client", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

function response<T>(result: ApiResult<T>): AxiosResponse<ApiResult<T>> {
  return { data: result, status: 200, statusText: "OK", headers: {}, config: { headers: {} } } as AxiosResponse<ApiResult<T>>;
}

const delivery = { id: "delivery-1", status: "PermanentFailure", notificationType: "critical_alert" } as NotificationDeliveryResult;

describe("notification delivery operational contract", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists normal organization-scoped delivery evidence", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue({
      ...response({ succeeded: true, statusCode: 200, data: [delivery] }),
      data: { succeeded: true, statusCode: 200, data: [delivery], pagination: { page: 1, pageSize: 20, totalCount: 1, totalPages: 1, hasNext: false, hasPrevious: false } },
    } as AxiosResponse<NotificationDeliveriesPage>);

    await expect(listNotificationDeliveries("org-1")).resolves.toMatchObject({ data: [delivery] });
    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/management/organizations/org-1/notification-deliveries",
      { params: { status: undefined, pageNumber: 1, pageSize: 20 }, signal: undefined },
    );
  });

  it("requeues only through the explicit normal management command", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue(response({ succeeded: true, statusCode: 200, data: delivery }));
    await requeueNotificationDelivery("org-1", "delivery-1", "Provider recovered");
    expect(axiosClient.post).toHaveBeenCalledWith(
      "/api/v1/management/organizations/org-1/notification-deliveries/delivery-1/requeue",
      { reason: "Provider recovered" },
    );
  });
});
