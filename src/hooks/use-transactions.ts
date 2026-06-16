"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  cancelManagementOrder,
  getManagementRefundById,
  getManagementOrderById,
  getManagementOrderStatusHistory,
  getTransactionsErrorMessage,
  listManagementRefunds,
  listManagementOrders,
  markManagementOrderRefundRequired,
} from "@/lib/services/transactions";
import type {
  OrderResult,
  OrderStatusFilter,
  OrderStatusHistoryResult,
  PaymentStatusFilter,
  RefundResult,
  RefundsFilters,
  RefundStatusFilter,
  RefundsSummary,
  TransactionsFilters,
  TransactionsPaginationMeta,
  TransactionsSummary,
} from "@/types/transactions";

const ORDERS_PAGE_SIZE = 10;
const REFUNDS_PAGE_SIZE = 10;
const HISTORY_PAGE_SIZE = 8;

const INITIAL_FILTERS: TransactionsFilters = {
  searchTerm: "",
  status: "ALL",
  paymentStatus: "ALL",
};

const INITIAL_REFUND_FILTERS: RefundsFilters = {
  searchTerm: "",
  status: "ALL",
};

function emptyPagination(
  page: number,
  pageSize: number,
): TransactionsPaginationMeta {
  return {
    page,
    pageSize,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: page > 1,
  };
}

interface TransactionsCollectionState<T> {
  data: T[];
  pagination: TransactionsPaginationMeta;
  isLoading: boolean;
  errorMessage: string | null;
}

export interface UseTransactionsResult {
  orders: TransactionsCollectionState<OrderResult>;
  refunds: TransactionsCollectionState<RefundResult>;
  statusHistory: TransactionsCollectionState<OrderStatusHistoryResult>;
  filters: TransactionsFilters;
  refundFilters: RefundsFilters;
  summary: TransactionsSummary;
  refundsSummary: RefundsSummary;
  selectedOrder: OrderResult | null;
  selectedRefund: RefundResult | null;
  isDetailOpen: boolean;
  isDetailLoading: boolean;
  detailErrorMessage: string | null;
  isRefundDetailOpen: boolean;
  isRefundDetailLoading: boolean;
  refundDetailErrorMessage: string | null;
  orderPendingAction: OrderResult | null;
  actionReason: string;
  actionErrorMessage: string | null;
  actionSuccessMessage: string | null;
  isCancelOpen: boolean;
  isRefundRequiredOpen: boolean;
  isActionSubmitting: boolean;
  setSearchTerm: (value: string) => void;
  setStatusFilter: (value: OrderStatusFilter) => void;
  setPaymentStatusFilter: (value: PaymentStatusFilter) => void;
  setRefundSearchTerm: (value: string) => void;
  setRefundStatusFilter: (value: RefundStatusFilter) => void;
  clearFilters: () => void;
  clearRefundFilters: () => void;
  previousPage: () => void;
  nextPage: () => void;
  previousRefundPage: () => void;
  nextRefundPage: () => void;
  previousHistoryPage: () => void;
  nextHistoryPage: () => void;
  openOrderDetail: (orderId: string) => Promise<void>;
  openRefundDetail: (refundId: string) => Promise<void>;
  setDetailOpen: (open: boolean) => void;
  setRefundDetailOpen: (open: boolean) => void;
  requestCancelOrder: (order: OrderResult) => void;
  requestRefundRequired: (order: OrderResult) => void;
  setActionReason: (value: string) => void;
  setCancelOpen: (open: boolean) => void;
  setRefundRequiredOpen: (open: boolean) => void;
  confirmCancelOrder: () => Promise<void>;
  confirmRefundRequired: () => Promise<void>;
  clearActionSuccessMessage: () => void;
  refresh: () => Promise<void>;
}

export function useTransactions(): UseTransactionsResult {
  const [filters, setFilters] = useState<TransactionsFilters>(INITIAL_FILTERS);
  const [refundFilters, setRefundFilters] =
    useState<RefundsFilters>(INITIAL_REFUND_FILTERS);
  const [page, setPage] = useState(1);
  const [refundPage, setRefundPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderResult | null>(null);
  const [selectedRefund, setSelectedRefund] = useState<RefundResult | null>(
    null,
  );
  const [orderPendingAction, setOrderPendingAction] =
    useState<OrderResult | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isRefundDetailOpen, setIsRefundDetailOpen] = useState(false);
  const [isRefundDetailLoading, setIsRefundDetailLoading] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isRefundRequiredOpen, setIsRefundRequiredOpen] = useState(false);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const [actionReason, setActionReason] = useState("");
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(
    null,
  );
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(
    null,
  );
  const [detailErrorMessage, setDetailErrorMessage] = useState<string | null>(
    null,
  );
  const [refundDetailErrorMessage, setRefundDetailErrorMessage] = useState<
    string | null
  >(null);
  const [orders, setOrders] = useState<
    TransactionsCollectionState<OrderResult>
  >({
    data: [],
    pagination: emptyPagination(1, ORDERS_PAGE_SIZE),
    isLoading: true,
    errorMessage: null,
  });
  const [refunds, setRefunds] = useState<
    TransactionsCollectionState<RefundResult>
  >({
    data: [],
    pagination: emptyPagination(1, REFUNDS_PAGE_SIZE),
    isLoading: true,
    errorMessage: null,
  });
  const [statusHistory, setStatusHistory] = useState<
    TransactionsCollectionState<OrderStatusHistoryResult>
  >({
    data: [],
    pagination: emptyPagination(1, HISTORY_PAGE_SIZE),
    isLoading: false,
    errorMessage: null,
  });

  const fetchOrders = useCallback(
    async (signal?: AbortSignal) => {
      setOrders((current) => ({
        ...current,
        isLoading: true,
        errorMessage: null,
      }));

      try {
        const result = await listManagementOrders(
          {
            searchTerm: filters.searchTerm,
            status: filters.status === "ALL" ? undefined : filters.status,
            paymentStatus:
              filters.paymentStatus === "ALL"
                ? undefined
                : filters.paymentStatus,
            pageNumber: page,
            pageSize: ORDERS_PAGE_SIZE,
          },
          signal,
        );

        if (signal?.aborted) {
          return;
        }

        setOrders({
          data: result.data ?? [],
          pagination: result.pagination,
          isLoading: false,
          errorMessage: null,
        });
      } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) {
          return;
        }

        setOrders({
          data: [],
          pagination: emptyPagination(page, ORDERS_PAGE_SIZE),
          isLoading: false,
          errorMessage: getTransactionsErrorMessage(
            error,
            "Không thể tải danh sách giao dịch.",
          ),
        });
      }
    },
    [filters.paymentStatus, filters.searchTerm, filters.status, page],
  );

  const fetchStatusHistory = useCallback(
    async (orderId: string, signal?: AbortSignal) => {
      setStatusHistory((current) => ({
        ...current,
        isLoading: true,
        errorMessage: null,
      }));

      try {
        const result = await getManagementOrderStatusHistory(
          orderId,
          {
            pageNumber: historyPage,
            pageSize: HISTORY_PAGE_SIZE,
          },
          signal,
        );

        if (signal?.aborted) {
          return;
        }

        setStatusHistory({
          data: result.data ?? [],
          pagination: result.pagination,
          isLoading: false,
          errorMessage: null,
        });
      } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) {
          return;
        }

        setStatusHistory({
          data: [],
          pagination: emptyPagination(historyPage, HISTORY_PAGE_SIZE),
          isLoading: false,
          errorMessage: getTransactionsErrorMessage(
            error,
            "Không thể tải lịch sử trạng thái giao dịch.",
          ),
        });
      }
    },
    [historyPage],
  );

  const fetchRefunds = useCallback(
    async (signal?: AbortSignal) => {
      setRefunds((current) => ({
        ...current,
        isLoading: true,
        errorMessage: null,
      }));

      try {
        const result = await listManagementRefunds(
          {
            searchTerm: refundFilters.searchTerm,
            status:
              refundFilters.status === "ALL" ? undefined : refundFilters.status,
            pageNumber: refundPage,
            pageSize: REFUNDS_PAGE_SIZE,
          },
          signal,
        );

        if (signal?.aborted) {
          return;
        }

        setRefunds({
          data: result.data ?? [],
          pagination: result.pagination,
          isLoading: false,
          errorMessage: null,
        });
      } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) {
          return;
        }

        setRefunds({
          data: [],
          pagination: emptyPagination(refundPage, REFUNDS_PAGE_SIZE),
          isLoading: false,
          errorMessage: getTransactionsErrorMessage(
            error,
            "Không thể tải danh sách hoàn tiền.",
          ),
        });
      }
    },
    [refundFilters.searchTerm, refundFilters.status, refundPage],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void fetchOrders(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [fetchOrders]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void fetchRefunds(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [fetchRefunds]);

  useEffect(() => {
    if (!selectedOrderId || !isDetailOpen) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void fetchStatusHistory(selectedOrderId, controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [fetchStatusHistory, isDetailOpen, selectedOrderId]);

  const summary = useMemo<TransactionsSummary>(
    () => ({
      total: orders.pagination.totalCount,
      paidOnPage: orders.data.filter((order) => order.paymentStatus === "Paid")
        .length,
      refundRequiredOnPage: orders.data.filter(
        (order) => order.status === "RefundRequired",
      ).length,
      failedOrCancelledOnPage: orders.data.filter(
        (order) =>
          order.status === "Failed" ||
          order.status === "Cancelled" ||
          order.paymentStatus === "Failed" ||
          order.paymentStatus === "Cancelled",
      ).length,
    }),
    [orders.data, orders.pagination.totalCount],
  );

  const refundsSummary = useMemo<RefundsSummary>(
    () => ({
      total: refunds.pagination.totalCount,
      requestedOnPage: refunds.data.filter((refund) => refund.status === "Requested")
        .length,
      processedOnPage: refunds.data.filter((refund) => refund.status === "Processed")
        .length,
      failedOrRejectedOnPage: refunds.data.filter(
        (refund) => refund.status === "Failed" || refund.status === "Rejected",
      ).length,
    }),
    [refunds.data, refunds.pagination.totalCount],
  );

  const setSearchTerm = useCallback((value: string) => {
    setFilters((current) => ({ ...current, searchTerm: value }));
    setPage(1);
  }, []);

  const setStatusFilter = useCallback((value: OrderStatusFilter) => {
    setFilters((current) => ({ ...current, status: value }));
    setPage(1);
  }, []);

  const setPaymentStatusFilter = useCallback((value: PaymentStatusFilter) => {
    setFilters((current) => ({ ...current, paymentStatus: value }));
    setPage(1);
  }, []);

  const setRefundSearchTerm = useCallback((value: string) => {
    setRefundFilters((current) => ({ ...current, searchTerm: value }));
    setRefundPage(1);
  }, []);

  const setRefundStatusFilter = useCallback((value: RefundStatusFilter) => {
    setRefundFilters((current) => ({ ...current, status: value }));
    setRefundPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  }, []);

  const clearRefundFilters = useCallback(() => {
    setRefundFilters(INITIAL_REFUND_FILTERS);
    setRefundPage(1);
  }, []);

  const openOrderDetail = useCallback(
    async (orderId: string) => {
      setSelectedOrderId(orderId);
      setSelectedOrder(null);
      setHistoryPage(1);
      setStatusHistory({
        data: [],
        pagination: emptyPagination(1, HISTORY_PAGE_SIZE),
        isLoading: true,
        errorMessage: null,
      });
      setIsDetailOpen(true);
      setIsDetailLoading(true);
      setDetailErrorMessage(null);

      try {
        const order = await getManagementOrderById(orderId);
        setSelectedOrder(order);
      } catch (error) {
        setDetailErrorMessage(
          getTransactionsErrorMessage(
            error,
            "Không thể tải chi tiết giao dịch.",
          ),
        );
      } finally {
        setIsDetailLoading(false);
      }
    },
    [],
  );

  const openRefundDetail = useCallback(async (refundId: string) => {
    setSelectedRefund(null);
    setIsRefundDetailOpen(true);
    setIsRefundDetailLoading(true);
    setRefundDetailErrorMessage(null);

    try {
      const refund = await getManagementRefundById(refundId);
      setSelectedRefund(refund);
    } catch (error) {
      setRefundDetailErrorMessage(
        getTransactionsErrorMessage(
          error,
          "Không thể tải chi tiết hoàn tiền.",
        ),
      );
    } finally {
      setIsRefundDetailLoading(false);
    }
  }, []);

  const setDetailOpen = useCallback((open: boolean) => {
    setIsDetailOpen(open);
    if (!open) {
      setSelectedOrderId(null);
      setSelectedOrder(null);
      setDetailErrorMessage(null);
      setStatusHistory({
        data: [],
        pagination: emptyPagination(1, HISTORY_PAGE_SIZE),
        isLoading: false,
        errorMessage: null,
      });
    }
  }, []);

  const setRefundDetailOpen = useCallback((open: boolean) => {
    setIsRefundDetailOpen(open);
    if (!open) {
      setSelectedRefund(null);
      setRefundDetailErrorMessage(null);
    }
  }, []);

  const updateOrderInState = useCallback((updatedOrder: OrderResult) => {
    setOrders((current) => ({
      ...current,
      data: current.data.map((order) =>
        order.id === updatedOrder.id ? updatedOrder : order,
      ),
    }));
    setSelectedOrder((current) =>
      current?.id === updatedOrder.id ? updatedOrder : current,
    );
  }, []);

  const resetActionState = useCallback(() => {
    setOrderPendingAction(null);
    setActionReason("");
    setActionErrorMessage(null);
  }, []);

  const requestCancelOrder = useCallback((order: OrderResult) => {
    setOrderPendingAction(order);
    setActionReason("");
    setActionErrorMessage(null);
    setIsCancelOpen(true);
  }, []);

  const requestRefundRequired = useCallback((order: OrderResult) => {
    setOrderPendingAction(order);
    setActionReason("");
    setActionErrorMessage(null);
    setIsRefundRequiredOpen(true);
  }, []);

  const setCancelOpen = useCallback(
    (open: boolean) => {
      setIsCancelOpen(open);
      if (!open && !isActionSubmitting) {
        resetActionState();
      }
    },
    [isActionSubmitting, resetActionState],
  );

  const setRefundRequiredOpen = useCallback(
    (open: boolean) => {
      setIsRefundRequiredOpen(open);
      if (!open && !isActionSubmitting) {
        resetActionState();
      }
    },
    [isActionSubmitting, resetActionState],
  );

  const confirmCancelOrder = useCallback(async () => {
    if (!orderPendingAction) {
      return;
    }

    setIsActionSubmitting(true);
    setActionErrorMessage(null);

    try {
      const updatedOrder = await cancelManagementOrder(orderPendingAction.id, {
        reason: actionReason.trim() || null,
      });
      updateOrderInState(updatedOrder);
      setActionSuccessMessage(`Đã hủy giao dịch ${updatedOrder.orderNumber}.`);
      setIsCancelOpen(false);
      resetActionState();
      if (isDetailOpen) {
        await fetchStatusHistory(updatedOrder.id);
      }
    } catch (error) {
      setActionErrorMessage(
        getTransactionsErrorMessage(error, "Không thể hủy giao dịch."),
      );
    } finally {
      setIsActionSubmitting(false);
    }
  }, [
    actionReason,
    fetchStatusHistory,
    isDetailOpen,
    orderPendingAction,
    resetActionState,
    updateOrderInState,
  ]);

  const confirmRefundRequired = useCallback(async () => {
    if (!orderPendingAction) {
      return;
    }

    const reason = actionReason.trim();
    if (!reason) {
      setActionErrorMessage("Vui lòng nhập lý do cần hoàn tiền.");
      return;
    }

    setIsActionSubmitting(true);
    setActionErrorMessage(null);

    try {
      const updatedOrder = await markManagementOrderRefundRequired(
        orderPendingAction.id,
        { reason },
      );
      updateOrderInState(updatedOrder);
      setActionSuccessMessage(
        `Đã đánh dấu giao dịch ${updatedOrder.orderNumber} cần hoàn tiền.`,
      );
      setIsRefundRequiredOpen(false);
      resetActionState();
      if (isDetailOpen) {
        await fetchStatusHistory(updatedOrder.id);
      }
    } catch (error) {
      setActionErrorMessage(
        getTransactionsErrorMessage(
          error,
          "Không thể đánh dấu giao dịch cần hoàn tiền.",
        ),
      );
    } finally {
      setIsActionSubmitting(false);
    }
  }, [
    actionReason,
    fetchStatusHistory,
    isDetailOpen,
    orderPendingAction,
    resetActionState,
    updateOrderInState,
  ]);

  return {
    orders,
    refunds,
    statusHistory,
    filters,
    refundFilters,
    summary,
    refundsSummary,
    selectedOrder,
    selectedRefund,
    isDetailOpen,
    isDetailLoading,
    detailErrorMessage,
    isRefundDetailOpen,
    isRefundDetailLoading,
    refundDetailErrorMessage,
    orderPendingAction,
    actionReason,
    actionErrorMessage,
    actionSuccessMessage,
    isCancelOpen,
    isRefundRequiredOpen,
    isActionSubmitting,
    setSearchTerm,
    setStatusFilter,
    setPaymentStatusFilter,
    setRefundSearchTerm,
    setRefundStatusFilter,
    clearFilters,
    clearRefundFilters,
    previousPage: () => setPage((current) => Math.max(current - 1, 1)),
    nextPage: () => setPage((current) => current + 1),
    previousRefundPage: () =>
      setRefundPage((current) => Math.max(current - 1, 1)),
    nextRefundPage: () => setRefundPage((current) => current + 1),
    previousHistoryPage: () =>
      setHistoryPage((current) => Math.max(current - 1, 1)),
    nextHistoryPage: () => setHistoryPage((current) => current + 1),
    openOrderDetail,
    openRefundDetail,
    setDetailOpen,
    setRefundDetailOpen,
    requestCancelOrder,
    requestRefundRequired,
    setActionReason,
    setCancelOpen,
    setRefundRequiredOpen,
    confirmCancelOrder,
    confirmRefundRequired,
    clearActionSuccessMessage: () => setActionSuccessMessage(null),
    refresh: async () => {
      await Promise.all([fetchOrders(), fetchRefunds()]);
      if (selectedOrderId && isDetailOpen) {
        await fetchStatusHistory(selectedOrderId);
      }
    },
  };
}
