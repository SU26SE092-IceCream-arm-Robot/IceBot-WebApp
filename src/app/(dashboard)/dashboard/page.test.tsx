import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DashboardPage from "@/app/(dashboard)/dashboard/page";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    effectiveAccess: {
      accountId: "11111111-1111-1111-1111-111111111111",
      isSystemAdmin: false,
      roles: ["Manager"],
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
});
