import type { ApiResult } from "@/types";

export type TenantScopeType = "Global" | "Organization" | "Store" | "Kiosk" | "Device";

export type MenuStatus = "Draft" | "Active" | "Paused" | "Archived";

export type MenuItemStatus = "Draft" | "Active" | "Unavailable" | "Archived";

export type FulfillmentType = "Manual" | "Packaged" | "MachineProduced";

export interface ProductVariantResult {
  id: string;
  productId: string;
  code: string;
  name: string;
  displayName?: string | null;
  description?: string | null;
  variantType: string;
  fulfillmentType: FulfillmentType;
  sizeCode?: string | null;
  basePrice: number;
  currency: string;
  isAvailable: boolean;
  displayOrder: number;
  preparationTimeSeconds?: number | null;
  imageUrl?: string | null;
  metadataJson?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ProductResult {
  id: string;
  organizationId?: string | null;
  storeId?: string | null;
  kioskId?: string | null;
  templateProductId?: string | null;
  categoryId?: number | null;
  code: string;
  name: string;
  displayName?: string | null;
  description?: string | null;
  productType: string;
  basePrice: number;
  currency: string;
  isAvailable: boolean;
  preparationTimeSeconds?: number | null;
  imageUrl?: string | null;
  metadataJson?: string | null;
  scopeType: TenantScopeType;
  createdAt: string;
  updatedAt?: string | null;
  variants: ProductVariantResult[];
}

export interface MenuItemResult {
  id: string;
  menuId: string;
  productId: string;
  productVariantId: string;
  recipeId?: string | null;
  code: string;
  displayName: string;
  description?: string | null;
  status: MenuItemStatus;
  price: number;
  discountAmount: number;
  currency: string;
  displayOrder: number;
  preparationTimeSeconds?: number | null;
  imageUrl?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  metadataSchemaVersion: number;
  metadataJson?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface MenuResult {
  id: string;
  organizationId?: string | null;
  storeId?: string | null;
  kioskId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  status: MenuStatus;
  scopeType: TenantScopeType;
  currency: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  displayOrder: number;
  metadataSchemaVersion: number;
  metadataJson?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  items: MenuItemResult[];
}

export interface MenuManagementPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface MenuManagementPagedResult<T> extends ApiResult<T[]> {
  pagination: MenuManagementPagination;
}

export interface MenuManagementQuery {
  searchTerm: string;
  pageNumber: number;
  pageSize: number;
}

export interface CreateProductRequest {
  organizationId?: string | null;
  storeId?: string | null;
  kioskId?: string | null;
  templateProductId?: string | null;
  categoryId?: number | null;
  code: string;
  name: string;
  displayName?: string | null;
  description?: string | null;
  productType: string;
  basePrice: number;
  currency: string;
  isAvailable: boolean;
  preparationTimeSeconds?: number | null;
  imageUrl?: string | null;
  metadataJson?: string | null;
  scopeType: TenantScopeType;
  variants: UpsertProductVariantRequest[];
}

export type UpdateProductRequest = Omit<CreateProductRequest, "variants">;

export interface UpsertProductVariantRequest {
  code: string;
  name: string;
  displayName?: string | null;
  description?: string | null;
  variantType: string;
  fulfillmentType: FulfillmentType;
  sizeCode?: string | null;
  basePrice: number;
  currency: string;
  isAvailable: boolean;
  displayOrder: number;
  preparationTimeSeconds?: number | null;
  imageUrl?: string | null;
  metadataJson?: string | null;
}

export type UpdateProductVariantRequest = UpsertProductVariantRequest;
