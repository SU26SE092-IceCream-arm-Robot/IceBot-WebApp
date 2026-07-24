"use client";

import { useCallback, useRef, useState } from "react";

export function useMutationRefreshRecovery<T>(
  refresh: (context: T) => Promise<void>,
  warningMessage: string,
) {
  const pendingContextRef = useRef<T | null>(null);
  const [refreshWarningMessage, setRefreshWarningMessage] = useState<
    string | null
  >(null);
  const [isRefreshRetrying, setIsRefreshRetrying] = useState(false);

  const runRefresh = useCallback(
    async (context: T) => {
      pendingContextRef.current = context;
      setIsRefreshRetrying(true);
      try {
        await refresh(context);
        pendingContextRef.current = null;
        setRefreshWarningMessage(null);
        return true;
      } catch {
        setRefreshWarningMessage(warningMessage);
        return false;
      } finally {
        setIsRefreshRetrying(false);
      }
    },
    [refresh, warningMessage],
  );

  const retryRefresh = useCallback(async () => {
    const context = pendingContextRef.current;
    if (context === null || isRefreshRetrying) {
      return false;
    }

    return runRefresh(context);
  }, [isRefreshRetrying, runRefresh]);

  return {
    refreshWarningMessage,
    isRefreshRetrying,
    runRefresh,
    retryRefresh,
  };
}
