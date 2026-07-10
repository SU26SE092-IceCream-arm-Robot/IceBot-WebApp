"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getMenuManagementErrorMessage,
  listProductCategories,
} from "@/lib/services/menu-management";
import type { ProductCategoryResult } from "@/types/menu-management";

export function useProductCategories(enabled: boolean) {
  const [categories, setCategories] = useState<ProductCategoryResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!enabled) {
        setCategories([]);
        setErrorMessage(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await listProductCategories(true, signal);
        if (signal?.aborted) return;
        setCategories(result);
      } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) return;
        setCategories([]);
        setErrorMessage(getMenuManagementErrorMessage(error, "danh mục sản phẩm"));
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [enabled],
  );

  useEffect(() => {
    if (!enabled) return;

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void load(abortController.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [enabled, load]);

  const activeCategories = useMemo(
    () => categories.filter((category) => category.isActive),
    [categories],
  );

  return {
    categories,
    activeCategories,
    isLoading,
    errorMessage,
    retry: () => void load(),
  };
}
