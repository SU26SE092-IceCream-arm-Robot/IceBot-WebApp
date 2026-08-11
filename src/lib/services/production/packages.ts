import axiosClient from "@/lib/axios-client";
import { unwrapApiResult } from "@/lib/api/result";
import type { ApiResult } from "@/types";
import type {
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
} from "@/types/production/operations";

import { collectPagedResults, idempotencyKey, OPERATIONS_PAGE_SIZE } from "./shared";
export async function listProductionPackageCatalog(
  organizationId: string,
  signal?: AbortSignal,
) {
  const response = await axiosClient.get<ApiResult<ProductionPackageResult[]>>(
    `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/production-packages/catalog`,
    { signal },
  );
  return unwrapApiResult(response.data, "Không thể tải danh mục gói sản xuất.");
}

const installationsPath = (organizationId: string) =>
  `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/production-package-installations`;

export async function listPackageInstallations(
  organizationId: string,
  kioskId: string,
  signal?: AbortSignal,
) {
  return collectPagedResults<PackageInstallationResult>(async (pageNumber) => {
    const response = await axiosClient.get<PackageInstallationsPage>(
      installationsPath(organizationId),
      {
        params: { kioskId, pageNumber, pageSize: OPERATIONS_PAGE_SIZE },
        signal,
      },
    );
    if (!response.data.succeeded)
      throw new Error(
        response.data.message || "Không thể tải các gói đã cài đặt.",
      );
    return response.data;
  });
}

export async function previewPackageInstallation(
  organizationId: string,
  request: PackageInstallRequest,
) {
  const response = await axiosClient.post<
    ApiResult<PackageInstallationPreview>
  >(`${installationsPath(organizationId)}/preview`, request);
  return unwrapApiResult(response.data, "Không thể xem trước gói sản xuất.");
}

export async function installProductionPackage(
  organizationId: string,
  request: PackageInstallRequest,
) {
  const response = await axiosClient.post<ApiResult<PackageInstallationResult>>(
    installationsPath(organizationId),
    request,
    { headers: { "Idempotency-Key": idempotencyKey("package-install") } },
  );
  return unwrapApiResult(response.data, "Không thể cài đặt gói sản xuất.");
}

export async function getPackageWorkspace(
  organizationId: string,
  installationId: string,
  signal?: AbortSignal,
) {
  const response = await axiosClient.get<ApiResult<PackageWorkspaceResult>>(
    `${installationsPath(organizationId)}/${encodeURIComponent(installationId)}/workspace`,
    { signal },
  );
  return unwrapApiResult(
    response.data,
    "Không thể tải không gian làm việc của gói.",
  );
}

export async function recoverPackageInstallation(
  organizationId: string,
  installationId: string,
  action: "retry" | "repair",
) {
  const path = `${installationsPath(organizationId)}/${encodeURIComponent(installationId)}/${action}`;
  if (action === "repair") {
    const response =
      await axiosClient.post<ApiResult<PackageRepairResult>>(path);
    return unwrapApiResult(response.data, "Không thể sửa dữ liệu cài đặt gói.");
  }
  const response =
    await axiosClient.post<ApiResult<PackageInstallationResult>>(path);
  return unwrapApiResult(response.data, "Không thể thử lại cài đặt gói.");
}

export async function listPackageUpgrades(
  organizationId: string,
  installationId: string,
  signal?: AbortSignal,
) {
  return collectPagedResults<PackageUpgradeResult>(async (pageNumber) => {
    const response = await axiosClient.get<PackageUpgradesPage>(
      `${installationsPath(organizationId)}/${encodeURIComponent(installationId)}/upgrades`,
      { params: { pageNumber, pageSize: OPERATIONS_PAGE_SIZE }, signal },
    );
    if (!response.data.succeeded)
      throw new Error(
        response.data.message || "Không thể tải lịch sử nâng cấp.",
      );
    return response.data;
  });
}

export async function previewPackageUpgrade(
  organizationId: string,
  installationId: string,
  targetPackageVersionId: string,
  productSourceKeys: string[],
) {
  const response = await axiosClient.post<
    ApiResult<PackageUpgradePreviewResult>
  >(
    `${installationsPath(organizationId)}/${encodeURIComponent(installationId)}/upgrades/preview`,
    { targetPackageVersionId, productSourceKeys },
  );
  return unwrapApiResult(response.data, "Không thể xem trước nâng cấp gói.");
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
  return unwrapApiResult(response.data, "Không thể bắt đầu nâng cấp gói.");
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
  return unwrapApiResult(response.data, "Không thể cập nhật nâng cấp gói.");
}


export async function forkProductionPackageInstallation(
  organizationId: string,
  installationId: string,
) {
  const response = await axiosClient.post<ApiResult<PackageInstallationResult>>(
    `${installationsPath(organizationId)}/${encodeURIComponent(installationId)}/fork`,
  );
  return unwrapApiResult(
    response.data,
    "Không thể tách cấu hình khỏi gói sản xuất.",
  );
}
