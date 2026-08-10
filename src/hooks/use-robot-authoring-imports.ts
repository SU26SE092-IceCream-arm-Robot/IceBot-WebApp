"use client";

import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  confirmRobotAuthoringComposition,
  discardRobotAuthoringImport,
  getConfigurationReleaseAuthoringOptions,
  getProductionOperationsErrorMessage,
  getRobotAuthoringImport,
  getRobotAuthoringWorkspace,
  listRobotAuthoringImports,
  previewRobotAuthoringComposition,
  publishRobotAuthoringImportResources,
  resumeRobotAuthoringImport,
  uploadRobotAuthoringImport,
} from "@/lib/services/production-operations";
import type {
  ConfigurationReleaseAuthoringOptions,
  RobotAuthoringCompositionPreview,
  RobotAuthoringImportQuery,
  RobotAuthoringImportResult,
  RobotAuthoringImportListItem,
  RobotAuthoringImportStatus,
  RobotAuthoringWorkspaceResult,
  UploadRobotAuthoringImportRequest,
} from "@/types/production-operations";
import type { PaginationMeta } from "@/types/accounts";

const INITIAL_PAGINATION: PaginationMeta = {
  page: 1,
  pageSize: 10,
  totalCount: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

const INITIAL_QUERY: RobotAuthoringImportQuery = {
  status: "ALL",
  search: "",
  pageNumber: 1,
  pageSize: 10,
};

export function useRobotAuthoringImports(organizationId: string) {
  const [query, setQuery] = useState<RobotAuthoringImportQuery>(INITIAL_QUERY);
  const [items, setItems] = useState<RobotAuthoringImportListItem[]>([]);
  const [pagination, setPagination] =
    useState<PaginationMeta>(INITIAL_PAGINATION);
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null);
  const [selectedImport, setSelectedImport] =
    useState<RobotAuthoringImportResult | null>(null);
  const [workspace, setWorkspace] =
    useState<RobotAuthoringWorkspaceResult | null>(null);
  const [authoringOptions, setAuthoringOptions] =
    useState<ConfigurationReleaseAuthoringOptions | null>(null);
  const [compositionPreview, setCompositionPreview] =
    useState<RobotAuthoringCompositionPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSelection, setIsLoadingSelection] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshWarning, setRefreshWarning] = useState<string | null>(null);
  const [selectionWarning, setSelectionWarning] = useState<string | null>(null);
  const mutationRef = useRef(false);
  const listRequestRef = useRef(0);
  const selectionRequestRef = useRef(0);

  const loadList = useCallback(
    async (
      nextQuery = query,
      signal?: AbortSignal,
      preserveCurrentData = false,
    ) => {
      const requestId = ++listRequestRef.current;
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await listRobotAuthoringImports(
          organizationId,
          nextQuery,
          signal,
        );
        if (signal?.aborted || requestId !== listRequestRef.current)
          return false;
        setItems(result.data ?? []);
        setPagination(result.pagination);
        return true;
      } catch (error) {
        if (
          signal?.aborted ||
          axios.isCancel(error) ||
          requestId !== listRequestRef.current
        )
          return false;
        if (!preserveCurrentData) {
          setItems([]);
          setPagination(INITIAL_PAGINATION);
          setErrorMessage(
            getProductionOperationsErrorMessage(
              error,
              "Không thể tải các gói cấu hình đã nhập.",
            ),
          );
        }
        return false;
      } finally {
        if (!signal?.aborted && requestId === listRequestRef.current)
          setIsLoading(false);
      }
    },
    [organizationId, query],
  );

  const loadSelected = useCallback(
    async (importId: string, signal?: AbortSignal) => {
      const requestId = ++selectionRequestRef.current;
      setSelectedImportId(importId);
      setSelectedImport(null);
      setWorkspace(null);
      setCompositionPreview(null);
      setSelectionWarning(null);
      setIsLoadingSelection(true);
      try {
        const [detailResult, workspaceResult] = await Promise.allSettled([
          getRobotAuthoringImport(organizationId, importId, signal),
          getRobotAuthoringWorkspace(organizationId, importId, signal),
        ]);
        if (signal?.aborted || requestId !== selectionRequestRef.current)
          return null;
        if (detailResult.status === "rejected") {
          setSelectionWarning(
            getProductionOperationsErrorMessage(
              detailResult.reason,
              "Không thể tải chi tiết gói cấu hình.",
            ),
          );
          return null;
        }
        setSelectedImport(detailResult.value);
        if (workspaceResult.status === "fulfilled") {
          setWorkspace(workspaceResult.value);
        } else if (!axios.isCancel(workspaceResult.reason)) {
          setSelectionWarning(
            getProductionOperationsErrorMessage(
              workspaceResult.reason,
              "Đã tải gói cấu hình nhưng chưa thể tải workspace liên quan.",
            ),
          );
        }
        return detailResult.value;
      } finally {
        if (!signal?.aborted && requestId === selectionRequestRef.current)
          setIsLoadingSelection(false);
      }
    },
    [organizationId],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => void loadList(query, controller.signal),
      0,
    );
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadList, query]);

  const refresh = useCallback(async () => {
    const loaded = await loadList(query);
    if (selectedImportId) await loadSelected(selectedImportId);
    if (loaded) setRefreshWarning(null);
    return loaded;
  }, [loadList, loadSelected, query, selectedImportId]);

  const runMutation = useCallback(
    async <T>(
      mutation: () => Promise<T>,
      successMessage: string,
      onSuccess?: (result: T) => void,
    ) => {
      if (mutationRef.current) return null;
      mutationRef.current = true;
      setIsMutating(true);
      setErrorMessage(null);
      setSelectionWarning(null);
      try {
        const result = await mutation();
        onSuccess?.(result);
        toast.success(successMessage);
        const listLoaded = await loadList(query, undefined, true);
        if (selectedImportId) await loadSelected(selectedImportId);
        if (!listLoaded) {
          const warning =
            "Thao tác đã thành công nhưng danh sách mới chưa tải lại được.";
          setRefreshWarning(warning);
          toast.warning(`${warning} Hãy dùng nút Làm mới.`);
        } else {
          setRefreshWarning(null);
        }
        return result;
      } catch (error) {
        const message = getProductionOperationsErrorMessage(
          error,
          "Không thể hoàn tất thao tác với gói cấu hình.",
        );
        setSelectionWarning(message);
        toast.error(message);
        return null;
      } finally {
        mutationRef.current = false;
        setIsMutating(false);
      }
    },
    [loadList, loadSelected, query, selectedImportId],
  );

  const loadAuthoringOptions = useCallback(async () => {
    try {
      const options =
        await getConfigurationReleaseAuthoringOptions(organizationId);
      setAuthoringOptions(options);
      return options;
    } catch (error) {
      setSelectionWarning(
        getProductionOperationsErrorMessage(
          error,
          "Không thể tải Recipe để soạn cấu hình.",
        ),
      );
      return null;
    }
  }, [organizationId]);

  const previewComposition = useCallback(
    async (recipeId: string, selectedOptionCodes: string[]) => {
      if (!selectedImportId) return null;
      setCompositionPreview(null);
      try {
        const preview = await previewRobotAuthoringComposition(
          organizationId,
          selectedImportId,
          recipeId,
          selectedOptionCodes,
        );
        setCompositionPreview(preview);
        return preview;
      } catch (error) {
        setSelectionWarning(
          getProductionOperationsErrorMessage(
            error,
            "Không thể xem trước cấu thành chương trình robot.",
          ),
        );
        return null;
      }
    },
    [organizationId, selectedImportId],
  );

  const setStatus = useCallback(
    (status: RobotAuthoringImportStatus | "ALL") => {
      setQuery((current) => ({ ...current, status, pageNumber: 1 }));
    },
    [],
  );

  const setSearch = useCallback((search: string) => {
    setQuery((current) => ({ ...current, search, pageNumber: 1 }));
  }, []);

  return {
    query,
    items,
    pagination,
    selectedImportId,
    selectedImport,
    workspace,
    authoringOptions,
    compositionPreview,
    isLoading,
    isLoadingSelection,
    isMutating,
    errorMessage,
    refreshWarning,
    selectionWarning,
    setStatus,
    setSearch,
    previousPage: () =>
      setQuery((current) => ({
        ...current,
        pageNumber: Math.max(1, current.pageNumber - 1),
      })),
    nextPage: () =>
      setQuery((current) => ({
        ...current,
        pageNumber: current.pageNumber + 1,
      })),
    selectImport: (importId: string) => loadSelected(importId),
    clearSelection: () => {
      selectionRequestRef.current += 1;
      setSelectedImportId(null);
      setSelectedImport(null);
      setWorkspace(null);
      setCompositionPreview(null);
      setSelectionWarning(null);
    },
    refresh,
    loadAuthoringOptions,
    upload: (request: UploadRobotAuthoringImportRequest) =>
      runMutation(
        () => uploadRobotAuthoringImport(organizationId, request),
        "Đã nhập chương trình và tạo tài nguyên Draft.",
        (result) => void loadSelected(result.id),
      ),
    resume: () =>
      selectedImportId
        ? runMutation(
            () =>
              resumeRobotAuthoringImport(organizationId, selectedImportId),
            "Đã tiếp tục nhập chương trình.",
          )
        : Promise.resolve(null),
    publishResources: () =>
      selectedImportId
        ? runMutation(
            () =>
              publishRobotAuthoringImportResources(
                organizationId,
                selectedImportId,
              ),
            "Đã phát hành tài nguyên từ gói cấu hình.",
          )
        : Promise.resolve(null),
    discard: () =>
      selectedImportId
        ? runMutation(
            () => discardRobotAuthoringImport(organizationId, selectedImportId),
            "Đã hủy gói cấu hình đã nhập.",
          )
        : Promise.resolve(null),
    previewComposition,
    clearCompositionPreview: () => setCompositionPreview(null),
    confirmComposition: (
      recipeId: string,
      selectedOptionCodes: string[],
      previewChecksum: string,
    ) =>
      selectedImportId
        ? runMutation(
            () =>
              confirmRobotAuthoringComposition(
                organizationId,
                selectedImportId,
                recipeId,
                selectedOptionCodes,
                previewChecksum,
              ),
            "Đã xác nhận cấu thành chương trình robot.",
          )
        : Promise.resolve(null),
  };
}
