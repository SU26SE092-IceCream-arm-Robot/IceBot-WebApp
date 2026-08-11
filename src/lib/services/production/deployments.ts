import axiosClient from "@/lib/axios-client";
import { unwrapApiResult } from "@/lib/api/result";
import type { ApiResult } from "@/types";
import type {
  ConfigurationDeploymentArtifactResult,
  ConfigurationDeploymentResult,
  ConfigurationDeploymentRollbackResult,
  ConfigurationDeploymentsPage,
  DeploymentPreview,
  InventoryReadinessResult,
} from "@/types/production/operations";

import { collectPagedResults, idempotencyKey, OPERATIONS_PAGE_SIZE } from "./shared";
export async function listConfigurationDeployments(
  kioskId: string,
  signal?: AbortSignal,
) {
  return collectPagedResults<ConfigurationDeploymentResult>(
    async (pageNumber) => {
      const response = await axiosClient.get<ConfigurationDeploymentsPage>(
        `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/configuration-deployments`,
        { params: { pageNumber, pageSize: OPERATIONS_PAGE_SIZE }, signal },
      );
      if (!response.data.succeeded)
        throw new Error(
          response.data.message || "Không thể tải lịch sử triển khai.",
        );
      return response.data;
    },
  );
}

export async function getConfigurationDeploymentArtifacts(
  kioskId: string,
  deploymentId: string,
) {
  const response = await axiosClient.get<
    ApiResult<ConfigurationDeploymentArtifactResult[]>
  >(
    `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/configuration-deployments/${encodeURIComponent(deploymentId)}/artifacts`,
  );
  return unwrapApiResult(
    response.data,
    "Không thể tải artifact của lần triển khai.",
  );
}

export async function getConfigurationInventoryReadiness(
  kioskId: string,
  releaseId: string,
) {
  const response = await axiosClient.get<ApiResult<InventoryReadinessResult>>(
    `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/configuration-releases/${encodeURIComponent(releaseId)}/inventory-readiness`,
  );
  return unwrapApiResult(response.data, "Không thể kiểm tra mức sẵn sàng tồn kho.");
}

export async function previewConfigurationDeployment(
  kioskId: string,
  releaseId: string,
) {
  const response = await axiosClient.post<ApiResult<DeploymentPreview>>(
    `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/configuration-deployments/preview`,
    { configurationReleaseId: releaseId, selections: [] },
  );
  return unwrapApiResult(response.data, "Không thể xem trước triển khai.");
}

export async function deployConfiguration(
  kioskId: string,
  preview: DeploymentPreview,
  endpointId: string,
  acknowledgeRemainingRisk: boolean,
  reason: string,
) {
  const endpoint = preview.endpoints.find(
    (item) => item.kioskExecutionEndpointId === endpointId,
  );
  if (!endpoint)
    throw new Error("Điểm thực thi đã chọn không còn trong bản xem trước.");
  const profilePath =
    endpoint.executionProfile === "FullEdge" ? "full-edge" : "low-cost";
  const response = await axiosClient.post<
    ApiResult<ConfigurationDeploymentRollbackResult>
  >(
    `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/configuration-deployments/${profilePath}`,
    {
      configurationReleaseId: preview.configurationReleaseId,
      kioskExecutionEndpointId: endpoint.kioskExecutionEndpointId,
      deploymentPreviewChecksum: endpoint.deploymentChecksum,
      reason: reason.trim(),
      acknowledgeRemainingRisk,
      ...(profilePath === "low-cost"
        ? { selections: endpoint.selections }
        : {}),
    },
    { headers: { "Idempotency-Key": idempotencyKey("configuration-deploy") } },
  );
  return unwrapApiResult(response.data, "Không thể triển khai cấu hình.");
}

export async function rollbackConfigurationDeployment(
  kioskId: string,
  deploymentId: string,
  expectedActiveDeploymentId: string,
  reason: string,
) {
  const response = await axiosClient.post<
    ApiResult<ConfigurationDeploymentResult>
  >(
    `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/configuration-deployments/${encodeURIComponent(deploymentId)}/rollback`,
    {
      reason: reason.trim(),
      expectedActiveDeploymentId,
    },
    {
      headers: { "Idempotency-Key": idempotencyKey("configuration-rollback") },
    },
  );
  return unwrapApiResult(response.data, "Không thể rollback cấu hình.");
}
