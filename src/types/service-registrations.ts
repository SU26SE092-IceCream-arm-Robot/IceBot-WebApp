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
