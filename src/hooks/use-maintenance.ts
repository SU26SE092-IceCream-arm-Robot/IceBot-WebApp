"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getAccountsErrorMessage, listManagementAccounts } from "@/lib/services/accounts";
import {
  getKioskManagementErrorMessage,
  getManagementKiosks,
} from "@/lib/services/kiosk-management";
import {
  assignManagementMaintenanceTicket,
  cancelManagementMaintenanceTicket,
  closeManagementMaintenanceTicket,
  createManagementMaintenanceTicket,
  getMaintenanceErrorMessage,
  getManagementMaintenanceTicketById,
  listManagementMaintenanceTickets,
  resolveManagementMaintenanceTicket,
  startManagementMaintenanceTicket,
  updateManagementMaintenanceTicket,
} from "@/lib/services/maintenance";
import type { InternalAccountResult } from "@/types/accounts";
import type { KioskResult } from "@/types/kiosk-management";
import type {
  CreateMaintenanceTicketRequest,
  MaintenanceEditorMode,
  MaintenanceFilters,
  MaintenancePaginationMeta,
  MaintenancePriorityFilter,
  MaintenanceStatusFilter,
  MaintenanceSummary,
  MaintenanceTicketResult,
  MaintenanceWorkflowAction,
  MaintenanceWorkflowSubmission,
  UpdateMaintenanceTicketRequest,
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
  kiosks: KioskResult[];
  technicians: InternalAccountResult[];
  lookupWarning: string | null;
  selectedTicket: MaintenanceTicketResult | null;
  isDetailOpen: boolean;
  isDetailLoading: boolean;
  detailErrorMessage: string | null;
  editorMode: MaintenanceEditorMode | null;
  editorTicket: MaintenanceTicketResult | null;
  isEditorOpen: boolean;
  workflowAction: MaintenanceWorkflowAction | null;
  workflowTicket: MaintenanceTicketResult | null;
  isWorkflowOpen: boolean;
  isMutationSubmitting: boolean;
  mutationErrorMessage: string | null;
  successMessage: string | null;
  setSearchTerm: (value: string) => void;
  setStatusFilter: (value: MaintenanceStatusFilter) => void;
  setPriorityFilter: (value: MaintenancePriorityFilter) => void;
  clearFilters: () => void;
  previousPage: () => void;
  nextPage: () => void;
  openTicketDetail: (ticketId: string) => Promise<void>;
  setDetailOpen: (open: boolean) => void;
  openCreateEditor: () => void;
  openEditEditor: (ticket: MaintenanceTicketResult) => void;
  setEditorOpen: (open: boolean) => void;
  submitCreate: (request: CreateMaintenanceTicketRequest) => Promise<boolean>;
  submitUpdate: (request: UpdateMaintenanceTicketRequest) => Promise<boolean>;
  requestWorkflow: (
    ticket: MaintenanceTicketResult,
    action: MaintenanceWorkflowAction,
  ) => void;
  setWorkflowOpen: (open: boolean) => void;
  submitWorkflow: (
    submission: MaintenanceWorkflowSubmission,
  ) => Promise<boolean>;
  clearSuccessMessage: () => void;
  refresh: () => Promise<void>;
}

function matchesSearch(
  ticket: MaintenanceTicketResult,
  searchTerm: string,
): boolean {
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
  const mutationInFlightRef = useRef(false);
  const selectedTicketIdRef = useRef<string | null>(null);
  const [filters, setFilters] = useState<MaintenanceFilters>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] =
    useState<MaintenanceTicketResult | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailErrorMessage, setDetailErrorMessage] = useState<string | null>(null);
  const [kiosks, setKiosks] = useState<KioskResult[]>([]);
  const [technicians, setTechnicians] = useState<InternalAccountResult[]>([]);
  const [lookupWarning, setLookupWarning] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<MaintenanceEditorMode | null>(null);
  const [editorTicket, setEditorTicket] =
    useState<MaintenanceTicketResult | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [workflowAction, setWorkflowAction] =
    useState<MaintenanceWorkflowAction | null>(null);
  const [workflowTicket, setWorkflowTicket] =
    useState<MaintenanceTicketResult | null>(null);
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [isMutationSubmitting, setIsMutationSubmitting] = useState(false);
  const [mutationErrorMessage, setMutationErrorMessage] = useState<string | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
            priority: filters.priority === "ALL" ? undefined : filters.priority,
            pageNumber: page,
            pageSize: MAINTENANCE_PAGE_SIZE,
          },
          signal,
        );

        if (!signal?.aborted) {
          setTickets({
            data: result.data ?? [],
            pagination: result.pagination,
            isLoading: false,
            errorMessage: null,
          });
        }
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

  const loadLookups = useCallback(async (signal?: AbortSignal) => {
    setLookupWarning(null);
    const [kioskResult, accountResult] = await Promise.allSettled([
      getManagementKiosks({}, signal),
      listManagementAccounts(
        { searchTerm: "", status: "Active", pageNumber: 1, pageSize: 100 },
        signal,
      ),
    ]);

    if (signal?.aborted) {
      return;
    }

    const warnings: string[] = [];
    if (kioskResult.status === "fulfilled") {
      setKiosks(kioskResult.value);
    } else {
      setKiosks([]);
      warnings.push(
        getKioskManagementErrorMessage(
          kioskResult.reason,
          "Không thể tải danh sách kiosk cho form bảo trì.",
        ),
      );
    }

    if (accountResult.status === "fulfilled") {
      setTechnicians(
        (accountResult.value.data ?? []).filter((account) =>
          account.roles.some((role) => role.roleCode === "Technician"),
        ),
      );
    } else {
      setTechnicians([]);
      warnings.push(
        getAccountsErrorMessage(
          accountResult.reason,
          "Không thể tải danh sách kỹ thuật viên; vẫn có thể nhập Account ID.",
        ),
      );
    }

    setLookupWarning(warnings.length > 0 ? warnings.join(" ") : null);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => void fetchTickets(controller.signal), 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [fetchTickets]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => void loadLookups(controller.signal), 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadLookups]);

  const visibleTickets = useMemo(
    () => tickets.data.filter((ticket) => matchesSearch(ticket, filters.searchTerm)),
    [filters.searchTerm, tickets.data],
  );

  const summary = useMemo<MaintenanceSummary>(
    () => ({
      total: tickets.pagination.totalCount,
      openOnPage: tickets.data.filter((ticket) => ticket.status === "Open").length,
      inProgressOnPage: tickets.data.filter(
        (ticket) => ticket.status === "InProgress",
      ).length,
      criticalOnPage: tickets.data.filter(
        (ticket) => ticket.priority === "Critical",
      ).length,
    }),
    [tickets.data, tickets.pagination.totalCount],
  );

  const openTicketDetail = useCallback(async (ticketId: string) => {
    selectedTicketIdRef.current = ticketId;
    setSelectedTicket(null);
    setIsDetailOpen(true);
    setIsDetailLoading(true);
    setDetailErrorMessage(null);

    try {
      const detail = await getManagementMaintenanceTicketById(ticketId);
      if (selectedTicketIdRef.current === ticketId) {
        setSelectedTicket(detail);
      }
    } catch (error) {
      if (selectedTicketIdRef.current === ticketId) {
        setDetailErrorMessage(
          getMaintenanceErrorMessage(
            error,
            "Không thể tải chi tiết yêu cầu bảo trì.",
          ),
        );
      }
    } finally {
      if (selectedTicketIdRef.current === ticketId) {
        setIsDetailLoading(false);
      }
    }
  }, []);

  const refreshDetailIfSelected = useCallback(async (ticketId: string) => {
    if (selectedTicketIdRef.current !== ticketId) {
      return;
    }

    try {
      const detail = await getManagementMaintenanceTicketById(ticketId);
      if (selectedTicketIdRef.current === ticketId) {
        setSelectedTicket(detail);
      }
      setDetailErrorMessage(null);
    } catch (error) {
      if (selectedTicketIdRef.current === ticketId) {
        setDetailErrorMessage(
          getMaintenanceErrorMessage(
            error,
            "Đã cập nhật ticket nhưng chưa thể tải lại chi tiết.",
          ),
        );
      }
    }
  }, []);

  const completeMutation = useCallback(
    async (ticketId: string | null, message: string) => {
      await fetchTickets();
      if (ticketId) {
        await refreshDetailIfSelected(ticketId);
      }
      setMutationErrorMessage(null);
      setSuccessMessage(message);
    },
    [fetchTickets, refreshDetailIfSelected],
  );

  const runMutation = useCallback(
    async (
      mutation: () => Promise<MaintenanceTicketResult>,
      success: (ticket: MaintenanceTicketResult) => string,
    ) => {
      if (mutationInFlightRef.current) {
        return false;
      }

      mutationInFlightRef.current = true;
      setIsMutationSubmitting(true);
      setMutationErrorMessage(null);

      try {
        const result = await mutation();
        setSelectedTicket((current) => (current?.id === result.id ? result : current));
        await completeMutation(result.id, success(result));
        return true;
      } catch (error) {
        setMutationErrorMessage(
          getMaintenanceErrorMessage(
            error,
            "Không thể cập nhật yêu cầu bảo trì. Vui lòng thử lại.",
          ),
        );
        return false;
      } finally {
        mutationInFlightRef.current = false;
        setIsMutationSubmitting(false);
      }
    },
    [completeMutation],
  );

  const submitCreate = useCallback(
    async (request: CreateMaintenanceTicketRequest) => {
      const succeeded = await runMutation(
        () => createManagementMaintenanceTicket(request),
        (ticket) => `Đã tạo yêu cầu ${ticket.ticketNumber}.`,
      );
      if (succeeded) {
        setIsEditorOpen(false);
        setEditorMode(null);
        setEditorTicket(null);
      }
      return succeeded;
    },
    [runMutation],
  );

  const submitUpdate = useCallback(
    async (request: UpdateMaintenanceTicketRequest) => {
      if (!editorTicket) {
        return false;
      }
      const succeeded = await runMutation(
        () => updateManagementMaintenanceTicket(editorTicket.id, request),
        (ticket) => `Đã cập nhật ${ticket.ticketNumber}.`,
      );
      if (succeeded) {
        setIsEditorOpen(false);
        setEditorMode(null);
        setEditorTicket(null);
      }
      return succeeded;
    },
    [editorTicket, runMutation],
  );

  const submitWorkflow = useCallback(
    async (submission: MaintenanceWorkflowSubmission) => {
      if (!workflowTicket || !workflowAction) {
        return false;
      }

      const ticketId = workflowTicket.id;
      const mutation = () => {
        switch (workflowAction) {
          case "assign":
            return assignManagementMaintenanceTicket(ticketId, {
              assignedToAccountId: submission.accountId ?? "",
            });
          case "start":
            return startManagementMaintenanceTicket(ticketId);
          case "resolve":
            return resolveManagementMaintenanceTicket(ticketId, {
              resolutionNotes: submission.resolutionNotes ?? "",
            });
          case "close":
            return closeManagementMaintenanceTicket(ticketId);
          case "cancel":
            return cancelManagementMaintenanceTicket(ticketId, {
              reason: submission.reason ?? "",
            });
        }
      };

      const actionLabel: Record<MaintenanceWorkflowAction, string> = {
        assign: "phân công",
        start: "bắt đầu xử lý",
        resolve: "đánh dấu đã xử lý",
        close: "đóng",
        cancel: "hủy",
      };
      const succeeded = await runMutation(
        mutation,
        (ticket) => `Đã ${actionLabel[workflowAction]} ${ticket.ticketNumber}.`,
      );
      if (succeeded) {
        setIsWorkflowOpen(false);
        setWorkflowAction(null);
        setWorkflowTicket(null);
      }
      return succeeded;
    },
    [runMutation, workflowAction, workflowTicket],
  );

  const closeMutationDialog = useCallback(
    (open: boolean, type: "editor" | "workflow") => {
      if (mutationInFlightRef.current) {
        return;
      }
      setMutationErrorMessage(null);
      if (type === "editor") {
        setIsEditorOpen(open);
        if (!open) {
          setEditorMode(null);
          setEditorTicket(null);
        }
      } else {
        setIsWorkflowOpen(open);
        if (!open) {
          setWorkflowAction(null);
          setWorkflowTicket(null);
        }
      }
    },
    [],
  );

  return {
    tickets,
    visibleTickets,
    filters,
    summary,
    kiosks,
    technicians,
    lookupWarning,
    selectedTicket,
    isDetailOpen,
    isDetailLoading,
    detailErrorMessage,
    editorMode,
    editorTicket,
    isEditorOpen,
    workflowAction,
    workflowTicket,
    isWorkflowOpen,
    isMutationSubmitting,
    mutationErrorMessage,
    successMessage,
    setSearchTerm: (value) =>
      setFilters((current) => ({ ...current, searchTerm: value })),
    setStatusFilter: (value) => {
      setFilters((current) => ({ ...current, status: value }));
      setPage(1);
    },
    setPriorityFilter: (value) => {
      setFilters((current) => ({ ...current, priority: value }));
      setPage(1);
    },
    clearFilters: () => {
      setFilters(INITIAL_FILTERS);
      setPage(1);
    },
    previousPage: () => setPage((current) => Math.max(current - 1, 1)),
    nextPage: () => setPage((current) => current + 1),
    openTicketDetail,
    setDetailOpen: (open) => {
      setIsDetailOpen(open);
      if (!open) {
        selectedTicketIdRef.current = null;
        setSelectedTicket(null);
        setIsDetailLoading(false);
        setDetailErrorMessage(null);
      }
    },
    openCreateEditor: () => {
      setEditorMode("create");
      setEditorTicket(null);
      setMutationErrorMessage(null);
      setIsEditorOpen(true);
    },
    openEditEditor: (ticket) => {
      setEditorMode("edit");
      setEditorTicket(ticket);
      setMutationErrorMessage(null);
      setIsEditorOpen(true);
    },
    setEditorOpen: (open) => closeMutationDialog(open, "editor"),
    submitCreate,
    submitUpdate,
    requestWorkflow: (ticket, action) => {
      setWorkflowTicket(ticket);
      setWorkflowAction(action);
      setMutationErrorMessage(null);
      setIsWorkflowOpen(true);
    },
    setWorkflowOpen: (open) => closeMutationDialog(open, "workflow"),
    submitWorkflow,
    clearSuccessMessage: () => setSuccessMessage(null),
    refresh: async () => {
      await Promise.all([fetchTickets(), loadLookups()]);
      if (selectedTicket) {
        await refreshDetailIfSelected(selectedTicket.id);
      }
    },
  };
}
