import type { ApiResult } from "@/types";

export type TenantScopeType =
  "Global" | "Organization" | "Store" | "Kiosk" | "Device";

export type MenuStatus = "Draft" | "Active" | "Paused" | "Archived";

export type MenuItemStatus = "Draft" | "Active" | "Unavailable" | "Archived";

export type FulfillmentType = "Manual" | "Packaged" | "MachineProduced";

export type OptionSelectionType = "Single" | "Multiple";

export type ProductOptionExecutionImpact =
  "CommercialOnly" | "ProductionAffecting";

export interface ProductOptionResult {
  id: string;
  optionGroupId: number;
  code: string;
  name: string;
  description?: string | null;
  priceDelta: number;
  executionImpact: ProductOptionExecutionImpact;
  currency: string;
  isDefault: boolean;
  isAvailable: boolean;
  displayOrder: number;
  ingredientRequirements: ProductOptionIngredientRequirementResult[];
}

export interface ProductOptionIngredientRequirementResult {
  ingredientId: string;
  quantity: number;
  unit: string;
  requiredWorkcellCapabilityCode: string;
}

export interface ProductCategoryResult {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  productType: string;
  imageUrl?: string | null;
  isActive: boolean;
  displayOrder: number;
}

export interface CreateProductCategoryRequest {
  code: string;
  name: string;
  description?: string | null;
  productType: string;
  imageUrl?: string | null;
  displayOrder: number;
}

export type UpdateProductCategoryRequest = Omit<
  CreateProductCategoryRequest,
  "code"
>;

export interface OptionGroupResult {
  id: number;
  productId: string;
  code: string;
  name: string;
  description?: string | null;
  selectionType: OptionSelectionType;
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  isActive: boolean;
  displayOrder: number;
  options: ProductOptionResult[];
}

export interface UpsertOptionGroupRequest {
  code: string;
  name: string;
  description?: string | null;
  selectionType: OptionSelectionType;
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  displayOrder: number;
}

export interface UpsertProductOptionRequest {
  code: string;
  name: string;
  description?: string | null;
  priceDelta: number;
  executionImpact: ProductOptionExecutionImpact;
  isDefault: boolean;
  displayOrder: number;
}

export interface ReplaceProductOptionIngredientRequirementsRequest {
  items: Array<{
    ingredientId: string;
    quantity: number;
    unit: string;
    requiredWorkcellCapabilityCode: string;
  }>;
}

export type RecipeStatus = "Draft" | "Published" | "Active" | "Retired";

export interface RecipeItemResult {
  id: string;
  ingredientId: string;
  ingredientCode: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  displayOrder: number;
  isOptional: boolean;
  notes?: string | null;
}

export interface RecipeResult {
  id: string;
  productVariantId: string;
  templateRecipeId?: string | null;
  code: string;
  name: string;
  version: number;
  status: RecipeStatus;
  isDefault: boolean;
  yieldQuantity: number;
  unit: string;
  estimatedDurationSeconds?: number | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  items: RecipeItemResult[];
}

export interface CreateRecipeRequest {
  code: string;
  name: string;
  yieldQuantity: number;
  unit: string;
  estimatedDurationSeconds?: number | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isDefault: boolean;
}

export type UpdateRecipeRequest = Omit<CreateRecipeRequest, "code">;

export interface ReplaceRecipeItemsRequest {
  items: Array<{
    ingredientId: string;
    quantity: number;
    unit: string;
    displayOrder: number;
    isOptional: boolean;
    notes?: string | null;
  }>;
}

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
  optionGroups: OptionGroupResult[];
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
  productOptionIds?: string[];
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
  organizationId?: string;
  searchTerm: string;
  pageNumber: number;
  pageSize: number;
}

export interface ProductTemplatesQuery {
  searchTerm: string;
  pageNumber: number;
  pageSize: number;
}

export interface CloneProductTemplateRequest {
  templateProductId: string;
  storeId?: string | null;
  kioskId?: string | null;
  code?: string | null;
  name?: string | null;
}

export interface CreateProductRequest {
  storeId?: string | null;
  kioskId?: string | null;
  categoryId?: number | null;
  code: string;
  name: string;
  displayName?: string | null;
  description?: string | null;
  productType: string;
  basePrice: number;
  currency: string;
  preparationTimeSeconds?: number | null;
  imageUrl?: string | null;
  variants: UpsertProductVariantRequest[];
}

export interface UpdateProductRequest {
  categoryId?: number | null;
  code?: string | null;
  name?: string | null;
  displayName?: string | null;
  description?: string | null;
  productType?: string | null;
  basePrice?: number | null;
  currency?: string | null;
  preparationTimeSeconds?: number | null;
  imageUrl?: string | null;
}

export interface UpsertProductVariantRequest {
  code: string;
  name: string;
  displayName?: string | null;
  description?: string | null;
  variantType: string;
  fulfillmentType: FulfillmentType;
  sizeCode?: string | null;
  basePrice: number;
  displayOrder: number;
  preparationTimeSeconds?: number | null;
  imageUrl?: string | null;
}

export type UpdateProductVariantRequest = Partial<UpsertProductVariantRequest>;

export interface CreateMenuRequest {
  storeId?: string | null;
  kioskId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  currency: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  displayOrder: number;
}

export interface UpdateMenuRequest {
  code?: string | null;
  name?: string | null;
  description?: string | null;
  currency?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  displayOrder?: number | null;
}

export interface CreateMenuItemRequest {
  productVariantId: string;
  recipeId?: string | null;
  code: string;
  displayName: string;
  description?: string | null;
  price: number;
  discountAmount: number;
  displayOrder: number;
  preparationTimeSeconds?: number | null;
  imageUrl?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  productOptionIds: string[];
}

export interface UpdateMenuItemRequest
  extends Partial<CreateMenuItemRequest> {
  clearRecipe?: boolean;
}
