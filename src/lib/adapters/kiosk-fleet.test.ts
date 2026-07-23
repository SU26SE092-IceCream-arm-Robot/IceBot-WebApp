import { describe, expect, it } from "vitest";

import { toKioskFleetViewModel } from "@/lib/adapters/kiosk-fleet";
import type { KioskResult, StoreResult } from "@/types/kiosk-management";

const kiosk: KioskResult = {
  id: "11111111-1111-1111-1111-111111111111",
  organizationId: "22222222-2222-2222-2222-222222222222",
  storeId: "33333333-3333-3333-3333-333333333333",
  code: "KIOSK_DEMO",
  name: "Kiosk Demo",
  kioskType: "RoboticVending",
  status: "Provisioning",
  operationalState: "Maintenance",
  operationalStateReason: "Kiểm tra định kỳ",
  timeZone: "Asia/Ho_Chi_Minh",
  configurationVersion: 1,
  settingsSchemaVersion: 1,
  createdAt: "2026-07-23T08:00:00Z",
};

const store: StoreResult = {
  id: kiosk.storeId,
  organizationId: kiosk.organizationId,
  code: "STORE_DEMO",
  name: "Cửa hàng Demo",
  storeType: "Standard",
  status: "Active",
  timeZone: "Asia/Ho_Chi_Minh",
  openingHours: [],
  createdAt: "2026-07-23T08:00:00Z",
};

describe("kiosk fleet adapter", () => {
  it("keeps lifecycle and operational state as separate fields", () => {
    const result = toKioskFleetViewModel(kiosk, store);

    expect(result.lifecycleStatus).toBe("Provisioning");
    expect(result.operationalState).toBe("Maintenance");
    expect(result.operationalStateReason).toBe("Kiểm tra định kỳ");
    expect(result.locationName).toBe("Cửa hàng Demo");
  });
});
