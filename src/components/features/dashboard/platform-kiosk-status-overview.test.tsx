import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlatformKioskStatusOverview } from "@/components/features/dashboard/platform-kiosk-status-overview";

describe("PlatformKioskStatusOverview", () => {
  it("keeps lifecycle and connectivity semantics in separate panels", () => {
    render(
      <PlatformKioskStatusOverview
        lifecycleItems={[
          { status: "Provisioning", count: 2 },
          { status: "Active", count: 1 },
        ]}
        connectivityItems={[
          { status: "Online", count: 2 },
          { status: "Unreachable", count: 1 },
        ]}
        total={3}
      />,
    );

    const lifecyclePanel = screen
      .getByText("Vòng đời kiosk")
      .closest("[data-slot='card']");
    const connectivityPanel = screen
      .getByText("Trạng thái kết nối")
      .closest("[data-slot='card']");

    expect(lifecyclePanel).not.toBeNull();
    expect(connectivityPanel).not.toBeNull();
    expect(
      within(lifecyclePanel!).getByText("Đang cấu hình"),
    ).toBeInTheDocument();
    expect(
      within(lifecyclePanel!).getByText("Đã kích hoạt"),
    ).toBeInTheDocument();
    expect(
      within(lifecyclePanel!).queryByText("Mất kết nối"),
    ).not.toBeInTheDocument();
    expect(
      within(lifecyclePanel!).queryByText("Bảo trì"),
    ).not.toBeInTheDocument();
    expect(
      within(connectivityPanel!).getByText("Trực tuyến"),
    ).toBeInTheDocument();
    expect(
      within(connectivityPanel!).getByText("Mất kết nối"),
    ).toBeInTheDocument();
    expect(
      within(connectivityPanel!).queryByText("Đã kích hoạt"),
    ).not.toBeInTheDocument();
  });
});
