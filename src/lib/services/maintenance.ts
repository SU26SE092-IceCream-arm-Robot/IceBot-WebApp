import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  ManagementMaintenanceTicketsQuery,
  MaintenancePagedResult,
  MaintenanceTicketResult,
} from "@/types/maintenance";

function requireData<T>(result: ApiResult<T>, fallbackMessage: string): T {
  if (!result.succeeded || !result.data) {
    throw new Error(result.message || fallbackMessage);
  }

  return result.data;
}

function requirePagedData<T>(
  result: MaintenancePagedResult<T>,
  fallbackMessage: string,
): MaintenancePagedResult<T> {
  if (!result.succeeded) {
    throw new Error(result.message || fallbackMessage);
  }

  return result;
}

function buildMaintenanceParams(query: ManagementMaintenanceTicketsQuery) {
  return {
    status: query.status,
    priority: query.priority,
    organizationId: query.organizationId,
    storeId: query.storeId,
    kioskId: query.kioskId,
    assignedToAccountId: query.assignedToAccountId,
    createdByAccountId: query.createdByAccountId,
    fromDate: query.fromDate,
    toDate: query.toDate,
    pageNumber: query.pageNumber,
    pageSize: query.pageSize,
  };
}

export async function listManagementMaintenanceTickets(
  query: ManagementMaintenanceTicketsQuery,
  signal?: AbortSignal,
): Promise<MaintenancePagedResult<MaintenanceTicketResult>> {
  const response = await axiosClient.get<
    MaintenancePagedResult<MaintenanceTicketResult>
  >("/api/v1/management/maintenance-tickets", {
    params: buildMaintenanceParams(query),
    signal,
  });

  return requirePagedData(
    response.data,
    "Không thể tải danh sách yêu cầu bảo trì.",
  );
}

export async function getManagementMaintenanceTicketById(
  ticketId: string,
  signal?: AbortSignal,
): Promise<MaintenanceTicketResult> {
  const response = await axiosClient.get<ApiResult<MaintenanceTicketResult>>(
    `/api/v1/management/maintenance-tickets/${encodeURIComponent(ticketId)}`,
    { signal },
  );

  return requireData(response.data, "Không thể tải chi tiết yêu cầu bảo trì.");
}

export function getMaintenanceErrorMessage(
  error: unknown,
  fallbackMessage = "Không thể tải dữ liệu bảo trì.",
): string {
  if (axios.isCancel(error)) {
    return "";
  }

  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    if (error.response?.status === 403) {
      return "Tài khoản hiện tại không có quyền xem dữ liệu bảo trì.";
    }

    return error.response?.data?.message || fallbackMessage;
  }

  return error instanceof Error ? error.message : fallbackMessage;
}
