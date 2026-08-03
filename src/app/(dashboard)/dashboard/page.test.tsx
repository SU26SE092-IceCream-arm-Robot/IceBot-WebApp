import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DashboardPage from "@/app/(dashboard)/dashboard/page";
import { PERMISSION_ROLES } from "@/lib/rbac";

const { authState } = vi.hoisted(() => ({
  authState: {
    isSystemAdmin: false,
    roles: ["Manager"],
  },
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    effectiveAccess: {
      accountId: "11111111-1111-1111-1111-111111111111",
      isSystemAdmin: authState.isSystemAdmin,
      roles: authState.roles,
      permissionCodes: Object.entries(PERMISSION_ROLES)
        .filter(([, roles]) =>
          roles.some((role) => authState.roles.includes(role)),
        )
        .map(([permission]) => permission),
      roleScopes: [],
      effectiveScope: {
        organizationIds: [],
        storeIds: [],
        kioskIds: [],
      },
    },
  }),
}));

vi.mock("@/hooks/use-dashboard-overview", () => ({
  useDashboardOverview: () => ({
    data: {
      dashboard: {
        organizationCount: 1,
        storeCount: 1,
        kioskCount: 1,
        activeKioskCount: 1,
        offlineKioskCount: 0,
        maintenanceKioskCount: 0,
        pendingOrderCount: 0,
        paidOrderCount: 0,
        refundRequiredOrderCount: 0,
        lowStockDispenserCount: 0,
        latestDeviceEventCount: 0,
      },
      kioskStatusOverview: null,
      inventorySummary: null,
      orderOverview: null,
    },
    warnings: ["Không thể tải một số nguồn tổng quan."],
    lastUpdatedAt: new Date("2026-07-28T06:00:00Z"),
    isLoading: false,
    isRefreshing: false,
    errorMessage: null,
    refresh: vi.fn(),
  }),
}));

describe("DashboardPage partial data", () => {
  beforeEach(() => {
    authState.isSystemAdmin = false;
    authState.roles = ["Manager"];
  });

  it("keeps usable roots visible and marks unavailable roots independently", () => {
    render(<DashboardPage />);

    expect(screen.getByText("Tổng số kiosk")).toBeInTheDocument();
    expect(screen.getByText("Phạm vi hệ thống")).toBeInTheDocument();
    expect(screen.getByText("Trạng thái kiosk chưa tải được")).toBeInTheDocument();
    expect(
      screen.getByText("Trạng thái đơn hàng chưa tải được"),
    ).toBeInTheDocument();
    expect(screen.getByText("Đơn hàng gần đây chưa tải được")).toBeInTheDocument();
    expect(
      screen.getByText("Một phần dữ liệu tổng quan chưa tải được"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Hệ thống chưa có dữ liệu")).not.toBeInTheDocument();
  });

  it("composes a platform control workspace for SystemAdmin", () => {
    authState.isSystemAdmin = true;
    authState.roles = ["SystemAdmin"];

    render(<DashboardPage />);

    expect(screen.getByRole("heading", { name: "Kiểm soát nền tảng" })).toBeInTheDocument();
    expect(screen.getAllByText("Tổ chức").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Kiosk đã kích hoạt").length).toBeGreaterThan(0);
    expect(screen.getByText("Can thiệp cấp nền tảng")).toBeInTheDocument();
    expect(screen.getByText("Quản trị nền tảng")).toBeInTheDocument();
    expect(screen.queryByText("Đơn hàng gần đây chưa tải được")).not.toBeInTheDocument();
    expect(screen.queryByText("Trạng thái đơn hàng chưa tải được")).not.toBeInTheDocument();
  });
});
