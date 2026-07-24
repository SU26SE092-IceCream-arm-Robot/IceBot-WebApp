"use client";

import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";

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

export function useExecutionAttempts(
  orderId: string,
  canViewDiagnostics: boolean,
) {
  const detailAbortRef = useRef<AbortController | null>(null);
  const detailRequestIdRef = useRef(0);
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

  useEffect(
    () => () => {
      detailRequestIdRef.current += 1;
      detailAbortRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (!canViewDiagnostics) {
      detailRequestIdRef.current += 1;
      detailAbortRef.current?.abort();
      detailAbortRef.current = null;
    }
  }, [canViewDiagnostics]);

  const toggleDetail = useCallback(
    async (sourceCommandId: string) => {
      if (!canViewDiagnostics) {
        return;
      }

      if (expandedId === sourceCommandId) {
        detailRequestIdRef.current += 1;
        detailAbortRef.current?.abort();
        detailAbortRef.current = null;
        setExpandedId(null);
        setDetail(null);
        setIsDetailLoading(false);
        setDetailErrorMessage(null);
        return;
      }

      detailAbortRef.current?.abort();
      const controller = new AbortController();
      detailAbortRef.current = controller;
      const requestId = ++detailRequestIdRef.current;

      setExpandedId(sourceCommandId);
      setDetail(null);
      setDetailErrorMessage(null);
      setIsDetailLoading(true);
      try {
        const nextDetail = await getManagementExecutionAttempt(
          orderId,
          sourceCommandId,
          controller.signal,
        );
        if (
          controller.signal.aborted ||
          requestId !== detailRequestIdRef.current
        ) {
          return;
        }
        setDetail(nextDetail);
      } catch (error) {
        if (
          axios.isCancel(error) ||
          controller.signal.aborted ||
          requestId !== detailRequestIdRef.current
        ) {
          return;
        }
        setDetailErrorMessage(
          getTransactionsErrorMessage(error, "Không thể tải chi tiết lần thực thi."),
        );
      } finally {
        if (requestId === detailRequestIdRef.current) {
          detailAbortRef.current = null;
          setIsDetailLoading(false);
        }
      }
    },
    [canViewDiagnostics, expandedId, orderId],
  );

  return {
    attempts,
    pagination,
    isLoading,
    errorMessage,
    expandedId: canViewDiagnostics ? expandedId : null,
    detail: canViewDiagnostics ? detail : null,
    isDetailLoading: canViewDiagnostics && isDetailLoading,
    detailErrorMessage: canViewDiagnostics ? detailErrorMessage : null,
    previousPage: () => setPage((current) => Math.max(1, current - 1)),
    nextPage: () => setPage((current) => current + 1),
    retry: () => void loadAttempts(),
    toggleDetail,
  };
}
