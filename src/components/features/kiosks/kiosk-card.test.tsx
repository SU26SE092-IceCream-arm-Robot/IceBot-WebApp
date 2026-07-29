import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { KioskCard } from "@/components/features/kiosks/kiosk-card";
import type { KioskFleetItem, KioskOperationalState } from "@/types";

const baseKiosk: KioskFleetItem = {
  managementId: "11111111-1111-1111-1111-111111111111",
  kioskId: "KIOSK_DEMO",
  name: "Kiosk Demo",
  organizationId: "22222222-2222-2222-2222-222222222222",
  locationId: "33333333-3333-3333-3333-333333333333",
  locationName: "Cửa hàng Demo",
  lifecycleStatus: "Active",
  operationalState: "Operational",
  createdAt: "2026-07-23T08:00:00Z",
};

const operationalLabels: Array<[KioskOperationalState, string]> = [
  ["Operational", "Sẵn sàng nhận đơn"],
  ["PausedByOperator", "Đã tạm dừng nhận đơn"],
  ["Maintenance", "Tạm dừng để bảo trì"],
  ["Cleaning", "Tạm dừng để vệ sinh"],
  ["Restocking", "Tạm dừng để bổ sung hàng"],
  ["EmergencyStopRequested", "Đang yêu cầu dừng khẩn cấp"],
  ["OutOfService", "Ngừng phục vụ"],
];

describe("KioskCard operational-state labels", () => {
  it.each(operationalLabels)("maps %s to %s", (operationalState, label) => {
    render(<KioskCard kiosk={{ ...baseKiosk, operationalState }} />);

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText("Đã kích hoạt")).toBeInTheDocument();
  });
});
