"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getMenuManagementErrorMessage,
  listManagementProducts,
} from "@/lib/services/menu-management";
import type {
  MenuManagementPagination,
  ProductResult,
} from "@/types/menu-management";

const PAGE_SIZE = 8;

function emptyPagination(page = 1): MenuManagementPagination {
  return {
    page,
    pageSize: PAGE_SIZE,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: page > 1,
  };
}

export interface ProductOptionGroupCatalogItem {
  product: ProductResult;
  group: ProductResult["optionGroups"][number];
}

export function useProductOptionsCatalog({
  open,
  organizationId,
}: {
  open: boolean;
  organizationId: string | null;
}) {
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [pagination, setPagination] = useState<MenuManagementPagination>(
    emptyPagination(),
  );
  const [searchTerm, setSearchTermValue] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!open) return;

      if (!organizationId) {
        setProducts([]);
        setPagination(emptyPagination());
        setIsLoading(false);
        setErrorMessage("Vui lòng chọn tổ chức trước khi xem nhóm tuỳ chọn.");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await listManagementProducts(
          {
            organizationId,
            searchTerm,
            pageNumber: page,
            pageSize: PAGE_SIZE,
          },
          signal,
        );

        if (signal?.aborted) return;

        setProducts(result.data ?? []);
        setPagination(result.pagination);
      } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) return;
        setProducts([]);
        setPagination(emptyPagination(page));
        setErrorMessage(getMenuManagementErrorMessage(error, "nhóm tuỳ chọn"));
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [open, organizationId, page, searchTerm],
  );

  useEffect(() => {
    if (!open) return;
    const abortController = new AbortController();
    const timeoutId = window.setTimeout(
      () => void load(abortController.signal),
      searchTerm ? 250 : 0,
    );

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [load, open, searchTerm]);

  const setSearchTerm = useCallback((value: string) => {
    setSearchTermValue(value);
    setPage(1);
  }, []);

  const optionGroups = useMemo<ProductOptionGroupCatalogItem[]>(
    () =>
      products.flatMap((product) =>
        product.optionGroups.map((group) => ({
          product,
          group,
        })),
      ),
    [products],
  );

  return {
    products,
    optionGroups,
    pagination,
    searchTerm,
    isLoading,
    errorMessage,
    setSearchTerm,
    retry: () => void load(),
    previousPage: () => setPage((current) => Math.max(current - 1, 1)),
    nextPage: () => setPage((current) => current + 1),
  };
}
