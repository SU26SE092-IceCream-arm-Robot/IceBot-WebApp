"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { listAllManagementOrganizations } from "@/lib/services/tenants/organizations";
import {
  getManagementStores,
  getStoresErrorMessage,
} from "@/lib/services/tenants/stores";
import type { StoreResult } from "@/types";
import type { OrganizationResult } from "@/types/tenants/management";

export interface StoreOrganizationGroup {
  organizationId: string;
  organizationName: string;
  organizationCode: string;
  stores: StoreResult[];
}

export function useStoresList() {
  const [stores, setStores] = useState<StoreResult[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [storesResult, orgsResult] = await Promise.allSettled([
        getManagementStores({}, signal),
        listAllManagementOrganizations(),
      ]);

      if (signal?.aborted) return;

      if (storesResult.status === "fulfilled") {
        setStores(storesResult.value);
      } else {
        throw storesResult.reason;
      }

      if (orgsResult.status === "fulfilled") {
        setOrganizations(orgsResult.value);
      } else {
        setOrganizations([]);
      }
    } catch (error) {
      if (!signal?.aborted) {
        setStores([]);
        setOrganizations([]);
        setErrorMessage(getStoresErrorMessage(error));
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  const groups = useMemo<StoreOrganizationGroup[]>(() => {
    const orgMap = new Map<string, OrganizationResult>();
    for (const org of organizations) {
      orgMap.set(org.id, org);
    }

    const groupMap = new Map<string, StoreOrganizationGroup>();
    for (const store of stores) {
      const orgId = store.organizationId || "unassigned";
      const org = orgMap.get(store.organizationId);
      const orgName =
        org?.name ||
        (store.organizationId
          ? `Tổ chức ${store.organizationId.slice(0, 8)}`
          : "Khác");
      const orgCode = org?.code || "";

      if (!groupMap.has(orgId)) {
        groupMap.set(orgId, {
          organizationId: orgId,
          organizationName: orgName,
          organizationCode: orgCode,
          stores: [],
        });
      }
      groupMap.get(orgId)!.stores.push(store);
    }

    return Array.from(groupMap.values());
  }, [organizations, stores]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void refresh(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [refresh]);

  return { stores, groups, organizations, isLoading, errorMessage, refresh };
}

