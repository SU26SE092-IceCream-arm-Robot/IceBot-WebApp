import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import { listKioskMenuItemAvailability, setKioskMenuItemAvailability } from "@/lib/services/kiosks/menu-item-availability";
import type { ApiResult } from "@/types";
import type { KioskMenuItemAvailabilityResult } from "@/types/kiosks/menu-item-availability";

vi.mock("@/lib/axios-client", () => ({ default: { get: vi.fn(), put: vi.fn() } }));

function response<T>(result: ApiResult<T>): AxiosResponse<ApiResult<T>> {
  return { data: result, status: 200, statusText: "OK", headers: {}, config: { headers: {} } } as AxiosResponse<ApiResult<T>>;
}

const item = { kioskId: "kiosk-1", menuId: "menu-1", menuItemId: "item-1", state: "Available", revision: 0 } as KioskMenuItemAvailabilityResult;

describe("kiosk menu-item availability contracts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists availability through the kiosk-owned management route", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue(response({ succeeded: true, statusCode: 200, data: [item] }));
    await listKioskMenuItemAvailability("kiosk/1", { search: "kem", state: "Paused" });
    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/management/kiosks/kiosk%2F1/menu-item-availability",
      { params: { search: "kem", state: "Paused" }, signal: undefined },
    );
  });

  it("preserves reason, revision, and request identity in the pause mutation", async () => {
    vi.mocked(axiosClient.put).mockResolvedValue(response({ succeeded: true, statusCode: 200, data: { ...item, state: "Paused", revision: 1 } }));
    const request = { state: "Paused" as const, reasonCode: "OutOfStock" as const, reason: "Hết kem", expectedRevision: 0, requestId: "request-1" };
    await setKioskMenuItemAvailability("kiosk-1", "item/1", request);
    expect(axiosClient.put).toHaveBeenCalledWith(
      "/api/v1/management/kiosks/kiosk-1/menu-items/item%2F1/availability",
      request,
    );
  });

  it("surfaces backend conflicts instead of reporting success", async () => {
    vi.mocked(axiosClient.put).mockResolvedValue(response({ succeeded: false, statusCode: 409, message: "Availability changed by another operator." }));
    await expect(setKioskMenuItemAvailability("kiosk-1", "item-1", { state: "Paused", reasonCode: "Other", expectedRevision: 1 })).rejects.toThrow("Availability changed by another operator.");
  });
});
