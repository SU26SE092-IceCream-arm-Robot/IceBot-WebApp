"use client";

import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  approveServiceRegistration,
  getManagementServiceRegistration,
  getServiceRegistrationErrorMessage,
  listManagementServiceRegistrations,
  rejectServiceRegistration,
  retryProvisioningServiceRegistration,
  startReviewServiceRegistration,
} from "@/lib/services/service-registrations";
import type { PaginationMeta } from "@/types/identity/accounts";
import type {
  ApproveServiceRegistrationRequest,
  ManagementServiceRegistrationDetail,
  ManagementServiceRegistrationItem,
  RejectServiceRegistrationRequest,
} from "@/types/service-registrations";

const PAGE_SIZE = 20;

const EMPTY_PAGINATION: PaginationMeta = {
  page: 1,
  pageSize: PAGE_SIZE,
  totalCount: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

export function useServiceRegistrations() {
  const detailAbortRef = useRef<AbortController | null>(null);
  const detailRequestIdRef = useRef(0);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");

  const [items, setItems] = useState<ManagementServiceRegistrationItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(EMPTY_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail drawer state
  const [selectedDetail, setSelectedDetail] =
    useState<ManagementServiceRegistrationDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Approve dialog state
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [targetForApprove, setTargetForApprove] =
    useState<ManagementServiceRegistrationDetail | null>(null);

  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [targetForReject, setTargetForReject] =
    useState<ManagementServiceRegistrationDetail | null>(null);

  // Action loading states
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(
    async (
      currentPage: number,
      currentStatus: string,
      search: string,
      from: string,
      to: string,
      signal?: AbortSignal,
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await listManagementServiceRegistrations(
          {
            pageNumber: currentPage,
            pageSize: PAGE_SIZE,
            status: currentStatus,
            search: search.trim() || undefined,
            createdFrom: from || undefined,
            createdTo: to || undefined,
          },
          signal,
        );
        if (signal?.aborted) return;
        setItems(result.data ?? []);
        setPagination(result.pagination ?? EMPTY_PAGINATION);
      } catch (loadError) {
        if (axios.isCancel(loadError) || signal?.aborted) return;
        setItems([]);
        setError(
          getServiceRegistrationErrorMessage(
            loadError,
            "Không thể tải danh sách đơn đăng ký dịch vụ.",
          ),
        );
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(page, statusFilter, searchQuery, createdFrom, createdTo, controller.signal);
    return () => controller.abort();
  }, [load, page, statusFilter, searchQuery, createdFrom, createdTo]);

  useEffect(
    () => () => {
      detailRequestIdRef.current += 1;
      detailAbortRef.current?.abort();
    },
    [],
  );

  const refresh = useCallback(() => {
    void load(page, statusFilter, searchQuery, createdFrom, createdTo);
  }, [load, page, statusFilter, searchQuery, createdFrom, createdTo]);

  const openDetail = useCallback(async (id: string) => {
    detailAbortRef.current?.abort();
    const controller = new AbortController();
    detailAbortRef.current = controller;
    const requestId = ++detailRequestIdRef.current;

    setDetailOpen(true);
    setSelectedDetail(null);
    setDetailError(null);
    setDetailLoading(true);

    try {
      const detail = await getManagementServiceRegistration(id, controller.signal);
      if (controller.signal.aborted || requestId !== detailRequestIdRef.current) return;
      setSelectedDetail(detail);
    } catch (detailLoadError) {
      if (axios.isCancel(detailLoadError) || controller.signal.aborted) return;
      if (requestId === detailRequestIdRef.current) {
        setDetailError(
          getServiceRegistrationErrorMessage(
            detailLoadError,
            "Không thể tải thông tin chi tiết đơn đăng ký.",
          ),
        );
      }
    } finally {
      if (!controller.signal.aborted && requestId === detailRequestIdRef.current) {
        setDetailLoading(false);
      }
    }
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    detailRequestIdRef.current += 1;
    detailAbortRef.current?.abort();
    setSelectedDetail(null);
    setDetailError(null);
    setDetailLoading(false);
  }, []);

  const handleStartReview = useCallback(
    async (id: string, revision?: number) => {
      setActionLoading(true);
      try {
        const updated = await startReviewServiceRegistration(id, revision);
        toast.success("Đã chuyển đơn đăng ký sang trạng thái đang rà soát.");
        setSelectedDetail(updated);
        refresh();
      } catch (err) {
        toast.error(getServiceRegistrationErrorMessage(err));
      } finally {
        setActionLoading(false);
      }
    },
    [refresh],
  );

  const handleApprove = useCallback(
    async (id: string, request: ApproveServiceRegistrationRequest) => {
      setActionLoading(true);
      try {
        const updated = await approveServiceRegistration(id, request);
        toast.success("Đã phê duyệt đơn đăng ký và bắt đầu khởi tạo tổ chức.");
        setApproveDialogOpen(false);
        setTargetForApprove(null);
        setSelectedDetail(updated);
        refresh();
      } catch (err) {
        toast.error(getServiceRegistrationErrorMessage(err));
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [refresh],
  );

  const handleReject = useCallback(
    async (id: string, request: RejectServiceRegistrationRequest) => {
      setActionLoading(true);
      try {
        const updated = await rejectServiceRegistration(id, request);
        toast.success("Đã từ chối đơn đăng ký dịch vụ.");
        setRejectDialogOpen(false);
        setTargetForReject(null);
        setSelectedDetail(updated);
        refresh();
      } catch (err) {
        toast.error(getServiceRegistrationErrorMessage(err));
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [refresh],
  );

  const handleRetryProvisioning = useCallback(
    async (id: string, revision?: number) => {
      setActionLoading(true);
      try {
        const updated = await retryProvisioningServiceRegistration(id, revision);
        toast.success("Đã gửi lệnh thử lại quy trình cấp phát.");
        setSelectedDetail(updated);
        refresh();
      } catch (err) {
        toast.error(getServiceRegistrationErrorMessage(err));
      } finally {
        setActionLoading(false);
      }
    },
    [refresh],
  );

  const openApproveDialog = useCallback((detail: ManagementServiceRegistrationDetail) => {
    setTargetForApprove(detail);
    setApproveDialogOpen(true);
  }, []);

  const openRejectDialog = useCallback((detail: ManagementServiceRegistrationDetail) => {
    setTargetForReject(detail);
    setRejectDialogOpen(true);
  }, []);

  return {
    items,
    pagination,
    isLoading,
    error,
    page,
    setPage,
    statusFilter,
    setStatusFilter: (s: string) => {
      setStatusFilter(s);
      setPage(1);
    },
    searchQuery,
    setSearchQuery: (q: string) => {
      setSearchQuery(q);
      setPage(1);
    },
    createdFrom,
    setCreatedFrom: (from: string) => {
      setCreatedFrom(from);
      setPage(1);
    },
    createdTo,
    setCreatedTo: (to: string) => {
      setCreatedTo(to);
      setPage(1);
    },
    selectedDetail,
    detailOpen,
    detailLoading,
    detailError,
    openDetail,
    closeDetail,
    approveDialogOpen,
    setApproveDialogOpen,
    targetForApprove,
    openApproveDialog,
    rejectDialogOpen,
    setRejectDialogOpen,
    targetForReject,
    openRejectDialog,
    actionLoading,
    startReview: handleStartReview,
    approve: handleApprove,
    reject: handleReject,
    retryProvisioning: handleRetryProvisioning,
    refresh,
    previousPage: () => setPage((curr) => Math.max(1, curr - 1)),
    nextPage: () => setPage((curr) => curr + 1),
  };
}
