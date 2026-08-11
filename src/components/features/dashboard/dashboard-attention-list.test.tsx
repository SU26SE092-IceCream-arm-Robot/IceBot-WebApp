import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardAttentionList } from "@/components/features/dashboard/dashboard-attention-list";
import type {
  DashboardMetrics,
  InventorySummary,
} from "@/types/dashboard/overview";
import type { DashboardRoutePath } from "@/types";

const metrics: DashboardMetrics = {
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
  latestDeviceEventCount: 12,
};

const inventory: InventorySummary = {
  totalDispenserCount: 0,
  lowStockCount: 0,
  emptyCount: 0,
  items: [],
};

describe("DashboardAttentionList", () => {
  it("does not classify device-event volume as an attention issue", () => {
    render(
      <DashboardAttentionList
        metrics={metrics}
        inventory={inventory}
        visibleRoutes={new Set<DashboardRoutePath>(["/kiosks"])}
      />,
    );

    expect(
      screen.getByText("Hệ thống hiện không có vấn đề cần xử lý."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Sự kiện thiết bị 24 giờ")).not.toBeInTheDocument();
  });

  it("does not claim a healthy state when a source is unavailable", () => {
    render(
      <DashboardAttentionList
        metrics={metrics}
        inventory={null}
        visibleRoutes={new Set<DashboardRoutePath>(["/kiosks"])}
      />,
    );

    expect(
      screen.getByText(
        "Chưa thể xác định đầy đủ vì một số nguồn dữ liệu chưa tải được.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Hệ thống hiện không có vấn đề cần xử lý."),
    ).not.toBeInTheDocument();
  });
});
