import { MOCK_KIOSKS } from "@/lib/mocks/kiosks";
import type {
  Kiosk,
  KioskFilters,
  KioskLocationOption,
  KioskSummary,
  DashboardRole,
} from "@/types";

const MOCK_DELAY_MS = 300;

export interface GetFleetKiosksParams {
  role: DashboardRole;
  locationIds?: string[];
  filters: KioskFilters;
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

function applyRoleScope(kiosks: Kiosk[], role: DashboardRole, locationIds?: string[]): Kiosk[] {
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

      const searchableText = `${kiosk.kioskId} ${kiosk.name} ${kiosk.locationName}`.toLowerCase();
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

export async function getFleetKiosks(params: GetFleetKiosksParams): Promise<FleetKiosksResult> {
  await delay(MOCK_DELAY_MS);

  const scopedKiosks = applyRoleScope(MOCK_KIOSKS, params.role, params.locationIds);
  const filteredKiosks = applyFilters(scopedKiosks, params.filters);
  const summary = buildSummary(scopedKiosks);
  const locations = buildLocations(scopedKiosks);

  return {
    scopedKiosks,
    filteredKiosks,
    locations,
    summary,
  };
}
