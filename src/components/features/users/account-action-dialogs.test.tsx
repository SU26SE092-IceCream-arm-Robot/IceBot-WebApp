import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ResetPasswordDialog } from "@/components/features/users/account-action-dialogs";
import type { InternalAccountResult } from "@/types/accounts";

const account: InternalAccountResult = {
  id: "account-1",
  userName: "operator@example.com",
  email: "operator@example.com",
  status: "Active",
  localLoginEnabled: true,
  googleLoginEnabled: false,
  roles: [],
};

describe("ResetPasswordDialog", () => {
  it("asks the account owner to reset their password instead of accepting an admin-entered password", async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);

    render(
      <ResetPasswordDialog
        account={account}
        open
        onOpenChange={vi.fn()}
        isSubmitting={false}
        errorMessage={null}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.queryByLabelText("Mật khẩu mới")).not.toBeInTheDocument();
    expect(screen.getByText(/người dùng tự đặt mật khẩu mới/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Gửi hướng dẫn" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(account);
  });
});
