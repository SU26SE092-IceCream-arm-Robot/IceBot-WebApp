import axios from "axios";

import type { ApiResult } from "@/types";
export function getProductionOperationsErrorMessage(
  error: unknown,
  fallbackMessage: string,
) {
  if (axios.isCancel(error)) return "";
  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    if (error.response?.status === 403)
      return "Tài khoản hiện tại không có quyền thực hiện thao tác này trong phạm vi đã chọn.";
    if (error.response?.status === 409)
      return (
        error.response.data?.message ||
        "Dữ liệu đã thay đổi. Hãy tải lại trước khi tiếp tục."
      );
    const validationMessages = Object.values(
      error.response?.data?.validationErrors ?? {},
    ).flat();
    if (validationMessages.length > 0) return validationMessages[0];
    return (
      error.response?.data?.message ||
      error.response?.data?.businessError ||
      fallbackMessage
    );
  }
  return error instanceof Error ? error.message : fallbackMessage;
}
