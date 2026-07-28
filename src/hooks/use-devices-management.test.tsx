import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDevices } from "@/hooks/use-devices";
import {
  createManagementDevice,
  getDevicesByKiosk,
} from "@/lib/services/devices";
import type { DeviceResult } from "@/types/devices";

vi.mock("@/lib/services/devices", () => ({
  getDevicesByKiosk: vi.fn(),
  createManagementDevice: vi.fn(),
  updateManagementDevice: vi.fn(),
  setManagementDeviceStatus: vi.fn(),
  retireManagementDevice: vi.fn(),
  getDeviceManagementErrorMessage: vi.fn((error: unknown) =>
    error instanceof Error ? error.message : "Không thể thực hiện thao tác.",
  ),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => { resolve = resolvePromise; });
  return { promise, resolve };
}

describe("useDevices management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDevicesByKiosk).mockResolvedValue({
      succeeded: true,
      statusCode: 200,
      data: [],
    });
  });

  it("guards duplicate create submissions and applies the authoritative result", async () => {
    const pending = deferred<DeviceResult>();
    vi.mocked(createManagementDevice).mockReturnValue(pending.promise);
    const { result } = renderHook(() => useDevices("kiosk-1"));
    await waitFor(() => expect(result.current.state).toBe("SUCCESS"));

    const request = { deviceTypeId: 1, code: "DISP-01", name: "Bộ rót" };
    let first!: Promise<DeviceResult | null>;
    act(() => { first = result.current.createDevice(request); });

    let second: DeviceResult | null = {} as DeviceResult;
    await act(async () => { second = await result.current.createDevice(request); });
    expect(second).toBeNull();
    expect(createManagementDevice).toHaveBeenCalledOnce();

    pending.resolve({ id: "device-1", kioskId: "kiosk-1", name: "Bộ rót" } as DeviceResult);
    await act(async () => { await first; });

    expect(result.current.devices).toHaveLength(1);
    expect(toast.success).toHaveBeenCalledOnce();
  });
});
