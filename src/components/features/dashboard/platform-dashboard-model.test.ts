import { describe, expect, it } from "vitest";

import { buildPlatformInterventions } from "@/components/features/dashboard/platform-dashboard-model";
import type {
  DashboardMetrics,
  InventorySummary,
  KioskStatusOverview,
} from "@/types/dashboard/overview";

const metrics: DashboardMetrics = {
  organizationCount: 8,
  storeCount: 3,
  kioskCount: 3,
  activeKioskCount: 1,
  offlineKioskCount: 1,
  maintenanceKioskCount: 1,
  pendingOrderCount: 0,
  paidOrderCount: 0,
  refundRequiredOrderCount: 0,
  lowStockDispenserCount: 1,
  latestDeviceEventCount: 0,
};

const kioskStatus: KioskStatusOverview = {
  totalCount: 3,
  byLifecycleStatus: [
    { status: "Provisioning", count: 2 },
    { status: "Active", count: 1 },
  ],
  byConnectivityStatus: [
    { status: "Online", count: 2 },
    { status: "Unreachable", count: 1 },
  ],
  items: [
    {
      kioskId: "kiosk-3",
      kioskCode: "K-03",
      kioskName: "Kiosk K-03",
      organizationId: "org-1",
      storeId: "store-1",
      storeName: "Coffee Export",
      lifecycleStatus: "Active",
      connectivityStatus: "Unreachable",
      lastHeartbeatAt: "2026-09-06T12:48:00Z",
    },
  ],
};

const inventory: InventorySummary = {
  totalDispenserCount: 2,
  lowStockCount: 1,
  emptyCount: 0,
  items: [],
};

describe("buildPlatformInterventions", () => {
  it("puts concrete connectivity evidence before other interventions", () => {
    const result = buildPlatformInterventions({
      metrics,
      kioskStatus,
      inventory,
      now: new Date("2026-09-06T13:00:00Z"),
    });

    expect(result[0]).toMatchObject({
      kind: "connectivity",
      tone: "destructive",
      label: "Kiosk K-03 · Mất kết nối",
      description: "Coffee Export · 12 phút trước · K-03",
      href: "/kiosks/kiosk-3",
    });
    expect(result.map((item) => item.kind)).toEqual([
      "connectivity",
      "maintenance",
      "lowInventory",
    ]);
  });

  it("uses a fallback count when detailed kiosk evidence is unavailable", () => {
    const result = buildPlatformInterventions({
      metrics,
      kioskStatus: { ...kioskStatus, items: [] },
      inventory: null,
    });

    expect(result[0]).toMatchObject({
      id: "connectivity:remaining",
      count: 1,
      href: "/kiosks",
    });
  });

  it("does not turn lifecycle values into connectivity incidents", () => {
    const result = buildPlatformInterventions({
      metrics: { ...metrics, offlineKioskCount: 0, maintenanceKioskCount: 0 },
      kioskStatus: {
        ...kioskStatus,
        items: [
          {
            ...kioskStatus.items[0],
            lifecycleStatus: "Disabled",
            connectivityStatus: "Online",
          },
        ],
      },
      inventory: { ...inventory, lowStockCount: 0 },
    });

    expect(result).toEqual([]);
  });
});
