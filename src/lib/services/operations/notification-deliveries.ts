import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  NotificationDeliveriesPage,
  NotificationDeliveryResult,
  NotificationDeliveryStatus,
} from "@/types/operations/notification-deliveries";

const collectionPath = (organizationId: string) =>
  `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/notification-deliveries`;

function requireData<T>(result: ApiResult<T>, fallbackMessage: string): T {
  if (!result.succeeded || result.data === undefined || result.data === null) {
    throw new Error(result.message || result.businessError || fallbackMessage);
  }
  return result.data;
}

export async function listNotificationDeliveries(
  organizationId: string,
  status?: NotificationDeliveryStatus,
  signal?: AbortSignal,
): Promise<NotificationDeliveriesPage> {
  const response = await axiosClient.get<NotificationDeliveriesPage>(collectionPath(organizationId), {
    params: { status, pageNumber: 1, pageSize: 20 },
    signal,
  });
  if (!response.data.succeeded) throw new Error(response.data.message || "Không thể tải trạng thái gửi thông báo.");
  return response.data;
}

export async function requeueNotificationDelivery(organizationId: string, deliveryId: string, reason: string) {
  const response = await axiosClient.post<ApiResult<NotificationDeliveryResult>>(
    `${collectionPath(organizationId)}/${encodeURIComponent(deliveryId)}/requeue`, { reason },
  );
  return requireData(response.data, "Không thể đưa thông báo vào hàng đợi lại.");
}

export function getNotificationDeliveryErrorMessage(error: unknown, fallbackMessage = "Không thể hoàn tất thao tác gửi thông báo.") {
  if (axios.isCancel(error)) return "";
  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    if (error.response?.status === 403) return "Tài khoản hiện tại không được thực hiện thao tác gửi thông báo này.";
    if (error.response?.status === 409) return error.response.data?.message || "Trạng thái gửi thông báo đã thay đổi. Hãy tải lại trước khi thử lại.";
    return error.response?.data?.message || error.response?.data?.businessError || fallbackMessage;
  }
  return error instanceof Error ? error.message : fallbackMessage;
}
