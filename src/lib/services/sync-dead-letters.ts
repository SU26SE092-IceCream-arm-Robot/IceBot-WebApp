import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  SyncDeadLetterResult,
  SyncDeadLettersPagedResult,
  SyncDeadLettersQuery,
} from "@/types/sync-dead-letters";

const BASE_PATH = "/api/v1/management/sync-dead-letters";

function requirePagedData(result: SyncDeadLettersPagedResult): SyncDeadLettersPagedResult {
  if (!result.succeeded) {
    throw new Error(result.message || "Không thể tải danh sách sự cố đồng bộ.");
  }
  return result;
}

function requireData(result: ApiResult<SyncDeadLetterResult>): SyncDeadLetterResult {
  if (!result.succeeded || !result.data) {
    throw new Error(result.message || "Không thể tải chi tiết sự cố đồng bộ.");
  }
  return result.data;
}

export async function listSyncDeadLetters(
  query: SyncDeadLettersQuery,
  signal?: AbortSignal,
): Promise<SyncDeadLettersPagedResult> {
  const response = await axiosClient.get<SyncDeadLettersPagedResult>(BASE_PATH, {
    params: {
      status: query.status || undefined,
      eventType: query.eventType || undefined,
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
    },
    signal,
  });
  return requirePagedData(response.data);
}

export async function getSyncDeadLetter(
  id: string,
  signal?: AbortSignal,
): Promise<SyncDeadLetterResult> {
  const response = await axiosClient.get<ApiResult<SyncDeadLetterResult>>(
    `${BASE_PATH}/${encodeURIComponent(id)}`,
    { signal },
  );
  return requireData(response.data);
}
