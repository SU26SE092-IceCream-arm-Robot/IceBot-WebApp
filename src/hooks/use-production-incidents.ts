"use client";

import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  completeManagementProductionIncident,
  getManagementProductionIncident,
  getTransactionsErrorMessage,
  listManagementProductionIncidents,
  recordManagementProductionInspection,
  selectManagementProductionIncidentResolution,
} from "@/lib/services/transactions";
import type {
  CompleteProductionIncidentRequest,
  ProductionIncidentResult,
  ProductionIncidentStatus,
  RecordProductionInspectionRequest,
  SelectProductionIncidentResolutionRequest,
  TransactionsPaginationMeta,
} from "@/types/transactions";

const PAGE_SIZE = 10;

function emptyPagination(page: number): TransactionsPaginationMeta {
  return {
    page,
    pageSize: PAGE_SIZE,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: page > 1,
  };
}

export function useProductionIncidents(enabled: boolean) {
  const detailAbortRef = useRef<AbortController | null>(null);
  const detailRequestIdRef = useRef(0);
  const mutationInFlightRef = useRef(false);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ProductionIncidentStatus | "ALL">("ALL");
  const [incidents, setIncidents] = useState<ProductionIncidentResult[]>([]);
  const [pagination, setPagination] = useState(() => emptyPagination(1));
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] =
    useState<ProductionIncidentResult | null>(null);
  const [isDetailOpen, setIsDetailOpenState] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailErrorMessage, setDetailErrorMessage] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await listManagementProductionIncidents({
        status: status === "ALL" ? undefined : status,
        pageNumber: page,
        pageSize: PAGE_SIZE,
      });
      setIncidents(result.data ?? []);
      setPagination(result.pagination);
    } catch (error) {
      setErrorMessage(
        getTransactionsErrorMessage(error, "Không thể tải danh sách sự cố sản xuất."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [enabled, page, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(
    () => () => {
      detailAbortRef.current?.abort();
    },
    [],
  );

  const openDetail = useCallback(async (incident: ProductionIncidentResult) => {
    detailAbortRef.current?.abort();
    const controller = new AbortController();
    detailAbortRef.current = controller;
    const requestId = ++detailRequestIdRef.current;
    setSelectedIncident(incident);
    setIsDetailOpenState(true);
    setIsDetailLoading(true);
    setDetailErrorMessage(null);

    try {
      const detail = await getManagementProductionIncident(
        incident.orderId,
        incident.id,
        controller.signal,
      );
      if (detailRequestIdRef.current === requestId && !controller.signal.aborted) {
        setSelectedIncident(detail);
      }
    } catch (error) {
      if (
        !axios.isCancel(error) &&
        detailRequestIdRef.current === requestId &&
        !controller.signal.aborted
      ) {
        setDetailErrorMessage(
          getTransactionsErrorMessage(error, "Không thể tải chi tiết sự cố sản xuất."),
        );
      }
    } finally {
      if (detailRequestIdRef.current === requestId && !controller.signal.aborted) {
        setIsDetailLoading(false);
      }
    }
  }, []);

  const setDetailOpen = useCallback((open: boolean) => {
    setIsDetailOpenState(open);
    if (!open) {
      detailAbortRef.current?.abort();
      detailRequestIdRef.current += 1;
      setSelectedIncident(null);
      setDetailErrorMessage(null);
      setIsDetailLoading(false);
    }
  }, []);

  const applyMutation = useCallback(
    async (
      request: () => Promise<ProductionIncidentResult>,
      successMessage: string,
    ) => {
      if (mutationInFlightRef.current) {
        return false;
      }

      mutationInFlightRef.current = true;
      setIsMutating(true);
      setDetailErrorMessage(null);
      try {
        const updated = await request();
        setSelectedIncident(updated);
        setIncidents((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
        toast.success(successMessage);
        return true;
      } catch (error) {
        setDetailErrorMessage(
          getTransactionsErrorMessage(error, "Không thể cập nhật sự cố sản xuất."),
        );
        return false;
      } finally {
        mutationInFlightRef.current = false;
        setIsMutating(false);
      }
    },
    [],
  );

  const inspect = useCallback(
    (request: RecordProductionInspectionRequest) => {
      if (!selectedIncident) return Promise.resolve(false);
      return applyMutation(
        () =>
          recordManagementProductionInspection(
            selectedIncident.orderId,
            selectedIncident.id,
            request,
          ),
        "Đã ghi nhận kết quả kiểm tra đầu ra.",
      );
    },
    [applyMutation, selectedIncident],
  );

  const resolve = useCallback(
    (request: SelectProductionIncidentResolutionRequest) => {
      if (!selectedIncident) return Promise.resolve(false);
      return applyMutation(
        () =>
          selectManagementProductionIncidentResolution(
            selectedIncident.orderId,
            selectedIncident.id,
            request,
          ),
        request.resolution === "RequestRemake"
          ? "Đã yêu cầu làm lại đúng đơn vị sản phẩm bị ảnh hưởng."
          : "Đã ghi nhận hướng xử lý sự cố.",
      );
    },
    [applyMutation, selectedIncident],
  );

  const complete = useCallback(
    (request: CompleteProductionIncidentRequest) => {
      if (!selectedIncident) return Promise.resolve(false);
      return applyMutation(
        () =>
          completeManagementProductionIncident(
            selectedIncident.orderId,
            selectedIncident.id,
            request,
          ),
        "Đã hoàn tất xử lý sự cố sản xuất.",
      );
    },
    [applyMutation, selectedIncident],
  );

  return {
    incidents,
    pagination,
    isLoading,
    errorMessage,
    status,
    selectedIncident,
    isDetailOpen,
    isDetailLoading,
    detailErrorMessage,
    isMutating,
    setStatus: (value: ProductionIncidentStatus | "ALL") => {
      setPage(1);
      setStatus(value);
    },
    previousPage: () => setPage((current) => Math.max(current - 1, 1)),
    nextPage: () => setPage((current) => current + 1),
    refresh,
    openDetail,
    setDetailOpen,
    inspect,
    resolve,
    complete,
  };
}
