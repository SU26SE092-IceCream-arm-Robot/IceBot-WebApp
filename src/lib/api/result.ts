import type { ApiResult } from "@/types";

export function getApiResultMessage(
  result: ApiResult<unknown> | undefined,
  fallbackMessage: string,
): string {
  if (!result) return fallbackMessage;

  const validationMessages = Object.values(result.validationErrors ?? {}).flat();
  if (validationMessages.length > 0) return validationMessages.join(" ");

  return result.message || result.businessError || fallbackMessage;
}

export function unwrapApiResult<T>(
  result: ApiResult<T>,
  fallbackMessage: string,
): T {
  if (!result.succeeded || result.data === undefined || result.data === null) {
    throw new Error(getApiResultMessage(result, fallbackMessage));
  }

  return result.data;
}

export function unwrapPagedApiResult<T extends ApiResult<unknown>>(
  result: T,
  fallbackMessage: string,
): T {
  if (!result.succeeded || result.data === undefined || result.data === null) {
    throw new Error(getApiResultMessage(result, fallbackMessage));
  }

  return result;
}
