"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  getSetupReadiness,
  getSetupReadinessScopeOptions,
} from "@/lib/services/setup-readiness";
import type {
  ReadinessSourceFailure,
  SetupReadinessOrganizationOption,
  SetupReadinessResult,
  SetupReadinessStoreOption,
} from "@/types/setup-readiness";

export interface UseSetupReadinessResult {
  organizations: SetupReadinessOrganizationOption[];
  stores: SetupReadinessStoreOption[];
  availableStores: SetupReadinessStoreOption[];
  selectedOrganizationId: string | null;
  selectedStoreId: string | null;
  result: SetupReadinessResult | null;
  scopeFailures: ReadinessSourceFailure[];
  isScopeLoading: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  lastUpdatedAt: Date | null;
  setSelectedOrganizationId: (organizationId: string | null) => void;
  setSelectedStoreId: (storeId: string | null) => void;
  refreshScope: () => Promise<void>;
  refresh: () => Promise<void>;
}

function getUnknownErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? error.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function useSetupReadiness(): UseSetupReadinessResult {
  const { status } = useAuth();
  const [organizations, setOrganizations] = useState<
    SetupReadinessOrganizationOption[]
  >([]);
  const [stores, setStores] = useState<SetupReadinessStoreOption[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationIdState] = useState<
    string | null
  >(null);
  const [selectedStoreId, setSelectedStoreIdState] = useState<string | null>(null);
  const [result, setResult] = useState<SetupReadinessResult | null>(null);
  const [scopeFailures, setScopeFailures] = useState<ReadinessSourceFailure[]>([]);
  const [isScopeLoading, setIsScopeLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const availableStores = useMemo(
    () =>
      selectedOrganizationId
        ? stores.filter((store) => store.organizationId === selectedOrganizationId)
        : [],
    [selectedOrganizationId, stores],
  );

  const loadScope = useCallback(
    async (signal?: AbortSignal) => {
      if (status !== "authenticated") {
        setOrganizations([]);
        setStores([]);
        setSelectedOrganizationIdState(null);
        setSelectedStoreIdState(null);
        setScopeFailures([]);
        setIsScopeLoading(false);
        return;
      }

      setIsScopeLoading(true);
      setErrorMessage(null);

      try {
        const scope = await getSetupReadinessScopeOptions(signal);
        if (signal?.aborted) {
          return;
        }

        setOrganizations(scope.organizations);
        setStores(scope.stores);
        setScopeFailures(scope.failures);
        setSelectedOrganizationIdState((current) => {
          if (current && scope.organizations.some((item) => item.id === current)) {
            return current;
          }
          return scope.organizations[0]?.id ?? null;
        });
      } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) {
          return;
        }

        setOrganizations([]);
        setStores([]);
        setSelectedOrganizationIdState(null);
        setSelectedStoreIdState(null);
        setScopeFailures([]);
        setErrorMessage(
          getUnknownErrorMessage(error, "Không thể tải phạm vi kiểm tra."),
        );
      } finally {
        if (!signal?.aborted) {
          setIsScopeLoading(false);
        }
      }
    },
    [status],
  );

  const loadReadiness = useCallback(
    async (signal?: AbortSignal) => {
      if (!selectedOrganizationId || !selectedStoreId) {
        setResult(null);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      setIsLoading(true);
      setIsRefreshing(true);
      setErrorMessage(null);

      try {
        const nextResult = await getSetupReadiness(
          {
            organizationId: selectedOrganizationId,
            storeId: selectedStoreId,
          },
          signal,
        );
        if (signal?.aborted) {
          return;
        }

        setResult(nextResult);
        setLastUpdatedAt(new Date());
      } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) {
          return;
        }

        setResult(null);
        setErrorMessage(
          getUnknownErrorMessage(error, "Không thể kiểm tra sẵn sàng vận hành."),
        );
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [selectedOrganizationId, selectedStoreId],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void loadScope(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadScope]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!selectedOrganizationId) {
        setSelectedStoreIdState(null);
        return;
      }

      setSelectedStoreIdState((current) => {
        if (current && availableStores.some((store) => store.id === current)) {
          return current;
        }
        return availableStores[0]?.id ?? null;
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [availableStores, selectedOrganizationId]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void loadReadiness(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadReadiness]);

  const setSelectedOrganizationId = useCallback((organizationId: string | null) => {
    setSelectedOrganizationIdState(organizationId);
    setResult(null);
  }, []);

  const setSelectedStoreId = useCallback((storeId: string | null) => {
    setSelectedStoreIdState(storeId);
    setResult(null);
  }, []);

  return {
    organizations,
    stores,
    availableStores,
    selectedOrganizationId,
    selectedStoreId,
    result,
    scopeFailures,
    isScopeLoading,
    isLoading,
    isRefreshing,
    errorMessage,
    lastUpdatedAt,
    setSelectedOrganizationId,
    setSelectedStoreId,
    refreshScope: () => loadScope(),
    refresh: () => loadReadiness(),
  };
}
