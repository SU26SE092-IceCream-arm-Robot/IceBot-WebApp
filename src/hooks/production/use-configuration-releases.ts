"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { queryKeys } from "@/lib/api/query-keys";
import {
  createConfigurationRelease,
  discardConfigurationRelease,
  getConfigurationRelease,
  getConfigurationReleaseAuthoringOptions,
  getProductionOperationsErrorMessage,
  listConfigurationReleases,
  listProductionProgramBindings,
  publishConfigurationRelease,
  replaceConfigurationReleaseRoutes,
  retireConfigurationRelease,
} from "@/lib/services/production/operations";
import type {
  ConfigurationReleaseResult,
  ConfigurationReleaseRouteRequest,
  ConfigurationReleaseSummaryResult,
  ProductionProgramBindingResult,
} from "@/types/production/operations";

type ReleaseMutation = {
  operation: () => Promise<unknown>;
  successMessage: string;
};

export function useConfigurationReleases(organizationId: string) {
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [refreshWarning, setRefreshWarning] = useState<string | null>(null);
  const detailRequestRef = useRef(0);

  const releasesQuery = useQuery({
    queryKey: queryKeys.production.configurationReleases(organizationId),
    queryFn: ({ signal }) => listConfigurationReleases(organizationId, signal),
    enabled: Boolean(organizationId),
  });
  const authoringOptionsQuery = useQuery({
    queryKey: queryKeys.production.releaseAuthoringOptions(organizationId),
    queryFn: () => getConfigurationReleaseAuthoringOptions(organizationId),
    enabled: false,
  });
  const productionProgramBindingsQuery = useQuery({
    queryKey: queryKeys.production.productionProgramBindings(organizationId),
    queryFn: () => listProductionProgramBindings(organizationId),
    enabled: false,
  });

  const mutation = useMutation({
    mutationFn: async ({ operation }: ReleaseMutation) => operation(),
  });

  const refresh = useCallback(
    async (reportAsPrimaryError = true) => {
      setMutationError(null);
      try {
        const result = await releasesQuery.refetch();
        if (result.isError) {
          if (reportAsPrimaryError) {
            setMutationError(
              getProductionOperationsErrorMessage(
                result.error,
                "Không thể tải bản phát hành cấu hình.",
              ),
            );
          }
          return false;
        }
        setRefreshWarning(null);
        return true;
      } catch (error) {
        if (reportAsPrimaryError) {
          setMutationError(
            getProductionOperationsErrorMessage(
              error,
              "Không thể tải bản phát hành cấu hình.",
            ),
          );
        }
        return false;
      }
    },
    [releasesQuery],
  );

  const runMutation = useCallback(
    async (operation: () => Promise<unknown>, successMessage: string) => {
      if (mutation.isPending) return null;

      setMutationError(null);
      try {
        const result = await mutation.mutateAsync({ operation, successMessage });
        toast.success(successMessage);
        await queryClient.invalidateQueries({
          queryKey: queryKeys.production.configurationReleases(organizationId),
          refetchType: "none",
        });
        const refreshed = await refresh(false);
        if (!refreshed) {
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
        setMutationError(message);
        toast.error(message);
        return null;
      }
    },
    [mutation, organizationId, queryClient, refresh],
  );

  const loadEditor = useCallback(
    async (releaseId: string) => {
      const requestId = ++detailRequestRef.current;
      setMutationError(null);

      try {
        const [release] = await Promise.all([
          getConfigurationRelease(organizationId, releaseId),
          queryClient.fetchQuery({
            queryKey: queryKeys.production.releaseAuthoringOptions(organizationId),
            queryFn: () => getConfigurationReleaseAuthoringOptions(organizationId),
          }),
          queryClient.fetchQuery({
            queryKey: queryKeys.production.productionProgramBindings(organizationId),
            queryFn: () => listProductionProgramBindings(organizationId),
          }),
        ]);

        if (requestId !== detailRequestRef.current) return null;
        return release;
      } catch (error) {
        if (requestId === detailRequestRef.current) {
          setMutationError(
            getProductionOperationsErrorMessage(
              error,
              "Không thể mở trình soạn bản phát hành.",
            ),
          );
        }
        return null;
      }
    },
    [organizationId, queryClient],
  );

  const authoringOptions = authoringOptionsQuery.data ?? null;
  const productionProgramBindings = (
    productionProgramBindingsQuery.data ?? ([] as ProductionProgramBindingResult[])
  ).filter((binding) => binding.status === "Active");
  const queryError = releasesQuery.isError && !refreshWarning
    ? getProductionOperationsErrorMessage(
        releasesQuery.error,
        "Không thể tải bản phát hành cấu hình.",
      )
    : null;

  return {
    releases: releasesQuery.data ?? ([] as ConfigurationReleaseSummaryResult[]),
    authoringOptions,
    productionProgramBindings,
    isLoading: releasesQuery.isLoading || releasesQuery.isFetching,
    isMutating: mutation.isPending,
    errorMessage: mutationError ?? queryError,
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
