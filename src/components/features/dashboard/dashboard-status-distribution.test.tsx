import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardStatusDistribution } from "@/components/features/dashboard/dashboard-status-distribution";

describe("DashboardStatusDistribution kiosk status labels", () => {
  it("renders lifecycle labels without treating them as connectivity", () => {
    render(
      <DashboardStatusDistribution
        title="Vòng đời kiosk"
        description="Phân bố theo vòng đời"
        kind="kioskLifecycle"
        items={[
          { status: "Provisioning", count: 1 },
          { status: "Active", count: 1 },
          { status: "Disabled", count: 1 },
          { status: "Retired", count: 1 },
        ]}
        total={4}
        emptyMessage="Chưa có dữ liệu"
      />,
    );

    expect(screen.getByText("Đang cấu hình")).toBeInTheDocument();
    expect(screen.getByText("Đang hoạt động")).toBeInTheDocument();
    expect(screen.getByText("Đã vô hiệu hóa")).toBeInTheDocument();
    expect(screen.getByText("Đã ngừng sử dụng")).toBeInTheDocument();
    expect(screen.queryByText("Trực tuyến")).not.toBeInTheDocument();
  });

  it("renders connectivity labels independently from lifecycle", () => {
    render(
      <DashboardStatusDistribution
        title="Kết nối kiosk"
        description="Phân bố theo kết nối"
        kind="kioskConnectivity"
        items={[
          { status: "Online", count: 1 },
          { status: "Degraded", count: 1 },
          { status: "Unreachable", count: 1 },
          { status: "Unknown", count: 1 },
        ]}
        total={4}
        emptyMessage="Chưa có dữ liệu"
      />,
    );

    expect(screen.getByText("Trực tuyến")).toBeInTheDocument();
    expect(screen.getByText("Kết nối không ổn định")).toBeInTheDocument();
    expect(screen.getByText("Mất kết nối")).toBeInTheDocument();
    expect(screen.getByText("Chưa xác định")).toBeInTheDocument();
    expect(screen.queryByText("Đang hoạt động")).not.toBeInTheDocument();
  });
});
