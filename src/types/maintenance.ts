import type { PagedResult, PaginationMeta } from "@/types/accounts";

export type MaintenanceTicketStatus =
  | "Open"
  | "Assigned"
  | "InProgress"
  | "Resolved"
  | "Closed"
  | "Cancelled";

export type MaintenancePriority = "Low" | "Medium" | "High" | "Critical";

export type MaintenanceStatusFilter = "ALL" | MaintenanceTicketStatus;

export type MaintenancePriorityFilter = "ALL" | MaintenancePriority;

export type MaintenanceEditorMode = "create" | "edit";

export type MaintenanceWorkflowAction =
  | "assign"
  | "start"
  | "resolve"
  | "close"
  | "cancel";

export interface CreateMaintenanceTicketRequest {
  organizationId: string;
  storeId: string;
  kioskId: string;
  deviceId?: string | null;
  orderId?: string | null;
  deviceEventId?: string | null;
  title: string;
  description?: string | null;
  issueCode?: string | null;
  priority: MaintenancePriority;
}

export interface UpdateMaintenanceTicketRequest {
  title: string;
  description?: string | null;
  priority: MaintenancePriority;
  deviceId?: string | null;
  orderId?: string | null;
  deviceEventId?: string | null;
}

export interface AssignMaintenanceTicketRequest {
  assignedToAccountId: string;
}

export interface ResolveMaintenanceTicketRequest {
  resolutionNotes: string;
}

export interface CancelMaintenanceTicketRequest {
  reason: string;
}

export interface MaintenanceWorkflowSubmission {
  accountId?: string;
  resolutionNotes?: string;
  reason?: string;
}

export interface MaintenanceTicketResult {
  id: string;
  ticketNumber: string;
  organizationId: string;
  storeId: string;
  kioskId: string;
  deviceId?: string | null;
  orderId?: string | null;
  deviceEventId?: string | null;
  issueCode: string;
  title: string;
  description?: string | null;
  priority: MaintenancePriority;
  status: MaintenanceTicketStatus;
  assignedToAccountId?: string | null;
  createdByAccountId?: string | null;
  reportedAt: string;
  dueAt?: string | null;
  assignedAt?: string | null;
  startedAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  cancelledAt?: string | null;
  resolutionNotes?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface MaintenanceFilters {
  searchTerm: string;
  status: MaintenanceStatusFilter;
  priority: MaintenancePriorityFilter;
}

export interface ManagementMaintenanceTicketsQuery {
  status?: MaintenanceTicketStatus;
  priority?: MaintenancePriority;
  organizationId?: string;
  storeId?: string;
  kioskId?: string;
  assignedToAccountId?: string;
  createdByAccountId?: string;
  fromDate?: string;
  toDate?: string;
  pageNumber: number;
  pageSize: number;
}

export interface MaintenanceSummary {
  total: number;
  openOnPage: number;
  inProgressOnPage: number;
  criticalOnPage: number;
}

export type MaintenancePaginationMeta = PaginationMeta;

export type MaintenancePagedResult<T> = PagedResult<T>;
