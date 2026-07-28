"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import {
  getOperationLogsErrorMessage,
  listKioskOperationLogs,
} from "@/lib/services/operation-logs";
import type { PaginationMeta } from "@/types/accounts";
import type { OperationLogResult } from "@/types/operation-logs";

const PAGE_SIZE = 10;

const EMPTY_PAGINATION: PaginationMeta = {
  page: 1,
  pageSize: PAGE_SIZE,
  totalCount: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

export function useOperationLogs(kioskId: string) {
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState<OperationLogResult[]>([]);
  const [pagination, setPagination] =
    useState<PaginationMeta>(EMPTY_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await listKioskOperationLogs(
          kioskId,
          { pageNumber: page, pageSize: PAGE_SIZE },
          signal,
        );
        if (signal?.aborted) return;
        setLogs(result.data ?? []);
        setPagination(result.pagination);
      } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) return;
        setLogs([]);
        setPagination({ ...EMPTY_PAGINATION, page });
        setErrorMessage(getOperationLogsErrorMessage(error));
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [kioskId, page],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => void load(controller.signal), 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [load]);

  return {
    logs,
    pagination,
    isLoading,
    errorMessage,
    refresh: () => load(),
    previousPage: () => setPage((current) => Math.max(current - 1, 1)),
    nextPage: () => {
      if (pagination.hasNext) setPage((current) => current + 1);
    },
  };
}
