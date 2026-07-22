import { toKioskFleetViewModel } from "@/lib/adapters/kiosk-fleet";
import { getManagementKiosks } from "@/lib/services/kiosk-management";
import {
  getManagementStores,
  getStoresErrorMessage,
} from "@/lib/services/stores";
import type {
  KioskFleetItem,
  KioskFilters,
  KioskLocationOption,
  KioskSummary,
} from "@/types";
import type { StoreResult } from "@/types/kiosk-management";

export interface FleetKiosksResult {
  scopedKiosks: KioskFleetItem[];
  filteredKiosks: KioskFleetItem[];
  locations: KioskLocationOption[];
  summary: KioskSummary;
}

export interface ManagementFleetKiosksResult {
  kiosks: KioskFleetItem[];
  warning: string | null;
}

function normalizeKeyword(value: string): string {
  return value.trim().toLowerCase();
}

function buildSummary(kiosks: KioskFleetItem[]): KioskSummary {
  return {
    total: kiosks.length,
    active: kiosks.filter((kiosk) => kiosk.lifecycleStatus === "Active").length,
    provisioning: kiosks.filter(
      (kiosk) => kiosk.lifecycleStatus === "Provisioning",
    ).length,
    maintenance: kiosks.filter(
      (kiosk) => kiosk.operationalState === "Maintenance",
    ).length,
    disabled: kiosks.filter(
      (kiosk) =>
        kiosk.lifecycleStatus === "Disabled" ||
        kiosk.lifecycleStatus === "Retired",
    ).length,
  };
}

function buildLocations(kiosks: KioskFleetItem[]): KioskLocationOption[] {
  const byLocation = new Map<string, string>();

  kiosks.forEach((kiosk) => {
    if (!byLocation.has(kiosk.locationId)) {
      byLocation.set(kiosk.locationId, kiosk.locationName);
    }
  });

  return Array.from(byLocation.entries())
    .map(([locationId, locationName]) => ({ locationId, locationName }))
    .sort((a, b) => a.locationName.localeCompare(b.locationName));
}

function applyFilters(
  kiosks: KioskFleetItem[],
  filters: KioskFilters,
): KioskFleetItem[] {
  const keyword = normalizeKeyword(filters.searchTerm);

  return kiosks
    .filter((kiosk) => {
      if (!keyword) {
        return true;
      }

      const searchableText =
        `${kiosk.kioskId} ${kiosk.name} ${kiosk.locationName} ${kiosk.serialNumber ?? ""}`.toLowerCase();
      return searchableText.includes(keyword);
    })
    .filter((kiosk) => {
      if (filters.status === "ALL") {
        return true;
      }

      return kiosk.lifecycleStatus === filters.status;
    })
    .filter((kiosk) => {
      if (filters.locationId === "ALL") {
        return true;
      }

      return kiosk.locationId === filters.locationId;
    })
    .sort((a, b) => a.kioskId.localeCompare(b.kioskId));
}

export async function getManagementFleetKiosks(
  signal?: AbortSignal,
): Promise<ManagementFleetKiosksResult> {
  const metadata = await getManagementKiosks({}, signal);
  let stores: StoreResult[] = [];
  let warning: string | null = null;

  try {
    stores = await getManagementStores({}, signal);
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    warning = `${getStoresErrorMessage(error)} Tên cửa hàng tạm hiển thị theo Store ID.`;
  }

  const storesById = new Map<string, StoreResult>(
    stores.map((store) => [store.id, store]),
  );

  return {
    kiosks: metadata.map((kiosk) =>
      toKioskFleetViewModel(kiosk, storesById.get(kiosk.storeId)),
    ),
    warning,
  };
}

export function buildFleetKiosksResult(
  scopedKiosks: KioskFleetItem[],
  filters: KioskFilters,
): FleetKiosksResult {
  return {
    scopedKiosks,
    filteredKiosks: applyFilters(scopedKiosks, filters),
    locations: buildLocations(scopedKiosks),
    summary: buildSummary(scopedKiosks),
  };
}
