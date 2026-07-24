"use client";

import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  acknowledgeAlert as apiAcknowledgeAlert,
  getAlertById,
  getAlertErrorMessage,
  listAlerts,
  resolveAlert as apiResolveAlert,
} from "@/lib/services/alerts";
import type { PaginationMeta } from "@/types/accounts";
import type { AlertResult, AlertSeverity, AlertsListQuery, AlertStatus } from "@/types/alerts";

const ALERTS_PAGE_SIZE = 20;

const INITIAL_FILTERS: AlertsListQuery = {
  status: "ALL",
  severity: "ALL",
  pageNumber: 1,
  pageSize: ALERTS_PAGE_SIZE,
};

function emptyPagination(page: number): PaginationMeta {
  return {
    page,
    pageSize: ALERTS_PAGE_SIZE,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: page > 1,
  };
}

export function useAlerts() {
  const mutationInFlightRef = useRef(false);
  const detailAbortRef = useRef<AbortController | null>(null);
  const detailRequestIdRef = useRef(0);
  const [filters, setFilters] = useState<AlertsListQuery>(INITIAL_FILTERS);
  const [alerts, setAlerts] = useState<AlertResult[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(emptyPagination(1));
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedAlert, setSelectedAlert] = useState<AlertResult | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailErrorMessage, setDetailErrorMessage] = useState<string | null>(null);

  const [isMutationSubmitting, setIsMutationSubmitting] = useState(false);
  const [mutationErrorMessage, setMutationErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadAlerts = useCallback(async (currentFilters: AlertsListQuery, signal?: AbortSignal) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await listAlerts(currentFilters, signal);
      if (signal?.aborted) return;

      setAlerts(result.data || []);
      setPagination(result.pagination);
    } catch (error) {
      if (axios.isCancel(error) || signal?.aborted) return;
      setAlerts([]);
      setPagination(emptyPagination(currentFilters.pageNumber));
      setErrorMessage(getAlertErrorMessage(error, "Không thể tải danh sách cảnh báo."));
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAlerts(filters, controller.signal);
    return () => controller.abort();
  }, [filters, loadAlerts]);

  useEffect(
    () => () => {
      detailRequestIdRef.current += 1;
      detailAbortRef.current?.abort();
    },
    [],
  );

  const refresh = useCallback(async () => {
    await loadAlerts(filters);
  }, [filters, loadAlerts]);

  const updateAlertInList = useCallback((updatedAlert: AlertResult) => {
    setAlerts((current) =>
      current.map((alert) => (alert.id === updatedAlert.id ? updatedAlert : alert)),
    );
    setSelectedAlert((current) => (current?.id === updatedAlert.id ? updatedAlert : current));
  }, []);

  const openAlertDetail = useCallback(async (alertId: string) => {
    detailAbortRef.current?.abort();
    const controller = new AbortController();
    detailAbortRef.current = controller;
    const requestId = ++detailRequestIdRef.current;

    setDetailErrorMessage(null);
    setIsDetailOpen(true);
    setIsDetailLoading(true);

    try {
      const detail = await getAlertById(alertId, controller.signal);
      if (
        controller.signal.aborted ||
        requestId !== detailRequestIdRef.current
      ) {
        return;
      }
      setSelectedAlert(detail);
      updateAlertInList(detail);
    } catch (error) {
      if (
        axios.isCancel(error) ||
        controller.signal.aborted ||
        requestId !== detailRequestIdRef.current
      ) {
        return;
      }
      setDetailErrorMessage(getAlertErrorMessage(error, "Không thể tải chi tiết cảnh báo."));
    } finally {
      if (requestId === detailRequestIdRef.current) {
        detailAbortRef.current = null;
        setIsDetailLoading(false);
      }
    }
  }, [updateAlertInList]);

  const setDetailOpen = useCallback((open: boolean) => {
    setIsDetailOpen(open);
    if (!open) {
      detailRequestIdRef.current += 1;
      detailAbortRef.current?.abort();
      detailAbortRef.current = null;
      setIsDetailLoading(false);
      setDetailErrorMessage(null);
    }
  }, []);

  const setStatusFilter = useCallback((status: AlertStatus | "ALL") => {
    setFilters((current) => ({ ...current, status, pageNumber: 1 }));
  }, []);

  const setSeverityFilter = useCallback((severity: AlertSeverity | "ALL") => {
    setFilters((current) => ({ ...current, severity, pageNumber: 1 }));
  }, []);

  const setOrganizationFilter = useCallback((organizationId?: string) => {
    setFilters((current) => ({ ...current, organizationId, pageNumber: 1 }));
  }, []);

  const setStoreFilter = useCallback((storeId?: string) => {
    setFilters((current) => ({ ...current, storeId, pageNumber: 1 }));
  }, []);

  const setKioskFilter = useCallback((kioskId?: string) => {
    setFilters((current) => ({ ...current, kioskId, pageNumber: 1 }));
  }, []);

  const previousPage = useCallback(() => {
    setFilters((current) =>
      current.pageNumber > 1 ? { ...current, pageNumber: current.pageNumber - 1 } : current,
    );
  }, []);

  const nextPage = useCallback(() => {
    if (pagination.hasNext) {
      setFilters((current) => ({ ...current, pageNumber: current.pageNumber + 1 }));
    }
  }, [pagination.hasNext]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    if (mutationInFlightRef.current) return false;
    mutationInFlightRef.current = true;
    setIsMutationSubmitting(true);
    setMutationErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatedAlert = await apiAcknowledgeAlert(alertId);
      updateAlertInList(updatedAlert);
      setSuccessMessage("Đã xác nhận cảnh báo.");
      return true;
    } catch (error) {
      setMutationErrorMessage(getAlertErrorMessage(error, "Không thể xác nhận cảnh báo."));
      return false;
    } finally {
      setIsMutationSubmitting(false);
      mutationInFlightRef.current = false;
    }
  }, [updateAlertInList]);

  const resolveAlert = useCallback(async (alertId: string, resolutionNotes: string) => {
    if (mutationInFlightRef.current) return false;
    mutationInFlightRef.current = true;
    setIsMutationSubmitting(true);
    setMutationErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatedAlert = await apiResolveAlert(alertId, { resolutionNotes });
      updateAlertInList(updatedAlert);
      setSuccessMessage("Đã đánh dấu xử lý cảnh báo.");
      return true;
    } catch (error) {
      setMutationErrorMessage(getAlertErrorMessage(error, "Không thể đánh dấu xử lý."));
      return false;
    } finally {
      setIsMutationSubmitting(false);
      mutationInFlightRef.current = false;
    }
  }, [updateAlertInList]);

  const clearSuccessMessage = useCallback(() => setSuccessMessage(null), []);

  return {
    alerts,
    pagination,
    filters,
    isLoading,
    errorMessage,
    selectedAlert,
    isDetailOpen,
    isDetailLoading,
    detailErrorMessage,
    isMutationSubmitting,
    mutationErrorMessage,
    successMessage,
    setStatusFilter,
    setSeverityFilter,
    setOrganizationFilter,
    setStoreFilter,
    setKioskFilter,
    previousPage,
    nextPage,
    openAlertDetail,
    setIsDetailOpen: setDetailOpen,
    acknowledgeAlert,
    resolveAlert,
    clearSuccessMessage,
    refresh,
  };
}
