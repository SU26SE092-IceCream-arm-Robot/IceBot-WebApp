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
  ["Operational", "Đang vận hành"],
  ["PausedByOperator", "Tạm dừng bởi nhân viên"],
  ["Maintenance", "Đang bảo trì"],
  ["Cleaning", "Đang vệ sinh"],
  ["Restocking", "Đang bổ sung hàng"],
  ["EmergencyStopRequested", "Đã yêu cầu dừng khẩn cấp"],
  ["OutOfService", "Ngừng phục vụ"],
];

describe("KioskCard operational-state labels", () => {
  it.each(operationalLabels)("maps %s to %s", (operationalState, label) => {
    render(<KioskCard kiosk={{ ...baseKiosk, operationalState }} />);

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText("Đang hoạt động")).toBeInTheDocument();
  });
});
