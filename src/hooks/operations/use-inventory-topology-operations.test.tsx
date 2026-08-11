import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useInventoryTopologyOperations } from "@/hooks/operations/use-inventory-topology-operations";
import {
  createDispenserState,
  listDispenserStates,
  rebindDispenserState,
} from "@/lib/services/operations/inventory";
import { listIngredients } from "@/lib/services/catalog/ingredients";
import type {
  DispenserRebindResult,
  DispenserStateResult,
} from "@/types/operations/inventory";

vi.mock("sonner", () => ({
  toast: { success: vi.fn() },
}));

vi.mock("@/lib/services/operations/inventory", () => ({
  createDispenserState: vi.fn(),
  getInventoryErrorMessage: vi.fn(
    (_error: unknown, fallback: string) => fallback,
  ),
  listDispenserStates: vi.fn(),
  rebindDispenserState: vi.fn(),
  setDispenserStateStatus: vi.fn(),
  updateDispenserState: vi.fn(),
}));

vi.mock("@/lib/services/catalog/ingredients", () => ({
  getIngredientsErrorMessage: vi.fn(
    (_error: unknown, fallback: string) => fallback,
  ),
  listIngredients: vi.fn(),
}));

const pagination = {
  page: 1,
  pageSize: 100,
  totalCount: 1,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
};
const state = {
  id: "state-1",
  kioskId: "kiosk-1",
  deviceId: "device-1",
  ingredientId: "ingredient-1",
  isActive: true,
} as DispenserStateResult;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe("useInventoryTopologyOperations", () => {
  beforeEach(() => {
    vi.mocked(listIngredients).mockResolvedValue({
      succeeded: true,
      statusCode: 200,
      data: [],
      pagination,
    });
    vi.mocked(listDispenserStates).mockResolvedValue({
      succeeded: true,
      statusCode: 200,
      data: [state],
      pagination,
    });
    vi.mocked(createDispenserState).mockResolvedValue(state);
    vi.mocked(rebindDispenserState).mockReset();
    vi.mocked(toast.success).mockReset();
  });

  it("loads selectable resources in the selected kiosk scope", async () => {
    const { result } = renderHook(() =>
      useInventoryTopologyOperations("kiosk-1", vi.fn()),
    );

    await act(async () => {
      await result.current.loadResources();
    });

    expect(listDispenserStates).toHaveBeenCalledWith({
      kioskId: "kiosk-1",
      pageNumber: 1,
      pageSize: 100,
    });
    expect(result.current.dispenserStates).toEqual([state]);
  });

  it("keeps mutation success separate from refresh failure and retries reads only", async () => {
    const refresh = vi.fn()
      .mockRejectedValueOnce(new Error("refresh failed"))
      .mockResolvedValueOnce(undefined);
    const { result } = renderHook(() =>
      useInventoryTopologyOperations("kiosk-1", refresh),
    );
    const request = {
      deviceId: "device-1",
      ingredientId: "ingredient-1",
      containerCode: "BIN-A",
      capacityQuantity: 1000,
      unit: "gram",
      levelToQuantityProfile: [],
    };

    await act(async () => {
      await result.current.create(request);
    });
    expect(createDispenserState).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledOnce();
    expect(result.current.refreshWarningMessage).toContain("đã thành công");

    await act(async () => {
      await result.current.retryRefresh();
    });
    expect(createDispenserState).toHaveBeenCalledOnce();
    expect(refresh).toHaveBeenCalledTimes(2);
    expect(result.current.refreshWarningMessage).toBeNull();
  });

  it("prevents duplicate rebind submissions", async () => {
    const pending = deferred<DispenserRebindResult>();
    vi.mocked(rebindDispenserState).mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() =>
      useInventoryTopologyOperations("kiosk-1", vi.fn().mockResolvedValue(undefined)),
    );
    const request = {
      deviceId: "device-2",
      ingredientId: "ingredient-1",
      containerCode: "BIN-B",
      capacityQuantity: 1000,
      unit: "gram",
      levelToQuantityProfile: [],
      estimateDisposition: "Transfer" as const,
      reason: "Thay khay",
    };

    let first!: Promise<DispenserRebindResult | null>;
    act(() => {
      first = result.current.rebind("state-1", request);
    });
    await act(async () => {
      await result.current.rebind("state-1", request);
    });
    expect(rebindDispenserState).toHaveBeenCalledOnce();

    pending.resolve({
      sourceDispenserStateId: "state-1",
      replacement: { ...state, id: "state-2" },
      estimateDisposition: "Transfer",
      previousEstimatedQuantity: 10,
      transferredQuantity: 10,
    });
    await act(async () => {
      await first;
    });
  });
});
