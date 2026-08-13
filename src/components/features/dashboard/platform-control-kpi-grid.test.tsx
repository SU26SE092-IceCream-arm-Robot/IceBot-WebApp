import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlatformControlKpiGrid } from "@/components/features/dashboard/platform-control-kpi-grid";
import type { DashboardMetrics } from "@/types/dashboard/overview";
import type { DashboardRoutePath } from "@/types";

const metrics: DashboardMetrics = {
  organizationCount: 4,
  storeCount: 2,
  kioskCount: 2,
  activeKioskCount: 1,
  offlineKioskCount: 1,
  maintenanceKioskCount: 0,
  pendingOrderCount: 0,
  paidOrderCount: 0,
  refundRequiredOrderCount: 0,
  lowStockDispenserCount: 0,
  latestDeviceEventCount: 0,
};

describe("PlatformControlKpiGrid", () => {
  it("routes organization and store metrics to their dedicated pages", () => {
    const visibleRoutes = new Set<DashboardRoutePath>([
      "/organizations",
      "/stores",
      "/kiosks",
    ]);

    render(<PlatformControlKpiGrid metrics={metrics} visibleRoutes={visibleRoutes} />);

    expect(screen.getByText("Tổ chức").closest("a")).toHaveAttribute(
      "href",
      "/organizations",
    );
    expect(screen.getByText("Cửa hàng").closest("a")).toHaveAttribute(
      "href",
      "/stores",
    );
  });

  it("uses the connectivity attention metric instead of repeating active kiosks", () => {
    render(
      <PlatformControlKpiGrid
        metrics={metrics}
        visibleRoutes={new Set<DashboardRoutePath>(["/kiosks"])}
      />,
    );

    expect(screen.getByText("Kiosk mất kết nối")).toBeInTheDocument();
    expect(screen.queryByText("Kiosk đã kích hoạt")).not.toBeInTheDocument();
  });
});
