import { API_BASE_URL } from "@/lib/api-base-url";

export function getOperationsHubUrl(): string {
  if (API_BASE_URL === "/api/backend") {
    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "http://localhost:3000";
    return `${origin}/api/backend/hubs/operations`;
  }

  return `${API_BASE_URL.replace(/\/api(?:\/v1)?$/, "")}/hubs/operations`;
}
