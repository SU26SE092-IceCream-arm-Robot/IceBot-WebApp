"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  createExecutionEndpoint,
  getExecutionEndpointsErrorMessage,
  listExecutionEndpointsByKiosk,
  rotateExecutionEndpointCredential,
  provisionExecutionEndpoint,
  replaceExecutionEndpointRobotTargets,
  setExecutionEndpointLifecycle,
} from "@/lib/services/execution-endpoints";
import type {
  CreateExecutionEndpointRequest,
  ExecutionEndpointResult,
  ProvisionExecutionEndpointRequest,
  ReplaceExecutionEndpointRobotTargetsRequest,
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
          "Không thể cập nhật điểm thực thi.",
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
        "Đã tạo điểm thực thi ở trạng thái chờ cấu hình.",
      ),
    [kioskId, runMutation],
  );

  const setLifecycle = useCallback(
    (endpointId: string, action: "disable" | "reactivate" | "retire") =>
      runMutation(
        () => setExecutionEndpointLifecycle(kioskId, endpointId, action),
        action === "disable"
          ? "Đã vô hiệu hóa điểm thực thi."
          : action === "reactivate"
            ? "Đã kích hoạt lại điểm thực thi."
            : "Đã ngừng sử dụng điểm thực thi.",
      ),
    [kioskId, runMutation],
  );

  const replaceRobotTargets = useCallback(
    (endpointId: string, request: ReplaceExecutionEndpointRobotTargetsRequest) =>
      runMutation(
        () => replaceExecutionEndpointRobotTargets(kioskId, endpointId, request),
        "Đã cập nhật đích robot được hỗ trợ.",
      ),
    [kioskId, runMutation],
  );

  const provisionEndpoint = useCallback(
    (endpointId: string, request: ProvisionExecutionEndpointRequest) =>
      runMutation(
        () => provisionExecutionEndpoint(kioskId, endpointId, request),
        "Đã cấu hình và kích hoạt điểm thực thi.",
      ),
    [kioskId, runMutation],
  );

  const rotateCredential = useCallback(async (
    endpointId: string,
    request: Omit<ProvisionExecutionEndpointRequest, "profileIdentity">,
  ) => {
    if (mutationInFlightRef.current) return null;
    mutationInFlightRef.current = true;
    setIsMutating(true);
    setMutationErrorMessage(null);
    try {
      const result = await rotateExecutionEndpointCredential(kioskId, endpointId, request);
      await load();
      toast.success("Đã thay thông tin xác thực công khai của điểm thực thi.");
      return result;
    } catch (error) {
      const message = getExecutionEndpointsErrorMessage(
        error,
        "Không thể thay thông tin xác thực công khai của điểm thực thi.",
      );
      setMutationErrorMessage(message);
      toast.error(message);
      return null;
    } finally {
      mutationInFlightRef.current = false;
      setIsMutating(false);
    }
  }, [kioskId, load]);

  return {
    items,
    isLoading,
    errorMessage,
    mutationErrorMessage,
    isMutating,
    createEndpoint,
    setLifecycle,
    replaceRobotTargets,
    provisionEndpoint,
    rotateCredential,
    clearMutationError: () => setMutationErrorMessage(null),
    refresh: () => load(),
  };
}
