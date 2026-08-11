import axiosClient from "@/lib/axios-client";
import { unwrapApiResult } from "@/lib/api/result";
import type { ApiResult } from "@/types";
import type {
  ConfigurationReleaseResult,
  CreateRobotAuthoringReleaseDraftRequest,
  RobotAuthoringCompositionPreview,
  RobotAuthoringImportQuery,
  RobotAuthoringImportResult,
  RobotAuthoringImportsPage,
  RobotAuthoringWorkspaceResult,
  RobotProgramResult,
  UploadRobotAuthoringImportRequest,
} from "@/types/production/operations";

import { idempotencyKey } from "./shared";

const authoringImportsPath = (organizationId: string) =>
  `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/robot-authoring-imports`;

export async function listRobotAuthoringImports(
  organizationId: string,
  query: RobotAuthoringImportQuery,
  signal?: AbortSignal,
) {
  const response = await axiosClient.get<RobotAuthoringImportsPage>(
    authoringImportsPath(organizationId),
    {
      params: {
        ...(query.status && query.status !== "ALL"
          ? { status: query.status }
          : {}),
        ...(query.storeId ? { storeId: query.storeId } : {}),
        ...(query.kioskId ? { kioskId: query.kioskId } : {}),
        ...(query.deviceId ? { deviceId: query.deviceId } : {}),
        ...(query.search?.trim() ? { search: query.search.trim() } : {}),
        ...(query.createdFrom ? { createdFrom: query.createdFrom } : {}),
        ...(query.createdTo ? { createdTo: query.createdTo } : {}),
        pageNumber: query.pageNumber,
        pageSize: query.pageSize,
      },
      signal,
    },
  );
  if (!response.data.succeeded) {
    throw new Error(
      response.data.message ||
        response.data.businessError ||
        "Không thể tải các gói cấu hình đã nhập.",
    );
  }
  return response.data;
}

export async function getRobotAuthoringImport(
  organizationId: string,
  importId: string,
  signal?: AbortSignal,
) {
  const response = await axiosClient.get<ApiResult<RobotAuthoringImportResult>>(
    `${authoringImportsPath(organizationId)}/${encodeURIComponent(importId)}`,
    { signal },
  );
  return unwrapApiResult(response.data, "Không thể tải gói cấu hình đã nhập.");
}

export async function getRobotAuthoringWorkspace(
  organizationId: string,
  importId: string,
  signal?: AbortSignal,
) {
  const response = await axiosClient.get<
    ApiResult<RobotAuthoringWorkspaceResult>
  >(
    `${authoringImportsPath(organizationId)}/${encodeURIComponent(importId)}/workspace`,
    { signal },
  );
  return unwrapApiResult(
    response.data,
    "Không thể tải workspace cấu hình sản xuất.",
  );
}

export async function uploadRobotAuthoringImport(
  organizationId: string,
  request: UploadRobotAuthoringImportRequest,
) {
  const formData = new FormData();
  formData.append("bundle", request.bundle);
  if (request.storeId) formData.append("storeId", request.storeId);
  if (request.kioskId) formData.append("kioskId", request.kioskId);
  if (request.deviceId) formData.append("deviceId", request.deviceId);
  const response = await axiosClient.post<
    ApiResult<RobotAuthoringImportResult>
  >(authoringImportsPath(organizationId), formData, {
    headers: { "Idempotency-Key": idempotencyKey("robot-authoring-import") },
  });
  return unwrapApiResult(response.data, "Không thể tải lên gói cấu hình.");
}

export async function validateRobotAuthoringImport(
  organizationId: string,
  importId: string,
) {
  const response = await axiosClient.post<
    ApiResult<RobotAuthoringImportResult>
  >(
    `${authoringImportsPath(organizationId)}/${encodeURIComponent(importId)}/validate`,
  );
  return unwrapApiResult(response.data, "Không thể kiểm tra gói cấu hình.");
}

export async function resumeRobotAuthoringImport(
  organizationId: string,
  importId: string,
) {
  const response = await axiosClient.post<
    ApiResult<RobotAuthoringImportResult>
  >(
    `${authoringImportsPath(organizationId)}/${encodeURIComponent(importId)}/resume`,
  );
  return unwrapApiResult(
    response.data,
    "Không thể tiếp tục nhập chương trình.",
  );
}

export async function materializeRobotAuthoringImport(
  organizationId: string,
  importId: string,
) {
  const response = await axiosClient.post<
    ApiResult<RobotAuthoringImportResult>
  >(
    `${authoringImportsPath(organizationId)}/${encodeURIComponent(importId)}/materialize`,
  );
  return unwrapApiResult(
    response.data,
    "Không thể tạo tài nguyên từ gói cấu hình.",
  );
}

export async function discardRobotAuthoringImport(
  organizationId: string,
  importId: string,
) {
  const response = await axiosClient.post<
    ApiResult<RobotAuthoringImportResult>
  >(
    `${authoringImportsPath(organizationId)}/${encodeURIComponent(importId)}/discard`,
  );
  return unwrapApiResult(response.data, "Không thể hủy gói cấu hình đã nhập.");
}

export async function publishRobotAuthoringImportResources(
  organizationId: string,
  importId: string,
) {
  const response = await axiosClient.post<
    ApiResult<RobotAuthoringImportResult>
  >(
    `${authoringImportsPath(organizationId)}/${encodeURIComponent(importId)}/publish-resources`,
  );
  return unwrapApiResult(
    response.data,
    "Không thể phát hành tài nguyên từ gói cấu hình.",
  );
}

export async function previewRobotAuthoringComposition(
  organizationId: string,
  importId: string,
  recipeId: string,
  selectedOptionCodes: string[],
) {
  const response = await axiosClient.post<
    ApiResult<RobotAuthoringCompositionPreview>
  >(
    `${authoringImportsPath(organizationId)}/${encodeURIComponent(importId)}/preview-composition`,
    { recipeId, selectedOptionCodes },
  );
  return unwrapApiResult(
    response.data,
    "Không thể xem trước cấu thành chương trình robot.",
  );
}

export async function confirmRobotAuthoringComposition(
  organizationId: string,
  importId: string,
  recipeId: string,
  selectedOptionCodes: string[],
  previewChecksum: string,
) {
  const response = await axiosClient.post<ApiResult<RobotProgramResult>>(
    `${authoringImportsPath(organizationId)}/${encodeURIComponent(importId)}/confirm-composition`,
    { recipeId, selectedOptionCodes, previewChecksum },
  );
  return unwrapApiResult(
    response.data,
    "Không thể xác nhận cấu thành chương trình robot.",
  );
}

export async function createRobotAuthoringReleaseDraft(
  organizationId: string,
  importId: string,
  request: CreateRobotAuthoringReleaseDraftRequest,
) {
  const response = await axiosClient.post<
    ApiResult<{
      import: RobotAuthoringImportResult;
      configurationRelease: ConfigurationReleaseResult;
    }>
  >(
    `${authoringImportsPath(organizationId)}/${encodeURIComponent(importId)}/create-release-draft`,
    request,
  );
  return unwrapApiResult(
    response.data,
    "Không thể tạo bản nháp cấu hình từ gói đã nhập.",
  );
}
