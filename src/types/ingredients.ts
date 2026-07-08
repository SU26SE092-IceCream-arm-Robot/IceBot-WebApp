import type { PaginationMeta, PagedResult } from "@/types/accounts";

export interface IngredientResult {
  id: string;
  code: string;
  name: string;
  ingredientType: string;
  unit: string;
  description?: string | null;
  storageRequirement?: string | null;
  isPerishable: boolean;
  isAllergen: boolean;
  shelfLifeDays?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface IngredientsQuery {
  search?: string;
  isActive?: boolean;
  pageNumber: number;
  pageSize: number;
}

export type IngredientsPagination = PaginationMeta;
export type IngredientsPagedResult = PagedResult<IngredientResult>;
