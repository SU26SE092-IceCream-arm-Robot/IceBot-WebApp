import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import {
  createDispenserState,
  rebindDispenserState,
  setDispenserStateStatus,
  updateDispenserState,
} from "@/lib/services/inventory";

vi.mock("@/lib/axios-client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

function apiResponse<T>(data: T): AxiosResponse {
  return {
    data: { succeeded: true, statusCode: 200, data },
    status: 200,
    statusText: "OK",
    headers: {},
    config: { headers: {} },
  } as AxiosResponse;
}

describe("inventory topology management contracts", () => {
  beforeEach(() => {
    vi.mocked(axiosClient.post).mockReset();
    vi.mocked(axiosClient.put).mockReset();
    vi.mocked(axiosClient.patch).mockReset();
  });

  it("uses kiosk-owned create and update routes with typed calibration points", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue(apiResponse({ id: "state-1" }));
    vi.mocked(axiosClient.put).mockResolvedValue(apiResponse({ id: "state-1" }));
    const createRequest = {
      deviceId: "device-1",
      ingredientId: "ingredient-1",
      containerCode: "BIN-A",
      capacityQuantity: 1000,
      unit: "gram",
      levelToQuantityProfile: [
        { level: "Low" as const, estimatedQuantity: 100 },
        { level: "Medium" as const, estimatedQuantity: 500 },
        { level: "Full" as const, estimatedQuantity: 900 },
      ],
    };

    await createDispenserState("kiosk-1", createRequest);
    await updateDispenserState("kiosk-1", "state-1", {
      capacityQuantity: 1200,
      unit: "gram",
      levelToQuantityProfile: createRequest.levelToQuantityProfile,
      reason: "Hiệu chuẩn lại khay",
    });

    expect(axiosClient.post).toHaveBeenCalledWith(
      "/api/v1/management/kiosks/kiosk-1/inventory/dispenser-states",
      createRequest,
    );
    expect(axiosClient.put).toHaveBeenCalledWith(
      "/api/v1/management/kiosks/kiosk-1/inventory/dispenser-states/state-1",
      expect.objectContaining({ reason: "Hiệu chuẩn lại khay" }),
    );
  });

  it("uses explicit status and rebind contracts without delete or IoT calls", async () => {
    vi.mocked(axiosClient.patch).mockResolvedValue(apiResponse({ id: "state-1" }));
    vi.mocked(axiosClient.post).mockResolvedValue(
      apiResponse({ sourceDispenserStateId: "state-1", replacement: { id: "state-2" } }),
    );

    await setDispenserStateStatus("kiosk-1", "state-1", {
      isActive: false,
      reason: "Thay khay vật lý",
    });
    await rebindDispenserState("kiosk-1", "state-1", {
      deviceId: "device-2",
      ingredientId: "ingredient-1",
      containerCode: "BIN-B",
      capacityQuantity: 1000,
      unit: "gram",
      levelToQuantityProfile: [],
      estimateDisposition: "Transfer",
      reason: "Chuyển sang khay thay thế",
    });

    expect(axiosClient.patch).toHaveBeenCalledWith(
      "/api/v1/management/kiosks/kiosk-1/inventory/dispenser-states/state-1/status",
      { isActive: false, reason: "Thay khay vật lý" },
    );
    expect(axiosClient.post).toHaveBeenCalledWith(
      "/api/v1/management/kiosks/kiosk-1/inventory/dispenser-states/state-1/rebind",
      expect.objectContaining({
        estimateDisposition: "Transfer",
        deviceId: "device-2",
      }),
    );
  });
});
