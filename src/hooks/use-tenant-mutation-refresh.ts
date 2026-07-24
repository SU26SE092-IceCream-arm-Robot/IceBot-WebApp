"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { useMutationRefreshRecovery } from "@/hooks/use-mutation-refresh-recovery";

interface TenantMutationOptions<TContext, TResult> {
  mutation: () => Promise<TResult>;
  refreshContext: TContext;
  successMessage: string | ((result: TResult) => string);
  getErrorMessage: (error: unknown) => string;
  tone?: "success" | "warning";
  onMutationSuccess?: (result: TResult) => void;
}

export function useTenantMutationRefresh<TContext>(
  refresh: (context: TContext) => Promise<void>,
  refreshWarningMessage: string,
) {
  const mutationRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const refreshRecovery = useMutationRefreshRecovery(
    refresh,
    refreshWarningMessage,
  );

  const runMutation = useCallback(
    async <TResult,>({
      mutation,
      refreshContext,
      successMessage,
      getErrorMessage,
      tone = "success",
      onMutationSuccess,
    }: TenantMutationOptions<TContext, TResult>) => {
      if (mutationRef.current) return false;

      mutationRef.current = true;
      setIsSubmitting(true);
      setErrorMessage(null);

      let result: TResult;
      try {
        result = await mutation();
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
        mutationRef.current = false;
        setIsSubmitting(false);
        return false;
      }

      const message =
        typeof successMessage === "function"
          ? successMessage(result)
          : successMessage;
      if (tone === "warning") toast.warning(message);
      else toast.success(message);
      onMutationSuccess?.(result);

      await refreshRecovery.runRefresh(refreshContext);
      mutationRef.current = false;
      setIsSubmitting(false);
      return true;
    },
    [refreshRecovery],
  );

  return {
    mutationRef,
    isSubmitting,
    errorMessage,
    clearError: () => setErrorMessage(null),
    runMutation,
    refreshWarningMessage: refreshRecovery.refreshWarningMessage,
    isRefreshRetrying: refreshRecovery.isRefreshRetrying,
    retryRefresh: refreshRecovery.retryRefresh,
  };
}
