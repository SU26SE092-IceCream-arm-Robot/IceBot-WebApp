import axiosClient from "@/lib/axios-client";
import { unwrapApiResult } from "@/lib/api/result";
import type { ApiResult } from "@/types";
import type {
  CreateRobotProgramRequest,
  ReplaceRobotProgramArtifactsRequest,
  RobotProgramResult,
  RobotProgramSummaryResult,
  RobotProgramsPage,
  UpdateRobotProgramRequest,
} from "@/types/production/operations";

import { collectPagedResults, OPERATIONS_PAGE_SIZE } from "./shared";
export async function listRobotPrograms(
  organizationId: string,
  signal?: AbortSignal,
) {
  return collectPagedResults<RobotProgramSummaryResult>(async (pageNumber) => {
    const response = await axiosClient.get<RobotProgramsPage>(
      `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/robot-programs`,
      { params: { pageNumber, pageSize: OPERATIONS_PAGE_SIZE }, signal },
    );
    if (!response.data.succeeded)
      throw new Error(
        response.data.message || "Không thể tải chương trình robot.",
      );
    return response.data;
  });
}

export async function createRobotProgram(
  organizationId: string,
  request: CreateRobotProgramRequest,
) {
  const response = await axiosClient.post<ApiResult<RobotProgramResult>>(
    `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/robot-programs`,
    request,
  );
  return unwrapApiResult(response.data, "Không thể tạo chương trình robot.");
}

export async function updateRobotProgram(
  organizationId: string,
  programId: string,
  request: UpdateRobotProgramRequest,
) {
  const response = await axiosClient.put<ApiResult<RobotProgramResult>>(
    `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/robot-programs/${encodeURIComponent(programId)}`,
    request,
  );
  return unwrapApiResult(response.data, "Không thể cập nhật chương trình robot.");
}

export async function getRobotProgram(
  organizationId: string,
  programId: string,
  signal?: AbortSignal,
) {
  const response = await axiosClient.get<ApiResult<RobotProgramResult>>(
    `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/robot-programs/${encodeURIComponent(programId)}`,
    { signal },
  );
  return unwrapApiResult(response.data, "Cannot load robot program.");
}

export async function replaceRobotProgramArtifacts(
  organizationId: string,
  programId: string,
  request: ReplaceRobotProgramArtifactsRequest,
) {
  const response = await axiosClient.put<ApiResult<RobotProgramResult>>(
    `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/robot-programs/${encodeURIComponent(programId)}/artifacts`,
    request,
  );
  return unwrapApiResult(
    response.data,
    "Cannot save robot program artifact order.",
  );
}

export async function changeRobotProgramLifecycle(
  organizationId: string,
  programId: string,
  action: "publish" | "retire" | "discard",
) {
  const path = `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/robot-programs/${encodeURIComponent(programId)}`;
  if (action === "discard") {
    const response = await axiosClient.delete<ApiResult<object>>(path);
    if (!response.data.succeeded) {
      throw new Error(
        response.data.message ||
          response.data.businessError ||
          "Không thể xóa bản nháp chương trình robot.",
      );
    }
    return null;
  }
  const response = await axiosClient.patch<ApiResult<RobotProgramResult>>(
    `${path}/${action}`,
  );
  return unwrapApiResult(
    response.data,
    "Không thể cập nhật vòng đời chương trình robot.",
  );
}
