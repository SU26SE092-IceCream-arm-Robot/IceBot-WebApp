"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import {
  assignLuaTemplateTechnicalContract,
  changeLuaTemplateLifecycle,
  createLuaTemplateReviewUrl,
  listLuaTemplates,
  listPublishedTechnicalContracts,
  uploadLuaTemplate,
} from "@/lib/services/platform/lua-templates";
import type { PaginationMeta } from "@/types/identity/accounts";
import type {
  LuaTemplateResult,
  TechnicalContractResult,
  UploadLuaTemplateRequest,
} from "@/types/platform/lua-templates";

const PAGE_SIZE = 20;
const EMPTY_PAGINATION: PaginationMeta = {
  page: 1,
  pageSize: PAGE_SIZE,
  totalCount: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isCancel(error)) return "";
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; businessError?: string } | undefined;
    return data?.message || data?.businessError || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function useLuaTemplates() {
  const [items, setItems] = useState<LuaTemplateResult[]>([]);
  const [contracts, setContracts] = useState<TechnicalContractResult[]>([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshWarning, setRefreshWarning] = useState<string | null>(null);

  const load = useCallback(async (
    signal?: AbortSignal,
    preserveDataOnError = false,
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const [templatesPage, contractsPage] = await Promise.all([
        listLuaTemplates({ search, status, pageNumber: page, pageSize: PAGE_SIZE }, signal),
        listPublishedTechnicalContracts(signal),
      ]);
      if (signal?.aborted) return false;
      setItems(templatesPage.data ?? []);
      setPagination(templatesPage.pagination);
      setContracts(contractsPage.data ?? []);
      setRefreshWarning(null);
      return true;
    } catch (loadError) {
      if (axios.isCancel(loadError) || signal?.aborted) return false;
      const message = getErrorMessage(loadError, "Không thể tải kho mẫu LUA hệ thống.");
      if (preserveDataOnError) {
        setRefreshWarning(`Thao tác đã thành công nhưng danh sách chưa tải lại được. ${message}`);
      } else {
        setError(message);
      }
      return false;
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const refreshAfterMutation = useCallback(async () => {
    await load(undefined, true);
  }, [load]);

  const runMutation = useCallback(async <T,>(mutation: () => Promise<T>) => {
    if (isMutating) throw new Error("Một thao tác khác đang được xử lý.");
    setIsMutating(true);
    try {
      const result = await mutation();
      await refreshAfterMutation();
      return result;
    } finally {
      setIsMutating(false);
    }
  }, [isMutating, refreshAfterMutation]);

  return {
    items,
    contracts,
    pagination,
    page,
    search,
    status,
    isLoading,
    isMutating,
    error,
    refreshWarning,
    setSearch: (value: string) => { setSearch(value); setPage(1); },
    setStatus: (value: string) => { setStatus(value); setPage(1); },
    previousPage: () => setPage((current) => Math.max(1, current - 1)),
    nextPage: () => setPage((current) => current + 1),
    refresh: () => void load(),
    upload: (request: UploadLuaTemplateRequest) => runMutation(() => uploadLuaTemplate(request)),
    assignContract: (templateId: string, contractId: string) =>
      runMutation(() => assignLuaTemplateTechnicalContract(templateId, contractId)),
    changeLifecycle: (templateId: string, action: "publish" | "retire" | "discard") =>
      runMutation(() => changeLuaTemplateLifecycle(templateId, action)),
    openReview: async (templateId: string) => createLuaTemplateReviewUrl(templateId),
  };
}
