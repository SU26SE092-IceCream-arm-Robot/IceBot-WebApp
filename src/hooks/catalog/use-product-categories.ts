"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  createProductCategory,
  deleteProductCategory,
  getMenuManagementErrorMessage,
  listProductCategories,
  setProductCategoryStatus,
  updateProductCategory,
} from "@/lib/services/catalog/menu-management";
import type {
  CreateProductCategoryRequest,
  ProductCategoryResult,
  UpdateProductCategoryRequest,
} from "@/types/catalog/menu-management";

export function useProductCategories(enabled: boolean) {
  const [categories, setCategories] = useState<ProductCategoryResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutatingCategoryId, setMutatingCategoryId] = useState<
    number | "new" | null
  >(null);
  const mutationInFlightRef = useRef(false);

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

  const runMutation = useCallback(
    async (
      target: number | "new",
      action: () => Promise<unknown>,
      successMessage: string,
    ) => {
      if (mutationInFlightRef.current) return false;
      mutationInFlightRef.current = true;
      setMutatingCategoryId(target);
      setMutationError(null);
      try {
        await action();
        toast.success(successMessage);
        await load();
        return true;
      } catch (error) {
        setMutationError(
          getMenuManagementErrorMessage(error, "danh mục sản phẩm"),
        );
        return false;
      } finally {
        mutationInFlightRef.current = false;
        setMutatingCategoryId(null);
      }
    },
    [load],
  );
  const clearMutationError = useCallback(() => setMutationError(null), []);

  return {
    categories,
    activeCategories,
    isLoading,
    errorMessage,
    mutationError,
    clearMutationError,
    mutatingCategoryId,
    retry: () => void load(),
    create: (request: CreateProductCategoryRequest) =>
      runMutation(
        "new",
        () => createProductCategory(request),
        "Đã tạo danh mục sản phẩm.",
      ),
    update: (categoryId: number, request: UpdateProductCategoryRequest) =>
      runMutation(
        categoryId,
        () => updateProductCategory(categoryId, request),
        "Đã cập nhật danh mục sản phẩm.",
      ),
    setStatus: (category: ProductCategoryResult) =>
      runMutation(
        category.id,
        () => setProductCategoryStatus(category.id, !category.isActive),
        category.isActive
          ? "Đã tắt danh mục sản phẩm."
          : "Đã kích hoạt danh mục sản phẩm.",
      ),
    remove: (category: ProductCategoryResult) =>
      runMutation(
        category.id,
        () => deleteProductCategory(category.id),
        "Đã xóa danh mục sản phẩm.",
      ),
  };
}
