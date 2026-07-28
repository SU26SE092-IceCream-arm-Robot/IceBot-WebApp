"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import {
  getMenuManagementErrorMessage,
  listRecipes,
} from "@/lib/services/menu-management";
import type { RecipeResult } from "@/types/menu-management";

export function useMenuItemAuthoringOptions({
  open,
  organizationId,
  productId,
  variantId,
}: {
  open: boolean;
  organizationId?: string | null;
  productId?: string | null;
  variantId?: string | null;
}) {
  const [recipes, setRecipes] = useState<RecipeResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!organizationId || !productId || !variantId) {
        setRecipes([]);
        setErrorMessage(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await listRecipes(
          organizationId,
          productId,
          variantId,
          signal,
        );
        if (!signal?.aborted) {
          setRecipes(
            (response.data ?? []).filter(
              (recipe) =>
                recipe.status === "Published" || recipe.status === "Active",
            ),
          );
        }
      } catch (error) {
        if (!axios.isCancel(error) && !signal?.aborted) {
          setRecipes([]);
          setErrorMessage(
            getMenuManagementErrorMessage(error, "công thức khả dụng"),
          );
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

  return {
    recipes,
    isLoading,
    errorMessage,
    retry: () => load(),
  };
}
