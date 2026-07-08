"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import {
  getIngredientsErrorMessage,
  listIngredients,
} from "@/lib/services/ingredients";
import type {
  IngredientResult,
  IngredientsPagination,
} from "@/types/ingredients";

const PAGE_SIZE = 10;

export type IngredientStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

function emptyPagination(page: number): IngredientsPagination {
  return {
    page,
    pageSize: PAGE_SIZE,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: page > 1,
  };
}

export function useIngredients(open: boolean) {
  const [ingredients, setIngredients] = useState<IngredientResult[]>([]);
  const [search, setSearchState] = useState("");
  const [status, setStatusState] = useState<IngredientStatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] =
    useState<IngredientsPagination>(emptyPagination(1));
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await listIngredients(
          {
            search,
            isActive:
              status === "ALL" ? undefined : status === "ACTIVE",
            pageNumber: page,
            pageSize: PAGE_SIZE,
          },
          signal,
        );
        if (signal?.aborted) return;

        setIngredients(result.data ?? []);
        setPagination(result.pagination);
      } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) return;
        setIngredients([]);
        setPagination(emptyPagination(page));
        setErrorMessage(getIngredientsErrorMessage(error));
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [page, search, status],
  );

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => void load(controller.signal), 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [load, open]);

  return {
    ingredients,
    search,
    status,
    pagination,
    isLoading,
    errorMessage,
    setSearch: (value: string) => {
      setSearchState(value);
      setPage(1);
    },
    setStatus: (value: IngredientStatusFilter) => {
      setStatusState(value);
      setPage(1);
    },
    previousPage: () => setPage((current) => Math.max(1, current - 1)),
    nextPage: () => setPage((current) => current + 1),
    retry: () => void load(),
  };
}
