import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RegistrationForm } from "@/components/features/service-registration/registration-form";
import * as serviceModule from "@/lib/services/service-registrations";

vi.mock("@/lib/services/service-registrations", () => ({
  submitServiceRegistration: vi.fn(),
  getServiceRegistrationErrorMessage: vi.fn((err: unknown) =>
    err instanceof Error ? err.message : "Đăng ký thất bại",
  ),
}));

describe("RegistrationForm component on Landing Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates required fields on submit", async () => {
    render(<RegistrationForm />);

    const submitBtn = screen.getByRole("button", { name: /Gửi yêu cầu đăng ký/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/Vui lòng nhập họ và tên người liên hệ/i),
    ).toBeInTheDocument();
    expect(serviceModule.submitServiceRegistration).not.toHaveBeenCalled();
  });

  it("validates email containing @ and domain", async () => {
    render(<RegistrationForm />);

    fireEvent.change(screen.getByLabelText(/Họ và tên/i), {
      target: { value: "Nguyễn Văn A" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "invalid-email" },
    });
    fireEvent.change(screen.getByLabelText(/Tên thương hiệu \/ Cơ sở/i), {
      target: { value: "Kem IceBot" },
    });
    fireEvent.click(screen.getByLabelText(/Tôi đồng ý với/i));

    fireEvent.click(screen.getByRole("button", { name: /Gửi yêu cầu đăng ký/i }));

    expect(
      await screen.findByText(/Địa chỉ email không hợp lệ/i),
    ).toBeInTheDocument();
  });

  it("submits successfully and renders reference code on success screen", async () => {
    vi.mocked(serviceModule.submitServiceRegistration).mockResolvedValue({
      id: "sr-01",
      referenceCode: "SR-2026-000888",
      status: "Submitted",
      submittedAt: "2026-08-17T04:00:00Z",
    });

    render(<RegistrationForm />);

    fireEvent.change(screen.getByLabelText(/Họ và tên/i), {
      target: { value: "Nguyễn Văn A" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "owner@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Tên thương hiệu \/ Cơ sở/i), {
      target: { value: "Kem IceBot" },
    });
    fireEvent.click(screen.getByLabelText(/Tôi đồng ý với/i));

    fireEvent.click(screen.getByRole("button", { name: /Gửi yêu cầu đăng ký/i }));

    await waitFor(() => {
      expect(screen.getByText("Đăng ký dịch vụ thành công!")).toBeInTheDocument();
    });

    expect(screen.getByText("SR-2026-000888")).toBeInTheDocument();
  });
});
