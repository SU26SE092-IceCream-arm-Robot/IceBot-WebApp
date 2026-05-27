import type { ApiResult } from "@/types";

export type ManagementAccountStatus =
  | "Active"
  | "PendingVerification"
  | "Suspended"
  | "Disabled";

export type ManagementAccountStatusFilter = "ALL" | ManagementAccountStatus;

export interface InternalAccountRoleResult {
  roleCode: string;
  organizationId?: string | null;
  storeId?: string | null;
  kioskId?: string | null;
}

export interface InternalAccountResult {
  id: string;
  userName: string;
  email: string;
  fullName?: string | null;
  status: ManagementAccountStatus;
  localLoginEnabled: boolean;
  googleLoginEnabled: boolean;
  roles: InternalAccountRoleResult[];
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PagedResult<T> extends ApiResult<T[]> {
  pagination: PaginationMeta;
}

export interface ManagementAccountsQuery {
  searchTerm: string;
  status: ManagementAccountStatusFilter;
  pageNumber: number;
  pageSize: number;
}
