"use client";

import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  getSyncDeadLetter,
  listSyncDeadLetters,
} from "@/lib/services/sync-dead-letters";
import type { PaginationMeta } from "@/types/accounts";
import type { SyncDeadLetterResult } from "@/types/sync-dead-letters";

const PAGE_SIZE = 20;

const EMPTY_PAGINATION: PaginationMeta = {
  page: 1,
  pageSize: PAGE_SIZE,
  totalCount: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

function errorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function useSyncDeadLetters() {
  const detailAbortRef = useRef<AbortController | null>(null);
  const detailRequestIdRef = useRef(0);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<SyncDeadLetterResult[]>([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SyncDeadLetterResult | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const load = useCallback(async (currentPage: number, signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listSyncDeadLetters(
        { pageNumber: currentPage, pageSize: PAGE_SIZE },
        signal,
      );
      if (signal?.aborted) return;
      setItems(result.data ?? []);
      setPagination(result.pagination);
    } catch (loadError) {
      if (axios.isCancel(loadError) || signal?.aborted) return;
      setItems([]);
      setError(errorMessage(loadError, "Không thể tải danh sách sự cố đồng bộ."));
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(page, controller.signal);
    return () => controller.abort();
  }, [load, page]);

  useEffect(
    () => () => {
      detailRequestIdRef.current += 1;
      detailAbortRef.current?.abort();
    },
    [],
  );

  const openDetail = useCallback(async (id: string) => {
    detailAbortRef.current?.abort();
    const controller = new AbortController();
    detailAbortRef.current = controller;
    const requestId = ++detailRequestIdRef.current;
    setDetailOpen(true);
    setSelected(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const detail = await getSyncDeadLetter(id, controller.signal);
      if (controller.signal.aborted || requestId !== detailRequestIdRef.current) return;
      setSelected(detail);
    } catch (detailLoadError) {
      if (axios.isCancel(detailLoadError) || controller.signal.aborted) return;
      if (requestId === detailRequestIdRef.current) {
        setDetailError(errorMessage(detailLoadError, "Không thể tải chi tiết sự cố đồng bộ."));
      }
    } finally {
      if (!controller.signal.aborted && requestId === detailRequestIdRef.current) {
        setDetailLoading(false);
      }
    }
  }, []);

  const setDetailOpenSafely = useCallback((open: boolean) => {
    setDetailOpen(open);
    if (!open) {
      detailRequestIdRef.current += 1;
      detailAbortRef.current?.abort();
      setSelected(null);
      setDetailError(null);
      setDetailLoading(false);
    }
  }, []);

  return {
    items,
    pagination,
    isLoading,
    error,
    selected,
    detailOpen,
    detailLoading,
    detailError,
    openDetail,
    setDetailOpen: setDetailOpenSafely,
    refresh: () => void load(page),
    previousPage: () => setPage((current) => Math.max(1, current - 1)),
    nextPage: () => setPage((current) => current + 1),
  };
}
