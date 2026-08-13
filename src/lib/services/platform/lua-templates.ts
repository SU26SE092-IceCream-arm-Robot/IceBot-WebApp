import axiosClient from "@/lib/axios-client";
import { unwrapApiResult, unwrapPagedApiResult } from "@/lib/api/result";
import type { ApiResult } from "@/types";
import type {
  BulkLuaTemplateUploadResult,
  LuaTemplateResult,
  LuaTemplateReviewUrlResult,
  LuaTemplatesPage,
  TechnicalContractsPage,
  UploadLuaTemplateRequest,
} from "@/types/platform/lua-templates";

const templatesPath = "/api/v1/management/robot-artifact-templates";
const contractsPath = "/api/v1/management/robot-artifact-template-contracts";

export async function listLuaTemplates(
  query: { search?: string; status?: string; pageNumber: number; pageSize: number },
  signal?: AbortSignal,
) {
  const response = await axiosClient.get<LuaTemplatesPage>(templatesPath, {
    params: {
      ...(query.search?.trim() ? { search: query.search.trim() } : {}),
      ...(query.status && query.status !== "ALL" ? { status: query.status } : {}),
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
    },
    signal,
  });
  return unwrapPagedApiResult(response.data, "Không thể tải mẫu LUA hệ thống.");
}

export async function listPublishedTechnicalContracts(signal?: AbortSignal) {
  const response = await axiosClient.get<TechnicalContractsPage>(contractsPath, {
    params: { status: "Published", pageNumber: 1, pageSize: 100 },
    signal,
  });
  return unwrapPagedApiResult(
    response.data,
    "Không thể tải hợp đồng kỹ thuật đã phát hành.",
  );
}

export async function uploadLuaTemplate(request: UploadLuaTemplateRequest) {
  const formData = new FormData();
  formData.append("files", request.file);
  formData.append(
    "manifestJson",
    JSON.stringify([
      {
        fileName: request.file.name,
        templateCode: request.templateCode.trim(),
        templateName: request.templateName.trim(),
        runtimeTargetCode: request.runtimeTargetCode.trim(),
        machineModelCode: request.machineModelCode.trim(),
        description: request.description?.trim() || null,
      },
    ]),
  );
  const response = await axiosClient.post<ApiResult<BulkLuaTemplateUploadResult>>(
    templatesPath,
    formData,
  );
  return unwrapApiResult(response.data, "Không thể tải lên mẫu LUA.");
}

export async function createLuaTemplateReviewUrl(templateId: string) {
  const response = await axiosClient.post<ApiResult<LuaTemplateReviewUrlResult>>(
    `${templatesPath}/${encodeURIComponent(templateId)}/review-url`,
  );
  return unwrapApiResult(response.data, "Không thể mở nội dung mẫu LUA.");
}

export async function assignLuaTemplateTechnicalContract(
  templateId: string,
  technicalContractId: string,
) {
  const response = await axiosClient.put<ApiResult<LuaTemplateResult>>(
    `${templatesPath}/${encodeURIComponent(templateId)}/technical-contract`,
    { technicalContractId },
  );
  return unwrapApiResult(response.data, "Không thể gán hợp đồng kỹ thuật.");
}

export async function changeLuaTemplateLifecycle(
  templateId: string,
  action: "publish" | "retire" | "discard",
) {
  const path = `${templatesPath}/${encodeURIComponent(templateId)}`;
  if (action === "discard") {
    const response = await axiosClient.delete<ApiResult<object>>(path);
    return unwrapApiResult(response.data, "Không thể xóa bản nháp mẫu LUA.");
  }
  const response = await axiosClient.patch<ApiResult<LuaTemplateResult>>(
    `${path}/${action}`,
  );
  return unwrapApiResult(response.data, "Không thể cập nhật trạng thái mẫu LUA.");
}
