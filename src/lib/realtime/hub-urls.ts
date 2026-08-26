import { API_BASE_URL } from "@/lib/api-base-url";

function resolveHubUrl(path: string): string {
  if (API_BASE_URL === "/api/backend") {
    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "http://localhost:3000";
    return `${origin}/api/backend/hubs/${path}`;
  }

  return `${API_BASE_URL.replace(/\/api(?:\/v1)?$/, "")}/hubs/${path}`;
}

export function getManagementDashboardHubUrl(): string {
  return resolveHubUrl("management-dashboard");
}

export function getOperationsHubUrl(): string {
  return resolveHubUrl("operations");
}

export function getOrdersHubUrl(): string {
  return resolveHubUrl("orders");
}
