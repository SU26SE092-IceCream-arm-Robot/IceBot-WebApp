export type StaffWorkforceStatus =
  | "Invited"
  | "PendingVerification"
  | "Active"
  | "Suspended"
  | "Disabled";

export interface StaffWorkforceScopeRequest {
  storeId?: string | null;
  kioskId?: string | null;
}

export interface StaffWorkforceScopeResult extends StaffWorkforceScopeRequest {
  storeCode?: string | null;
  kioskCode?: string | null;
}

export interface StaffWorkforceInvitationResult {
  expiresAt: string;
  emailSentAt?: string | null;
}

export interface StaffWorkforceResult {
  accountId: string;
  userName: string;
  email: string;
  fullName?: string | null;
  phoneNumber?: string | null;
  status: StaffWorkforceStatus;
  localLoginEnabled: boolean;
  googleLoginEnabled: boolean;
  staffScopes: StaffWorkforceScopeResult[];
  createdAt: string;
  updatedAt?: string | null;
  revision: number;
  invitation?: StaffWorkforceInvitationResult | null;
}

export interface StaffWorkforcePage {
  succeeded: boolean;
  statusCode: number;
  message?: string;
  data?: StaffWorkforceResult[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
}

export interface CreateStaffWorkforceRequest {
  userName: string;
  email: string;
  fullName?: string | null;
  phoneNumber?: string | null;
  localLoginEnabled: boolean;
  googleLoginEnabled: boolean;
  googleEmail?: string | null;
  sendInvitationEmail: boolean;
  staffScopes: StaffWorkforceScopeRequest[];
}

export interface UpdateStaffWorkforceRequest {
  fullName?: string | null;
  phoneNumber?: string | null;
  expectedRevision: number;
}

export interface UpdateStaffWorkforceScopesRequest {
  staffScopes: StaffWorkforceScopeRequest[];
  expectedRevision: number;
}

export interface StaffLifecycleRequest {
  idempotencyKey: string;
  reason: string;
  expectedRevision: number;
}

export type StaffWorkforceStatusFilter = "ALL" | StaffWorkforceStatus;
