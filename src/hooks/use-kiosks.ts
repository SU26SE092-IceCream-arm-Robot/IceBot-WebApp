"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getMockCurrentUser,
  getMockRole,
  getMockRoleChangedEventName,
} from "@/lib/mock-current-user";
import { getFleetKiosks } from "@/lib/services/kiosks";
import type {
  DashboardUser,
  Kiosk,
  KioskFilters,
  KioskLocationOption,
  KioskStatusFilter,
  KioskSummary,
  Role,
} from "@/types";

const INITIAL_FILTERS: KioskFilters = {
  searchTerm: "",
  status: "ALL",
  locationId: "ALL",
};

export interface UseKiosksResult {
  role: Role;
  currentUser: DashboardUser;
  kiosks: Kiosk[];
  summary: KioskSummary;
  locations: KioskLocationOption[];
  filters: KioskFilters;
  isLoading: boolean;
  errorMessage: string | null;
  scopedCount: number;
  setSearchTerm: (value: string) => void;
  setStatusFilter: (value: KioskStatusFilter) => void;
  setLocationFilter: (value: string | null) => void;
  clearFilters: () => void;
  refresh: () => Promise<void>;
}

const EMPTY_SUMMARY: KioskSummary = {
  total: 0,
  online: 0,
  error: 0,
  maintenance: 0,
};

function isStatusFilter(value: string | null): value is KioskStatusFilter {
  return value === "ALL" || value === "ONLINE" || value === "OFFLINE" || value === "MAINTENANCE" || value === "ERROR";
}

export function useKiosks(): UseKiosksResult {
  const [role, setRole] = useState<Role>(() => getMockRole());
  const [filters, setFilters] = useState<KioskFilters>(INITIAL_FILTERS);
  const [kiosks, setKiosks] = useState<Kiosk[]>([]);
  const [summary, setSummary] = useState<KioskSummary>(EMPTY_SUMMARY);
  const [locations, setLocations] = useState<KioskLocationOption[]>([]);
  const [scopedCount, setScopedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentUser = useMemo(() => getMockCurrentUser(role), [role]);

  const fetchKiosks = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await getFleetKiosks({
        role,
        locationIds: currentUser.locationIds,
        filters,
      });

      setKiosks(result.filteredKiosks);
      setSummary(result.summary);
      setLocations(result.locations);
      setScopedCount(result.scopedKiosks.length);
    } catch {
      setKiosks([]);
      setSummary(EMPTY_SUMMARY);
      setLocations([]);
      setScopedCount(0);
      setErrorMessage("Không thể tải dữ liệu kiosk. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.locationIds, filters, role]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchKiosks();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchKiosks]);

  useEffect(() => {
    const syncRoleFromStorage = () => {
      setRole(getMockRole());
    };

    const roleChangedEventName = getMockRoleChangedEventName();

    window.addEventListener("storage", syncRoleFromStorage);
    window.addEventListener(roleChangedEventName, syncRoleFromStorage);

    return () => {
      window.removeEventListener("storage", syncRoleFromStorage);
      window.removeEventListener(roleChangedEventName, syncRoleFromStorage);
    };
  }, []);

  const setSearchTerm = useCallback((value: string) => {
    setFilters((previous) => ({ ...previous, searchTerm: value }));
  }, []);

  const setStatusFilter = useCallback((value: KioskStatusFilter) => {
    setFilters((previous) => ({ ...previous, status: value }));
  }, []);

  const setLocationFilter = useCallback((value: string | null) => {
    setFilters((previous) => ({ ...previous, locationId: value ?? "ALL" }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  return {
    role,
    currentUser,
    kiosks,
    summary,
    locations,
    filters,
    isLoading,
    errorMessage,
    scopedCount,
    setSearchTerm,
    setStatusFilter,
    setLocationFilter,
    clearFilters,
    refresh: fetchKiosks,
  };
}

export { isStatusFilter };
