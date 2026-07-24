import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PaymentMethodsView } from "@/components/features/settings/payment-methods-view";
import { usePaymentMethods } from "@/hooks/use-payment-methods";

vi.mock("@/hooks/use-payment-methods", () => ({
  usePaymentMethods: vi.fn(),
}));

describe("PaymentMethodsView status permission", () => {
  beforeEach(() => {
    vi.mocked(usePaymentMethods).mockReturnValue({
      methods: [
        {
          id: 1,
          code: "PAYOS",
          name: "PayOS",
          description: "Cổng thanh toán PayOS",
          isActive: true,
        },
      ],
      state: "SUCCESS",
      error: null,
      updatingId: null,
      refresh: vi.fn(),
      updateStatus: vi.fn(),
    });
  });

  it("keeps the list visible but hides the toggle without manage permission", () => {
    render(<PaymentMethodsView canManageStatus={false} />);

    expect(screen.getByText("PayOS")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tắt" })).not.toBeInTheDocument();
  });

  it("keeps the existing toggle action with manage permission", () => {
    render(<PaymentMethodsView canManageStatus />);

    expect(screen.getByRole("button", { name: "Tắt" })).toBeInTheDocument();
  });
});
