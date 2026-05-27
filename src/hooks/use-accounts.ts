"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";

import {
  getAccountsErrorMessage,
  listManagementAccounts,
} from "@/lib/services/accounts";
import type {
  InternalAccountResult,
  ManagementAccountStatusFilter,
  ManagementAccountsQuery,
  PaginationMeta,
} from "@/types/accounts";

const DEFAULT_PAGE_SIZE = 10;

const INITIAL_QUERY: ManagementAccountsQuery = {
  searchTerm: "",
  status: "ALL",
  pageNumber: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

const EMPTY_PAGINATION: PaginationMeta = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalCount: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

export interface UseAccountsResult {
  accounts: InternalAccountResult[];
  query: ManagementAccountsQuery;
  pagination: PaginationMeta;
  isLoading: boolean;
  errorMessage: string | null;
  setSearchTerm: (value: string) => void;
  setStatus: (value: ManagementAccountStatusFilter) => void;
  clearFilters: () => void;
  previousPage: () => void;
  nextPage: () => void;
  refresh: () => Promise<void>;
}

export function useAccounts(): UseAccountsResult {
  const [query, setQuery] = useState<ManagementAccountsQuery>(INITIAL_QUERY);
  const [accounts, setAccounts] = useState<InternalAccountResult[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(EMPTY_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAccounts = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await listManagementAccounts(query, signal);
        if (signal?.aborted) {
          return;
        }

        setAccounts(result.data ?? []);
        setPagination(result.pagination);
      } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) {
          return;
        }

        setAccounts([]);
        setPagination(EMPTY_PAGINATION);
        setErrorMessage(getAccountsErrorMessage(error));
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [query]
  );

  useEffect(() => {
    const abortController = new AbortController();
    const delay = query.searchTerm ? 250 : 0;
    const timeoutId = window.setTimeout(() => {
      void fetchAccounts(abortController.signal);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [fetchAccounts, query.searchTerm]);

  const setSearchTerm = useCallback((value: string) => {
    setQuery((previous) => ({
      ...previous,
      searchTerm: value,
      pageNumber: 1,
    }));
  }, []);

  const setStatus = useCallback((value: ManagementAccountStatusFilter) => {
    setQuery((previous) => ({
      ...previous,
      status: value,
      pageNumber: 1,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setQuery(INITIAL_QUERY);
  }, []);

  const previousPage = useCallback(() => {
    setQuery((previous) => ({
      ...previous,
      pageNumber: Math.max(previous.pageNumber - 1, 1),
    }));
  }, []);

  const nextPage = useCallback(() => {
    setQuery((previous) => ({
      ...previous,
      pageNumber: previous.pageNumber + 1,
    }));
  }, []);

  return {
    accounts,
    query,
    pagination,
    isLoading,
    errorMessage,
    setSearchTerm,
    setStatus,
    clearFilters,
    previousPage,
    nextPage,
    refresh: () => fetchAccounts(),
  };
}
