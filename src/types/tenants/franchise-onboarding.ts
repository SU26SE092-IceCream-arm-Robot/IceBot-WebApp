import type { PagedResult } from "@/types/identity/accounts";
import type { CreateKioskRequest } from "@/types/kiosks/management";
import type { CreateStoreRequest } from "@/types/tenants/management";

export type FranchiseOnboardingStatus =
  | "Pending"
  | "Running"
  | "Failed"
  | "ReadyForActivation"
  | "Cancelled";

export interface FranchiseOnboardingResult {
  id: string;
  organizationId: string;
  status: FranchiseOnboardingStatus;
  storeId?: string | null;
  kioskId?: string | null;
  packageInstallationId?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  createdAt: string;
  readyAt?: string | null;
}

export interface StartFranchiseOnboardingRequest {
  store: CreateStoreRequest;
  kiosk: CreateKioskRequest;
  productionPackageId?: string | null;
  productionPackageVersionId?: string | null;
  productSourceKeys?: string[];
}

export type FranchiseOnboardingsPage = PagedResult<FranchiseOnboardingResult>;
