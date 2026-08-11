"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useMutationRefreshRecovery } from "@/hooks/shared/use-mutation-refresh-recovery";
import {
  cancelFranchiseOnboarding,
  getFranchiseOnboardingErrorMessage,
  listFranchiseOnboardings,
  resumeFranchiseOnboarding,
  startFranchiseOnboarding,
} from "@/lib/services/tenants/franchise-onboarding";
import type { FranchiseOnboardingResult, StartFranchiseOnboardingRequest } from "@/types/tenants/franchise-onboarding";

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
  const currentOrganizationIdRef = useRef(organizationId);

  useEffect(() => {
    currentOrganizationIdRef.current = organizationId;
  }, [organizationId]);

  const load = useCallback(async (
    signal?: AbortSignal,
    propagateError = false,
    targetOrganizationId = organizationId,
  ) => {
    if (targetOrganizationId !== currentOrganizationIdRef.current) return;
    if (!enabled) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const page = await listFranchiseOnboardings(targetOrganizationId, undefined, signal);
      if (!signal?.aborted && targetOrganizationId === currentOrganizationIdRef.current) {
        setItems(page.data ?? []);
        setErrorMessage(null);
      }
    } catch (error) {
      if (!signal?.aborted && targetOrganizationId === currentOrganizationIdRef.current) {
        if (propagateError) throw error;
        setErrorMessage(getFranchiseOnboardingErrorMessage(error, "Không thể tải lịch sử thiết lập điểm bán."));
      }
    } finally {
      if (!signal?.aborted && targetOrganizationId === currentOrganizationIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [enabled, organizationId]);

  const refreshRecovery = useMutationRefreshRecovery(
    (targetOrganizationId: string) => load(undefined, true, targetOrganizationId),
    "Thao tác đã thành công nhưng lịch sử thiết lập chưa tải lại được.",
  );

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
    const targetOrganizationId = organizationId;
    try {
      const result = await mutation();
      toast.success(successMessage);
      await refreshRecovery.runRefresh(targetOrganizationId);
      return result;
    } catch (error) {
      if (targetOrganizationId === currentOrganizationIdRef.current) {
        setErrorMessage(getFranchiseOnboardingErrorMessage(error));
      }
      return null;
    } finally {
      mutationRef.current = false;
      setIsMutating(false);
    }
  }, [organizationId, refreshRecovery]);

  return {
    items, isLoading, isMutating, errorMessage,
    refreshWarningMessage: refreshRecovery.refreshWarningMessage,
    isRefreshRetrying: refreshRecovery.isRefreshRetrying,
    retryRefresh: refreshRecovery.retryRefresh,
    refresh: () => load(),
    clearError: () => setErrorMessage(null),
    start: async (request: StartFranchiseOnboardingRequest) => {
      startKeyRef.current ??= createIdempotencyKey();
      const result = await runMutation(() => startFranchiseOnboarding(organizationId, startKeyRef.current!, request), "Đã bắt đầu thiết lập điểm bán.");
      if (result) startKeyRef.current = null;
      return result;
    },
    resume: (onboardingId: string) => runMutation(() => resumeFranchiseOnboarding(organizationId, onboardingId), "Đã tiếp tục thiết lập điểm bán."),
    cancel: (onboardingId: string, reason: string) => runMutation(() => cancelFranchiseOnboarding(organizationId, onboardingId, reason), "Đã hủy quy trình thiết lập điểm bán."),
  };
}
