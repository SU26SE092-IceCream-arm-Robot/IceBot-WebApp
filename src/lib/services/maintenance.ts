import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  AssignMaintenanceTicketRequest,
  CancelMaintenanceTicketRequest,
  CreateMaintenanceTicketRequest,
  ManagementMaintenanceTicketsQuery,
  MaintenancePagedResult,
  MaintenanceTicketResult,
  ResolveMaintenanceTicketRequest,
  UpdateMaintenanceTicketRequest,
} from "@/types/maintenance";

function getApiResultMessage(
  result: ApiResult<unknown> | undefined,
  fallbackMessage: string,
): string {
  if (!result) {
    return fallbackMessage;
  }

  const validationMessages = Object.values(result.validationErrors ?? {}).flat();
  if (validationMessages.length > 0) {
    return validationMessages.join(" ");
  }

  return result.message || result.businessError || fallbackMessage;
}

function requireData<T>(result: ApiResult<T>, fallbackMessage: string): T {
  if (!result.succeeded || !result.data) {
    throw new Error(getApiResultMessage(result, fallbackMessage));
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

export async function createManagementMaintenanceTicket(
  request: CreateMaintenanceTicketRequest,
): Promise<MaintenanceTicketResult> {
  const response = await axiosClient.post<ApiResult<MaintenanceTicketResult>>(
    "/api/v1/management/maintenance-tickets",
    request,
  );

  return requireData(response.data, "Không thể tạo yêu cầu bảo trì.");
}

export async function updateManagementMaintenanceTicket(
  ticketId: string,
  request: UpdateMaintenanceTicketRequest,
): Promise<MaintenanceTicketResult> {
  const response = await axiosClient.put<ApiResult<MaintenanceTicketResult>>(
    `/api/v1/management/maintenance-tickets/${encodeURIComponent(ticketId)}`,
    request,
  );

  return requireData(response.data, "Không thể cập nhật yêu cầu bảo trì.");
}

export async function assignManagementMaintenanceTicket(
  ticketId: string,
  request: AssignMaintenanceTicketRequest,
): Promise<MaintenanceTicketResult> {
  const response = await axiosClient.patch<ApiResult<MaintenanceTicketResult>>(
    `/api/v1/management/maintenance-tickets/${encodeURIComponent(ticketId)}/assign`,
    request,
  );

  return requireData(response.data, "Không thể phân công yêu cầu bảo trì.");
}

export async function startManagementMaintenanceTicket(
  ticketId: string,
): Promise<MaintenanceTicketResult> {
  const response = await axiosClient.patch<ApiResult<MaintenanceTicketResult>>(
    `/api/v1/management/maintenance-tickets/${encodeURIComponent(ticketId)}/start`,
  );

  return requireData(response.data, "Không thể bắt đầu xử lý yêu cầu bảo trì.");
}

export async function resolveManagementMaintenanceTicket(
  ticketId: string,
  request: ResolveMaintenanceTicketRequest,
): Promise<MaintenanceTicketResult> {
  const response = await axiosClient.patch<ApiResult<MaintenanceTicketResult>>(
    `/api/v1/management/maintenance-tickets/${encodeURIComponent(ticketId)}/resolve`,
    request,
  );

  return requireData(response.data, "Không thể hoàn tất xử lý yêu cầu bảo trì.");
}

export async function closeManagementMaintenanceTicket(
  ticketId: string,
): Promise<MaintenanceTicketResult> {
  const response = await axiosClient.patch<ApiResult<MaintenanceTicketResult>>(
    `/api/v1/management/maintenance-tickets/${encodeURIComponent(ticketId)}/close`,
  );

  return requireData(response.data, "Không thể đóng yêu cầu bảo trì.");
}

export async function cancelManagementMaintenanceTicket(
  ticketId: string,
  request: CancelMaintenanceTicketRequest,
): Promise<MaintenanceTicketResult> {
  const response = await axiosClient.patch<ApiResult<MaintenanceTicketResult>>(
    `/api/v1/management/maintenance-tickets/${encodeURIComponent(ticketId)}/cancel`,
    request,
  );

  return requireData(response.data, "Không thể hủy yêu cầu bảo trì.");
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
      return "Tài khoản hiện tại không có quyền truy cập hoặc thao tác dữ liệu bảo trì.";
    }

    return getApiResultMessage(error.response?.data, fallbackMessage);
  }

  return error instanceof Error ? error.message : fallbackMessage;
}
