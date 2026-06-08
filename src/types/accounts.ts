import type { ApiResult } from "@/types";

export type ManagementAccountStatus =
  | "Active"
  | "PendingVerification"
  | "Suspended"
  | "Disabled"
  | "Invited";

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
  invitation?: InternalAccountInvitationResult | null;
  roles: InternalAccountRoleResult[];
}

export interface InternalAccountInvitationResult {
  invitationToken: string;
  invitationUrl?: string | null;
  expiresAt: string;
  emailSent: boolean;
}

export interface AccountInvitationResult extends InternalAccountInvitationResult {
  accountId: string;
}

export interface AcceptInvitationResult {
  accepted: boolean;
  localLoginEnabled: boolean;
  googleLoginEnabled: boolean;
}

export interface AccountRoleScopeRequest {
  roleCode: string;
  organizationId?: string | null;
  storeId?: string | null;
  kioskId?: string | null;
}

export interface CreateInternalAccountRequest {
  userName: string;
  email: string;
  fullName?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  gender?: string;
  localLoginEnabled: boolean;
  initialPassword?: string | null;
  googleLoginEnabled: boolean;
  googleEmail?: string | null;
  createInvitation: boolean;
  sendInvitationEmail: boolean;
  roles: AccountRoleScopeRequest[];
}

export interface CreateAccountInvitationRequest {
  sendEmail: boolean;
}

export interface AcceptInvitationRequest {
  token: string;
  newPassword: string;
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
