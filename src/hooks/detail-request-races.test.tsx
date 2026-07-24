import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAccounts } from "@/hooks/use-accounts";
import { useAlerts } from "@/hooks/use-alerts";
import { useTransactions } from "@/hooks/use-transactions";
import {
  getAccountById,
  listManagementAccounts,
} from "@/lib/services/accounts";
import {
  getAlertById,
  listAlerts,
} from "@/lib/services/alerts";
import {
  getManagementOrderById,
  getManagementOrderStatusHistory,
  listManagementOrders,
  listManagementRefunds,
} from "@/lib/services/transactions";
import type { InternalAccountResult } from "@/types/accounts";
import type { AlertResult } from "@/types/alerts";
import type { OrderResult } from "@/types/transactions";

vi.mock("@/lib/services/accounts", () => ({
  createAccount: vi.fn(),
  disableAccount: vi.fn(),
  getAccountById: vi.fn(),
  getAccountsErrorMessage: vi.fn(
    (_error: unknown, fallback = "Không thể tải tài khoản.") => fallback,
  ),
  getInvitationErrorMessage: vi.fn(),
  listManagementAccounts: vi.fn(),
  regenerateInvitation: vi.fn(),
}));

vi.mock("@/lib/services/roles", () => ({
  getManagementRoles: vi.fn(),
  getRolesErrorMessage: vi.fn(),
  getRoleScopeOptions: vi.fn(),
}));

vi.mock("@/lib/services/alerts", () => ({
  acknowledgeAlert: vi.fn(),
  getAlertById: vi.fn(),
  getAlertErrorMessage: vi.fn(
    (_error: unknown, fallback = "Không thể tải cảnh báo.") => fallback,
  ),
  listAlerts: vi.fn(),
  resolveAlert: vi.fn(),
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

const idA = "11111111-1111-1111-1111-111111111111";
const idB = "22222222-2222-2222-2222-222222222222";

const emptyPagination = {
  page: 1,
  pageSize: 10,
  totalCount: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

function TransactionsProbe() {
  const state = useTransactions();
  return (
    <div>
      <span data-testid="transaction-detail">
        {state.selectedOrder?.id ?? "none"}
      </span>
      <button type="button" onClick={() => void state.openOrderDetail(idA)}>
        Transaction A
      </button>
      <button type="button" onClick={() => void state.openOrderDetail(idB)}>
        Transaction B
      </button>
    </div>
  );
}

function AlertsProbe() {
  const state = useAlerts();
  return (
    <div>
      <span data-testid="alert-detail">{state.selectedAlert?.id ?? "none"}</span>
      <span data-testid="alert-error">
        {state.detailErrorMessage ?? "none"}
      </span>
      <button type="button" onClick={() => void state.openAlertDetail(idA)}>
        Alert A
      </button>
      <button type="button" onClick={() => void state.openAlertDetail(idB)}>
        Alert B
      </button>
    </div>
  );
}

function AccountsProbe() {
  const state = useAccounts();
  return (
    <div>
      <span data-testid="account-detail">
        {state.selectedAccount?.id ?? "none"}
      </span>
      <span data-testid="account-loading">
        {state.isDetailLoading ? "loading" : "idle"}
      </span>
      <button type="button" onClick={() => void state.openAccountDetail(idA)}>
        Account A
      </button>
      <button type="button" onClick={() => state.setDetailOpen(false)}>
        Close account
      </button>
    </div>
  );
}

describe("detail request race protection", () => {
  beforeEach(() => {
    vi.mocked(listManagementOrders).mockResolvedValue({
      data: [],
      pagination: emptyPagination,
    });
    vi.mocked(listManagementRefunds).mockResolvedValue({
      data: [],
      pagination: emptyPagination,
    });
    vi.mocked(getManagementOrderStatusHistory).mockResolvedValue({
      data: [],
      pagination: { ...emptyPagination, pageSize: 8 },
    });
    vi.mocked(listAlerts).mockResolvedValue({
      succeeded: true,
      statusCode: 200,
      data: [],
      pagination: { ...emptyPagination, pageSize: 20 },
    });
    vi.mocked(listManagementAccounts).mockResolvedValue({
      succeeded: true,
      statusCode: 200,
      data: [],
      pagination: emptyPagination,
    });
  });

  it("keeps transaction B when transaction A resolves later", async () => {
    const requestA = deferred<OrderResult>();
    const requestB = deferred<OrderResult>();
    vi.mocked(getManagementOrderById).mockImplementation((orderId) =>
      orderId === idA ? requestA.promise : requestB.promise,
    );
    render(<TransactionsProbe />);

    fireEvent.click(screen.getByRole("button", { name: "Transaction A" }));
    fireEvent.click(screen.getByRole("button", { name: "Transaction B" }));
    requestB.resolve({ id: idB } as OrderResult);

    await waitFor(() => {
      expect(screen.getByTestId("transaction-detail")).toHaveTextContent(idB);
    });
    requestA.resolve({ id: idA } as OrderResult);

    await waitFor(() => {
      expect(screen.getByTestId("transaction-detail")).toHaveTextContent(idB);
    });
  });

  it("ignores alert A error after alert B succeeds", async () => {
    const requestA = deferred<AlertResult>();
    const requestB = deferred<AlertResult>();
    vi.mocked(getAlertById).mockImplementation((alertId) =>
      alertId === idA ? requestA.promise : requestB.promise,
    );
    render(<AlertsProbe />);

    fireEvent.click(screen.getByRole("button", { name: "Alert A" }));
    fireEvent.click(screen.getByRole("button", { name: "Alert B" }));
    requestB.resolve({ id: idB } as AlertResult);

    await waitFor(() => {
      expect(screen.getByTestId("alert-detail")).toHaveTextContent(idB);
    });
    requestA.reject(new Error("stale alert failed"));

    await waitFor(() => {
      expect(screen.getByTestId("alert-error")).toHaveTextContent("none");
      expect(screen.getByTestId("alert-detail")).toHaveTextContent(idB);
    });
  });

  it("does not update account detail after the dialog closes", async () => {
    const requestA = deferred<InternalAccountResult>();
    vi.mocked(getAccountById).mockReturnValue(requestA.promise);
    render(<AccountsProbe />);

    fireEvent.click(screen.getByRole("button", { name: "Account A" }));
    fireEvent.click(screen.getByRole("button", { name: "Close account" }));
    requestA.resolve({ id: idA } as InternalAccountResult);

    await waitFor(() => {
      expect(screen.getByTestId("account-detail")).toHaveTextContent("none");
      expect(screen.getByTestId("account-loading")).toHaveTextContent("idle");
    });
  });
});
