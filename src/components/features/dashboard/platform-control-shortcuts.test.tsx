import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlatformControlShortcuts } from "@/components/features/dashboard/platform-control-shortcuts";
import type { DashboardRoutePath } from "@/types";

describe("PlatformControlShortcuts", () => {
  it("groups visible routes without exposing unauthorized modules", () => {
    render(
      <PlatformControlShortcuts
        visibleRoutes={
          new Set<DashboardRoutePath>([
            "/organizations",
            "/roles",
            "/platform/service-registrations",
            "/platform/organization-sales",
            "/platform/content-pages",
          ])
        }
      />,
    );

    expect(screen.getByText("Hoạt động quản trị")).toBeInTheDocument();
    expect(screen.getByText("Lối tắt nền tảng")).toBeInTheDocument();
    expect(screen.getByText("Tổ chức").closest("a")).toHaveAttribute(
      "href",
      "/organizations",
    );
    expect(screen.getByText("Đơn đăng ký dịch vụ")).toBeInTheDocument();
    expect(screen.getByText("Doanh thu tổ chức")).toBeInTheDocument();
    expect(screen.getByText("Trang nội dung tĩnh")).toBeInTheDocument();
    expect(screen.queryByText("Tài khoản")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Phương thức thanh toán"),
    ).not.toBeInTheDocument();
  });
});
