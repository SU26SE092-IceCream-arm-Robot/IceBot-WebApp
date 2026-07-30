import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type { ApiResult } from "@/types";
import type {
  CreateMenuItemRequest,
  CreateMenuRequest,
  CreateProductCategoryRequest,
  CreateProductRequest,
  CreateRecipeRequest,
  CloneProductTemplateRequest,
  MenuItemResult,
  MenuItemStatus,
  MenuManagementPagedResult,
  MenuManagementQuery,
  MenuResult,
  MenuStatus,
  ProductCategoryResult,
  ProductResult,
  ProductOptionResult,
  OptionGroupResult,
  RecipeResult,
  RecipeStatus,
  ProductTemplatesQuery,
  ProductVariantResult,
  UpdateMenuItemRequest,
  UpdateMenuRequest,
  UpdateProductCategoryRequest,
  UpdateProductRequest,
  UpdateProductVariantRequest,
  UpdateRecipeRequest,
  UpsertOptionGroupRequest,
  UpsertProductOptionRequest,
  ReplaceProductOptionIngredientRequirementsRequest,
  ReplaceRecipeItemsRequest,
  UpsertProductVariantRequest,
} from "@/types/menu-management";

function getApiResultMessage(
  result: ApiResult<unknown> | undefined,
  fallbackMessage: string,
): string {
  if (!result) return fallbackMessage;
  const validationMessages = Object.values(
    result.validationErrors ?? {},
  ).flat();
  return validationMessages.length > 0
    ? validationMessages.join(" ")
    : result.message || result.businessError || fallbackMessage;
}

function requireData<T>(result: ApiResult<T>, fallbackMessage: string): T {
  if (!result.succeeded || result.data === undefined || result.data === null) {
    throw new Error(getApiResultMessage(result, fallbackMessage));
  }
  return result.data;
}

function requireOrganizationId(organizationId: string | undefined): string {
  const normalized = organizationId?.trim();
  if (!normalized) {
    throw new Error(
      "Vui lòng chọn tổ chức trước khi tải danh mục và thực đơn.",
    );
  }
  return encodeURIComponent(normalized);
}

function productsRoot(organizationId: string | undefined): string {
  return `/api/v1/management/organizations/${requireOrganizationId(organizationId)}/products`;
}

function menusRoot(organizationId: string | undefined): string {
  return `/api/v1/management/organizations/${requireOrganizationId(organizationId)}/menus`;
}

function optionGroupsRoot(organizationId: string, productId: string): string {
  return `${productsRoot(organizationId)}/${encodeURIComponent(productId)}/option-groups`;
}

function recipesRoot(
  organizationId: string,
  productId: string,
  variantId: string,
): string {
  return `${productsRoot(organizationId)}/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/recipes`;
}

function buildListParams(query: MenuManagementQuery) {
  return {
    search: query.searchTerm.trim() || undefined,
    pageNumber: query.pageNumber,
    pageSize: query.pageSize,
  };
}

export async function listManagementProducts(
  query: MenuManagementQuery,
  signal?: AbortSignal,
): Promise<MenuManagementPagedResult<ProductResult>> {
  const response = await axiosClient.get<
    MenuManagementPagedResult<ProductResult>
  >(productsRoot(query.organizationId), {
    params: buildListParams(query),
    signal,
  });
  if (!response.data.succeeded) {
    throw new Error(
      response.data.message || "Không thể tải danh mục sản phẩm.",
    );
  }
  return response.data;
}

export async function listProductTemplates(
  query: ProductTemplatesQuery,
  signal?: AbortSignal,
): Promise<MenuManagementPagedResult<ProductResult>> {
  const response = await axiosClient.get<
    MenuManagementPagedResult<ProductResult>
  >("/api/v1/management/product-templates", {
    params: {
      search: query.searchTerm.trim() || undefined,
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
    },
    signal,
  });
  if (!response.data.succeeded) {
    throw new Error(
      response.data.message || "Không thể tải danh sách mẫu sản phẩm.",
    );
  }
  return response.data;
}

export async function listProductCategories(
  includeInactive = false,
  signal?: AbortSignal,
): Promise<ProductCategoryResult[]> {
  const response = await axiosClient.get<ApiResult<ProductCategoryResult[]>>(
    "/api/v1/management/product-categories",
    {
      params: { includeInactive },
      signal,
    },
  );
  return requireData(response.data, "Không thể tải danh mục sản phẩm.");
}

export async function createProductCategory(
  request: CreateProductCategoryRequest,
): Promise<ProductCategoryResult> {
  const response = await axiosClient.post<ApiResult<ProductCategoryResult>>(
    "/api/v1/management/product-categories",
    request,
  );
  return requireData(response.data, "Không thể tạo danh mục sản phẩm.");
}

export async function updateProductCategory(
  categoryId: number,
  request: UpdateProductCategoryRequest,
): Promise<ProductCategoryResult> {
  const response = await axiosClient.put<ApiResult<ProductCategoryResult>>(
    `/api/v1/management/product-categories/${categoryId}`,
    request,
  );
  return requireData(response.data, "Không thể cập nhật danh mục sản phẩm.");
}

export async function setProductCategoryStatus(
  categoryId: number,
  isActive: boolean,
): Promise<ProductCategoryResult> {
  const response = await axiosClient.patch<ApiResult<ProductCategoryResult>>(
    `/api/v1/management/product-categories/${categoryId}/status`,
    { isActive },
  );
  return requireData(response.data, "Không thể đổi trạng thái danh mục sản phẩm.");
}

export async function deleteProductCategory(categoryId: number): Promise<void> {
  const response = await axiosClient.delete<ApiResult<unknown>>(
    `/api/v1/management/product-categories/${categoryId}`,
  );
  if (!response.data.succeeded) {
    throw new Error(
      getApiResultMessage(response.data, "Không thể xóa danh mục sản phẩm."),
    );
  }
}

export async function cloneProductTemplate(
  organizationId: string,
  request: CloneProductTemplateRequest,
): Promise<ProductResult> {
  const response = await axiosClient.post<ApiResult<ProductResult>>(
    `${productsRoot(organizationId)}/from-template`,
    request,
  );
  return requireData(response.data, "Không thể tạo sản phẩm từ mẫu.");
}

export async function listManagementMenus(
  query: MenuManagementQuery,
  signal?: AbortSignal,
): Promise<MenuManagementPagedResult<MenuResult>> {
  const response = await axiosClient.get<MenuManagementPagedResult<MenuResult>>(
    menusRoot(query.organizationId),
    { params: buildListParams(query), signal },
  );
  if (!response.data.succeeded) {
    throw new Error(
      response.data.message || "Không thể tải danh sách thực đơn.",
    );
  }
  return response.data;
}

export async function getProductById(
  organizationId: string,
  productId: string,
  signal?: AbortSignal,
): Promise<ProductResult> {
  const response = await axiosClient.get<ApiResult<ProductResult>>(
    `${productsRoot(organizationId)}/${encodeURIComponent(productId)}`,
    { signal },
  );
  return requireData(response.data, "Không thể tải chi tiết sản phẩm.");
}

export async function createManagementProduct(
  organizationId: string,
  request: CreateProductRequest,
): Promise<ProductResult> {
  const response = await axiosClient.post<ApiResult<ProductResult>>(
    productsRoot(organizationId),
    request,
  );
  return requireData(response.data, "Không thể tạo sản phẩm.");
}

export async function updateManagementProduct(
  organizationId: string,
  productId: string,
  request: UpdateProductRequest,
): Promise<ProductResult> {
  const response = await axiosClient.put<ApiResult<ProductResult>>(
    `${productsRoot(organizationId)}/${encodeURIComponent(productId)}`,
    request,
  );
  return requireData(response.data, "Không thể cập nhật sản phẩm.");
}

export async function deleteManagementProduct(
  organizationId: string,
  productId: string,
): Promise<boolean> {
  const response = await axiosClient.delete<ApiResult<boolean>>(
    `${productsRoot(organizationId)}/${encodeURIComponent(productId)}`,
  );
  return requireData(response.data, "Không thể xóa sản phẩm.");
}

export async function createManagementProductVariant(
  organizationId: string,
  productId: string,
  request: UpsertProductVariantRequest,
): Promise<ProductVariantResult> {
  const response = await axiosClient.post<ApiResult<ProductVariantResult>>(
    `${productsRoot(organizationId)}/${encodeURIComponent(productId)}/variants`,
    request,
  );
  return requireData(response.data, "Không thể tạo biến thể sản phẩm.");
}

export async function updateManagementProductVariant(
  organizationId: string,
  productId: string,
  variantId: string,
  request: UpdateProductVariantRequest,
): Promise<ProductVariantResult> {
  const response = await axiosClient.put<ApiResult<ProductVariantResult>>(
    `${productsRoot(organizationId)}/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`,
    request,
  );
  return requireData(response.data, "Không thể cập nhật biến thể sản phẩm.");
}

export async function deleteManagementProductVariant(
  organizationId: string,
  productId: string,
  variantId: string,
): Promise<boolean> {
  const response = await axiosClient.delete<ApiResult<boolean>>(
    `${productsRoot(organizationId)}/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`,
  );
  return requireData(response.data, "Không thể xóa biến thể sản phẩm.");
}

export async function setProductAvailability(
  organizationId: string,
  productId: string,
  isAvailable: boolean,
): Promise<ProductResult> {
  const response = await axiosClient.patch<ApiResult<ProductResult>>(
    `${productsRoot(organizationId)}/${encodeURIComponent(productId)}/availability`,
    { isAvailable },
  );
  return requireData(response.data, "Không thể cập nhật trạng thái sản phẩm.");
}

export async function setProductVariantAvailability(
  organizationId: string,
  productId: string,
  variantId: string,
  isAvailable: boolean,
): Promise<ProductVariantResult> {
  const response = await axiosClient.patch<ApiResult<ProductVariantResult>>(
    `${productsRoot(organizationId)}/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/availability`,
    { isAvailable },
  );
  return requireData(response.data, "Không thể cập nhật trạng thái biến thể.");
}

export async function createOptionGroup(
  organizationId: string,
  productId: string,
  request: UpsertOptionGroupRequest,
): Promise<OptionGroupResult> {
  const response = await axiosClient.post<ApiResult<OptionGroupResult>>(
    optionGroupsRoot(organizationId, productId),
    request,
  );
  return requireData(response.data, "Không thể tạo nhóm tùy chọn.");
}

export async function updateOptionGroup(
  organizationId: string,
  productId: string,
  optionGroupId: number,
  request: UpsertOptionGroupRequest,
): Promise<OptionGroupResult> {
  const response = await axiosClient.put<ApiResult<OptionGroupResult>>(
    `${optionGroupsRoot(organizationId, productId)}/${optionGroupId}`,
    request,
  );
  return requireData(response.data, "Không thể cập nhật nhóm tùy chọn.");
}

export async function setOptionGroupStatus(
  organizationId: string,
  productId: string,
  optionGroupId: number,
  isActive: boolean,
): Promise<OptionGroupResult> {
  const response = await axiosClient.patch<ApiResult<OptionGroupResult>>(
    `${optionGroupsRoot(organizationId, productId)}/${optionGroupId}/status`,
    { isActive },
  );
  return requireData(
    response.data,
    "Không thể cập nhật trạng thái nhóm tùy chọn.",
  );
}

export async function deleteOptionGroup(
  organizationId: string,
  productId: string,
  optionGroupId: number,
): Promise<boolean> {
  const response = await axiosClient.delete<ApiResult<boolean>>(
    `${optionGroupsRoot(organizationId, productId)}/${optionGroupId}`,
  );
  return requireData(response.data, "Không thể xóa nhóm tùy chọn.");
}

export async function createProductOption(
  organizationId: string,
  productId: string,
  optionGroupId: number,
  request: UpsertProductOptionRequest,
): Promise<ProductOptionResult> {
  const response = await axiosClient.post<ApiResult<ProductOptionResult>>(
    `${optionGroupsRoot(organizationId, productId)}/${optionGroupId}/options`,
    request,
  );
  return requireData(response.data, "Không thể tạo tùy chọn.");
}

export async function updateProductOption(
  organizationId: string,
  productId: string,
  optionGroupId: number,
  optionId: string,
  request: UpsertProductOptionRequest,
): Promise<ProductOptionResult> {
  const response = await axiosClient.put<ApiResult<ProductOptionResult>>(
    `${optionGroupsRoot(organizationId, productId)}/${optionGroupId}/options/${encodeURIComponent(optionId)}`,
    request,
  );
  return requireData(response.data, "Không thể cập nhật tùy chọn.");
}

export async function setProductOptionAvailability(
  organizationId: string,
  productId: string,
  optionGroupId: number,
  optionId: string,
  isAvailable: boolean,
): Promise<ProductOptionResult> {
  const response = await axiosClient.patch<ApiResult<ProductOptionResult>>(
    `${optionGroupsRoot(organizationId, productId)}/${optionGroupId}/options/${encodeURIComponent(optionId)}/availability`,
    { isAvailable },
  );
  return requireData(response.data, "Không thể cập nhật trạng thái tùy chọn.");
}

export async function deleteProductOption(
  organizationId: string,
  productId: string,
  optionGroupId: number,
  optionId: string,
): Promise<boolean> {
  const response = await axiosClient.delete<ApiResult<boolean>>(
    `${optionGroupsRoot(organizationId, productId)}/${optionGroupId}/options/${encodeURIComponent(optionId)}`,
  );
  return requireData(response.data, "Không thể xóa tùy chọn.");
}

export async function replaceProductOptionIngredientRequirements(
  organizationId: string,
  productId: string,
  optionGroupId: number,
  optionId: string,
  request: ReplaceProductOptionIngredientRequirementsRequest,
): Promise<ProductOptionResult> {
  const response = await axiosClient.put<ApiResult<ProductOptionResult>>(
    `${optionGroupsRoot(organizationId, productId)}/${optionGroupId}/options/${encodeURIComponent(optionId)}/ingredient-requirements`,
    request,
  );
  return requireData(
    response.data,
    "Không thể cập nhật nguyên liệu thực thi của tùy chọn.",
  );
}

export async function listRecipes(
  organizationId: string,
  productId: string,
  variantId: string,
  signal?: AbortSignal,
): Promise<MenuManagementPagedResult<RecipeResult>> {
  const response = await axiosClient.get<
    MenuManagementPagedResult<RecipeResult>
  >(recipesRoot(organizationId, productId, variantId), {
    params: { pageNumber: 1, pageSize: 100 },
    signal,
  });
  if (!response.data.succeeded)
    throw new Error(response.data.message || "Không thể tải công thức.");
  return response.data;
}

export async function createRecipe(
  organizationId: string,
  productId: string,
  variantId: string,
  request: CreateRecipeRequest,
): Promise<RecipeResult> {
  const response = await axiosClient.post<ApiResult<RecipeResult>>(
    recipesRoot(organizationId, productId, variantId),
    request,
  );
  return requireData(response.data, "Không thể tạo công thức.");
}

export async function updateRecipe(
  organizationId: string,
  productId: string,
  variantId: string,
  recipeId: string,
  request: UpdateRecipeRequest,
): Promise<RecipeResult> {
  const response = await axiosClient.put<ApiResult<RecipeResult>>(
    `${recipesRoot(organizationId, productId, variantId)}/${encodeURIComponent(recipeId)}`,
    request,
  );
  return requireData(response.data, "Không thể cập nhật công thức.");
}

export async function replaceRecipeItems(
  organizationId: string,
  productId: string,
  variantId: string,
  recipeId: string,
  request: ReplaceRecipeItemsRequest,
): Promise<RecipeResult> {
  const response = await axiosClient.put<ApiResult<RecipeResult>>(
    `${recipesRoot(organizationId, productId, variantId)}/${encodeURIComponent(recipeId)}/items`,
    request,
  );
  return requireData(
    response.data,
    "Không thể cập nhật nguyên liệu công thức.",
  );
}

export async function setRecipeStatus(
  organizationId: string,
  productId: string,
  variantId: string,
  recipeId: string,
  status: RecipeStatus,
): Promise<RecipeResult> {
  const response = await axiosClient.patch<ApiResult<RecipeResult>>(
    `${recipesRoot(organizationId, productId, variantId)}/${encodeURIComponent(recipeId)}/status`,
    { status },
  );
  return requireData(response.data, "Không thể cập nhật vòng đời công thức.");
}

export async function createRecipeVersion(
  organizationId: string,
  productId: string,
  variantId: string,
  recipeId: string,
): Promise<RecipeResult> {
  const response = await axiosClient.post<ApiResult<RecipeResult>>(
    `${recipesRoot(organizationId, productId, variantId)}/${encodeURIComponent(recipeId)}/versions`,
  );
  return requireData(response.data, "Không thể tạo phiên bản công thức mới.");
}

export async function getMenuById(
  organizationId: string,
  menuId: string,
  signal?: AbortSignal,
): Promise<MenuResult> {
  const response = await axiosClient.get<ApiResult<MenuResult>>(
    `${menusRoot(organizationId)}/${encodeURIComponent(menuId)}`,
    { signal },
  );
  return requireData(response.data, "Không thể tải chi tiết thực đơn.");
}

export async function setMenuStatus(
  organizationId: string,
  menuId: string,
  status: MenuStatus,
): Promise<MenuResult> {
  const response = await axiosClient.patch<ApiResult<MenuResult>>(
    `${menusRoot(organizationId)}/${encodeURIComponent(menuId)}/status`,
    { status },
  );
  return requireData(response.data, "Không thể cập nhật trạng thái thực đơn.");
}

export async function createManagementMenu(
  organizationId: string,
  request: CreateMenuRequest,
): Promise<MenuResult> {
  const response = await axiosClient.post<ApiResult<MenuResult>>(
    menusRoot(organizationId),
    request,
  );
  return requireData(response.data, "Không thể tạo thực đơn.");
}

export async function updateManagementMenu(
  organizationId: string,
  menuId: string,
  request: UpdateMenuRequest,
): Promise<MenuResult> {
  const response = await axiosClient.put<ApiResult<MenuResult>>(
    `${menusRoot(organizationId)}/${encodeURIComponent(menuId)}`,
    request,
  );
  return requireData(response.data, "Không thể cập nhật thực đơn.");
}

export async function deleteManagementMenu(
  organizationId: string,
  menuId: string,
): Promise<boolean> {
  const response = await axiosClient.delete<ApiResult<boolean>>(
    `${menusRoot(organizationId)}/${encodeURIComponent(menuId)}`,
  );
  return requireData(response.data, "Không thể xóa thực đơn.");
}

export async function createManagementMenuItem(
  organizationId: string,
  menuId: string,
  request: CreateMenuItemRequest,
): Promise<MenuItemResult> {
  const response = await axiosClient.post<ApiResult<MenuItemResult>>(
    `${menusRoot(organizationId)}/${encodeURIComponent(menuId)}/items`,
    request,
  );
  return requireData(response.data, "Không thể thêm món vào thực đơn.");
}

export async function updateManagementMenuItem(
  organizationId: string,
  menuId: string,
  menuItemId: string,
  request: UpdateMenuItemRequest,
): Promise<MenuItemResult> {
  const response = await axiosClient.put<ApiResult<MenuItemResult>>(
    `${menusRoot(organizationId)}/${encodeURIComponent(menuId)}/items/${encodeURIComponent(menuItemId)}`,
    request,
  );
  return requireData(response.data, "Không thể cập nhật món trong thực đơn.");
}

export async function deleteManagementMenuItem(
  organizationId: string,
  menuId: string,
  menuItemId: string,
): Promise<boolean> {
  const response = await axiosClient.delete<ApiResult<boolean>>(
    `${menusRoot(organizationId)}/${encodeURIComponent(menuId)}/items/${encodeURIComponent(menuItemId)}`,
  );
  return requireData(response.data, "Không thể xóa món khỏi thực đơn.");
}

export async function setMenuItemStatus(
  organizationId: string,
  menuId: string,
  menuItemId: string,
  status: MenuItemStatus,
): Promise<MenuItemResult> {
  const response = await axiosClient.patch<ApiResult<MenuItemResult>>(
    `${menusRoot(organizationId)}/${encodeURIComponent(menuId)}/items/${encodeURIComponent(menuItemId)}/status`,
    { status },
  );
  return requireData(response.data, "Không thể cập nhật trạng thái món.");
}

export function getMenuManagementErrorMessage(
  error: unknown,
  resourceName: string,
): string {
  if (axios.isCancel(error)) return "";
  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    if (error.response?.status === 403) {
      return "Tài khoản hiện tại không có quyền truy cập hoặc quản lý danh mục và thực đơn.";
    }
    return getApiResultMessage(
      error.response?.data,
      `Không thể tải ${resourceName}.`,
    );
  }
  return error instanceof Error
    ? error.message
    : `Không thể tải ${resourceName}.`;
}
