import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForgotPasswordForm } from "@/components/features/identity/auth/forgot-password-form";
import { ResetPasswordForm } from "@/components/features/identity/auth/reset-password-form";
import { requestPasswordReset, resetPassword } from "@/lib/services/identity/auth";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("token=reset-token"),
}));

vi.mock("@/lib/services/identity/auth", () => ({
  getAuthErrorMessage: (error: unknown) => error instanceof Error ? error.message : "Lỗi xác thực",
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
}));

describe("password recovery", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not expose backend details when a password-reset request fails", async () => {
    vi.mocked(requestPasswordReset).mockRejectedValueOnce(new Error("Account not found"));
    render(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText("Email hoặc tên đăng nhập"), {
      target: { value: "unknown@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gửi liên kết" }));

    await screen.findByText("Không thể gửi yêu cầu lúc này. Vui lòng thử lại.");
    expect(screen.queryByText("Account not found")).not.toBeInTheDocument();
  });

  it("uses a neutral success response for a completed password-reset request", async () => {
    vi.mocked(requestPasswordReset).mockResolvedValueOnce(undefined);
    render(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText("Email hoặc tên đăng nhập"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gửi liên kết" }));

    expect(await screen.findByText("Kiểm tra email của bạn")).toBeInTheDocument();
    expect(screen.getByText(/Nếu tài khoản phù hợp tồn tại/)).toBeInTheDocument();
  });

  it("submits the token from the reset link with the confirmed password", async () => {
    vi.mocked(resetPassword).mockResolvedValueOnce(undefined);
    render(<ResetPasswordForm />);

    fireEvent.change(screen.getByLabelText("Mật khẩu mới"), { target: { value: "NewPassword123" } });
    fireEvent.change(screen.getByLabelText("Xác nhận mật khẩu"), { target: { value: "NewPassword123" } });
    fireEvent.click(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));

    await waitFor(() => expect(resetPassword).toHaveBeenCalledWith({
      token: "reset-token",
      newPassword: "NewPassword123",
    }));
    expect(await screen.findByText("Đã đổi mật khẩu")).toBeInTheDocument();
  });
});
