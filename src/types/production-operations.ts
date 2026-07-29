import type { PagedResult } from "@/types/accounts";

export type RobotProgramStatus = "Draft" | "Published" | "Retired";
export type ConfigurationReleaseStatus = "Draft" | "Published" | "Retired";
export type ConfigurationDeploymentStatus = "Pending" | "Installed" | "Active" | "Failed";
export type ConfigurationDeploymentProfile = "FullEdge" | "LowCostController";
export type PackageInstallationStatus =
  | "Pending"
  | "Materializing"
  | "Installed"
  | "Failed"
  | "Superseded"
  | "Abandoned";
export type PackageUpgradeStatus =
  | "Materializing"
  | "ReadyForReview"
  | "Completed"
  | "RollbackPending"
  | "RolledBack"
  | "Failed"
  | "Abandoned";

export interface RobotProgramResult {
  id: string;
  organizationId?: string | null;
  storeId?: string | null;
  kioskId?: string | null;
  deviceId?: string | null;
  code: string;
  name: string;
  scopeType: string;
  status: RobotProgramStatus;
  restartPolicy: string;
  description?: string | null;
  programManifestChecksum?: string | null;
  publishedAt?: string | null;
  artifacts: Array<{
    id: string;
    robotArtifactId: string;
    runOrder: number;
    requiredOptionCode?: string | null;
    artifactCode?: string | null;
    artifactName?: string | null;
    artifactStatus?: string | null;
  }>;
}

export interface CreateRobotProgramRequest {
  code: string;
  name: string;
  storeId?: string | null;
  kioskId?: string | null;
  deviceId?: string | null;
  description?: string | null;
}

export interface UpdateRobotProgramRequest {
  code: string;
  name: string;
  description?: string | null;
}

export interface ProductionPackageVersionResult {
  id: string;
  version: number;
  status: string;
  manifestChecksum?: string | null;
  products: Array<{
    sourceKey: string;
    code: string;
    name: string;
    variantCodes: string[];
  }>;
}

export interface ProductionPackageResult {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: string;
  versions: ProductionPackageVersionResult[];
}

export interface PackageInstallationResult {
  id: string;
  organizationId: string;
  storeId?: string | null;
  kioskId?: string | null;
  packageVersionId: string;
  status: PackageInstallationStatus;
  ownershipMode: string;
  draftConfigurationReleaseId?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  materializations: Array<{
    resourceKind: string;
    sourceKey: string;
    targetKey: string;
    targetChecksum?: string | null;
  }>;
}

export interface PackageInstallationPreview {
  packageVersionId: string;
  manifestChecksum: string;
  productSourceKeys: string[];
  programBlueprintCodes: string[];
  routeCodes: string[];
  warnings: string[];
}

export interface PackageRepairResult {
  installationId: string;
  restoredResources: Array<{
    resourceKind: string;
    sourceKey: string;
    targetKey: string;
  }>;
}

export interface PackageInstallRequest {
  packageId: string;
  packageVersionId: string;
  storeId?: string | null;
  kioskId?: string | null;
  productSourceKeys: string[];
}

export interface WorkspaceBlockerResult {
  code: string;
  message: string;
  resourceType?: string | null;
  resourceId?: string | null;
  impact: number;
}

export interface PackageWorkspaceResult {
  installationId: string;
  organizationId: string;
  storeId?: string | null;
  kioskId?: string | null;
  installationStatus: string;
  ownershipMode: string;
  packageId: string;
  packageCode: string;
  packageName: string;
  packageVersionId: string;
  packageVersion: number;
  products: Array<{ id: string; sourceKey: string; code: string; name: string; status: string }>;
  productVariants: Array<{ id: string; sourceKey: string; code: string; name: string; status: string }>;
  options: Array<{ id: string; sourceKey: string; groupCode: string; code: string; name: string; status: string; executionImpact: string }>;
  recipes: Array<{ id: string; sourceKey: string; code: string; name: string; status: string }>;
  menus: Array<{ id: string; code: string; name: string; status: string; storeId?: string | null; kioskId?: string | null; assignedProductVariantIds: string[]; sellableProductVariantIds: string[] }>;
  artifacts: Array<{ id: string; sourceKey: string; code: string; name: string; status: string; technicalContractId?: string | null; technicalContractReady: boolean }>;
  programs: Array<{ id: string; sourceKey: string; code: string; name: string; status: string; artifacts: Array<{ robotArtifactId: string; runOrder: number; requiredOptionCode?: string | null }> }>;
  release?: { id: string; releaseNumber: number; status: string; routeCount: number; releaseChecksum?: string | null } | null;
  technicalReadiness: { isReady: boolean; hasTargetKiosk: boolean; hasActiveExecutionEndpoint: boolean; latestDeploymentStatus?: string | null; blockers: WorkspaceBlockerResult[] };
  commercialReadiness: { isReady: boolean; blockers: WorkspaceBlockerResult[] };
  requiredActions: WorkspaceActionResult[];
  optionalActions: WorkspaceActionResult[];
  recoveryActions: WorkspaceActionResult[];
}

export interface WorkspaceActionResult {
  code: string;
  resourceType: string;
  resourceId?: string | null;
  resourceKey?: string | null;
  isBlocked: boolean;
  blockerCodes: string[];
  requiredCount?: number | null;
  candidateResourceIds?: string[] | null;
  context?: {
    productId?: string | null;
    productVariantId?: string | null;
    menuId?: string | null;
    optionGroupId?: number | null;
    kioskExecutionEndpointId?: string | null;
    executionProfile?: string | null;
    deploymentSelections?: Array<{ executionRouteId: string; robotProgramId: string }> | null;
  } | null;
}

export interface PackageUpgradePreviewResult {
  sourceInstallationId: string;
  sourcePackageVersionId: string;
  targetPackageVersionId: string;
  previewChecksum: string;
  selectedProductSourceKeys: string[];
  addedProductSourceKeys: string[];
  removedProductSourceKeys: string[];
  changedProductSourceKeys: string[];
  affectedMenuItemCount: number;
  requiredEndpointCount: number;
  blockers: string[];
  warnings: string[];
}

export interface PackageUpgradeResult {
  id: string;
  sourceInstallationId: string;
  targetPackageVersionId: string;
  targetInstallationId?: string | null;
  status: PackageUpgradeStatus;
  previewChecksum: string;
  selectedProductSourceKeys: string[];
  menuChangeCount: number;
  endpointTargetCount: number;
  failureCode?: string | null;
  failureMessage?: string | null;
}

export interface ConfigurationReleaseResult {
  id: string;
  organizationId: string;
  releaseNumber: number;
  status: ConfigurationReleaseStatus;
  releaseChecksum?: string | null;
  publishedAt?: string | null;
  routeCount: number;
  routes: Array<{
    id: string;
    productVariantId: string;
    productVariantCode?: string | null;
    recipeId: string;
    recipeCode?: string | null;
    routeCode: string;
    priority: number;
    supportedOptionCodes: string[];
    robotBindings: Array<{
      id: string;
      robotProgramId: string;
      robotProgramCode?: string | null;
      bindingOrder: number;
      requiredWorkcellCapabilityCode: string;
    }>;
  }>;
}

export interface ConfigurationDeploymentResult {
  id: string;
  profile: ConfigurationDeploymentProfile;
  organizationId: string;
  storeId: string;
  kioskId: string;
  kioskExecutionEndpointId: string;
  endpointCode: string;
  configurationReleaseId: string;
  releaseNumber: number;
  releaseChecksum: string;
  status: ConfigurationDeploymentStatus;
  requestedAt: string;
  executorReportedAt?: string | null;
  cloudReceivedAt?: string | null;
  failureCode?: string | null;
  failureReason?: string | null;
  attemptNo?: number | null;
  activeSetVersion?: number | null;
}

export interface ConfigurationDeploymentRollbackResult {
  targetDeploymentId: string;
  newDeploymentId: string;
  profile: ConfigurationDeploymentProfile;
  kioskId: string;
  kioskExecutionEndpointId: string;
  configurationReleaseId: string;
  releaseChecksum: string;
  status: string;
}

export interface DeploymentPreview {
  configurationReleaseId: string;
  releaseChecksum: string;
  kioskId: string;
  requiresEndpointSelection: boolean;
  endpoints: DeploymentEndpointPreview[];
}

export interface DeploymentEndpointPreview {
  kioskExecutionEndpointId: string;
  endpointCode: string;
  executionProfile: ConfigurationDeploymentProfile;
  isEligible: boolean;
  blockers: Array<{ code: string; message: string }>;
  selections: Array<{ executionRouteId: string; robotProgramId: string }>;
  installationModes: string[];
  artifactCount: number;
  artifactStorageBytes: number;
  maximumArtifactCount?: number | null;
  maximumArtifactStorageBytes?: number | null;
  deploymentChecksum: string;
}

export interface InventoryReadinessResult {
  kioskId: string;
  organizationId: string;
  storeId: string;
  isReady: boolean;
  overallStatus: string;
  ingredients: Array<{ ingredientCode: string; ingredientName: string; status: string }>;
  optionGroups: Array<{ routeCode: string; optionGroupCode: string; isRequired: boolean; minimumSelections: number; readyOptionCount: number; isReady: boolean }>;
}

export type RobotProgramsPage = PagedResult<RobotProgramResult>;
export type PackageInstallationsPage = PagedResult<PackageInstallationResult>;
export type PackageUpgradesPage = PagedResult<PackageUpgradeResult>;
export type ConfigurationReleasesPage = PagedResult<ConfigurationReleaseResult>;
export type ConfigurationDeploymentsPage = PagedResult<ConfigurationDeploymentResult>;
