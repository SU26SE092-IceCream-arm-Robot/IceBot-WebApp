import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTransactions } from "@/hooks/use-transactions";
import {
  getManagementRefundById,
  listManagementOrders,
  listManagementRefunds,
  markManagementRefundProcessed,
  requestManagementRefund,
} from "@/lib/services/transactions";
import type { RefundResult } from "@/types/transactions";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock("@/lib/services/transactions", () => ({
  cancelManagementOrder: vi.fn(),
  cancelManagementRefund: vi.fn(),
  getManagementOrderById: vi.fn(),
  getManagementOrderStatusHistory: vi.fn(),
  getManagementRefundById: vi.fn(),
  getTransactionsErrorMessage: vi.fn(
    (_error: unknown, fallback = "Không thể tải giao dịch.") => fallback,
  ),
  listManagementOrders: vi.fn(),
  listManagementRefunds: vi.fn(),
  markManagementOrderRefundRequired: vi.fn(),
  markManagementRefundProcessed: vi.fn(),
  rejectManagementRefund: vi.fn(),
  requestManagementRefund: vi.fn(),
}));

const orderId = "11111111-1111-1111-1111-111111111111";
const refundId = "22222222-2222-2222-2222-222222222222";
const pagination = {
  page: 1,
  pageSize: 10,
  totalCount: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};
const refund = {
  id: refundId,
  orderId,
  refundNumber: "RF-001",
  orderNumber: "ORD-001",
  status: "Requested",
} as RefundResult;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

async function waitForInitialLoad() {
  await waitFor(() => {
    expect(listManagementOrders).toHaveBeenCalled();
    expect(listManagementRefunds).toHaveBeenCalled();
  });
}

describe("useTransactions mutation refresh outcomes", () => {
  beforeEach(() => {
    vi.mocked(listManagementOrders).mockResolvedValue({
      data: [],
      pagination,
    });
    vi.mocked(listManagementRefunds).mockResolvedValue({
      data: [],
      pagination,
    });
    vi.mocked(markManagementRefundProcessed).mockResolvedValue(refund);
    vi.mocked(requestManagementRefund).mockResolvedValue(refund);
    vi.mocked(getManagementRefundById).mockResolvedValue(refund);
  });

  it("keeps mutation success when the following detail refresh fails", async () => {
    const { result } = renderHook(() => useTransactions());
    await waitForInitialLoad();
    await act(async () => {
      await result.current.openRefundDetail(refundId);
    });
    vi.mocked(getManagementRefundById).mockRejectedValueOnce(
      new Error("detail refresh failed"),
    );

    await act(async () => {
      await result.current.submitRefundProcessed(refundId, {
        moneyWasRefunded: true,
      });
    });

    expect(markManagementRefundProcessed).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledWith(
      "Đã đánh dấu hoàn tiền là đã xử lý.",
    );
    expect(result.current.refreshWarningMessage).toContain(
      "Thao tác đã thành công",
    );
  });

  it("keeps mutation errors separate and does not report refresh success", async () => {
    vi.mocked(markManagementRefundProcessed).mockRejectedValueOnce(
      new Error("mutation failed"),
    );
    const { result } = renderHook(() => useTransactions());
    await waitForInitialLoad();

    let thrownError: unknown;
    await act(async () => {
      try {
        await result.current.submitRefundProcessed(refundId, {
          moneyWasRefunded: true,
        });
      } catch (error) {
        thrownError = error;
      }
    });

    expect(thrownError).toEqual(new Error("Không thể đánh dấu đã xử lý."));
    expect(toast.success).not.toHaveBeenCalled();
    expect(result.current.refreshWarningMessage).toBeNull();
  });

  it("preserves the normal path when mutation and refresh both succeed", async () => {
    const { result } = renderHook(() => useTransactions());
    await waitForInitialLoad();

    await act(async () => {
      await result.current.submitRefundProcessed(refundId, {
        moneyWasRefunded: true,
      });
    });

    expect(markManagementRefundProcessed).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledWith(
      "Đã đánh dấu hoàn tiền là đã xử lý.",
    );
    expect(result.current.refreshWarningMessage).toBeNull();
  });

  it("retries only read requests without repeating the mutation", async () => {
    const { result } = renderHook(() => useTransactions());
    await waitForInitialLoad();
    vi.mocked(listManagementOrders).mockRejectedValueOnce(
      new Error("refresh failed"),
    );

    await act(async () => {
      await result.current.submitRefundProcessed(refundId, {
        moneyWasRefunded: true,
      });
    });
    await act(async () => {
      await result.current.retryPostMutationRefresh();
    });

    expect(markManagementRefundProcessed).toHaveBeenCalledOnce();
    expect(listManagementOrders).toHaveBeenCalledTimes(3);
    expect(listManagementRefunds).toHaveBeenCalledTimes(3);
    expect(result.current.refreshWarningMessage).toBeNull();
  });

  it("keeps the idempotency key and prevents a second refund mutation", async () => {
    const pendingMutation = deferred<RefundResult>();
    vi.mocked(requestManagementRefund).mockReturnValueOnce(
      pendingMutation.promise,
    );
    const { result } = renderHook(() => useTransactions());
    await waitForInitialLoad();
    const request = {
      refundMethod: "FullMoneyRefund" as const,
      reason: "Khách yêu cầu hoàn tiền",
    };
    const idempotencyKey = "refund-intent-001";

    let firstSubmission!: Promise<void>;
    act(() => {
      firstSubmission = result.current.submitRefundRequest(
        orderId,
        request,
        idempotencyKey,
      );
    });
    await act(async () => {
      await result.current.submitRefundRequest(
        orderId,
        request,
        "second-key-must-not-be-used",
      );
    });

    expect(requestManagementRefund).toHaveBeenCalledOnce();
    expect(requestManagementRefund).toHaveBeenCalledWith(
      orderId,
      request,
      idempotencyKey,
    );

    pendingMutation.resolve(refund);
    await act(async () => {
      await firstSubmission;
    });
  });
});
