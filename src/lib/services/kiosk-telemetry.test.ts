import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import { listKioskEvents } from "@/lib/services/kiosk-telemetry";
import type { KioskDeviceEventResult } from "@/types/kiosk-detail";

vi.mock("@/lib/axios-client", () => ({
  default: { get: vi.fn() },
}));

describe("kiosk telemetry management contracts", () => {
  beforeEach(() => {
    vi.mocked(axiosClient.get).mockReset();
  });

  it("uses the backend device-events route", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue({
      data: {
        succeeded: true,
        statusCode: 200,
        data: [] as KioskDeviceEventResult[],
        pagination: {
          page: 1,
          pageSize: 20,
          totalCount: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
      },
    } as AxiosResponse);

    await listKioskEvents("kiosk/1");

    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/management/kiosks/kiosk%2F1/device-events",
      {
        params: {
          pageNumber: 1,
          pageSize: 20,
          from: undefined,
          to: undefined,
        },
        signal: undefined,
      },
    );
  });
});
