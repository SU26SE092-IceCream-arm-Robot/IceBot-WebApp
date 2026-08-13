import type { PagedResult } from "@/types/identity/accounts";

export type TenantEntityStatus =
  | "Active"
  | "Inactive"
  | "Suspended"
  | "Disabled"
  | "Archived";

export type TenantStatusFilter = "ALL" | TenantEntityStatus;

export type StoreDayOfWeek =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export interface StoreOpeningHoursDay {
  dayOfWeek: StoreDayOfWeek;
  isClosed: boolean;
  opensAt?: string | null;
  closesAt?: string | null;
}

export interface OrganizationResult {
  id: string;
  code: string;
  name: string;
  legalName?: string | null;
  taxCode?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  status: TenantEntityStatus;
  statusRevision: number;
  suspensionReasonCode?: string | null;
  suspensionReason?: string | null;
  suspendedAt?: string | null;
  deactivatedAt?: string | null;
  reactivatedAt?: string | null;
  metadataJson?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export type OrganizationLifecycleAction =
  | "suspend"
  | "resume"
  | "deactivate"
  | "reactivate";

export interface OrganizationLifecycleTransitionRequest {
  reasonCode?: string | null;
  reason: string;
  expectedRevision: number;
  idempotencyKey?: string | null;
  readinessConfirmed: boolean;
}

export interface OrganizationStatusTransitionResult {
  id: string;
  fromStatus: TenantEntityStatus;
  toStatus: TenantEntityStatus;
  reasonCode?: string | null;
  reason: string;
  changedByAccountId: string;
  changedAt: string;
  organizationStatusRevision: number;
  readinessConfirmed?: boolean | null;
}

export interface OrganizationsQuery {
  search?: string;
  status?: TenantEntityStatus;
  pageNumber: number;
  pageSize: number;
}

export interface CreateOrganizationRequest {
  code: string;
  name: string;
  legalName?: string | null;
  taxCode?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  metadataJson?: string | null;
}

export interface UpdateOrganizationRequest {
  name?: string | null;
  legalName?: string | null;
  taxCode?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  metadataJson?: string | null;
}

export interface CreateStoreRequest {
  code: string;
  name: string;
  storeType: string;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  timeZone: string;
  latitude?: number | null;
  longitude?: number | null;
  phoneNumber?: string | null;
  email?: string | null;
  openingHours: StoreOpeningHoursDay[];
}

export type UpdateStoreRequest = Omit<CreateStoreRequest, "code">;

export type OrganizationPagedResult = PagedResult<OrganizationResult>;
