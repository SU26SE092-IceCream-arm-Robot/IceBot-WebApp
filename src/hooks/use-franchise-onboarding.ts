"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  cancelFranchiseOnboarding,
  getFranchiseOnboardingErrorMessage,
  listFranchiseOnboardings,
  resumeFranchiseOnboarding,
  startFranchiseOnboarding,
} from "@/lib/services/franchise-onboarding";
import type { FranchiseOnboardingResult, StartFranchiseOnboardingRequest } from "@/types/franchise-onboarding";

function createIdempotencyKey() {
  return `franchise-onboarding-${crypto.randomUUID()}`;
}

export function useFranchiseOnboarding(organizationId: string, enabled: boolean) {
  const [items, setItems] = useState<FranchiseOnboardingResult[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mutationRef = useRef(false);
  const startKeyRef = useRef<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!enabled) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const page = await listFranchiseOnboardings(organizationId, undefined, signal);
      if (!signal?.aborted) {
        setItems(page.data ?? []);
        setErrorMessage(null);
      }
    } catch (error) {
      if (!signal?.aborted) setErrorMessage(getFranchiseOnboardingErrorMessage(error, "Unable to load franchise setup history."));
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [enabled, organizationId]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => void load(controller.signal), 0);
    return () => { window.clearTimeout(timeoutId); controller.abort(); };
  }, [load]);

  const runMutation = useCallback(async <T,>(mutation: () => Promise<T>, successMessage: string) => {
    if (mutationRef.current) return null;
    mutationRef.current = true;
    setIsMutating(true);
    setErrorMessage(null);
    try {
      const result = await mutation();
      toast.success(successMessage);
      await load();
      return result;
    } catch (error) {
      setErrorMessage(getFranchiseOnboardingErrorMessage(error));
      return null;
    } finally {
      mutationRef.current = false;
      setIsMutating(false);
    }
  }, [load]);

  return {
    items, isLoading, isMutating, errorMessage,
    refresh: () => load(),
    clearError: () => setErrorMessage(null),
    start: async (request: StartFranchiseOnboardingRequest) => {
      startKeyRef.current ??= createIdempotencyKey();
      const result = await runMutation(() => startFranchiseOnboarding(organizationId, startKeyRef.current!, request), "Franchise setup has been started.");
      if (result) startKeyRef.current = null;
      return result;
    },
    resume: (onboardingId: string) => runMutation(() => resumeFranchiseOnboarding(organizationId, onboardingId), "Franchise setup has been resumed."),
    cancel: (onboardingId: string, reason: string) => runMutation(() => cancelFranchiseOnboarding(organizationId, onboardingId, reason), "Franchise setup has been cancelled."),
  };
}
