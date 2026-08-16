import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ServiceRegistrationForm } from "@/components/features/landing/service-registration-form";
import * as serviceModule from "@/lib/services/service-registrations";

vi.mock("@/lib/services/service-registrations", () => ({
  submitServiceRegistration: vi.fn(),
  getServiceRegistrationErrorMessage: vi.fn((err: unknown) =>
    err instanceof Error ? err.message : "Đăng ký thất bại",
  ),
}));

describe("ServiceRegistrationForm component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates required fields on submit", async () => {
    render(<ServiceRegistrationForm />);

    const submitBtn = screen.getByRole("button", { name: /Gửi Đăng ký Dịch vụ/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/Vui lòng nhập họ và tên người liên hệ/i),
    ).toBeInTheDocument();
    expect(serviceModule.submitServiceRegistration).not.toHaveBeenCalled();
  });

  it("validates email containing @ and domain", async () => {
    render(<ServiceRegistrationForm />);

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

    fireEvent.click(screen.getByRole("button", { name: /Gửi Đăng ký Dịch vụ/i }));

    expect(
      await screen.findByText(/Địa chỉ email không hợp lệ/i),
    ).toBeInTheDocument();
  });

  it("validates privacy policy checkbox is checked", async () => {
    render(<ServiceRegistrationForm />);

    fireEvent.change(screen.getByLabelText(/Họ và tên/i), {
      target: { value: "Nguyễn Văn A" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "owner@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Tên thương hiệu \/ Cơ sở/i), {
      target: { value: "Kem IceBot" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Gửi Đăng ký Dịch vụ/i }));

    expect(
      await screen.findByText(/Bạn cần đồng ý với Điều khoản dịch vụ/i),
    ).toBeInTheDocument();
  });

  it("validates expectedLocationCount range", async () => {
    render(<ServiceRegistrationForm />);

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

    fireEvent.change(
      screen.getByLabelText(/Số lượng điểm bán dự kiến/i),
      { target: { value: "99999" } },
    );

    fireEvent.click(screen.getByRole("button", { name: /Gửi Đăng ký Dịch vụ/i }));

    expect(
      await screen.findByText(/Số lượng điểm bán dự kiến phải là số nguyên từ 1 đến 10,000/i),
    ).toBeInTheDocument();
  });

  it("submits successfully and renders reference code", async () => {
    vi.mocked(serviceModule.submitServiceRegistration).mockResolvedValue({
      id: "sr-01",
      referenceCode: "SR-2026-000999",
      status: "Submitted",
      submittedAt: "2026-08-17T04:00:00Z",
    });

    render(<ServiceRegistrationForm />);

    fireEvent.change(screen.getByLabelText(/Họ và tên/i), {
      target: { value: "Nguyễn Văn A" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "owner@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Số điện thoại/i), {
      target: { value: "0901234567" },
    });
    fireEvent.change(screen.getByLabelText(/Tên thương hiệu \/ Cơ sở/i), {
      target: { value: "Kem IceBot" },
    });
    fireEvent.click(screen.getByLabelText(/Tôi đồng ý với/i));

    fireEvent.click(screen.getByRole("button", { name: /Gửi Đăng ký Dịch vụ/i }));

    await waitFor(() => {
      expect(screen.getByText("Đăng ký dịch vụ thành công!")).toBeInTheDocument();
    });

    expect(screen.getByText("SR-2026-000999")).toBeInTheDocument();
    expect(screen.getByText("Submitted")).toBeInTheDocument();
  });
});
