import axiosClient from "@/lib/axios-client";
import { unwrapApiResult } from "@/lib/api/result";
import type { ApiResult } from "@/types";
import type {
  ConfigurationReleaseAuthoringOptions,
  ConfigurationReleaseResult,
  ConfigurationReleaseRouteRequest,
  ConfigurationReleasesPage,
  ConfigurationReleaseSummaryResult,
} from "@/types/production/operations";

import { collectPagedResults, OPERATIONS_PAGE_SIZE } from "./shared";
export async function listConfigurationReleases(
  organizationId: string,
  signal?: AbortSignal,
) {
  return collectPagedResults<ConfigurationReleaseSummaryResult>(
    async (pageNumber) => {
      const response = await axiosClient.get<ConfigurationReleasesPage>(
        `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/configuration-releases`,
        { params: { pageNumber, pageSize: OPERATIONS_PAGE_SIZE }, signal },
      );
      if (!response.data.succeeded)
        throw new Error(
          response.data.message || "Không thể tải bản phát hành cấu hình.",
        );
      return response.data;
    },
  );
}

export async function getConfigurationReleaseAuthoringOptions(
  organizationId: string,
  signal?: AbortSignal,
) {
  const response = await axiosClient.get<
    ApiResult<ConfigurationReleaseAuthoringOptions>
  >(
    `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/configuration-releases/authoring-options`,
    { signal },
  );
  return unwrapApiResult(
    response.data,
    "Không thể tải dữ liệu soạn bản phát hành.",
  );
}


export async function createConfigurationRelease(organizationId: string) {
  const response = await axiosClient.post<
    ApiResult<ConfigurationReleaseResult>
  >(
    `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/configuration-releases`,
  );
  return unwrapApiResult(response.data, "Không thể tạo bản nháp cấu hình.");
}

export async function replaceConfigurationReleaseRoutes(
  organizationId: string,
  releaseId: string,
  expectedRevision: string,
  routes: ConfigurationReleaseRouteRequest[],
) {
  const response = await axiosClient.put<ApiResult<ConfigurationReleaseResult>>(
    `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/configuration-releases/${encodeURIComponent(releaseId)}/routes`,
    { expectedRevision, routes },
  );
  return unwrapApiResult(response.data, "Không thể cập nhật tuyến sản xuất.");
}

export async function publishConfigurationRelease(
  organizationId: string,
  releaseId: string,
) {
  const response = await axiosClient.patch<
    ApiResult<ConfigurationReleaseResult>
  >(
    `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/configuration-releases/${encodeURIComponent(releaseId)}/publish`,
  );
  return unwrapApiResult(response.data, "Không thể phát hành cấu hình.");
}

export async function retireConfigurationRelease(
  organizationId: string,
  releaseId: string,
) {
  const response = await axiosClient.patch<
    ApiResult<ConfigurationReleaseResult>
  >(
    `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/configuration-releases/${encodeURIComponent(releaseId)}/retire`,
  );
  return unwrapApiResult(response.data, "Không thể ngừng sử dụng bản phát hành.");
}

export async function discardConfigurationRelease(
  organizationId: string,
  releaseId: string,
) {
  const response = await axiosClient.delete<ApiResult<object>>(
    `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/configuration-releases/${encodeURIComponent(releaseId)}`,
  );
  if (!response.data.succeeded) {
    throw new Error(
      response.data.message ||
        response.data.businessError ||
        "Không thể xóa bản nháp cấu hình.",
    );
  }
}


export async function getConfigurationRelease(
  organizationId: string,
  releaseId: string,
  signal?: AbortSignal,
) {
  const response = await axiosClient.get<ApiResult<ConfigurationReleaseResult>>(
    `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/configuration-releases/${encodeURIComponent(releaseId)}`,
    { signal },
  );
  return unwrapApiResult(
    response.data,
    "Không thể tải chi tiết bản phát hành cấu hình.",
  );
}

