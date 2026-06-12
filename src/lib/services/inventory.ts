import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  DispenserStateResult,
  InventoryPagedResult,
  InventoryQuery,
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

export function getInventoryErrorMessage(
  error: unknown,
  fallbackMessage = "Không thể tải dữ liệu tồn kho.",
): string {
  if (axios.isCancel(error)) {
    return "";
  }

  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    if (error.response?.status === 403) {
      return "Tài khoản hiện tại không có quyền xem dữ liệu tồn kho.";
    }

    return error.response?.data?.message || fallbackMessage;
  }

  return error instanceof Error ? error.message : fallbackMessage;
}
