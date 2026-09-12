import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FranchiseOnboardingPanel } from "@/components/features/tenants/onboarding/franchise-onboarding-panel";

const { useFranchiseOnboardingMock } = vi.hoisted(() => ({
  useFranchiseOnboardingMock: vi.fn(),
}));

vi.mock("@/hooks/tenants/use-franchise-onboarding", () => ({
  useFranchiseOnboarding: useFranchiseOnboardingMock,
}));

describe("FranchiseOnboardingPanel", () => {
  it("distinguishes quick setup history from directly created stores and kiosks", () => {
    useFranchiseOnboardingMock.mockReturnValue({
      items: [],
      isLoading: false,
      isMutating: false,
      errorMessage: null,
      refreshWarningMessage: null,
      isRefreshRetrying: false,
      retryRefresh: vi.fn(),
      refresh: vi.fn(),
      clearError: vi.fn(),
      start: vi.fn(),
      resume: vi.fn(),
      cancel: vi.fn(),
    });

    render(
      <FranchiseOnboardingPanel
        organizationId="organization-1"
        canManage
        canStart
      />,
    );

    expect(screen.getByText("Thiết lập nhanh điểm bán")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Chưa có lịch sử thiết lập nhanh. Cửa hàng hoặc kiosk được tạo trực tiếp không xuất hiện tại đây.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tạo nhanh" }));

    expect(
      screen.getByRole("heading", {
        name: "Thiết lập nhanh cửa hàng và kiosk",
      }),
    ).toBeInTheDocument();
  });

  it("does not start quick setup with an invalid IANA time zone", () => {
    const start = vi.fn();
    useFranchiseOnboardingMock.mockReturnValue({
      items: [],
      isLoading: false,
      isMutating: false,
      errorMessage: null,
      refreshWarningMessage: null,
      isRefreshRetrying: false,
      retryRefresh: vi.fn(),
      refresh: vi.fn(),
      clearError: vi.fn(),
      start,
      resume: vi.fn(),
      cancel: vi.fn(),
    });

    render(
      <FranchiseOnboardingPanel
        organizationId="organization-1"
        canManage
        canStart
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Tạo nhanh" }));
    fireEvent.change(screen.getByLabelText("Mã cửa hàng"), {
      target: { value: "HCM01" },
    });
    fireEvent.change(screen.getByLabelText("Tên cửa hàng"), {
      target: { value: "Cửa hàng Quận 1" },
    });
    fireEvent.change(screen.getByLabelText("Mã kiosk"), {
      target: { value: "KIOSK01" },
    });
    fireEvent.change(screen.getByLabelText("Tên kiosk"), {
      target: { value: "Kiosk Quận 1" },
    });
    fireEvent.change(screen.getByLabelText("Múi giờ"), {
      target: { value: "Asia/Invalid_City" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Tạo cửa hàng và kiosk" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Múi giờ không hợp lệ",
    );
    expect(start).not.toHaveBeenCalled();
  });
});
