"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import {
  getOrganizationsErrorMessage,
  listManagementOrganizations,
} from "@/lib/services/organizations";
import type { PaginationMeta } from "@/types/accounts";
import type { OrganizationResult } from "@/types/tenant-management";

const PAGE_SIZE = 25;
const EMPTY_PAGINATION: PaginationMeta = {
  page: 1,
  pageSize: PAGE_SIZE,
  totalCount: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

export function useProductionOrganizationScope() {
  const [organizations, setOrganizations] = useState<OrganizationResult[]>([]);
  const [selectedOrganization, setSelectedOrganization] =
    useState<OrganizationResult | null>(null);
  const [search, setSearchValue] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pagination, setPagination] =
    useState<PaginationMeta>(EMPTY_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await listManagementOrganizations(
          { pageNumber, pageSize: PAGE_SIZE, search },
          signal,
        );
        if (signal?.aborted) return;

        const available = result.data ?? [];
        setOrganizations(available);
        setPagination(result.pagination);
        setSelectedOrganization((current) => {
          if (current) return current;
          return result.pagination.totalCount === 1
            ? (available[0] ?? null)
            : null;
        });
      } catch (error) {
        if (signal?.aborted || axios.isCancel(error)) return;
        setOrganizations([]);
        setPagination(EMPTY_PAGINATION);
        setErrorMessage(
          getOrganizationsErrorMessage(
            error,
            "Không thể tải phạm vi tổ chức cho cấu hình sản xuất.",
          ),
        );
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [pageNumber, search],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => void load(controller.signal),
      search ? 250 : 0,
    );
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [load, search]);

  const setSearch = (value: string) => {
    setSearchValue(value);
    setPageNumber(1);
  };

  const selectOrganization = (organization: OrganizationResult) => {
    setSelectedOrganization(organization);
  };

  return {
    organizations,
    selectedOrganization,
    selectedOrganizationId: selectedOrganization?.id ?? null,
    search,
    setSearch,
    pageNumber,
    setPageNumber,
    pagination,
    selectOrganization,
    isLoading,
    errorMessage,
    refresh: load,
  };
}
