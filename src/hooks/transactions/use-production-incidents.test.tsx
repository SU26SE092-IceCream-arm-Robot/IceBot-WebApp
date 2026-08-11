import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useProductionIncidents } from "@/hooks/transactions/use-production-incidents";
import {
  getManagementProductionIncident,
  selectManagementProductionIncidentResolution,
} from "@/lib/services/transactions/transactions";
import type { ProductionIncidentResult } from "@/types/transactions/transactions";

vi.mock("sonner", () => ({
  toast: { success: vi.fn() },
}));

vi.mock("@/lib/services/transactions/transactions", () => ({
  completeManagementProductionIncident: vi.fn(),
  getManagementProductionIncident: vi.fn(),
  getTransactionsErrorMessage: vi.fn(
    (_error: unknown, fallback: string) => fallback,
  ),
  listManagementProductionIncidents: vi.fn(),
  recordManagementProductionInspection: vi.fn(),
  selectManagementProductionIncidentResolution: vi.fn(),
}));

function incident(id: string, orderId = `order-${id}`): ProductionIncidentResult {
  return {
    id,
    kioskId: "kiosk-1",
    orderId,
    orderItemId: `item-${id}`,
    orderNumber: `ORD-${id}`,
    productName: "Kem vani",
    productVariantName: "Mặc định",
    sourceCommandId: `command-${id}`,
    sourceProductionJobId: `job-${id}`,
    productionUnitNo: 1,
    productionUnitQuantity: 1,
    trigger: "ExecutionFailed",
    status: "Open",
    physicalOutputState: "No",
    inspectionOutcome: "NotProduced",
    resolution: null,
    createdAt: "2026-07-28T08:00:00Z",
    history: [],
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe("useProductionIncidents", () => {
  beforeEach(() => {
    vi.mocked(getManagementProductionIncident).mockReset();
    vi.mocked(selectManagementProductionIncidentResolution).mockReset();
  });

  it("keeps the newest incident detail when an older response arrives later", async () => {
    const first = deferred<ProductionIncidentResult>();
    const second = deferred<ProductionIncidentResult>();
    vi.mocked(getManagementProductionIncident)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useProductionIncidents(false));

    act(() => {
      void result.current.openDetail(incident("A"));
      void result.current.openDetail(incident("B"));
    });
    second.resolve(incident("B"));
    await waitFor(() => expect(result.current.selectedIncident?.id).toBe("B"));

    first.resolve(incident("A"));
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.selectedIncident?.id).toBe("B");
    expect(result.current.detailErrorMessage).toBeNull();
  });

  it("prevents duplicate exact-unit remake resolution submissions", async () => {
    const selected = incident("A");
    vi.mocked(getManagementProductionIncident).mockResolvedValue(selected);
    const pending = deferred<ProductionIncidentResult>();
    vi.mocked(selectManagementProductionIncidentResolution).mockReturnValueOnce(
      pending.promise,
    );
    const { result } = renderHook(() => useProductionIncidents(false));

    await act(async () => {
      await result.current.openDetail(selected);
    });

    const request = {
      resolutionRequestId: "resolution-1",
      resolution: "RequestRemake" as const,
      reason: "Không tạo ra sản phẩm",
      acknowledgeFullOrderCompensation: false,
    };
    let firstSubmission!: Promise<boolean>;
    act(() => {
      firstSubmission = result.current.resolve(request);
    });
    await act(async () => {
      await result.current.resolve({ ...request, resolutionRequestId: "resolution-2" });
    });

    expect(selectManagementProductionIncidentResolution).toHaveBeenCalledOnce();
    expect(selectManagementProductionIncidentResolution).toHaveBeenCalledWith(
      selected.orderId,
      selected.id,
      request,
    );

    pending.resolve({ ...selected, status: "ResolutionInProgress", resolution: "RequestRemake" });
    await act(async () => {
      await firstSubmission;
    });
  });
});
