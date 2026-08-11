import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useKioskDetail } from "@/hooks/kiosks/use-kiosk-detail";
import { getKioskDetail } from "@/lib/services/kiosks/detail";
import {
  setManagementKioskOperationalState,
} from "@/lib/services/kiosks/management";
import {
  listKioskEvents,
  listKioskHeartbeats,
} from "@/lib/services/kiosks/telemetry";
import type { KioskManagementDetail } from "@/types/kiosks/detail";
import type { KioskResult } from "@/types/kiosks/management";

vi.mock("@/hooks/identity/use-auth", () => ({
  useAuth: () => ({ currentUser: { id: "account-1" } }),
}));

vi.mock("@/lib/services/kiosks/detail", () => ({
  getKioskDetail: vi.fn(),
}));

vi.mock("@/lib/services/kiosks/management", () => ({
  setManagementKioskOperationalState: vi.fn(),
  getKioskManagementErrorMessage: vi.fn(
    (error: unknown, fallback: string) =>
      error instanceof Error ? error.message : fallback,
  ),
}));

vi.mock("@/lib/services/kiosks/telemetry", () => ({
  listKioskEvents: vi.fn(),
  listKioskHeartbeats: vi.fn(),
  getKioskTelemetryErrorMessage: vi.fn(
    (_error: unknown, fallback: string) => fallback,
  ),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn() },
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

const kiosk: KioskManagementDetail = {
  managementId: "11111111-1111-1111-1111-111111111111",
  kioskId: "KIOSK_DEMO",
  name: "Kiosk Demo",
  organizationId: "22222222-2222-2222-2222-222222222222",
  locationId: "33333333-3333-3333-3333-333333333333",
  locationName: "Store Demo",
  lifecycleStatus: "Active",
  operationalState: "Operational",
  operationalStateReason: null,
  operationalStateChangedAt: null,
  lastOnlineAt: null,
  createdAt: "2026-07-28T00:00:00Z",
  updatedAt: null,
  kioskType: "RoboticVending",
  timeZone: "Asia/Bangkok",
  configurationVersion: 1,
  settingsSchemaVersion: 1,
};

const emptyPage = {
  data: [],
  pagination: {
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  },
};

describe("useKioskDetail operational-state mutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getKioskDetail).mockResolvedValue({ outcome: "SUCCESS", kiosk });
    vi.mocked(listKioskEvents).mockResolvedValue(emptyPage);
    vi.mocked(listKioskHeartbeats).mockResolvedValue(emptyPage);
  });

  it("does not reload kiosk detail when auth focus refresh keeps the same account", async () => {
    const { result, rerender } = renderHook(() => useKioskDetail(kiosk.managementId));
    await waitFor(() => expect(result.current.state).toBe("READY"));

    rerender();

    expect(getKioskDetail).toHaveBeenCalledOnce();
    expect(listKioskHeartbeats).toHaveBeenCalledOnce();
    expect(listKioskEvents).toHaveBeenCalledOnce();
  });

  it("guards duplicate submissions and applies the authoritative mutation result", async () => {
    const pending = deferred<KioskResult>();
    vi.mocked(setManagementKioskOperationalState).mockReturnValue(pending.promise);
    const { result } = renderHook(() => useKioskDetail(kiosk.managementId));

    await waitFor(() => expect(result.current.state).toBe("READY"));

    let first!: Promise<boolean>;
    act(() => {
      first = result.current.setOperationalState({
        state: "Maintenance",
        reason: "Bảo trì định kỳ",
      });
    });

    let second = true;
    await act(async () => {
      second = await result.current.setOperationalState({
        state: "Maintenance",
        reason: "Gửi lần hai",
      });
    });

    expect(second).toBe(false);
    expect(setManagementKioskOperationalState).toHaveBeenCalledOnce();

    pending.resolve({
      id: kiosk.managementId,
      storeId: kiosk.locationId,
      organizationId: kiosk.organizationId,
      code: kiosk.kioskId,
      name: kiosk.name,
      kioskType: kiosk.kioskType,
      status: "Active",
      operationalState: "Maintenance",
      operationalStateReason: "Bảo trì định kỳ",
      operationalStateChangedAt: "2026-07-28T07:00:00Z",
      timeZone: kiosk.timeZone,
      configurationVersion: 1,
      settingsSchemaVersion: 1,
      createdAt: kiosk.createdAt,
    });
    await act(async () => {
      await first;
    });

    expect(result.current.kiosk?.operationalState).toBe("Maintenance");
    expect(toast.success).toHaveBeenCalledOnce();
  });

  it("keeps a backend conflict as a mutation error without changing state", async () => {
    vi.mocked(setManagementKioskOperationalState).mockRejectedValue(
      new Error("Kiosk đang có lần thực thi nên chưa thể bảo trì."),
    );
    const { result } = renderHook(() => useKioskDetail(kiosk.managementId));
    await waitFor(() => expect(result.current.state).toBe("READY"));

    let succeeded = true;
    await act(async () => {
      succeeded = await result.current.setOperationalState({
        state: "Maintenance",
        reason: "Bảo trì định kỳ",
      });
    });

    expect(succeeded).toBe(false);
    expect(result.current.kiosk?.operationalState).toBe("Operational");
    expect(result.current.operationalStateErrorMessage).toContain(
      "đang có lần thực thi",
    );
    expect(toast.success).not.toHaveBeenCalled();
  });
});
