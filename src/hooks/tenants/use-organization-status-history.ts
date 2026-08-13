"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getOrganizationsErrorMessage,
  listManagementOrganizationStatusHistory,
} from "@/lib/services/tenants/organizations";
import type { OrganizationStatusTransitionResult } from "@/types/tenants/management";

export function useOrganizationStatusHistory(
  organizationId: string,
  enabled: boolean,
) {
  const [history, setHistory] = useState<OrganizationStatusTransitionResult[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!enabled) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await listManagementOrganizationStatusHistory(
        organizationId,
        signal,
      );
      if (!signal?.aborted) setHistory(result);
    } catch (error) {
      if (!signal?.aborted) {
        setErrorMessage(
          getOrganizationsErrorMessage(error, "Không thể tải lịch sử trạng thái tổ chức."),
        );
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [enabled, organizationId]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => void load(controller.signal), 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [enabled, load]);

  return { history, isLoading, errorMessage, refresh: load };
}
