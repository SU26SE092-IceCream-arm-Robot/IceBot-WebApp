"use client";

import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  createRecipe,
  createRecipeVersion,
  getMenuManagementErrorMessage,
  listRecipes,
  replaceRecipeItems,
  setRecipeStatus,
  updateRecipe,
} from "@/lib/services/menu-management";
import type {
  CreateRecipeRequest,
  RecipeResult,
  RecipeStatus,
  ReplaceRecipeItemsRequest,
  UpdateRecipeRequest,
} from "@/types/menu-management";

export function useRecipeAuthoring({
  open,
  organizationId,
  productId,
  variantId,
}: {
  open: boolean;
  organizationId: string;
  productId: string;
  variantId: string;
}) {
  const [recipes, setRecipes] = useState<RecipeResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mutationRef = useRef(false);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await listRecipes(
          organizationId,
          productId,
          variantId,
          signal,
        );
        if (!signal?.aborted) setRecipes(result.data ?? []);
      } catch (error) {
        if (!axios.isCancel(error) && !signal?.aborted) {
          setRecipes([]);
          setErrorMessage(getMenuManagementErrorMessage(error, "công thức"));
        }
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [organizationId, productId, variantId],
  );

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => void load(controller.signal), 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [load, open]);

  const run = useCallback(
    async (mutation: () => Promise<RecipeResult>, success: string) => {
      if (mutationRef.current) return null;
      mutationRef.current = true;
      setIsSubmitting(true);
      setErrorMessage(null);
      try {
        const result = await mutation();
        setRecipes((current) =>
          current.some((item) => item.id === result.id)
            ? current.map((item) => (item.id === result.id ? result : item))
            : [result, ...current],
        );
        toast.success(success);
        return result;
      } catch (error) {
        setErrorMessage(getMenuManagementErrorMessage(error, "công thức"));
        return null;
      } finally {
        mutationRef.current = false;
        setIsSubmitting(false);
      }
    },
    [],
  );

  return {
    recipes,
    isLoading,
    isSubmitting,
    errorMessage,
    clearError: () => setErrorMessage(null),
    retry: () => load(),
    create: (request: CreateRecipeRequest) =>
      run(
        () => createRecipe(organizationId, productId, variantId, request),
        "Đã tạo bản nháp công thức.",
      ),
    update: (recipeId: string, request: UpdateRecipeRequest) =>
      run(
        () =>
          updateRecipe(organizationId, productId, variantId, recipeId, request),
        "Đã cập nhật công thức.",
      ),
    replaceItems: (recipeId: string, request: ReplaceRecipeItemsRequest) =>
      run(
        () =>
          replaceRecipeItems(
            organizationId,
            productId,
            variantId,
            recipeId,
            request,
          ),
        "Đã cập nhật nguyên liệu công thức.",
      ),
    setStatus: (recipeId: string, status: RecipeStatus) =>
      run(
        () =>
          setRecipeStatus(
            organizationId,
            productId,
            variantId,
            recipeId,
            status,
          ),
        "Đã cập nhật vòng đời công thức.",
      ),
    createVersion: (recipeId: string) =>
      run(
        () =>
          createRecipeVersion(organizationId, productId, variantId, recipeId),
        "Đã tạo phiên bản công thức mới ở trạng thái nháp.",
      ),
  };
}
