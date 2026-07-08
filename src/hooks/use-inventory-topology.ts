"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import {
  getInventoryErrorMessage,
  getKioskInventoryTopology,
} from "@/lib/services/inventory";
import type { KioskInventoryTopologyResult } from "@/types/inventory-management";

export interface UseInventoryTopologyResult {
  topology: KioskInventoryTopologyResult | null;
  isLoading: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
}

export function useInventoryTopology(
  kioskId: string | null,
): UseInventoryTopologyResult {
  const [topology, setTopology] =
    useState<KioskInventoryTopologyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTopology = useCallback(
    async (signal?: AbortSignal) => {
      if (!kioskId) {
        setTopology(null);
        setErrorMessage(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await getKioskInventoryTopology(kioskId, signal);
        if (!signal?.aborted) {
          setTopology(result);
        }
      } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) {
          return;
        }

        setTopology(null);
        setErrorMessage(
          getInventoryErrorMessage(
            error,
            "Không thể tải chẩn đoán cấu hình tồn kho của kiosk.",
          ),
        );
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [kioskId],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void fetchTopology(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [fetchTopology]);

  return {
    topology,
    isLoading,
    errorMessage,
    refresh: () => fetchTopology(),
  };
}
