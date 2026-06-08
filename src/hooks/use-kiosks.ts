"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { getFleetKiosks } from "@/lib/services/kiosks";
import type {
  DashboardUser,
  Kiosk,
  KioskFilters,
  KioskLocationOption,
  KioskStatusFilter,
  KioskSummary,
  DashboardRole,
} from "@/types";

const INITIAL_FILTERS: KioskFilters = {
  searchTerm: "",
  status: "ALL",
  locationId: "ALL",
};

export interface UseKiosksResult {
  role: DashboardRole | null;
  currentUser: DashboardUser | null;
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
  const { currentUser } = useAuth();
  const role = currentUser?.role ?? null;
  const [filters, setFilters] = useState<KioskFilters>(INITIAL_FILTERS);
  const [kiosks, setKiosks] = useState<Kiosk[]>([]);
  const [summary, setSummary] = useState<KioskSummary>(EMPTY_SUMMARY);
  const [locations, setLocations] = useState<KioskLocationOption[]>([]);
  const [scopedCount, setScopedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchKiosks = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    if (!role) {
      setKiosks([]);
      setSummary(EMPTY_SUMMARY);
      setLocations([]);
      setScopedCount(0);
      setIsLoading(false);
      return;
    }

    try {
      const result = await getFleetKiosks({
        role,
        locationIds: currentUser?.locationIds,
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
  }, [currentUser, filters, role]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchKiosks();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchKiosks]);

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
