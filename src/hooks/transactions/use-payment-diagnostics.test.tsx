import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePaymentDiagnostics } from "@/hooks/transactions/use-payment-diagnostics";
import { getOrderPaymentDiagnostics } from "@/lib/services/transactions/payments";

vi.mock("@/lib/services/transactions/payments", () => ({
  getOrderPaymentDiagnostics: vi.fn(),
}));

vi.mock("@/lib/services/transactions/transactions", () => ({
  getTransactionsErrorMessage: vi.fn(
    (_error: unknown, fallbackMessage: string) => fallbackMessage,
  ),
}));

function Probe({ canView }: { canView: boolean }) {
  const state = usePaymentDiagnostics("order-1", canView);
  return (
    <div>
      <span data-testid="loading">{state.isLoading ? "yes" : "no"}</span>
      <span data-testid="count">{state.diagnostics.length}</span>
    </div>
  );
}

describe("payment diagnostics access", () => {
  beforeEach(() => {
    vi.mocked(getOrderPaymentDiagnostics).mockReset();
  });

  it("does not call the diagnostics endpoint without permission", async () => {
    render(<Probe canView={false} />);

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("no");
    });
    expect(getOrderPaymentDiagnostics).not.toHaveBeenCalled();
  });

  it("loads diagnostics when operations.diagnostics is granted", async () => {
    vi.mocked(getOrderPaymentDiagnostics).mockResolvedValue([]);
    render(<Probe canView />);

    await waitFor(() => {
      expect(getOrderPaymentDiagnostics).toHaveBeenCalledWith(
        "order-1",
        expect.any(AbortSignal),
      );
      expect(screen.getByTestId("loading")).toHaveTextContent("no");
    });
  });
});
