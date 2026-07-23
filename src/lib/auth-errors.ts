import axios from "axios";

export class InvalidAuthSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAuthSessionError";
  }
}

export function isInvalidAuthSessionError(error: unknown): boolean {
  return (
    error instanceof InvalidAuthSessionError ||
    (axios.isAxiosError(error) && error.response?.status === 401)
  );
}

export function getAuthRestoreErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") {
      return "Kết nối xác thực đã hết thời gian chờ. Vui lòng thử lại.";
    }

    if (!error.response) {
      return "Không thể kết nối tới máy chủ để xác minh phiên đăng nhập.";
    }

    if (error.response.status >= 500) {
      return "Máy chủ tạm thời không thể xác minh phiên đăng nhập.";
    }
  }

  return "Không thể xác minh phiên đăng nhập lúc này. Vui lòng thử lại.";
}
