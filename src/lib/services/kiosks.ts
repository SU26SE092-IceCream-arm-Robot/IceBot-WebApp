import { toKioskFleetViewModel } from "@/lib/adapters/kiosk-fleet";
import { MOCK_KIOSKS } from "@/lib/mocks/kiosks";
import { getManagementKiosks } from "@/lib/services/kiosk-management";
import { getManagementStores } from "@/lib/services/stores";
import type {
  DashboardRole,
  Kiosk,
  KioskFilters,
  KioskLocationOption,
  KioskSummary,
} from "@/types";
import type { StoreResult } from "@/types/kiosk-management";

const MOCK_DELAY_MS = 300;

export interface GetMockFleetKiosksParams {
  role: DashboardRole;
  locationIds?: string[];
}

export interface FleetKiosksResult {
  scopedKiosks: Kiosk[];
  filteredKiosks: Kiosk[];
  locations: KioskLocationOption[];
  summary: KioskSummary;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalizeKeyword(value: string): string {
  return value.trim().toLowerCase();
}

function applyRoleScope(
  kiosks: Kiosk[],
  role: DashboardRole,
  locationIds?: string[],
): Kiosk[] {
  if (role !== "LOCATION_OWNER") {
    return kiosks;
  }

  if (!locationIds || locationIds.length === 0) {
    return [];
  }

  const locationScope = new Set(locationIds);
  return kiosks.filter((kiosk) => locationScope.has(kiosk.locationId));
}

function buildSummary(kiosks: Kiosk[]): KioskSummary {
  return {
    total: kiosks.length,
    online: kiosks.filter((kiosk) => kiosk.status === "ONLINE").length,
    error: kiosks.filter((kiosk) => kiosk.status === "ERROR").length,
    maintenance: kiosks.filter((kiosk) => kiosk.status === "MAINTENANCE").length,
  };
}

function buildLocations(kiosks: Kiosk[]): KioskLocationOption[] {
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

function applyFilters(kiosks: Kiosk[], filters: KioskFilters): Kiosk[] {
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

      return kiosk.status === filters.status;
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
): Promise<Kiosk[]> {
  const [metadata, stores] = await Promise.all([
    getManagementKiosks({}, signal),
    getManagementStores({}, signal),
  ]);
  const storesById = new Map<string, StoreResult>(
    stores.map((store) => [store.id, store]),
  );

  return metadata.map((kiosk) =>
    toKioskFleetViewModel(kiosk, storesById.get(kiosk.storeId)),
  );
}

export async function getMockFleetKiosks(
  params: GetMockFleetKiosksParams,
): Promise<Kiosk[]> {
  await delay(MOCK_DELAY_MS);
  return applyRoleScope(MOCK_KIOSKS, params.role, params.locationIds);
}

export function buildFleetKiosksResult(
  scopedKiosks: Kiosk[],
  filters: KioskFilters,
): FleetKiosksResult {
  return {
    scopedKiosks,
    filteredKiosks: applyFilters(scopedKiosks, filters),
    locations: buildLocations(scopedKiosks),
    summary: buildSummary(scopedKiosks),
  };
}
