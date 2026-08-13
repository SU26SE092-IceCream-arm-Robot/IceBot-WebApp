"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import { listOrganizationSalesSummaries } from "@/lib/services/platform/organization-sales";
import type { PaginationMeta } from "@/types/identity/accounts";
import type { OrganizationSalesSummaryResult } from "@/types/platform/organization-sales";

const PAGE_SIZE = 20;

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function createDefaultRange() {
  const today = new Date();
  const from = new Date(today);
  from.setUTCDate(from.getUTCDate() - 29);
  return { fromDate: formatDateInput(from), toDate: formatDateInput(today), search: "" };
}

function toUtcRange(fromDate: string, toDate: string) {
  const from = new Date(`${fromDate}T00:00:00.000Z`);
  const inclusiveTo = new Date(`${toDate}T00:00:00.000Z`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(inclusiveTo.getTime())) {
    throw new Error("Khoảng ngày không hợp lệ.");
  }
  if (from > inclusiveTo) {
    throw new Error("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.");
  }
  const to = new Date(inclusiveTo);
  to.setUTCDate(to.getUTCDate() + 1);
  if (to.getTime() - from.getTime() > 366 * 24 * 60 * 60 * 1000) {
    throw new Error("Khoảng thời gian không được vượt quá 366 ngày.");
  }
  return { from: from.toISOString(), to: to.toISOString() };
}

function errorMessage(error: unknown) {
  if (axios.isCancel(error)) return "";
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; businessError?: string } | undefined;
    return data?.message || data?.businessError || error.message;
  }
  return error instanceof Error ? error.message : "Không thể tải doanh thu tổ chức.";
}

const EMPTY_PAGINATION: PaginationMeta = {
  page: 1,
  pageSize: PAGE_SIZE,
  totalCount: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

export function useOrganizationSales() {
  const [defaults] = useState(createDefaultRange);
  const [draft, setDraft] = useState(defaults);
  const [filters, setFilters] = useState(defaults);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<OrganizationSalesSummaryResult[]>([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const range = toUtcRange(filters.fromDate, filters.toDate);
      const result = await listOrganizationSalesSummaries({
        ...range,
        search: filters.search,
        pageNumber: page,
        pageSize: PAGE_SIZE,
      }, signal);
      if (signal?.aborted) return;
      setItems(result.data ?? []);
      setPagination(result.pagination);
    } catch (requestError) {
      if (axios.isCancel(requestError) || signal?.aborted) return;
      setError(errorMessage(requestError));
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return {
    draft,
    items,
    pagination,
    page,
    isLoading,
    error,
    updateDraft: (field: "fromDate" | "toDate" | "search", value: string) =>
      setDraft((current) => ({ ...current, [field]: value })),
    applyFilters: () => {
      try {
        toUtcRange(draft.fromDate, draft.toDate);
        setError(null);
        setPage(1);
        setFilters({ ...draft });
      } catch (validationError) {
        setError(errorMessage(validationError));
      }
    },
    refresh: () => void load(),
    previousPage: () => setPage((current) => Math.max(1, current - 1)),
    nextPage: () => setPage((current) => current + 1),
  };
}
