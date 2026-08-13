"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  changeStaffWorkforceLifecycle,
  createStaffWorkforce,
  getStaffWorkforce,
  getStaffWorkforceErrorMessage,
  listStaffWorkforce,
  sendStaffWorkforceInvitation,
  updateStaffWorkforce,
  updateStaffWorkforceScopes,
} from "@/lib/services/identity/staff-workforce";
import type {
  CreateStaffWorkforceRequest,
  StaffWorkforceResult,
  StaffWorkforceScopeRequest,
  StaffWorkforceStatusFilter,
} from "@/types/identity/staff-workforce";

const PAGE_SIZE = 20;

export function useStaffWorkforce(organizationId: string | null) {
  const [items, setItems] = useState<StaffWorkforceResult[]>([]);
  const [search, setSearchState] = useState("");
  const [status, setStatusState] = useState<StaffWorkforceStatusFilter>("ALL");
  const [pageNumber, setPageNumber] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [selected, setSelected] = useState<StaffWorkforceResult | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const mutationRef = useRef(false);
  const detailRequestRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      if (!organizationId) {
        setItems([]);
        setTotalCount(0);
        setTotalPages(1);
        setErrorMessage(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      void listStaffWorkforce(
        organizationId,
        { search, status, pageNumber, pageSize: PAGE_SIZE },
        controller.signal,
      )
        .then((result) => {
          if (controller.signal.aborted) return;
          setItems(result.data ?? []);
          setTotalCount(result.pagination.totalCount);
          setTotalPages(Math.max(result.pagination.totalPages, 1));
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setItems([]);
          setTotalCount(0);
          setTotalPages(1);
          setErrorMessage(getStaffWorkforceErrorMessage(error));
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false);
        });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [organizationId, pageNumber, refreshVersion, search, status]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSelected(null);
      setPageNumber(1);
      setMutationError(null);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [organizationId]);

  const replaceItem = useCallback((updated: StaffWorkforceResult) => {
    setItems((current) => current.map((item) => item.accountId === updated.accountId ? updated : item));
    setSelected((current) => current?.accountId === updated.accountId ? updated : current);
  }, []);

  const runMutation = useCallback(async <T,>(operation: () => Promise<T>): Promise<T | null> => {
    if (mutationRef.current) return null;
    mutationRef.current = true;
    setIsSubmitting(true);
    setMutationError(null);
    try {
      return await operation();
    } catch (error) {
      setMutationError(getStaffWorkforceErrorMessage(error));
      return null;
    } finally {
      mutationRef.current = false;
      setIsSubmitting(false);
    }
  }, []);

  const openDetail = useCallback(async (accountId: string) => {
    if (!organizationId) return;
    const requestId = ++detailRequestRef.current;
    setIsDetailLoading(true);
    setDetailError(null);
    setSelected(null);
    try {
      const result = await getStaffWorkforce(organizationId, accountId);
      if (requestId === detailRequestRef.current) setSelected(result);
    } catch (error) {
      if (requestId === detailRequestRef.current) {
        setDetailError(getStaffWorkforceErrorMessage(error));
      }
    } finally {
      if (requestId === detailRequestRef.current) setIsDetailLoading(false);
    }
  }, [organizationId]);

  const closeDetail = useCallback(() => {
    detailRequestRef.current += 1;
    setSelected(null);
    setDetailError(null);
    setIsDetailLoading(false);
  }, []);

  return useMemo(() => ({
    items,
    search,
    status,
    pageNumber,
    totalCount,
    totalPages,
    isLoading,
    errorMessage,
    isSubmitting,
    mutationError,
    selected,
    isDetailLoading,
    detailError,
    setSearch(value: string) { setSearchState(value); setPageNumber(1); },
    setStatus(value: StaffWorkforceStatusFilter) { setStatusState(value); setPageNumber(1); },
    previousPage() { setPageNumber((page) => Math.max(page - 1, 1)); },
    nextPage() { setPageNumber((page) => Math.min(page + 1, totalPages)); },
    refresh() { setRefreshVersion((version) => version + 1); },
    clearMutationError() { setMutationError(null); },
    openDetail,
    closeDetail,
    async create(request: CreateStaffWorkforceRequest) {
      if (!organizationId) return null;
      const result = await runMutation(() => createStaffWorkforce(
        organizationId,
        request,
        crypto.randomUUID(),
      ));
      if (result) {
        setItems((current) => [result, ...current]);
        setTotalCount((count) => count + 1);
      }
      return result;
    },
    async updateProfile(request: { fullName?: string | null; phoneNumber?: string | null }) {
      if (!organizationId || !selected) return null;
      const result = await runMutation(() => updateStaffWorkforce(organizationId, selected.accountId, {
        ...request,
        expectedRevision: selected.revision,
      }));
      if (result) replaceItem(result);
      return result;
    },
    async updateScopes(scopes: StaffWorkforceScopeRequest[]) {
      if (!organizationId || !selected) return null;
      const result = await runMutation(() => updateStaffWorkforceScopes(organizationId, selected.accountId, {
        staffScopes: scopes,
        expectedRevision: selected.revision,
      }));
      if (result) replaceItem(result);
      return result;
    },
    async changeLifecycle(action: "deactivate" | "reactivate", reason: string) {
      if (!organizationId || !selected) return null;
      const result = await runMutation(() => changeStaffWorkforceLifecycle(
        organizationId,
        selected.accountId,
        action,
        { idempotencyKey: crypto.randomUUID(), reason, expectedRevision: selected.revision },
      ));
      if (result) replaceItem(result);
      return result;
    },
    async resendInvitation(sendEmail: boolean) {
      if (!organizationId || !selected) return null;
      const result = await runMutation(() => sendStaffWorkforceInvitation(
        organizationId,
        selected.accountId,
        sendEmail,
      ));
      if (result) replaceItem(result);
      return result;
    },
  }), [
    closeDetail, detailError, errorMessage, isDetailLoading, isLoading, isSubmitting, items,
    mutationError, openDetail, organizationId, pageNumber, replaceItem, runMutation, search,
    selected, status, totalCount, totalPages,
  ]);
}
