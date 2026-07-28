import type { PagedResult } from "@/types/accounts";

export type OperationLogSeverity =
  | "Debug"
  | "Info"
  | "Warning"
  | "Error"
  | "Critical";

export interface OperationLogResult {
  id: string;
  kioskId: string;
  deviceId?: string | null;
  orderId?: string | null;
  action: string;
  category: string;
  severity: OperationLogSeverity;
  message?: string | null;
  occurredAt: string;
}

export interface OperationLogsQuery {
  deviceId?: string;
  orderId?: string;
  severity?: OperationLogSeverity;
  from?: string;
  to?: string;
  pageNumber: number;
  pageSize: number;
}

export type OperationLogsPagedResult = PagedResult<OperationLogResult>;
