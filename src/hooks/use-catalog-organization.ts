"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  getOrganizationsErrorMessage,
  listManagementOrganizations,
} from "@/lib/services/organizations";
const ORGANIZATION_PAGE_SIZE = 100;

export interface CatalogOrganizationOption {
  id: string;
  name?: string;
  code?: string;
}

export function useCatalogOrganization() {
  const { session, status } = useAuth();
  const [organizations, setOrganizations] = useState<CatalogOrganizationOption[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const scopedOrganizationIds = useMemo(
    () =>
      Array.from(
        new Set(
          (session?.account.roles ?? [])
            .map((role) => role.organizationId)
            .filter((id): id is string => Boolean(id)),
        ),
      ),
    [session?.account.roles],
  );
  const isSystemAdmin = session?.account.roles.some(
    (role) => role.roleCode === "SystemAdmin",
  ) ?? false;

  const loadOrganizations = useCallback(
    async (signal?: AbortSignal) => {
      if (status !== "authenticated") return;
      setIsLoading(true);
      setErrorMessage(null);

      try {
        if (!isSystemAdmin) {
          const scopedOptions = scopedOrganizationIds.map((id) => ({ id }));
          setOrganizations(scopedOptions);
          setSelectedOrganizationId((current) => {
            if (current && scopedOptions.some((organization) => organization.id === current)) {
              return current;
            }
            return scopedOptions.length === 1 ? scopedOptions[0].id : null;
          });
          if (scopedOptions.length === 0) {
            setErrorMessage("Tài khoản chưa có phạm vi tổ chức để quản lý danh mục.");
          }
          return;
        }

        const loaded: CatalogOrganizationOption[] = [];
        let pageNumber = 1;
        let hasNext = true;

        while (hasNext) {
          const result = await listManagementOrganizations(
            { pageNumber, pageSize: ORGANIZATION_PAGE_SIZE },
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
          if (scopedOrganizationIds.length === 1) {
            return scopedOrganizationIds[0];
          }
          return loaded.length === 1 ? loaded[0].id : null;
        });
      } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) return;
        setOrganizations([]);
        setSelectedOrganizationId(null);
        setErrorMessage(
          getOrganizationsErrorMessage(error, "Không thể tải tổ chức để quản lý danh mục."),
        );
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [isSystemAdmin, scopedOrganizationIds, status],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => void loadOrganizations(controller.signal), 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadOrganizations]);

  return {
    organizations,
    selectedOrganizationId,
    selectedOrganization: organizations.find(
      (organization) => organization.id === selectedOrganizationId,
    ) ?? null,
    setSelectedOrganizationId,
    isLoading,
    errorMessage,
    refresh: loadOrganizations,
  };
}
