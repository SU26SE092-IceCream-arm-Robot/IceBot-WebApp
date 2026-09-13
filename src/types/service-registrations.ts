import type { ApiResult } from "@/types";
import type { PaginationMeta } from "@/types/identity/accounts";

export interface CreateServiceRegistrationRequest {
  contactName: string;
  email: string;
  phoneNumber?: string | null;
  businessName: string;
  legalName?: string | null;
  taxCode?: string | null;
  address?: string | null;
  expectedLocationCount?: number | null;
  message?: string | null;
  privacyPolicyAccepted: boolean;
  privacyPolicyRevisionId: string;
}

export interface ServiceRegistrationResult {
  id: string;
  referenceCode: string;
  status: string;
  submittedAt: string;
}

export type ServiceRegistrationStatus =
  | "Submitted"
  | "UnderReview"
  | "Rejected"
  | "Provisioning"
  | "ProvisioningFailed"
  | "Provisioned"
  | "Cancelled"
  | (string & {});

export interface ManagementServiceRegistrationItem {
  id: string;
  referenceCode: string;
  contactName: string;
  email: string;
  phoneNumber?: string | null;
  businessName: string;
  legalName?: string | null;
  taxCode?: string | null;
  address?: string | null;
  expectedLocationCount?: number | null;
  message?: string | null;
  privacyPolicyRevisionId: string;
  status: ServiceRegistrationStatus;
  reviewReason?: string | null;
  reviewedByAccountId?: string | null;
  reviewedAt?: string | null;
  provisionedOrganizationId?: string | null;
  provisionedOrgAdminAccountId?: string | null;
  provisionedInvitationId?: string | null;
  provisioningFailureCode?: string | null;
  provisioningFailureMessage?: string | null;
  revision: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ManagementServiceRegistrationDetail extends ManagementServiceRegistrationItem {
  /** Legacy/forward-compatible field. Current API proves consent via a required policy revision. */
  privacyPolicyAccepted?: boolean;
}

export interface ManagementServiceRegistrationsQuery {
  status?: string;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface ApproveServiceRegistrationRequest {
  organizationCode: string;
  organizationName: string;
  adminUserName: string;
  adminEmail: string;
  localLoginEnabled: boolean;
  googleLoginEnabled: boolean;
  expectedRevision: number;
}

export interface RejectServiceRegistrationRequest {
  reason: string;
  expectedRevision?: number;
}

export interface StartReviewServiceRegistrationRequest {
  expectedRevision?: number;
}

export interface RetryProvisioningServiceRegistrationRequest {
  expectedRevision?: number;
}

export interface ServiceRegistrationsPagedResult extends ApiResult<ManagementServiceRegistrationItem[]> {
  pagination: PaginationMeta;
}
