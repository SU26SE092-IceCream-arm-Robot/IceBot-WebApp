import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  AdjustDispenserEstimateRequest,
  DispenserHistoryResult,
  DispenserStateResult,
  InventoryPagedResult,
  InventoryQuery,
  KioskInventoryTopologyResult,
  RefillDispenserRequest,
  StockMovementResult,
} from "@/types/inventory-management";

function buildInventoryParams(query: InventoryQuery) {
  return {
    organizationId: query.organizationId,
    storeId: query.storeId,
    kioskId: query.kioskId,
    pageNumber: query.pageNumber,
    pageSize: query.pageSize,
  };
}

function requirePagedData<T>(
  result: InventoryPagedResult<T>,
  fallbackMessage: string,
): InventoryPagedResult<T> {
  if (!result.succeeded) {
    throw new Error(result.message || fallbackMessage);
  }

  return result;
}

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
  if (!result.succeeded || result.data === null || result.data === undefined) {
    throw new Error(getApiResultMessage(result, fallbackMessage));
  }

  return result.data;
}

export async function listDispenserStates(
  query: InventoryQuery,
  signal?: AbortSignal,
): Promise<InventoryPagedResult<DispenserStateResult>> {
  const response = await axiosClient.get<
    InventoryPagedResult<DispenserStateResult>
  >("/api/v1/management/inventory/dispenser-states", {
    params: buildInventoryParams(query),
    signal,
  });

  return requirePagedData(
    response.data,
    "Không thể tải trạng thái bộ phân phối nguyên liệu.",
  );
}

export async function listStockMovements(
  query: InventoryQuery,
  signal?: AbortSignal,
): Promise<InventoryPagedResult<StockMovementResult>> {
  const response = await axiosClient.get<
    InventoryPagedResult<StockMovementResult>
  >("/api/v1/management/inventory/stock-movements", {
    params: buildInventoryParams(query),
    signal,
  });

  return requirePagedData(
    response.data,
    "Không thể tải lịch sử biến động tồn kho.",
  );
}

export async function listDispenserHistory(
  kioskId: string,
  dispenserStateId: string,
  query: Pick<InventoryQuery, "pageNumber" | "pageSize">,
  signal?: AbortSignal,
): Promise<InventoryPagedResult<DispenserHistoryResult>> {
  const response = await axiosClient.get<
    InventoryPagedResult<DispenserHistoryResult>
  >(
    `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/inventory/dispenser-states/${encodeURIComponent(dispenserStateId)}/history`,
    {
      params: {
        pageNumber: query.pageNumber,
        pageSize: query.pageSize,
      },
      signal,
    },
  );

  return requirePagedData(
    response.data,
    "Không thể tải lịch sử bộ phân phối.",
  );
}

export async function getKioskInventoryTopology(
  kioskId: string,
  signal?: AbortSignal,
): Promise<KioskInventoryTopologyResult> {
  const response = await axiosClient.get<
    ApiResult<KioskInventoryTopologyResult>
  >(
    `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/inventory/topology`,
    { signal },
  );

  return requireData(
    response.data,
    "Không thể tải chẩn đoán cấu hình tồn kho của kiosk.",
  );
}

export async function refillDispenserState(
  kioskId: string,
  id: string,
  request: RefillDispenserRequest,
): Promise<DispenserStateResult> {
  const response = await axiosClient.post<ApiResult<DispenserStateResult>>(
    `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/inventory/dispenser-states/${encodeURIComponent(id)}/refill`,
    request,
  );

  return requireData(
    response.data,
    "Không thể ghi nhận lượng nguyên liệu vừa nạp thêm.",
  );
}

export async function adjustDispenserEstimate(
  kioskId: string,
  id: string,
  request: AdjustDispenserEstimateRequest,
): Promise<DispenserStateResult> {
  const response = await axiosClient.post<ApiResult<DispenserStateResult>>(
    `/api/v1/management/kiosks/${encodeURIComponent(kioskId)}/inventory/dispenser-states/${encodeURIComponent(id)}/adjust-estimate`,
    request,
  );

  return requireData(
    response.data,
    "Không thể điều chỉnh lượng tồn kho ước tính.",
  );
}

export function getInventoryErrorMessage(
  error: unknown,
  fallbackMessage = "Không thể tải dữ liệu tồn kho.",
): string {
  if (axios.isCancel(error)) {
    return "";
  }

  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    if (error.response?.status === 403) {
      return "Tài khoản hiện tại không có quyền truy cập hoặc thao tác dữ liệu tồn kho.";
    }

    return getApiResultMessage(error.response?.data, fallbackMessage);
  }

  return error instanceof Error ? error.message : fallbackMessage;
}
