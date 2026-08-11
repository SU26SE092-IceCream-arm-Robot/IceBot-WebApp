import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  FranchiseOnboardingResult,
  FranchiseOnboardingsPage,
  FranchiseOnboardingStatus,
  StartFranchiseOnboardingRequest,
} from "@/types/tenants/franchise-onboarding";

const collectionPath = (organizationId: string) =>
  `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/franchise-onboardings`;

function requireData<T>(result: ApiResult<T>, fallbackMessage: string): T {
  if (!result.succeeded || result.data === undefined || result.data === null) {
    throw new Error(result.message || result.businessError || fallbackMessage);
  }
  return result.data;
}

export async function listFranchiseOnboardings(
  organizationId: string,
  status?: FranchiseOnboardingStatus,
  signal?: AbortSignal,
): Promise<FranchiseOnboardingsPage> {
  const response = await axiosClient.get<FranchiseOnboardingsPage>(collectionPath(organizationId), {
    params: { status, pageNumber: 1, pageSize: 20 },
    signal,
  });
  if (!response.data.succeeded) {
    throw new Error(response.data.message || "Không thể tải lịch sử thiết lập điểm bán.");
  }
  return response.data;
}

export async function startFranchiseOnboarding(
  organizationId: string,
  idempotencyKey: string,
  request: StartFranchiseOnboardingRequest,
): Promise<FranchiseOnboardingResult> {
  const response = await axiosClient.post<ApiResult<FranchiseOnboardingResult>>(
    collectionPath(organizationId), request, { headers: { "Idempotency-Key": idempotencyKey } },
  );
  return requireData(response.data, "Không thể bắt đầu thiết lập điểm bán.");
}

export async function resumeFranchiseOnboarding(organizationId: string, onboardingId: string) {
  const response = await axiosClient.post<ApiResult<FranchiseOnboardingResult>>(
    `${collectionPath(organizationId)}/${encodeURIComponent(onboardingId)}/resume`,
  );
  return requireData(response.data, "Không thể tiếp tục thiết lập điểm bán.");
}

export async function cancelFranchiseOnboarding(organizationId: string, onboardingId: string, reason: string) {
  const response = await axiosClient.post<ApiResult<FranchiseOnboardingResult>>(
    `${collectionPath(organizationId)}/${encodeURIComponent(onboardingId)}/cancel`, { reason },
  );
  return requireData(response.data, "Không thể hủy quy trình thiết lập điểm bán.");
}

export function getFranchiseOnboardingErrorMessage(error: unknown, fallbackMessage = "Không thể hoàn tất thao tác thiết lập điểm bán.") {
  if (axios.isCancel(error)) return "";
  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    if (error.response?.status === 403) return "Tài khoản hiện tại không được quản lý quy trình thiết lập trong tổ chức này.";
    if (error.response?.status === 409) return error.response.data?.message || "Trạng thái thiết lập đã thay đổi. Hãy tải lại trước khi thử lại.";
    return error.response?.data?.message || error.response?.data?.businessError || fallbackMessage;
  }
  return error instanceof Error ? error.message : fallbackMessage;
}
