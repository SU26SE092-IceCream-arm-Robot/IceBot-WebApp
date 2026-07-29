import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  ConfigurationDeploymentsPage,
  ConfigurationDeploymentRollbackResult,
  ConfigurationDeploymentResult,
  ConfigurationReleaseResult,
  ConfigurationReleasesPage,
  CreateRobotProgramRequest,
  DeploymentPreview,
  InventoryReadinessResult,
  PackageInstallationPreview,
  PackageInstallationResult,
  PackageInstallationsPage,
  PackageInstallRequest,
  PackageRepairResult,
  PackageUpgradePreviewResult,
  PackageUpgradeResult,
  PackageUpgradesPage,
  PackageWorkspaceResult,
  ProductionPackageResult,
  RobotProgramResult,
  RobotProgramsPage,
  UpdateRobotProgramRequest,
} from "@/types/production-operations";

function requireData<T>(result: ApiResult<T>, fallbackMessage: string): T {
  if (!result.succeeded || result.data === undefined || result.data === null) {
    throw new Error(result.message || result.businessError || fallbackMessage);
  }
  return result.data;
}

function idempotencyKey(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

const OPERATIONS_PAGE_SIZE = 100;

async function collectPagedResults<T>(
  fetchPage: (pageNumber: number) => Promise<{ data?: T[] | null; pagination: { hasNext: boolean } }>,
) {
  const items: T[] = [];
  let pageNumber = 1;

  while (true) {
    const page = await fetchPage(pageNumber);
    items.push(...(page.data ?? []));
    if (!page.pagination.hasNext) return items;
    pageNumber += 1;
  }
}

export async function listRobotPrograms(organizationId: string, signal?: AbortSignal) {
  return collectPagedResults<RobotProgramResult>(async (pageNumber) => {
    const response = await axiosClient.get<RobotProgramsPage>(
      `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/robot-programs`,
      { params: { pageNumber, pageSize: OPERATIONS_PAGE_SIZE }, signal },
    );
    if (!response.data.succeeded) throw new Error(response.data.message || "Không thể tải chương trình robot.");
    return response.data;
  });
}

export async function createRobotProgram(organizationId: string, request: CreateRobotProgramRequest) {
  const response = await axiosClient.post<ApiResult<RobotProgramResult>>(
    `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/robot-programs`,
    request,
  );
  return requireData(response.data, "Không thể tạo chương trình robot.");
}

export async function updateRobotProgram(organizationId: string, programId: string, request: UpdateRobotProgramRequest) {
  const response = await axiosClient.put<ApiResult<RobotProgramResult>>(
    `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/robot-programs/${encodeURIComponent(programId)}`,
    request,
  );
  return requireData(response.data, "Không thể cập nhật chương trình robot.");
}

export async function changeRobotProgramLifecycle(
  organizationId: string,
  programId: string,
  action: "publish" | "retire" | "discard",
) {
  const path = `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/robot-programs/${encodeURIComponent(programId)}`;
  if (action === "discard") {
    const response = await axiosClient.delete<ApiResult<object>>(path);
    if (!response.data.succeeded) {
      throw new Error(response.data.message || response.data.businessError || "Không thể xóa bản nháp chương trình robot.");
    }
    return null;
  }
  const response = await axiosClient.patch<ApiResult<RobotProgramResult>>(`${path}/${action}`);
  return requireData(response.data, "Không thể cập nhật vòng đời chương trình robot.");
}

export async function listProductionPackageCatalog(organizationId: string, signal?: AbortSignal) {
  const response = await axiosClient.get<ApiResult<ProductionPackageResult[]>>(
    `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/production-packages/catalog`,
    { signal },
  );
  return requireData(response.data, "Không thể tải danh mục gói sản xuất.");
}

const installationsPath = (organizationId: string) =>
  `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/production-package-installations`;

export async function listPackageInstallations(organizationId: string, kioskId: string, signal?: AbortSignal) {
  return collectPagedResults<PackageInstallationResult>(async (pageNumber) => {
    const response = await axiosClient.get<PackageInstallationsPage>(installationsPath(organizationId), {
      params: { kioskId, pageNumber, pageSize: OPERATIONS_PAGE_SIZE },
      signal,
    });
    if (!response.data.succeeded) throw new Error(response.data.message || "Không thể tải các gói đã cài đặt.");
    return response.data;
  });
}

export async function previewPackageInstallation(organizationId: string, request: PackageInstallRequest) {
  const response = await axiosClient.post<ApiResult<PackageInstallationPreview>>(
    `${installationsPath(organizationId)}/preview`,
    request,
  );
  return requireData(response.data, "Không thể xem trước gói sản xuất.");
}

export async function installProductionPackage(organizationId: string, request: PackageInstallRequest) {
  const response = await axiosClient.post<ApiResult<PackageInstallationResult>>(
    installationsPath(organizationId),
    request,
    { headers: { "Idempotency-Key": idempotencyKey("package-install") } },
  );
  return requireData(response.data, "Không thể cài đặt gói sản xuất.");
}

export async function getPackageWorkspace(organizationId: string, installationId: string, signal?: AbortSignal) {
  const response = await axiosClient.get<ApiResult<PackageWorkspaceResult>>(
    `${installationsPath(organizationId)}/${encodeURIComponent(installationId)}/workspace`,
    { signal },
  );
  return requireData(response.data, "Không thể tải không gian làm việc của gói.");
}

export async function recoverPackageInstallation(
  organizationId: string,
  installationId: string,
  action: "retry" | "repair",
) {
  const path = `${installationsPath(organizationId)}/${encodeURIComponent(installationId)}/${action}`;
  if (action === "repair") {
    const response = await axiosClient.post<ApiResult<PackageRepairResult>>(path);
    return requireData(response.data, "Không thể sửa dữ liệu cài đặt gói.");
  }
  const response = await axiosClient.post<ApiResult<PackageInstallationResult>>(path);
  return requireData(response.data, "Không thể thử lại cài đặt gói.");
}

export async function listPackageUpgrades(organizationId: string, installationId: string, signal?: AbortSignal) {
  return collectPagedResults<PackageUpgradeResult>(async (pageNumber) => {
    const response = await axiosClient.get<PackageUpgradesPage>(
      `${installationsPath(organizationId)}/${encodeURIComponent(installationId)}/upgrades`,
      { params: { pageNumber, pageSize: OPERATIONS_PAGE_SIZE }, signal },
    );
    if (!response.data.succeeded) throw new Error(response.data.message || "Không thể tải lịch sử nâng cấp.");
    return response.data;
  });
}

export async function previewPackageUpgrade(
  organizationId: string,
  installationId: string,
  targetPackageVersionId: string,
  productSourceKeys: string[],
) {
  const response = await axiosClient.post<ApiResult<PackageUpgradePreviewResult>>(
    `${installationsPath(organizationId)}/${encodeURIComponent(installationId)}/upgrades/preview`,
    { targetPackageVersionId, productSourceKeys },
  );
  return requireData(response.data, "Không thể xem trước nâng cấp gói.");
}

export async function startPackageUpgrade(
  organizationId: string,
  installationId: string,
  preview: PackageUpgradePreviewResult,
) {
  const response = await axiosClient.post<ApiResult<PackageUpgradeResult>>(
    `${installationsPath(organizationId)}/${encodeURIComponent(installationId)}/upgrades`,
    {
      targetPackageVersionId: preview.targetPackageVersionId,
      previewChecksum: preview.previewChecksum,
      productSourceKeys: preview.selectedProductSourceKeys,
    },
    { headers: { "Idempotency-Key": idempotencyKey("package-upgrade") } },
  );
  return requireData(response.data, "Không thể bắt đầu nâng cấp gói.");
}

export async function changePackageUpgradeLifecycle(
  organizationId: string,
  installationId: string,
  upgradeId: string,
  action: "cutover" | "abandon" | "rollback",
  reason?: string,
) {
  const body = action === "cutover" ? undefined : { reason: reason?.trim() };
  const response = await axiosClient.post<ApiResult<PackageUpgradeResult>>(
    `${installationsPath(organizationId)}/${encodeURIComponent(installationId)}/upgrades/${encodeURIComponent(upgradeId)}/${action}`,
    body,
  );
  return requireData(response.data, "Không thể cập nhật nâng cấp gói.");
}

export async function listConfigurationReleases(organizationId: string, signal?: AbortSignal) {
  return collectPagedResults<ConfigurationReleaseResult>(async (pageNumber) => {
    const response = await axiosClient.get<ConfigurationReleasesPage>(
      `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/configuration-releases`,
      { params: { pageNumber, pageSize: OPERATIONS_PAGE_SIZE }, signal },
    );
    if (!response.data.succeeded) throw new Error(response.data.message || "Không thể tải bản phát hành cấu hình.");
    return response.data;
  });
}

export async function listConfigurationDeployments(kioskId: string, signal?: AbortSignal) {
  return collectPagedResults<ConfigurationDeploymentResult>(async (pageNumber) => {
    const response = await axiosClient.get<ConfigurationDeploymentsPage>(
      `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/configuration-deployments`,
      { params: { pageNumber, pageSize: OPERATIONS_PAGE_SIZE }, signal },
    );
    if (!response.data.succeeded) throw new Error(response.data.message || "Không thể tải lịch sử triển khai.");
    return response.data;
  });
}

export async function getConfigurationInventoryReadiness(kioskId: string, releaseId: string) {
  const response = await axiosClient.get<ApiResult<InventoryReadinessResult>>(
    `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/configuration-releases/${encodeURIComponent(releaseId)}/inventory-readiness`,
  );
  return requireData(response.data, "Không thể kiểm tra mức sẵn sàng tồn kho.");
}

export async function previewConfigurationDeployment(kioskId: string, releaseId: string) {
  const response = await axiosClient.post<ApiResult<DeploymentPreview>>(
    `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/configuration-deployments/preview`,
    { configurationReleaseId: releaseId, selections: [] },
  );
  return requireData(response.data, "Không thể xem trước triển khai.");
}

export async function deployConfiguration(
  kioskId: string,
  preview: DeploymentPreview,
  endpointId: string,
  acknowledgeRemainingRisk: boolean,
) {
  const endpoint = preview.endpoints.find((item) => item.kioskExecutionEndpointId === endpointId);
  if (!endpoint) throw new Error("Điểm thực thi đã chọn không còn trong bản xem trước.");
  const profilePath = endpoint.executionProfile === "FullEdge" ? "full-edge" : "low-cost";
  const response = await axiosClient.post<ApiResult<ConfigurationDeploymentRollbackResult>>(
    `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/configuration-deployments/${profilePath}`,
    {
      configurationReleaseId: preview.configurationReleaseId,
      kioskExecutionEndpointId: endpoint.kioskExecutionEndpointId,
      deploymentPreviewChecksum: endpoint.deploymentChecksum,
      acknowledgeRemainingRisk,
      ...(profilePath === "low-cost" ? { selections: endpoint.selections } : {}),
    },
    { headers: { "Idempotency-Key": idempotencyKey("configuration-deploy") } },
  );
  return requireData(response.data, "Không thể triển khai cấu hình.");
}

export async function rollbackConfigurationDeployment(kioskId: string, deploymentId: string) {
  const response = await axiosClient.post<ApiResult<ConfigurationDeploymentResult>>(
    `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/configuration-deployments/${encodeURIComponent(deploymentId)}/rollback`,
    undefined,
    { headers: { "Idempotency-Key": idempotencyKey("configuration-rollback") } },
  );
  return requireData(response.data, "Không thể rollback cấu hình.");
}

export function getProductionOperationsErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isCancel(error)) return "";
  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    if (error.response?.status === 403) return "Tài khoản hiện tại không có quyền thực hiện thao tác này trong phạm vi đã chọn.";
    if (error.response?.status === 409) return error.response.data?.message || "Dữ liệu đã thay đổi. Hãy tải lại trước khi tiếp tục.";
    return error.response?.data?.message || error.response?.data?.businessError || fallbackMessage;
  }
  return error instanceof Error ? error.message : fallbackMessage;
}
