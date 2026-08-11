import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type {
  OperationLogsPagedResult,
  OperationLogsQuery,
} from "@/types/operations/logs";

export async function listKioskOperationLogs(
  kioskId: string,
  query: OperationLogsQuery,
  signal?: AbortSignal,
): Promise<OperationLogsPagedResult> {
  const response = await axiosClient.get<OperationLogsPagedResult>(
    `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/operation-logs`,
    { params: query, signal },
  );

  if (!response.data.succeeded) {
    throw new Error(
      response.data.message || "Không thể tải nhật ký vận hành kiosk.",
    );
  }

  return response.data;
}

export function getOperationLogsErrorMessage(error: unknown): string {
  if (axios.isCancel(error)) return "";
  if (axios.isAxiosError<OperationLogsPagedResult>(error)) {
    if (error.response?.status === 403) {
      return "Tài khoản hiện tại không có quyền xem nhật ký vận hành kiosk.";
    }
    return (
      error.response?.data?.message || "Không thể tải nhật ký vận hành kiosk."
    );
  }
  return error instanceof Error
    ? error.message
    : "Không thể tải nhật ký vận hành kiosk.";
}
