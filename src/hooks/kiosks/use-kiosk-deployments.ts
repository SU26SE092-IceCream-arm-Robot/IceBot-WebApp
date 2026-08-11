"use client";

import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  deployConfiguration,
  getConfigurationInventoryReadiness,
  listConfigurationDeployments,
  previewConfigurationDeployment,
  rollbackConfigurationDeployment,
} from "@/lib/services/production/deployments";
import { getProductionOperationsErrorMessage } from "@/lib/services/production/errors";
import { listConfigurationReleases } from "@/lib/services/production/releases";
import type {
  ConfigurationDeploymentResult,
  ConfigurationReleaseSummaryResult,
  DeploymentPreview,
  InventoryReadinessResult,
} from "@/types/production/operations";

interface KioskDeploymentScope {
  organizationId: string;
  kioskId: string;
}

export function useKioskDeployments(scope: KioskDeploymentScope) {
  const [releases, setReleases] = useState<ConfigurationReleaseSummaryResult[]>([]);
  const [deployments, setDeployments] = useState<ConfigurationDeploymentResult[]>([]);
  const [deploymentPreview, setDeploymentPreview] = useState<DeploymentPreview | null>(null);
  const [inventoryReadiness, setInventoryReadiness] = useState<InventoryReadinessResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const mutationRef = useRef(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setWarnings([]);
    const results = await Promise.allSettled([
      listConfigurationReleases(scope.organizationId, signal),
      listConfigurationDeployments(scope.kioskId, signal),
    ]);
    if (signal?.aborted) return false;

    const nextWarnings: string[] = [];
    const assign = <T,>(
      result: PromiseSettledResult<T>,
      setter: (value: T) => void,
      label: string,
    ) => {
      if (result.status === "fulfilled") setter(result.value);
      else if (!axios.isCancel(result.reason)) {
        nextWarnings.push(
          getProductionOperationsErrorMessage(result.reason, `Không thể tải ${label}.`),
        );
      }
    };

    assign(results[0], setReleases, "bản phát hành cấu hình");
    assign(results[1], setDeployments, "lịch sử triển khai");
    setWarnings([...new Set(nextWarnings.filter(Boolean))]);
    setIsLoading(false);
    return nextWarnings.length === 0;
  }, [scope.kioskId, scope.organizationId]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => void load(controller.signal), 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [load]);

  const runMutation = useCallback(async <T,>(
    mutation: () => Promise<T>,
    successMessage: string,
  ) => {
    if (mutationRef.current) return null;
    mutationRef.current = true;
    setIsMutating(true);
    setMutationError(null);
    try {
      const result = await mutation();
      toast.success(successMessage);
      const refreshed = await load();
      if (!refreshed) {
        toast.warning("Thao tác đã thành công nhưng dữ liệu mới chưa tải lại đầy đủ.");
      }
      return result;
    } catch (error) {
      const message = getProductionOperationsErrorMessage(error, "Không thể hoàn tất thao tác triển khai.");
      setMutationError(message);
      toast.error(message);
      return null;
    } finally {
      mutationRef.current = false;
      setIsMutating(false);
    }
  }, [load]);

  const previewDeployment = useCallback(async (releaseId: string) => {
    setMutationError(null);
    setDeploymentPreview(null);
    setInventoryReadiness(null);
    try {
      const [preview, readiness] = await Promise.all([
        previewConfigurationDeployment(scope.kioskId, releaseId),
        getConfigurationInventoryReadiness(scope.kioskId, releaseId),
      ]);
      setDeploymentPreview(preview);
      setInventoryReadiness(readiness);
      return preview;
    } catch (error) {
      setMutationError(
        getProductionOperationsErrorMessage(error, "Không thể kiểm tra điều kiện triển khai."),
      );
      return null;
    }
  }, [scope.kioskId]);

  return {
    releases,
    deployments,
    deploymentPreview,
    inventoryReadiness,
    isLoading,
    isMutating,
    warnings,
    mutationError,
    refresh: () => load(),
    clearPreviews: () => {
      setDeploymentPreview(null);
      setInventoryReadiness(null);
    },
    previewDeployment,
    deploy: (
      preview: DeploymentPreview,
      endpointId: string,
      acknowledgeRemainingRisk: boolean,
      reason: string,
    ) => runMutation(
      () => deployConfiguration(scope.kioskId, preview, endpointId, acknowledgeRemainingRisk, reason),
      "Đã gửi yêu cầu triển khai cấu hình.",
    ),
    rollbackDeployment: (
      deploymentId: string,
      expectedActiveDeploymentId: string,
      reason: string,
    ) => runMutation(
      () => rollbackConfigurationDeployment(
        scope.kioskId,
        deploymentId,
        expectedActiveDeploymentId,
        reason,
      ),
      "Đã gửi yêu cầu rollback cấu hình.",
    ),
  };
}
