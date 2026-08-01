"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import {
  getOrganizationsErrorMessage,
  listManagementOrganizations,
} from "@/lib/services/organizations";
import type { OrganizationResult } from "@/types/tenant-management";

const PAGE_SIZE = 100;

export function useAccountOrganizationScope() {
  const [organizations, setOrganizations] = useState<OrganizationResult[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const loaded: OrganizationResult[] = [];
      let pageNumber = 1;
      let hasNext = true;

      while (hasNext) {
        const result = await listManagementOrganizations(
          { pageNumber, pageSize: PAGE_SIZE },
          signal,
        );
        loaded.push(...(result.data ?? []));
        hasNext = result.pagination.hasNext;
        pageNumber += 1;
      }

      if (signal?.aborted) return;
      setOrganizations(loaded);
      setSelectedOrganizationId((current) => {
        if (current && loaded.some((organization) => organization.id === current)) {
          return current;
        }
        return loaded.length === 1 ? loaded[0].id : null;
      });
    } catch (error) {
      if (signal?.aborted || axios.isCancel(error)) return;
      setOrganizations([]);
      setSelectedOrganizationId(null);
      setErrorMessage(
        getOrganizationsErrorMessage(
          error,
          "Không thể tải phạm vi tổ chức để quản lý tài khoản.",
        ),
      );
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => void load(controller.signal), 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [load]);

  return {
    organizations,
    selectedOrganizationId,
    selectedOrganization:
      organizations.find((organization) => organization.id === selectedOrganizationId) ?? null,
    setSelectedOrganizationId,
    isLoading,
    errorMessage,
    refresh: load,
  };
}
