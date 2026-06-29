"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getDashboardOverview,
  getDashboardOverviewErrorMessage,
} from "@/lib/services/dashboard-overview";
import type { DashboardOverviewData } from "@/types/dashboard-overview";

export interface UseDashboardOverviewResult {
  data: DashboardOverviewData | null;
  warnings: string[];
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
}

export function useDashboardOverview(): UseDashboardOverviewResult {
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setErrorMessage(null);
    setIsRefreshing(true);

    try {
      const result = await getDashboardOverview(signal);
      if (signal?.aborted) {
        return;
      }

      setData(result.data);
      setWarnings(result.warnings);
    } catch (error) {
      if (signal?.aborted) {
        return;
      }

      setData(null);
      setWarnings([]);
      setErrorMessage(getDashboardOverviewErrorMessage(error));
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void load(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [load]);

  return {
    data,
    warnings,
    isLoading,
    isRefreshing,
    errorMessage,
    refresh: () => load(),
  };
}
