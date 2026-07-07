import type { PagedResult } from "@/types/accounts";

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
  metadataJson?: string | null;
  createdAt: string;
  updatedAt?: string | null;
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
