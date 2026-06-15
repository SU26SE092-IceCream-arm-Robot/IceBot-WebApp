const LOCAL_PROXY_BASE_URL = "/api/backend";
const DEFAULT_API_BASE_URL = LOCAL_PROXY_BASE_URL;

function removeTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

export const API_BASE_URL = removeTrailingSlashes(
  process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_BASE_URL,
);

export function normalizeApiRequestPath(url?: string): string | undefined {
  if (API_BASE_URL !== LOCAL_PROXY_BASE_URL || !url?.startsWith("/api/")) {
    return url;
  }

  return url.slice("/api".length);
}
