import axiosClient from "@/lib/axios-client";
import { unwrapApiResult } from "@/lib/api/result";
import type { ApiResult } from "@/types";
import type {
  CreateProductionProgramBindingRequest,
  ProductionProgramBindingResult,
} from "@/types/production/operations";
export async function listProductionProgramBindings(
  organizationId: string,
  signal?: AbortSignal,
) {
  const response = await axiosClient.get<
    ApiResult<ProductionProgramBindingResult[]>
  >(
    `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/production-program-bindings`,
    { signal },
  );
  return unwrapApiResult(
    response.data,
    "Không thể tải liên kết chương trình sản xuất.",
  );
}

export async function createProductionProgramBinding(
  organizationId: string,
  request: CreateProductionProgramBindingRequest,
) {
  const response = await axiosClient.post<
    ApiResult<ProductionProgramBindingResult>
  >(
    `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/production-program-bindings`,
    request,
  );
  return unwrapApiResult(
    response.data,
    "Không thể tạo liên kết chương trình sản xuất.",
  );
}

export async function retireProductionProgramBinding(
  organizationId: string,
  bindingId: string,
) {
  const response = await axiosClient.patch<
    ApiResult<ProductionProgramBindingResult>
  >(
    `/api/v1/management/organizations/${encodeURIComponent(organizationId)}/production-program-bindings/${encodeURIComponent(bindingId)}/retire`,
  );
  return unwrapApiResult(
    response.data,
    "Không thể ngừng sử dụng liên kết chương trình sản xuất.",
  );
}
