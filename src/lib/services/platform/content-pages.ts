import axiosClient from "@/lib/axios-client";
import { unwrapApiResult } from "@/lib/api/result";
import type { ApiResult } from "@/types";
import type {
  ContentPageDetailResult,
  ContentPageResult,
  PublishContentPageRequest,
  PublicContentPageResult,
  SaveContentPageDraftRequest,
} from "@/types/platform/content-pages";

const publicPath = "/api/v1/content-pages";
const managementPath = "/api/v1/management/content-pages";

/**
 * Fetches published content page by slug for public display.
 */
export async function getPublicContentPage(
  slug: string,
  signal?: AbortSignal,
): Promise<PublicContentPageResult> {
  const response = await axiosClient.get<
    PublicContentPageResult | ApiResult<PublicContentPageResult>
  >(`${publicPath}/${encodeURIComponent(slug)}`, { signal });

  const rawData = response.data;
  if (!rawData) {
    throw new Error("Không thể tải nội dung trang công khai.");
  }

  // Handle both direct object payload and ApiResult envelope
  if (
    typeof rawData === "object" &&
    "succeeded" in rawData &&
    typeof (rawData as ApiResult<PublicContentPageResult>).succeeded === "boolean"
  ) {
    return unwrapApiResult(
      rawData as ApiResult<PublicContentPageResult>,
      "Không thể tải nội dung trang công khai.",
    );
  }

  return rawData as PublicContentPageResult;
}

/**
 * Fetches all managed static content pages for SystemAdmin.
 */
export async function listManagementContentPages(
  signal?: AbortSignal,
): Promise<ContentPageResult[]> {
  const response = await axiosClient.get<ApiResult<ContentPageResult[]>>(
    managementPath,
    { signal },
  );
  return unwrapApiResult(
    response.data,
    "Không thể tải danh sách trang nội dung.",
  );
}

/**
 * Fetches a single managed content page by key with draft and revision details.
 */
export async function getManagementContentPage(
  key: string,
  signal?: AbortSignal,
): Promise<ContentPageDetailResult> {
  const response = await axiosClient.get<ApiResult<ContentPageDetailResult>>(
    `${managementPath}/${encodeURIComponent(key)}`,
    { signal },
  );
  return unwrapApiResult(
    response.data,
    "Không thể tải chi tiết trang nội dung.",
  );
}

/**
 * Saves draft title and body HTML for a content page with expectedRevision.
 */
export async function saveContentPageDraft(
  key: string,
  request: SaveContentPageDraftRequest,
): Promise<ContentPageResult> {
  const payload = {
    title: request.title.trim(),
    bodyHtml: request.bodyHtml,
    expectedRevision: request.expectedRevision ?? 0,
  };

  const response = await axiosClient.put<ApiResult<ContentPageResult>>(
    `${managementPath}/${encodeURIComponent(key)}/draft`,
    payload,
  );
  return unwrapApiResult(
    response.data,
    "Không thể lưu bản nháp trang nội dung.",
  );
}

/**
 * Publishes the current draft of a content page with expectedRevision.
 */
export async function publishContentPage(
  key: string,
  request: PublishContentPageRequest,
): Promise<ContentPageResult> {
  const payload = {
    expectedRevision: request.expectedRevision ?? 0,
  };

  const response = await axiosClient.post<ApiResult<ContentPageResult>>(
    `${managementPath}/${encodeURIComponent(key)}/publish`,
    payload,
  );
  return unwrapApiResult(
    response.data,
    "Không thể xuất bản trang nội dung.",
  );
}
