import type { PagedResult } from "@/types/identity/accounts";

export interface OrganizationSalesSummaryResult {
  organizationId: string;
  organizationCode: string;
  organizationName: string;
  organizationStatus: string;
  currency: string;
  paidOrderCount: number;
  grossCollectedAmount: number;
  processedRefundAmount: number;
  netCollectedAmount: number;
}

export interface OrganizationSalesQuery {
  from: string;
  to: string;
  organizationId?: string;
  search?: string;
  pageNumber: number;
  pageSize: number;
}

export type OrganizationSalesPage = PagedResult<OrganizationSalesSummaryResult>;
