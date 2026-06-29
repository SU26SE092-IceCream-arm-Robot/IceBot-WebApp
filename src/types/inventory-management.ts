import type { PaginationMeta, PagedResult } from "@/types/accounts";

export type IngredientLevelStatus = "Unknown" | "Low" | "Medium" | "Full";

export type InventoryStatusFilter = "ALL" | IngredientLevelStatus;

export type InventoryMutationKind = "refill" | "adjust";

export interface RefillDispenserRequest {
  quantity: number;
  reportedLevelAfter?: IngredientLevelStatus | null;
  reasonCode?: string | null;
}

export interface AdjustDispenserEstimateRequest {
  estimatedQuantity: number;
  reasonCode?: string | null;
}

export interface DispenserStateResult {
  id: string;
  deviceId: string;
  deviceCode: string;
  kioskId?: string | null;
  kioskName?: string | null;
  ingredientId: string;
  ingredientName: string;
  ingredientCode: string;
  containerCode: string;
  currentLevelStatus: IngredientLevelStatus;
  estimatedQuantity?: number | null;
  capacityQuantity?: number | null;
  unit: string;
  lastMeasuredAt: string;
  lastRefilledAt?: string | null;
}

export interface StockMovementResult {
  id: string;
  ingredientDispenserStateId: string;
  containerCode: string;
  kioskId?: string | null;
  kioskName?: string | null;
  ingredientId?: string | null;
  ingredientName?: string | null;
  movementType: string;
  quantity: number;
  balanceAfter?: number | null;
  unit: string;
  reasonCode?: string | null;
  notes?: string | null;
  occurredAt: string;
}

export interface InventoryQuery {
  organizationId?: string;
  storeId?: string;
  kioskId?: string;
  pageNumber: number;
  pageSize: number;
}

export interface InventoryFilters {
  ingredientSearch: string;
  status: InventoryStatusFilter;
  storeId: string;
  kioskId: string;
}

export interface InventorySummary {
  total: number;
  lowOnPage: number;
  fullOnPage: number;
  unknownOnPage: number;
}

export type InventoryPaginationMeta = PaginationMeta;

export type InventoryPagedResult<T> = PagedResult<T>;
