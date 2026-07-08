"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import {
  getInventoryErrorMessage,
  listDispenserHistory,
} from "@/lib/services/inventory";
import type {
  DispenserHistoryResult,
  InventoryPaginationMeta,
} from "@/types/inventory-management";

const HISTORY_PAGE_SIZE = 8;

function emptyPagination(page: number): InventoryPaginationMeta {
  return {
    page,
    pageSize: HISTORY_PAGE_SIZE,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: page > 1,
  };
}

export function useDispenserHistory(
  dispenserStateId: string | null | undefined,
  enabled: boolean,
) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<DispenserHistoryResult[]>([]);
  const [pagination, setPagination] = useState<InventoryPaginationMeta>(
    emptyPagination(1),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!enabled || !dispenserStateId) {
        setData([]);
        setPagination(emptyPagination(1));
        setErrorMessage(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await listDispenserHistory(
          dispenserStateId,
          {
            pageNumber: page,
            pageSize: HISTORY_PAGE_SIZE,
          },
          signal,
        );

        if (signal?.aborted) {
          return;
        }

        setData(result.data ?? []);
        setPagination(result.pagination);
      } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) {
          return;
        }

        setData([]);
        setPagination(emptyPagination(page));
        setErrorMessage(
          getInventoryErrorMessage(
            error,
            "Không thể tải lịch sử bộ phân phối.",
          ),
        );
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [dispenserStateId, enabled, page],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void load(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [enabled, load]);

  return {
    data,
    pagination,
    isLoading,
    errorMessage,
    refresh: () => load(),
    previousPage: () => setPage((current) => Math.max(current - 1, 1)),
    nextPage: () => setPage((current) => current + 1),
  };
}
