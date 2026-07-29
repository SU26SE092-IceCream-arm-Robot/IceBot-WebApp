import { describe, expect, it } from "vitest";

import {
  getKioskConnectivityLabel,
  getKioskLifecycleLabel,
  getKioskOperationalLabel,
} from "@/lib/presenters/kiosk-state-labels";

describe("kiosk state vocabulary", () => {
  it("keeps lifecycle separate from sales admission", () => {
    expect(getKioskLifecycleLabel("Active")).toBe("Đã kích hoạt");
    expect(getKioskOperationalLabel("Operational")).toBe("Sẵn sàng nhận đơn");
  });

  it("describes operational pauses by their business effect", () => {
    expect(getKioskOperationalLabel("PausedByOperator")).toBe(
      "Đã tạm dừng nhận đơn",
    );
    expect(getKioskOperationalLabel("Restocking")).toBe(
      "Tạm dừng để bổ sung hàng",
    );
    expect(getKioskOperationalLabel("EmergencyStopRequested")).toBe(
      "Đang yêu cầu dừng khẩn cấp",
    );
  });

  it("keeps connectivity evidence independent", () => {
    expect(getKioskConnectivityLabel("Online")).toBe("Trực tuyến");
    expect(getKioskConnectivityLabel("Unreachable")).toBe("Mất kết nối");
  });
});
