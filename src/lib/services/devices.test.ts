import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import {
  createManagementDevice,
  retireManagementDevice,
  setManagementDeviceStatus,
  updateManagementDevice,
} from "@/lib/services/devices";
import type { ApiResult } from "@/types";
import type { DeviceResult } from "@/types/devices";

vi.mock("@/lib/axios-client", () => ({
  default: {
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

function response(result: ApiResult<DeviceResult>): AxiosResponse<ApiResult<DeviceResult>> {
  return { data: result, status: 200, statusText: "OK", headers: {}, config: { headers: {} } } as AxiosResponse<ApiResult<DeviceResult>>;
}

const device = { id: "device-1", name: "Bộ rót" } as DeviceResult;

describe("device management contracts", () => {
  beforeEach(() => {
    vi.mocked(axiosClient.post).mockResolvedValue(response({ succeeded: true, statusCode: 201, data: device }));
    vi.mocked(axiosClient.put).mockResolvedValue(response({ succeeded: true, statusCode: 200, data: device }));
    vi.mocked(axiosClient.patch).mockResolvedValue(response({ succeeded: true, statusCode: 200, data: device }));
    vi.mocked(axiosClient.delete).mockResolvedValue(response({ succeeded: true, statusCode: 200, data: device }));
  });

  it("uses kiosk-owned create and update routes", async () => {
    const createRequest = { deviceTypeId: 1, code: "DISP-01", name: "Bộ rót" };
    await createManagementDevice("kiosk-1", createRequest);
    expect(axiosClient.post).toHaveBeenCalledWith(
      "/api/v1/management/kiosks/kiosk-1/devices",
      createRequest,
    );

    const updateRequest = { deviceTypeId: 1, name: "Bộ rót mới" };
    await updateManagementDevice("kiosk-1", "device-1", updateRequest);
    expect(axiosClient.put).toHaveBeenCalledWith(
      "/api/v1/management/kiosks/kiosk-1/devices/device-1",
      updateRequest,
    );
  });

  it("keeps status and retire operations separate", async () => {
    await setManagementDeviceStatus("kiosk-1", "device-1", { status: "Maintenance" });
    expect(axiosClient.patch).toHaveBeenCalledWith(
      "/api/v1/management/kiosks/kiosk-1/devices/device-1/status",
      { status: "Maintenance" },
    );

    await retireManagementDevice("kiosk-1", "device-1", "Thay thiết bị");
    expect(axiosClient.delete).toHaveBeenCalledWith(
      "/api/v1/management/kiosks/kiosk-1/devices/device-1",
      { params: { reason: "Thay thiết bị" } },
    );
  });

  it("surfaces backend lifecycle conflicts", async () => {
    vi.mocked(axiosClient.delete).mockResolvedValue(
      response({ succeeded: false, statusCode: 409, message: "Device cannot be retired while execution is running." }),
    );
    await expect(retireManagementDevice("kiosk-1", "device-1", "Bảo trì")).rejects.toThrow(
      "Device cannot be retired while execution is running.",
    );
  });
});
