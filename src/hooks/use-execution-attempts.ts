"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import {
  getManagementExecutionAttempt,
  getManagementOrderExecutionAttempts,
  getTransactionsErrorMessage,
} from "@/lib/services/transactions";
import type {
  ExecutionAttemptDetailResult,
  ExecutionAttemptSummaryResult,
  TransactionsPaginationMeta,
} from "@/types/transactions";

const PAGE_SIZE = 5;

function emptyPagination(page = 1): TransactionsPaginationMeta {
  return {
    page,
    pageSize: PAGE_SIZE,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: page > 1,
  };
}

export function useExecutionAttempts(orderId: string) {
  const [page, setPage] = useState(1);
  const [attempts, setAttempts] = useState<ExecutionAttemptSummaryResult[]>([]);
  const [pagination, setPagination] = useState<TransactionsPaginationMeta>(
    emptyPagination(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ExecutionAttemptDetailResult | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailErrorMessage, setDetailErrorMessage] = useState<string | null>(null);

  const loadAttempts = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await getManagementOrderExecutionAttempts(
          orderId,
          { pageNumber: page, pageSize: PAGE_SIZE },
          signal,
        );
        if (signal?.aborted) return;
        setAttempts(result.data ?? []);
        setPagination(result.pagination);
      } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) return;
        setAttempts([]);
        setPagination(emptyPagination(page));
        setErrorMessage(
          getTransactionsErrorMessage(error, "Không thể tải lịch sử lần thực thi."),
        );
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [orderId, page],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void loadAttempts(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadAttempts]);

  const toggleDetail = useCallback(
    async (sourceCommandId: string) => {
      if (expandedId === sourceCommandId) {
        setExpandedId(null);
        setDetail(null);
        setDetailErrorMessage(null);
        return;
      }

      setExpandedId(sourceCommandId);
      setDetail(null);
      setDetailErrorMessage(null);
      setIsDetailLoading(true);
      try {
        setDetail(await getManagementExecutionAttempt(orderId, sourceCommandId));
      } catch (error) {
        setDetailErrorMessage(
          getTransactionsErrorMessage(error, "Không thể tải chi tiết lần thực thi."),
        );
      } finally {
        setIsDetailLoading(false);
      }
    },
    [expandedId, orderId],
  );

  return {
    attempts,
    pagination,
    isLoading,
    errorMessage,
    expandedId,
    detail,
    isDetailLoading,
    detailErrorMessage,
    previousPage: () => setPage((current) => Math.max(1, current - 1)),
    nextPage: () => setPage((current) => current + 1),
    retry: () => void loadAttempts(),
    toggleDetail,
  };
}
