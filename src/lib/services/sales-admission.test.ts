import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import { setManagementKioskOperationalState } from "@/lib/services/kiosk-management";
import {
  pauseManagementStoreSales,
  resumeManagementStoreSales,
} from "@/lib/services/stores";
import type { ApiResult } from "@/types";
import type { KioskResult, StoreResult } from "@/types/kiosk-management";

vi.mock("@/lib/axios-client", () => ({
  default: { patch: vi.fn() },
}));

function apiResponse<T>(result: ApiResult<T>): AxiosResponse<ApiResult<T>> {
  return {
    data: result,
    status: 200,
    statusText: "OK",
    headers: {},
    config: { headers: {} },
  } as AxiosResponse<ApiResult<T>>;
}

describe("sales admission service contracts", () => {
  beforeEach(() => {
    vi.mocked(axiosClient.patch).mockReset();
  });

  it("uses the organization-owned Store sales pause route and preserves payload", async () => {
    vi.mocked(axiosClient.patch).mockResolvedValue(
      apiResponse({ succeeded: true, statusCode: 200, data: {} as StoreResult }),
    );
    const request = {
      reason: "Kiểm tra vận hành",
      resumeAt: "2026-07-29T03:00:00.000Z",
    };

    await pauseManagementStoreSales("org-1", "store-1", request);

    expect(axiosClient.patch).toHaveBeenCalledWith(
      "/api/v1/management/organizations/org-1/stores/store-1/sales-pause",
      request,
    );
  });

  it("uses a separate Store sales resume mutation", async () => {
    vi.mocked(axiosClient.patch).mockResolvedValue(
      apiResponse({ succeeded: true, statusCode: 200, data: {} as StoreResult }),
    );

    await resumeManagementStoreSales("org-1", "store-1");

    expect(axiosClient.patch).toHaveBeenCalledWith(
      "/api/v1/management/organizations/org-1/stores/store-1/sales-resume",
    );
  });

  it("uses the Store-owned Kiosk operational-state route and preserves enum values", async () => {
    vi.mocked(axiosClient.patch).mockResolvedValue(
      apiResponse({ succeeded: true, statusCode: 200, data: {} as KioskResult }),
    );
    const request = {
      state: "EmergencyStopRequested" as const,
      reason: "Yêu cầu kiểm tra an toàn",
    };

    await setManagementKioskOperationalState("store-1", "kiosk-1", request);

    expect(axiosClient.patch).toHaveBeenCalledWith(
      "/api/v1/management/stores/store-1/kiosks/kiosk-1/operational-state",
      request,
    );
  });

  it("surfaces backend conflict messages instead of hiding them", async () => {
    vi.mocked(axiosClient.patch).mockResolvedValue(
      apiResponse<KioskResult>({
        succeeded: false,
        statusCode: 409,
        message: "Kiosk cannot enter Maintenance while an execution is running.",
      }),
    );

    await expect(
      setManagementKioskOperationalState("store-1", "kiosk-1", {
        state: "Maintenance",
        reason: "Bảo trì",
      }),
    ).rejects.toThrow(
      "Kiosk cannot enter Maintenance while an execution is running.",
    );
  });
});
