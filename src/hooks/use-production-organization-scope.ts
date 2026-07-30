"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import {
  getOrganizationsErrorMessage,
  listManagementOrganizations,
} from "@/lib/services/organizations";
import type { OrganizationResult } from "@/types/tenant-management";

const PAGE_SIZE = 100;

export function useProductionOrganizationScope() {
  const [organizations, setOrganizations] = useState<OrganizationResult[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await listManagementOrganizations({ pageNumber: 1, pageSize: PAGE_SIZE }, signal);
      if (signal?.aborted) return;
      const available = result.data ?? [];
      setOrganizations(available);
      setSelectedOrganizationId((current) => current && available.some((organization) => organization.id === current)
        ? current
        : available.length === 1 ? available[0].id : null);
    } catch (error) {
      if (signal?.aborted || axios.isCancel(error)) return;
      setOrganizations([]);
      setSelectedOrganizationId(null);
      setErrorMessage(getOrganizationsErrorMessage(error, "Không thể tải phạm vi tổ chức cho cấu hình sản xuất."));
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
    setSelectedOrganizationId,
    isLoading,
    errorMessage,
    refresh: load,
  };
}
