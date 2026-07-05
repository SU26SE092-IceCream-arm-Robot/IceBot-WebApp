import type { PagedResult } from "@/types/accounts";

export type AlertSeverity = "Debug" | "Info" | "Warning" | "Error" | "Critical";

export type AlertStatus = "Open" | "Acknowledged" | "Resolved" | "Suppressed";

export interface AlertResult {
  id: string;
  organizationId?: string | null;
  storeId?: string | null;
  kioskId?: string | null;
  deviceId?: string | null;
  alertCode: string;
  severity: AlertSeverity;
  title: string;
  message?: string | null;
  status: AlertStatus;
  sourceType?: string | null;
  sourceId?: string | null;
  raisedAt: string;
  lastOccurredAt: string;
  occurrenceCount: number;
  acknowledgedByAccountId?: string | null;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  resolutionNotes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface AlertsListQuery {
  status?: AlertStatus | "ALL";
  severity?: AlertSeverity | "ALL";
  organizationId?: string;
  storeId?: string;
  kioskId?: string;
  from?: string;
  to?: string;
  pageNumber: number;
  pageSize: number;
}

export interface ResolveAlertRequest {
  resolutionNotes: string;
}

export type AlertsPagedResult = PagedResult<AlertResult>;
