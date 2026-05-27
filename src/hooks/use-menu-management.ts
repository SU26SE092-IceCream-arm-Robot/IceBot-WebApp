"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import {
  getMenuManagementErrorMessage,
  listManagementMenus,
  listManagementProducts,
} from "@/lib/services/menu-management";
import type {
  MenuManagementPagination,
  MenuManagementQuery,
  MenuResult,
  ProductResult,
} from "@/types/menu-management";

const PAGE_SIZE = 6;

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

export interface MenuCollectionState<T> {
  data: T[];
  pagination: MenuManagementPagination;
  isLoading: boolean;
  errorMessage: string | null;
}

export interface UseMenuManagementResult {
  searchTerm: string;
  products: MenuCollectionState<ProductResult>;
  menus: MenuCollectionState<MenuResult>;
  setSearchTerm: (value: string) => void;
  clearSearch: () => void;
  previousProductsPage: () => void;
  nextProductsPage: () => void;
  previousMenusPage: () => void;
  nextMenusPage: () => void;
  refresh: () => Promise<void>;
}

export function useMenuManagement(): UseMenuManagementResult {
  const [searchTerm, setSearchTermValue] = useState("");
  const [productsPage, setProductsPage] = useState(1);
  const [menusPage, setMenusPage] = useState(1);
  const [products, setProducts] = useState<MenuCollectionState<ProductResult>>({
    data: [],
    pagination: emptyPagination(),
    isLoading: true,
    errorMessage: null,
  });
  const [menus, setMenus] = useState<MenuCollectionState<MenuResult>>({
    data: [],
    pagination: emptyPagination(),
    isLoading: true,
    errorMessage: null,
  });

  const fetchProducts = useCallback(
    async (signal?: AbortSignal) => {
      setProducts((current) => ({ ...current, isLoading: true, errorMessage: null }));

      const query: MenuManagementQuery = {
        searchTerm,
        pageNumber: productsPage,
        pageSize: PAGE_SIZE,
      };

      try {
        const result = await listManagementProducts(query, signal);
        if (signal?.aborted) {
          return;
        }

        setProducts({
          data: result.data ?? [],
          pagination: result.pagination,
          isLoading: false,
          errorMessage: null,
        });
      } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) {
          return;
        }

        setProducts({
          data: [],
          pagination: emptyPagination(productsPage),
          isLoading: false,
          errorMessage: getMenuManagementErrorMessage(error, "danh mục sản phẩm"),
        });
      }
    },
    [productsPage, searchTerm]
  );

  const fetchMenus = useCallback(
    async (signal?: AbortSignal) => {
      setMenus((current) => ({ ...current, isLoading: true, errorMessage: null }));

      const query: MenuManagementQuery = {
        searchTerm,
        pageNumber: menusPage,
        pageSize: PAGE_SIZE,
      };

      try {
        const result = await listManagementMenus(query, signal);
        if (signal?.aborted) {
          return;
        }

        setMenus({
          data: result.data ?? [],
          pagination: result.pagination,
          isLoading: false,
          errorMessage: null,
        });
      } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) {
          return;
        }

        setMenus({
          data: [],
          pagination: emptyPagination(menusPage),
          isLoading: false,
          errorMessage: getMenuManagementErrorMessage(error, "danh sách thực đơn"),
        });
      }
    },
    [menusPage, searchTerm]
  );

  useEffect(() => {
    const abortController = new AbortController();
    const timeoutId = window.setTimeout(
      () => void fetchProducts(abortController.signal),
      searchTerm ? 250 : 0
    );

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [fetchProducts, searchTerm]);

  useEffect(() => {
    const abortController = new AbortController();
    const timeoutId = window.setTimeout(
      () => void fetchMenus(abortController.signal),
      searchTerm ? 250 : 0
    );

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [fetchMenus, searchTerm]);

  const setSearchTerm = useCallback((value: string) => {
    setSearchTermValue(value);
    setProductsPage(1);
    setMenusPage(1);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTermValue("");
    setProductsPage(1);
    setMenusPage(1);
  }, []);

  return {
    searchTerm,
    products,
    menus,
    setSearchTerm,
    clearSearch,
    previousProductsPage: () => setProductsPage((page) => Math.max(page - 1, 1)),
    nextProductsPage: () => setProductsPage((page) => page + 1),
    previousMenusPage: () => setMenusPage((page) => Math.max(page - 1, 1)),
    nextMenusPage: () => setMenusPage((page) => page + 1),
    refresh: async () => {
      await Promise.all([fetchProducts(), fetchMenus()]);
    },
  };
}
