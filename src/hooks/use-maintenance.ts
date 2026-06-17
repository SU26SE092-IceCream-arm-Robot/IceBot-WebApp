"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getMaintenanceErrorMessage,
  getManagementMaintenanceTicketById,
  listManagementMaintenanceTickets,
} from "@/lib/services/maintenance";
import type {
  MaintenanceFilters,
  MaintenancePaginationMeta,
  MaintenancePriorityFilter,
  MaintenanceSummary,
  MaintenanceTicketResult,
  MaintenanceStatusFilter,
} from "@/types/maintenance";

const MAINTENANCE_PAGE_SIZE = 10;

const INITIAL_FILTERS: MaintenanceFilters = {
  searchTerm: "",
  status: "ALL",
  priority: "ALL",
};

function emptyPagination(page: number): MaintenancePaginationMeta {
  return {
    page,
    pageSize: MAINTENANCE_PAGE_SIZE,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: page > 1,
  };
}

interface MaintenanceCollectionState {
  data: MaintenanceTicketResult[];
  pagination: MaintenancePaginationMeta;
  isLoading: boolean;
  errorMessage: string | null;
}

export interface UseMaintenanceResult {
  tickets: MaintenanceCollectionState;
  visibleTickets: MaintenanceTicketResult[];
  filters: MaintenanceFilters;
  summary: MaintenanceSummary;
  selectedTicket: MaintenanceTicketResult | null;
  isDetailOpen: boolean;
  isDetailLoading: boolean;
  detailErrorMessage: string | null;
  setSearchTerm: (value: string) => void;
  setStatusFilter: (value: MaintenanceStatusFilter) => void;
  setPriorityFilter: (value: MaintenancePriorityFilter) => void;
  clearFilters: () => void;
  previousPage: () => void;
  nextPage: () => void;
  openTicketDetail: (ticketId: string) => Promise<void>;
  setDetailOpen: (open: boolean) => void;
  refresh: () => Promise<void>;
}

function matchesSearch(ticket: MaintenanceTicketResult, searchTerm: string): boolean {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  const searchableValues = [
    ticket.ticketNumber,
    ticket.title,
    ticket.description,
    ticket.issueCode,
    ticket.kioskId,
    ticket.storeId,
    ticket.organizationId,
    ticket.assignedToAccountId,
  ];

  return searchableValues.some((value) =>
    value?.toLowerCase().includes(normalizedSearch),
  );
}

export function useMaintenance(): UseMaintenanceResult {
  const [filters, setFilters] = useState<MaintenanceFilters>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] =
    useState<MaintenanceTicketResult | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailErrorMessage, setDetailErrorMessage] = useState<string | null>(
    null,
  );
  const [tickets, setTickets] = useState<MaintenanceCollectionState>({
    data: [],
    pagination: emptyPagination(1),
    isLoading: true,
    errorMessage: null,
  });

  const fetchTickets = useCallback(
    async (signal?: AbortSignal) => {
      setTickets((current) => ({
        ...current,
        isLoading: true,
        errorMessage: null,
      }));

      try {
        const result = await listManagementMaintenanceTickets(
          {
            status: filters.status === "ALL" ? undefined : filters.status,
            priority:
              filters.priority === "ALL" ? undefined : filters.priority,
            pageNumber: page,
            pageSize: MAINTENANCE_PAGE_SIZE,
          },
          signal,
        );

        if (signal?.aborted) {
          return;
        }

        setTickets({
          data: result.data ?? [],
          pagination: result.pagination,
          isLoading: false,
          errorMessage: null,
        });
      } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) {
          return;
        }

        setTickets({
          data: [],
          pagination: emptyPagination(page),
          isLoading: false,
          errorMessage: getMaintenanceErrorMessage(
            error,
            "Không thể tải danh sách yêu cầu bảo trì.",
          ),
        });
      }
    },
    [filters.priority, filters.status, page],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void fetchTickets(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [fetchTickets]);

  const visibleTickets = useMemo(
    () => tickets.data.filter((ticket) => matchesSearch(ticket, filters.searchTerm)),
    [filters.searchTerm, tickets.data],
  );

  const summary = useMemo<MaintenanceSummary>(
    () => ({
      total: tickets.pagination.totalCount,
      openOnPage: tickets.data.filter((ticket) => ticket.status === "Open")
        .length,
      inProgressOnPage: tickets.data.filter(
        (ticket) => ticket.status === "InProgress",
      ).length,
      criticalOnPage: tickets.data.filter(
        (ticket) => ticket.priority === "Critical",
      ).length,
    }),
    [tickets.data, tickets.pagination.totalCount],
  );

  const setSearchTerm = useCallback((value: string) => {
    setFilters((current) => ({ ...current, searchTerm: value }));
  }, []);

  const setStatusFilter = useCallback((value: MaintenanceStatusFilter) => {
    setFilters((current) => ({ ...current, status: value }));
    setPage(1);
  }, []);

  const setPriorityFilter = useCallback((value: MaintenancePriorityFilter) => {
    setFilters((current) => ({ ...current, priority: value }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  }, []);

  const openTicketDetail = useCallback(async (ticketId: string) => {
    setSelectedTicket(null);
    setIsDetailOpen(true);
    setIsDetailLoading(true);
    setDetailErrorMessage(null);

    try {
      const ticket = await getManagementMaintenanceTicketById(ticketId);
      setSelectedTicket(ticket);
    } catch (error) {
      setDetailErrorMessage(
        getMaintenanceErrorMessage(
          error,
          "Không thể tải chi tiết yêu cầu bảo trì.",
        ),
      );
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  const setDetailOpen = useCallback((open: boolean) => {
    setIsDetailOpen(open);
    if (!open) {
      setSelectedTicket(null);
      setDetailErrorMessage(null);
    }
  }, []);

  return {
    tickets,
    visibleTickets,
    filters,
    summary,
    selectedTicket,
    isDetailOpen,
    isDetailLoading,
    detailErrorMessage,
    setSearchTerm,
    setStatusFilter,
    setPriorityFilter,
    clearFilters,
    previousPage: () => setPage((current) => Math.max(current - 1, 1)),
    nextPage: () => setPage((current) => current + 1),
    openTicketDetail,
    setDetailOpen,
    refresh: async () => {
      await fetchTickets();
    },
  };
}
