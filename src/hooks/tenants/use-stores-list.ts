"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getManagementStores,
  getStoresErrorMessage,
} from "@/lib/services/tenants/stores";
import type { StoreResult } from "@/types";

export function useStoresList() {
  const [stores, setStores] = useState<StoreResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await getManagementStores({}, signal);
      if (!signal?.aborted) setStores(result);
    } catch (error) {
      if (!signal?.aborted) {
        setStores([]);
        setErrorMessage(getStoresErrorMessage(error));
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void refresh(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [refresh]);

  return { stores, isLoading, errorMessage, refresh };
}
