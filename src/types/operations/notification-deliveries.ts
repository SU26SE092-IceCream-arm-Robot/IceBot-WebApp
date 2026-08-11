import type { PagedResult } from "@/types/identity/accounts";

export type NotificationDeliveryStatus =
  | "Pending"
  | "Processing"
  | "Failed"
  | "PermanentFailure"
  | "Delivered";

export interface NotificationDeliveryResult {
  id: string;
  organizationId: string;
  storeId?: string | null;
  kioskId?: string | null;
  subjectId?: string | null;
  notificationType: string;
  recipientAccountId: string;
  status: NotificationDeliveryStatus;
  attemptCount: number;
  maxAttempts: number;
  nextAttemptAt: string;
  lastAttemptAt?: string | null;
  deliveredAt?: string | null;
  lastErrorCode?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export type NotificationDeliveriesPage = PagedResult<NotificationDeliveryResult>;
