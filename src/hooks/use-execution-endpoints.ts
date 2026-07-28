"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  createExecutionEndpoint,
  getExecutionEndpointsErrorMessage,
  listExecutionEndpointsByKiosk,
  setExecutionEndpointLifecycle,
} from "@/lib/services/execution-endpoints";
import type {
  CreateExecutionEndpointRequest,
  ExecutionEndpointResult,
} from "@/types/execution-endpoints";

export function useExecutionEndpoints(kioskId: string) {
  const [items, setItems] = useState<ExecutionEndpointResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mutationErrorMessage, setMutationErrorMessage] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const mutationInFlightRef = useRef(false);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await listExecutionEndpointsByKiosk(kioskId, signal);
        if (signal?.aborted) return;
        setItems(result);
      } catch (error) {
        if (signal?.aborted) return;
        setItems([]);
        setErrorMessage(getExecutionEndpointsErrorMessage(error));
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [kioskId],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => void load(controller.signal), 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [load]);

  const runMutation = useCallback(
    async (
      mutation: () => Promise<ExecutionEndpointResult>,
      successMessage: string,
    ) => {
      if (mutationInFlightRef.current) return null;
      mutationInFlightRef.current = true;
      setIsMutating(true);
      setMutationErrorMessage(null);
      try {
        const result = await mutation();
        setItems((current) =>
          current.some((item) => item.id === result.id)
            ? current.map((item) => (item.id === result.id ? result : item))
            : [result, ...current],
        );
        toast.success(successMessage);
        return result;
      } catch (error) {
        const message = getExecutionEndpointsErrorMessage(
          error,
          "Không thể cập nhật execution endpoint.",
        );
        setMutationErrorMessage(message);
        toast.error(message);
        return null;
      } finally {
        mutationInFlightRef.current = false;
        setIsMutating(false);
      }
    },
    [],
  );

  const createEndpoint = useCallback(
    (request: CreateExecutionEndpointRequest) =>
      runMutation(
        () => createExecutionEndpoint(kioskId, request),
        "Đã tạo execution endpoint ở trạng thái chờ cấu hình.",
      ),
    [kioskId, runMutation],
  );

  const setLifecycle = useCallback(
    (endpointId: string, action: "disable" | "reactivate" | "retire") =>
      runMutation(
        () => setExecutionEndpointLifecycle(kioskId, endpointId, action),
        action === "disable"
          ? "Đã vô hiệu hóa execution endpoint."
          : action === "reactivate"
            ? "Đã kích hoạt lại execution endpoint."
            : "Đã ngừng sử dụng execution endpoint.",
      ),
    [kioskId, runMutation],
  );

  return {
    items,
    isLoading,
    errorMessage,
    mutationErrorMessage,
    isMutating,
    createEndpoint,
    setLifecycle,
    clearMutationError: () => setMutationErrorMessage(null),
    refresh: () => load(),
  };
}
