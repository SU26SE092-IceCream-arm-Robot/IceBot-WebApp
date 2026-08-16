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
  | "Approved"
  | "Rejected"
  | "ProvisioningFailed"
  | "Provisioned"
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
  status: ServiceRegistrationStatus;
  revision: number;
  submittedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ManagementServiceRegistrationDetail extends ManagementServiceRegistrationItem {
  message?: string | null;
  privacyPolicyAccepted: boolean;
  privacyPolicyRevisionId: string;
  rejectionReason?: string | null;
  provisioningStatus?: string | null;
  provisioningError?: string | null;
  provisionedOrganizationId?: string | null;
  provisionedAdminUserId?: string | null;
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
