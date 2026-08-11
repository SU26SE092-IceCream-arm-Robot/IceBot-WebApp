import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useOrderItemFulfillment } from "@/hooks/transactions/use-order-item-fulfillment";
import {
  recordManualOrderItemFulfillment,
  setPackagedOrderItemFulfillment,
} from "@/lib/services/transactions/transactions";
import type { OrderItemResult, OrderResult } from "@/types/transactions/transactions";

vi.mock("@/lib/services/transactions/transactions", () => ({
  getTransactionsErrorMessage: vi.fn(
    (_error: unknown, fallback: string) => fallback,
  ),
  recordManualOrderItemFulfillment: vi.fn(),
  setPackagedOrderItemFulfillment: vi.fn(),
}));

const order = { id: "order-1", orderNumber: "ORD-001" } as OrderResult;
const item = {
  id: "item-1",
  productName: "Kem vani",
  productVariantName: "Mặc định",
  fulfillmentType: "Manual",
} as OrderItemResult;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe("useOrderItemFulfillment", () => {
  beforeEach(() => {
    vi.mocked(recordManualOrderItemFulfillment).mockReset();
    vi.mocked(setPackagedOrderItemFulfillment).mockReset();
  });

  it("prevents duplicate submission and applies the authoritative order result", async () => {
    const pending = deferred<OrderResult>();
    vi.mocked(recordManualOrderItemFulfillment).mockReturnValueOnce(pending.promise);
    const onOrderUpdated = vi.fn();
    const { result } = renderHook(() => useOrderItemFulfillment(onOrderUpdated));

    act(() => result.current.open(order, item));

    let firstSubmission!: Promise<boolean>;
    act(() => {
      firstSubmission = result.current.submit({
        action: "Preparing",
        reason: "Đã nhận món",
      });
    });
    await act(async () => {
      await result.current.submit({ action: "Completed", reason: "" });
    });

    expect(recordManualOrderItemFulfillment).toHaveBeenCalledOnce();
    expect(recordManualOrderItemFulfillment).toHaveBeenCalledWith(
      "order-1",
      "item-1",
      expect.objectContaining({
        fulfillmentEventId: expect.any(String),
        eventType: "Preparing",
      }),
    );

    const updatedOrder = { ...order, status: "Preparing" } as OrderResult;
    pending.resolve(updatedOrder);
    await act(async () => {
      await firstSubmission;
    });

    expect(onOrderUpdated).toHaveBeenCalledWith(updatedOrder);
  });

  it("requires a reason before recording failure", async () => {
    const { result } = renderHook(() => useOrderItemFulfillment(vi.fn()));
    act(() => result.current.open(order, item));

    let succeeded = true;
    await act(async () => {
      succeeded = await result.current.submit({ action: "Failed", reason: "" });
    });

    expect(succeeded).toBe(false);
    expect(result.current.errorMessage).toContain("Vui lòng nhập lý do");
    expect(recordManualOrderItemFulfillment).not.toHaveBeenCalled();
  });
});
