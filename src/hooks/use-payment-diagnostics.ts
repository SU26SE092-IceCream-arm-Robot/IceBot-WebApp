"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import { getOrderPaymentDiagnostics } from "@/lib/services/payments";
import { getTransactionsErrorMessage } from "@/lib/services/transactions";
import type { PaymentSessionDiagnosticsResult } from "@/types/payments";

export function usePaymentDiagnostics(
  orderId: string,
  canViewDiagnostics: boolean,
) {
  const [diagnostics, setDiagnostics] = useState<
    PaymentSessionDiagnosticsResult[]
  >([]);
  const [isLoading, setIsLoading] = useState(canViewDiagnostics);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!canViewDiagnostics) {
        setDiagnostics([]);
        setErrorMessage(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await getOrderPaymentDiagnostics(orderId, signal);
        if (!signal?.aborted) setDiagnostics(result);
      } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) return;
        setDiagnostics([]);
        setErrorMessage(
          getTransactionsErrorMessage(
            error,
            "Không thể tải bằng chứng chẩn đoán thanh toán.",
          ),
        );
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [canViewDiagnostics, orderId],
  );

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
    diagnostics,
    isLoading,
    errorMessage,
    retry: () => void load(),
  };
}
