import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useInventory } from "@/hooks/use-inventory";
import {
  adjustDispenserEstimate,
  listDispenserStates,
  listStockMovements,
  refillDispenserState,
} from "@/lib/services/inventory";
import { getManagementKiosks } from "@/lib/services/kiosk-management";
import { getManagementStores } from "@/lib/services/stores";
import type { DispenserStateResult } from "@/types/inventory-management";

vi.mock("@/lib/services/inventory", () => ({
  adjustDispenserEstimate: vi.fn(),
  getInventoryErrorMessage: vi.fn(
    (_error: unknown, fallback = "Không thể tải dữ liệu tồn kho.") => fallback,
  ),
  listDispenserStates: vi.fn(),
  listStockMovements: vi.fn(),
  refillDispenserState: vi.fn(),
}));

vi.mock("@/lib/services/kiosk-management", () => ({
  getKioskManagementErrorMessage: vi.fn(
    (_error: unknown, fallback: string) => fallback,
  ),
  getManagementKiosks: vi.fn(),
}));

vi.mock("@/lib/services/stores", () => ({
  getManagementStores: vi.fn(),
  getStoresErrorMessage: vi.fn(
    (_error: unknown, fallback: string) => fallback,
  ),
}));

const pagination = {
  page: 1,
  pageSize: 12,
  totalCount: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

const dispenser = {
  id: "11111111-1111-1111-1111-111111111111",
  kioskId: "22222222-2222-2222-2222-222222222222",
  ingredientName: "Sữa",
} as DispenserStateResult;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

async function waitForInitialLoad() {
  await waitFor(() => {
    expect(listDispenserStates).toHaveBeenCalled();
    expect(listStockMovements).toHaveBeenCalled();
    expect(getManagementStores).toHaveBeenCalled();
    expect(getManagementKiosks).toHaveBeenCalled();
  });
}

describe("useInventory mutation refresh outcomes", () => {
  beforeEach(() => {
    vi.mocked(listDispenserStates).mockResolvedValue({
      succeeded: true,
      statusCode: 200,
      data: [],
      pagination,
    });
    vi.mocked(listStockMovements).mockResolvedValue({
      succeeded: true,
      statusCode: 200,
      data: [],
      pagination: { ...pagination, pageSize: 8 },
    });
    vi.mocked(getManagementStores).mockResolvedValue([]);
    vi.mocked(getManagementKiosks).mockResolvedValue([]);
    vi.mocked(refillDispenserState).mockResolvedValue(dispenser);
    vi.mocked(adjustDispenserEstimate).mockResolvedValue(dispenser);
  });

  it("keeps mutation success and exposes a separate warning when refresh fails", async () => {
    const { result } = renderHook(() => useInventory());
    await waitForInitialLoad();
    vi.mocked(listDispenserStates).mockRejectedValueOnce(
      new Error("refresh failed"),
    );

    act(() => result.current.openRefillDialog(dispenser));
    let succeeded = false;
    await act(async () => {
      succeeded = await result.current.submitRefill({ quantity: 1 });
    });

    expect(succeeded).toBe(true);
    expect(result.current.mutationSuccessMessage).toContain(
      "Đã ghi nhận nạp thêm",
    );
    expect(result.current.mutationErrorMessage).toBeNull();
    expect(result.current.mutationRefreshWarningMessage).toContain(
      "Thao tác đã thành công",
    );
  });

  it("does not report success when the mutation fails", async () => {
    vi.mocked(refillDispenserState).mockRejectedValueOnce(
      new Error("mutation failed"),
    );
    const { result } = renderHook(() => useInventory());
    await waitForInitialLoad();

    act(() => result.current.openRefillDialog(dispenser));
    let succeeded = true;
    await act(async () => {
      succeeded = await result.current.submitRefill({ quantity: 1 });
    });

    expect(succeeded).toBe(false);
    expect(result.current.mutationSuccessMessage).toBeNull();
    expect(result.current.mutationErrorMessage).toContain(
      "Không thể ghi nhận nạp thêm",
    );
  });

  it("keeps the normal success path when mutation and refresh succeed", async () => {
    const { result } = renderHook(() => useInventory());
    await waitForInitialLoad();

    act(() => result.current.openAdjustDialog(dispenser));
    let succeeded = false;
    await act(async () => {
      succeeded = await result.current.submitAdjustment({
        estimatedQuantity: 2,
      });
    });

    expect(succeeded).toBe(true);
    expect(result.current.mutationSuccessMessage).toContain(
      "Đã cập nhật lượng ước tính",
    );
    expect(result.current.mutationRefreshWarningMessage).toBeNull();
  });

  it("retries only the refresh without submitting the mutation again", async () => {
    const { result } = renderHook(() => useInventory());
    await waitForInitialLoad();
    vi.mocked(listDispenserStates).mockRejectedValueOnce(
      new Error("refresh failed"),
    );

    act(() => result.current.openRefillDialog(dispenser));
    await act(async () => {
      await result.current.submitRefill({ quantity: 1 });
    });
    await act(async () => {
      await result.current.retryMutationRefresh();
    });

    expect(refillDispenserState).toHaveBeenCalledOnce();
    expect(result.current.mutationRefreshWarningMessage).toBeNull();
  });

  it("preserves the duplicate-submit guard", async () => {
    const pendingMutation = deferred<DispenserStateResult>();
    vi.mocked(refillDispenserState).mockReturnValueOnce(
      pendingMutation.promise,
    );
    const { result } = renderHook(() => useInventory());
    await waitForInitialLoad();

    act(() => result.current.openRefillDialog(dispenser));
    let firstSubmission!: Promise<boolean>;
    let secondResult = true;
    act(() => {
      firstSubmission = result.current.submitRefill({ quantity: 1 });
    });
    await act(async () => {
      secondResult = await result.current.submitRefill({ quantity: 1 });
    });

    expect(secondResult).toBe(false);
    expect(refillDispenserState).toHaveBeenCalledOnce();

    pendingMutation.resolve(dispenser);
    await act(async () => {
      await firstSubmission;
    });
  });
});
