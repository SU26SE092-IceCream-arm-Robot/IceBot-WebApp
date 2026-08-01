import { API_BASE_URL } from "@/lib/api-base-url";

export function getOperationsHubUrl(): string {
  if (API_BASE_URL === "/api/backend") {
    return "/api/backend/hubs/operations";
  }

  return `${API_BASE_URL.replace(/\/api(?:\/v1)?$/, "")}/hubs/operations`;
}
