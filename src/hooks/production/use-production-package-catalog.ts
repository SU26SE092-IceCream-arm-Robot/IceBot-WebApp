"use client";

import { useCallback, useEffect, useState } from "react";

import { listProductionPackageCatalog } from "@/lib/services/production/packages";
import type { ProductionPackageResult } from "@/types/production/operations";

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Không thể tải danh mục gói sản xuất.";
}

export function useProductionPackageCatalog(
  organizationId: string,
  enabled: boolean,
) {
  const [packages, setPackages] = useState<ProductionPackageResult[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !organizationId) {
      setPackages([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await listProductionPackageCatalog(organizationId);
      setPackages(result);
    } catch (loadError) {
      setPackages([]);
      setError(errorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [enabled, organizationId]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void (async () => {
      if (!enabled || !organizationId) {
        setPackages([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const result = await listProductionPackageCatalog(
          organizationId,
          controller.signal,
        );
        if (!controller.signal.aborted) setPackages(result);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setPackages([]);
          setError(errorMessage(loadError));
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
      })();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [enabled, organizationId]);

  return { packages, isLoading, error, refresh };
}
