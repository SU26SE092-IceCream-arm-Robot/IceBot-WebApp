"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  createConfigurationRelease,
  discardConfigurationRelease,
  getConfigurationRelease,
  getConfigurationReleaseAuthoringOptions,
  getProductionOperationsErrorMessage,
  listProductionProgramBindings,
  listConfigurationReleases,
  publishConfigurationRelease,
  replaceConfigurationReleaseRoutes,
  retireConfigurationRelease,
} from "@/lib/services/production-operations";
import type {
  ConfigurationReleaseAuthoringOptions,
  ConfigurationReleaseResult,
  ConfigurationReleaseRouteRequest,
  ConfigurationReleaseSummaryResult,
  ProductionProgramBindingResult,
} from "@/types/production-operations";

export function useConfigurationReleases(organizationId: string) {
  const [releases, setReleases] = useState<ConfigurationReleaseSummaryResult[]>(
    [],
  );
  const [authoringOptions, setAuthoringOptions] =
    useState<ConfigurationReleaseAuthoringOptions | null>(null);
  const [productionProgramBindings, setProductionProgramBindings] = useState<
    ProductionProgramBindingResult[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshWarning, setRefreshWarning] = useState<string | null>(null);
  const mutationRef = useRef(false);
  const detailRequestRef = useRef(0);

  const refresh = useCallback(
    async (signal?: AbortSignal, reportAsPrimaryError = true) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const items = await listConfigurationReleases(organizationId, signal);
        if (!signal?.aborted) {
          setReleases(items);
          setRefreshWarning(null);
        }
        return true;
      } catch (error) {
        if (!signal?.aborted && reportAsPrimaryError) {
          setErrorMessage(
            getProductionOperationsErrorMessage(
              error,
              "Không thể tải bản phát hành cấu hình.",
            ),
          );
        }
        return false;
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [organizationId],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => void refresh(controller.signal),
      0,
    );
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [refresh]);

  const runMutation = useCallback(
    async <T>(mutation: () => Promise<T>, success: string) => {
      if (mutationRef.current) return null;
      mutationRef.current = true;
      setIsMutating(true);
      setErrorMessage(null);
      try {
        const result = await mutation();
        toast.success(success);
        const refreshed = await refresh(undefined, false);
        if (!refreshed) {
          setErrorMessage(null);
          const warning =
            "Thao tác đã thành công nhưng danh sách chưa tải lại được. Hãy thử làm mới.";
          setRefreshWarning(warning);
          toast.warning(warning);
        }
        return result;
      } catch (error) {
        const message = getProductionOperationsErrorMessage(
          error,
          "Không thể hoàn tất thao tác.",
        );
        setErrorMessage(message);
        toast.error(message);
        return null;
      } finally {
        mutationRef.current = false;
        setIsMutating(false);
      }
    },
    [refresh],
  );

  const loadEditor = useCallback(
    async (releaseId: string) => {
      const requestId = ++detailRequestRef.current;
      setErrorMessage(null);
      try {
        const [release, options, bindings] = await Promise.all([
          getConfigurationRelease(organizationId, releaseId),
          authoringOptions
            ? Promise.resolve(authoringOptions)
            : getConfigurationReleaseAuthoringOptions(organizationId),
          listProductionProgramBindings(organizationId),
        ]);
        if (requestId !== detailRequestRef.current) return null;
        setAuthoringOptions(options);
        setProductionProgramBindings(
          bindings.filter((binding) => binding.status === "Active"),
        );
        return release;
      } catch (error) {
        if (requestId === detailRequestRef.current) {
          setErrorMessage(
            getProductionOperationsErrorMessage(
              error,
              "Không thể mở trình soạn bản phát hành.",
            ),
          );
        }
        return null;
      }
    },
    [authoringOptions, organizationId],
  );

  return {
    releases,
    authoringOptions,
    productionProgramBindings,
    isLoading,
    isMutating,
    errorMessage,
    refreshWarning,
    refresh,
    loadEditor,
    cancelEditorLoad: () => {
      detailRequestRef.current += 1;
    },
    createRelease: () =>
      runMutation(
        () => createConfigurationRelease(organizationId),
        "Đã tạo bản nháp cấu hình.",
      ),
    replaceRoutes: (
      release: ConfigurationReleaseResult,
      routes: ConfigurationReleaseRouteRequest[],
    ) =>
      runMutation(
        () =>
          replaceConfigurationReleaseRoutes(
            organizationId,
            release.id,
            release.revision,
            routes,
          ),
        "Đã lưu toàn bộ tuyến sản xuất.",
      ),
    publish: (releaseId: string) =>
      runMutation(
        () => publishConfigurationRelease(organizationId, releaseId),
        "Đã phát hành cấu hình.",
      ),
    retire: (releaseId: string) =>
      runMutation(
        () => retireConfigurationRelease(organizationId, releaseId),
        "Đã ngừng sử dụng bản phát hành.",
      ),
    discard: (releaseId: string) =>
      runMutation(
        () => discardConfigurationRelease(organizationId, releaseId),
        "Đã xóa bản nháp cấu hình.",
      ),
  };
}
