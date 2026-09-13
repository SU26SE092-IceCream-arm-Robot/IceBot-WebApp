import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AcceptInvitationForm } from "./accept-invitation-form";
import { acceptInvitation } from "@/lib/services/identity/accounts";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams("token=invitation-token"),
}));

vi.mock("@/lib/services/identity/accounts", () => ({
  acceptInvitation: vi.fn(),
  getInvitationErrorMessage: vi.fn(() => "Không thể chấp nhận lời mời."),
}));

describe("AcceptInvitationForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("preserves the invitation token and password payload", async () => {
    vi.mocked(acceptInvitation).mockResolvedValueOnce({ accepted: true });
    render(<AcceptInvitationForm />);

    fireEvent.change(screen.getByLabelText("Mật khẩu mới"), {
      target: { value: "NewPassword123" },
    });
    fireEvent.change(screen.getByLabelText("Xác nhận mật khẩu"), {
      target: { value: "NewPassword123" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Kích hoạt tài khoản" }),
    );

    await waitFor(() =>
      expect(acceptInvitation).toHaveBeenCalledWith({
        token: "invitation-token",
        newPassword: "NewPassword123",
      }),
    );
    expect(
      await screen.findByText("Tài khoản đã kích hoạt"),
    ).toBeInTheDocument();
  });
});
