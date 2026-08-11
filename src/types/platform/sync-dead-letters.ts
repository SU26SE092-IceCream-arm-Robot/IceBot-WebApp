import type { PagedResult } from "@/types/identity/accounts";

export interface SyncDeadLetterRetryAttemptResult {
  attemptNumber: number;
  requestedByAccountId: string;
  requestedAt: string;
  reason: string;
  succeeded?: boolean | null;
  completedAt?: string | null;
  resultMessage?: string | null;
}

export interface SyncDeadLetterResult {
  id: string;
  eventId?: string | null;
  kioskId?: string | null;
  kioskCode?: string | null;
  eventType: string;
  aggregateType?: string | null;
  aggregateId?: string | null;
  status: string;
  processingAttempts: number;
  errorMessage: string;
  failedAt: string;
  resolvedAt?: string | null;
  resolutionNotes?: string | null;
  retryAttempts: SyncDeadLetterRetryAttemptResult[];
}

export interface SyncDeadLettersQuery {
  status?: string;
  eventType?: string;
  pageNumber: number;
  pageSize: number;
}

export type SyncDeadLettersPagedResult = PagedResult<SyncDeadLetterResult>;
