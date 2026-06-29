"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { getKioskManagementErrorMessage } from "@/lib/services/kiosk-management";
import {
  buildFleetKiosksResult,
  getManagementFleetKiosks,
} from "@/lib/services/kiosks";
import type {
  DashboardRole,
  DashboardUser,
  KioskFleetItem,
  KioskFilters,
  KioskLocationOption,
  KioskStatusFilter,
  KioskSummary,
} from "@/types";

const INITIAL_FILTERS: KioskFilters = {
  searchTerm: "",
  status: "ALL",
  locationId: "ALL",
};

export interface UseKiosksResult {
  role: DashboardRole | null;
  currentUser: DashboardUser | null;
  kiosks: KioskFleetItem[];
  summary: KioskSummary;
  locations: KioskLocationOption[];
  filters: KioskFilters;
  isLoading: boolean;
  errorMessage: string | null;
  metadataWarning: string | null;
  scopedCount: number;
  setSearchTerm: (value: string) => void;
  setStatusFilter: (value: KioskStatusFilter) => void;
  setLocationFilter: (value: string | null) => void;
  clearFilters: () => void;
  refresh: () => Promise<void>;
}

const EMPTY_SUMMARY: KioskSummary = {
  total: 0,
  active: 0,
  offline: 0,
  maintenance: 0,
  disabled: 0,
};

function isStatusFilter(value: string | null): value is KioskStatusFilter {
  return (
    value === "ALL" ||
    value === "Provisioning" ||
    value === "Active" ||
    value === "Offline" ||
    value === "Maintenance" ||
    value === "Disabled" ||
    value === "Retired"
  );
}

export function useKiosks(): UseKiosksResult {
  const { currentUser } = useAuth();
  const role = currentUser?.role ?? null;
  const [filters, setFilters] = useState<KioskFilters>(INITIAL_FILTERS);
  const [scopedKiosks, setScopedKiosks] = useState<KioskFleetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [metadataWarning, setMetadataWarning] = useState<string | null>(null);

  const fleetResult = useMemo(
    () => buildFleetKiosksResult(scopedKiosks, filters),
    [filters, scopedKiosks],
  );

  const fetchKiosks = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setErrorMessage(null);
      setMetadataWarning(null);

      if (!role) {
        setScopedKiosks([]);
        setIsLoading(false);
        return;
      }

      try {
        const result = await getManagementFleetKiosks(signal);
        if (signal?.aborted) {
          return;
        }

        setScopedKiosks(result.kiosks);
        setMetadataWarning(result.warning);
      } catch (error) {
        if (signal?.aborted) {
          return;
        }

        setScopedKiosks([]);
        setErrorMessage(getKioskManagementErrorMessage(error));
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [role],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void fetchKiosks(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [fetchKiosks]);

  const setSearchTerm = useCallback((value: string) => {
    setFilters((previous) => ({ ...previous, searchTerm: value }));
  }, []);

  const setStatusFilter = useCallback((value: KioskStatusFilter) => {
    setFilters((previous) => ({ ...previous, status: value }));
  }, []);

  const setLocationFilter = useCallback((value: string | null) => {
    setFilters((previous) => ({
      ...previous,
      locationId: value ?? "ALL",
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  return {
    role,
    currentUser,
    kiosks: fleetResult.filteredKiosks,
    summary: scopedKiosks.length === 0 ? EMPTY_SUMMARY : fleetResult.summary,
    locations: fleetResult.locations,
    filters,
    isLoading,
    errorMessage,
    metadataWarning,
    scopedCount: fleetResult.scopedKiosks.length,
    setSearchTerm,
    setStatusFilter,
    setLocationFilter,
    clearFilters,
    refresh: () => fetchKiosks(),
  };
}

export { isStatusFilter };
