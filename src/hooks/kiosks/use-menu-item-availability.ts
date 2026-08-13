"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getMenuItemAvailabilityErrorMessage,
  listKioskMenuItemAvailability,
  setKioskMenuItemAvailability,
} from "@/lib/services/kiosks/menu-item-availability";
import type {
  KioskMenuItemAvailabilityResult,
  SetKioskMenuItemAvailabilityRequest,
} from "@/types/kiosks/menu-item-availability";

export function useMenuItemAvailability(kioskId: string, enabled: boolean) {
  const [items, setItems] = useState<KioskMenuItemAvailabilityResult[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const mutationRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      setErrorMessage(null);
      void listKioskMenuItemAvailability(kioskId, { search }, controller.signal)
        .then((result) => {
          if (!controller.signal.aborted) setItems(result);
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) {
            setItems([]);
            setErrorMessage(getMenuItemAvailabilityErrorMessage(error));
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false);
        });
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [enabled, kioskId, refreshVersion, search]);

  const update = useCallback(async (
    item: KioskMenuItemAvailabilityResult,
    request: Omit<SetKioskMenuItemAvailabilityRequest, "expectedRevision" | "requestId">,
  ) => {
    if (mutationRef.current) return false;
    mutationRef.current = true;
    setIsSubmitting(true);
    setMutationError(null);
    try {
      const updated = await setKioskMenuItemAvailability(kioskId, item.menuItemId, {
        ...request,
        expectedRevision: item.revision,
        requestId: crypto.randomUUID(),
      });
      setItems((current) => current.map((entry) => entry.menuItemId === updated.menuItemId ? updated : entry));
      return true;
    } catch (error) {
      setMutationError(getMenuItemAvailabilityErrorMessage(error));
      return false;
    } finally {
      mutationRef.current = false;
      setIsSubmitting(false);
    }
  }, [kioskId]);

  return {
    items,
    search,
    isLoading,
    errorMessage,
    isSubmitting,
    mutationError,
    setSearch,
    update,
    clearMutationError: () => setMutationError(null),
    refresh: () => setRefreshVersion((version) => version + 1),
  };
}
