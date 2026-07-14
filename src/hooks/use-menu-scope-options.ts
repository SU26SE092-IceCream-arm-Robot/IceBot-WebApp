"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getKioskManagementErrorMessage,
  getManagementKiosks,
} from "@/lib/services/kiosk-management";
import { getManagementStores, getStoresErrorMessage } from "@/lib/services/stores";
import type { KioskResult, StoreResult } from "@/types/kiosk-management";

interface UseMenuScopeOptionsResult {
  errorMessage: string | null;
  isLoading: boolean;
  kiosks: KioskResult[];
  stores: StoreResult[];
  retry: () => void;
}

export function useMenuScopeOptions(
  organizationId: string | null,
): UseMenuScopeOptionsResult {
  const [stores, setStores] = useState<StoreResult[]>([]);
  const [kiosks, setKiosks] = useState<KioskResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let controller: AbortController | null = null;
    const timeoutId = window.setTimeout(() => {
      if (!organizationId) {
        setStores([]);
        setKiosks([]);
        setErrorMessage(null);
        setIsLoading(false);
        return;
      }

      controller = new AbortController();
      setIsLoading(true);
      setErrorMessage(null);

      void Promise.allSettled([
        getManagementStores({ organizationId }, controller.signal),
        getManagementKiosks({ organizationId }, controller.signal),
      ]).then(([storesResult, kiosksResult]) => {
        if (controller?.signal.aborted) return;

        const messages: string[] = [];
        if (storesResult.status === "fulfilled") {
          setStores(storesResult.value);
        } else {
          setStores([]);
          messages.push(
            getStoresErrorMessage(
              storesResult.reason,
              "Không thể tải danh sách cửa hàng cho phạm vi sản phẩm.",
            ),
          );
        }

        if (kiosksResult.status === "fulfilled") {
          setKiosks(kiosksResult.value);
        } else {
          setKiosks([]);
          messages.push(
            getKioskManagementErrorMessage(
              kiosksResult.reason,
              "Không thể tải danh sách kiosk cho phạm vi sản phẩm.",
            ),
          );
        }

        setErrorMessage(messages.length > 0 ? messages.join(" ") : null);
        setIsLoading(false);
      });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller?.abort();
    };
  }, [organizationId, refreshVersion]);

  const retry = useCallback(() => {
    setRefreshVersion((version) => version + 1);
  }, []);

  return useMemo(
    () => ({
      errorMessage,
      isLoading,
      kiosks,
      stores,
      retry,
    }),
    [errorMessage, isLoading, kiosks, retry, stores],
  );
}
