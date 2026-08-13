import type { PagedResult } from "@/types/identity/accounts";

export type LuaTemplateStatus = "Draft" | "Published" | "Retired";
export type TechnicalContractStatus = "Draft" | "Published" | "Retired";

export interface LuaTemplateResult {
  id: string;
  templateCode: string;
  templateName: string;
  fileName: string;
  checksum: string;
  runtimeTargetCode: string;
  machineModelCode: string;
  contentLengthBytes: number;
  status: LuaTemplateStatus | string;
  exportedAt: string;
  description?: string | null;
  metadataJson?: string | null;
  technicalContractId?: string | null;
  technicalContractChecksum?: string | null;
  hasTechnicalContract: boolean;
}

export interface TechnicalContractResult {
  id: string;
  organizationId?: string | null;
  contractCode: string;
  contractVersion: number;
  schemaVersion: number;
  runtimeTargetCode: string;
  machineModelCode: string;
  status: TechnicalContractStatus | string;
  contractChecksum?: string | null;
  effects: unknown[];
  orderingConstraints: unknown[];
}

export interface LuaTemplateReviewUrlResult {
  robotArtifactId: string;
  fileName: string;
  checksum: string;
  contentLengthBytes: number;
  url: string;
  expiresAt: string;
}

export interface BulkLuaTemplateUploadResult {
  uploadedCount: number;
  existingCount: number;
  failedCount: number;
  items: Array<{
    fileName: string;
    succeeded: boolean;
    wasExisting: boolean;
    statusCode: number;
    message: string;
    template?: LuaTemplateResult | null;
  }>;
}

export interface UploadLuaTemplateRequest {
  file: File;
  templateCode: string;
  templateName: string;
  runtimeTargetCode: string;
  machineModelCode: string;
  description?: string;
}

export type LuaTemplatesPage = PagedResult<LuaTemplateResult>;
export type TechnicalContractsPage = PagedResult<TechnicalContractResult>;
