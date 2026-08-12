"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  CircleCheckBig,
  ShoppingBag,
  LayoutTemplate,
  ListTree,
  Plus,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";

import { CatalogActionDialog } from "@/components/features/catalog/shared/catalog-dialogs";
import {
  CatalogOrganizationSelector,
  CatalogRefreshWarning,
  CatalogSearchBar,
  CatalogStatCard,
  ProductsPanel,
} from "@/components/features/catalog/shared/catalog-page-ui";
import {
  ProductDeleteDialog,
  ProductFormDialog,
  VariantFormDialog,
} from "@/components/features/catalog/products/product-crud-dialogs";
import { ProductDetailPanel } from "@/components/features/catalog/products/product-detail-panel";
import { ProductCategoriesCatalogDialog } from "@/components/features/catalog/categories/product-categories-catalog-dialog";
import { ProductOptionsCatalogDialog } from "@/components/features/catalog/options/product-options-catalog-dialog";
import { ProductOptionAuthoringDialog } from "@/components/features/catalog/options/product-option-authoring-dialog";
import { ProductTemplatesDialog } from "@/components/features/catalog/templates/product-templates-dialog";
import { RecipeAuthoringDialog } from "@/components/features/catalog/recipes/recipe-authoring-dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/identity/use-auth";
import { useCatalogOrganization } from "@/hooks/catalog/use-catalog-organization";
import { useMenuManagement } from "@/hooks/catalog/use-menu-management";
import { useMenuScopeOptions } from "@/hooks/catalog/use-menu-scope-options";
import { useProductCategories } from "@/hooks/catalog/use-product-categories";
import { useProductCrud, type ProductCrudChange } from "@/hooks/catalog/use-product-crud";
import { useProductOptionsCatalog } from "@/hooks/catalog/use-product-options-catalog";
import { useProductTemplates } from "@/hooks/catalog/use-product-templates";
import { hasPermission, hasScopedPermission } from "@/lib/rbac";
import type { ProductResult, ProductVariantResult } from "@/types/catalog/menu-management";

export function ProductsManagementView() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedOrganizationId = searchParams.get("organizationId");
  const requestedProductId = searchParams.get("productId");
  const [isProductOptionsOpen, setProductOptionsOpen] = useState(false);
  const [isProductCategoriesOpen, setProductCategoriesOpen] = useState(false);
  const [isOptionAuthoringOpen, setOptionAuthoringOpen] = useState(false);
  const [recipeTarget, setRecipeTarget] = useState<{
    product: ProductResult;
    variant: ProductVariantResult;
  } | null>(null);
  const { effectiveAccess } = useAuth();
  const {
    organizations,
    selectedOrganizationId,
    selectedOrganization,
    setSelectedOrganizationId,
    isLoading: isOrganizationLoading,
    errorMessage: organizationError,
  } = useCatalogOrganization(requestedOrganizationId);
  const {
    searchTerm,
    products,
    selectedProduct,
    pendingAction,
    isProductDetailOpen,
    isProductDetailLoading,
    productDetailError,
    isActionDialogOpen,
    productActionId,
    variantActionId,
    actionError,
    setSearchTerm,
    clearSearch,
    previousProductsPage,
    nextProductsPage,
    refresh,
    openProductDetail,
    setProductDetailOpen,
    requestProductAvailability,
    requestVariantAvailability,
    setActionDialogOpen,
    confirmAction,
  } = useMenuManagement(selectedOrganizationId, { includeMenus: false });

  const replaceQuery = useCallback((changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const handleProductChanged = useCallback(
    async (change: ProductCrudChange) => {
      await refresh(true);
      if (change.productDeleted) {
        if (selectedProduct?.id === change.productId) setProductDetailOpen(false);
        return;
      }
      if (change.productCreated) {
        replaceQuery({ productId: change.productId });
        await openProductDetail(change.productId, true);
        return;
      }
      if (isProductDetailOpen && selectedProduct?.id === change.productId) {
        await openProductDetail(change.productId, true);
      }
    },
    [
      isProductDetailOpen,
      openProductDetail,
      refresh,
      replaceQuery,
      selectedProduct?.id,
      setProductDetailOpen,
    ],
  );

  const productCrud = useProductCrud({
    organizationId: selectedOrganizationId,
    onChanged: handleProductChanged,
  });
  const canManage = selectedOrganizationId
    ? hasScopedPermission(effectiveAccess, "products.manage", {
        organizationId: selectedOrganizationId,
      })
    : false;
  const canManageProductCategories = hasPermission(effectiveAccess, "product-categories.manage");
  const productTemplates = useProductTemplates({
    organizationId: selectedOrganizationId,
    onCloned: async () => refresh(),
  });
  const productOptions = useProductOptionsCatalog({
    open: isProductOptionsOpen,
    organizationId: selectedOrganizationId,
  });
  const productCategories = useProductCategories(true);
  const menuScopeOptions = useMenuScopeOptions(selectedOrganizationId);
  const availableProductsOnPage = products.data.filter((product) => product.isAvailable).length;

  const handleOrganizationChange = useCallback((organizationId: string | null) => {
    setSelectedOrganizationId(organizationId);
    replaceQuery({ organizationId, productId: null });
  }, [replaceQuery, setSelectedOrganizationId]);

  const handleOpenProductDetail = useCallback((productId: string) => {
    replaceQuery({ productId });
    void openProductDetail(productId);
  }, [openProductDetail, replaceQuery]);

  const handleCloseProductDetail = useCallback(() => {
    setProductDetailOpen(false);
    replaceQuery({ productId: null });
  }, [replaceQuery, setProductDetailOpen]);

  useEffect(() => {
    if (selectedOrganizationId && requestedOrganizationId !== selectedOrganizationId) {
      replaceQuery({ organizationId: selectedOrganizationId });
    }
  }, [replaceQuery, requestedOrganizationId, selectedOrganizationId]);

  useEffect(() => {
    if (!selectedOrganizationId || !requestedProductId || isProductDetailOpen) return;
    void openProductDetail(requestedProductId);
  }, [isProductDetailOpen, openProductDetail, requestedProductId, selectedOrganizationId]);

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Sản phẩm</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Quản lý danh mục, phiên bản, tuỳ chọn và công thức sản phẩm dùng lại trong các thực đơn.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-10" onClick={() => void refresh()} isLoading={products.isLoading}>
            <RefreshCw className="size-4" />Làm mới
          </Button>
          <Button variant="outline" className="h-10" onClick={() => setProductCategoriesOpen(true)}>
            <ListTree className="size-4" />Danh mục
          </Button>
          <Button variant="outline" className="h-10" disabled={!selectedOrganizationId} onClick={() => setProductOptionsOpen(true)}>
            <SlidersHorizontal className="size-4" />Tuỳ chọn
          </Button>
          {canManage ? (
            <>
              <Button variant="outline" className="h-10" disabled={!selectedOrganizationId} onClick={() => productTemplates.setOpen(true)}>
                <LayoutTemplate className="size-4" />Tạo từ mẫu
              </Button>
              <Button className="h-10" disabled={!selectedOrganizationId} onClick={productCrud.openProductCreate}>
                <Plus className="size-4" />Tạo sản phẩm
              </Button>
            </>
          ) : null}
        </div>
      </section>

      <CatalogRefreshWarning
        message={productCrud.refreshWarningMessage}
        isRetrying={productCrud.isRefreshRetrying}
        onRetry={productCrud.retryRefresh}
      />
      <CatalogRefreshWarning
        message={productTemplates.refreshWarningMessage}
        isRetrying={productTemplates.isRefreshRetrying}
        onRetry={productTemplates.retryRefresh}
      />

      <CatalogOrganizationSelector
        organizations={organizations}
        selectedOrganizationId={selectedOrganizationId}
        selectedOrganization={selectedOrganization}
        isLoading={isOrganizationLoading}
        errorMessage={organizationError}
        noun="Sản phẩm"
        onChange={handleOrganizationChange}
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <CatalogStatCard icon={ShoppingBag} label="Tổng sản phẩm" value={products.pagination.totalCount} tone="primary" />
        <CatalogStatCard icon={CircleCheckBig} label="Khả dụng trên trang" value={availableProductsOnPage} tone="success" />
      </section>

      <CatalogSearchBar
        value={searchTerm}
        placeholder="Tìm theo tên hoặc mã sản phẩm..."
        onChange={setSearchTerm}
        onClear={clearSearch}
      />

      <ProductsPanel
        canManage={canManage}
        categories={productCategories.categories}
        collection={products}
        productActionId={productActionId}
        onRetry={refresh}
        onPrevious={previousProductsPage}
        onNext={nextProductsPage}
        onView={handleOpenProductDetail}
        onToggleAvailability={requestProductAvailability}
      />

      {isProductDetailOpen ? (
        <ProductDetailPanel
          canManage={canManage}
          categories={productCategories.categories}
          errorMessage={productDetailError}
          isLoading={isProductDetailLoading}
          product={selectedProduct}
          productActionId={productActionId}
          variantActionId={variantActionId}
          onClose={handleCloseProductDetail}
          onToggleProduct={requestProductAvailability}
          onToggleVariant={requestVariantAvailability}
          onEditProduct={productCrud.openProductEdit}
          onDeleteProduct={productCrud.requestProductDelete}
          onCreateVariant={productCrud.openVariantCreate}
          onManageOptions={() => setOptionAuthoringOpen(true)}
          onManageRecipes={(product, variant) => setRecipeTarget({ product, variant })}
          onEditVariant={productCrud.openVariantEdit}
          onDeleteVariant={productCrud.requestVariantDelete}
        />
      ) : null}

      <CatalogActionDialog
        action={pendingAction}
        errorMessage={actionError}
        isSubmitting={productActionId !== null || variantActionId !== null}
        open={isActionDialogOpen}
        onConfirm={() => void confirmAction()}
        onOpenChange={setActionDialogOpen}
      />

      <ProductTemplatesDialog
        open={productTemplates.open}
        organizationName={selectedOrganization?.name || selectedOrganization?.code || "tổ chức đã chọn"}
        searchTerm={productTemplates.searchTerm}
        templates={productTemplates.templates}
        pagination={productTemplates.pagination}
        isLoading={productTemplates.isLoading}
        errorMessage={productTemplates.errorMessage}
        cloningTemplateId={productTemplates.cloningTemplateId}
        onOpenChange={productTemplates.setOpen}
        onSearchTermChange={productTemplates.setSearchTerm}
        onPreviousPage={productTemplates.previousPage}
        onNextPage={productTemplates.nextPage}
        onRetry={productTemplates.retry}
        onClone={(template) => void productTemplates.cloneTemplate(template)}
      />

      <ProductCategoriesCatalogDialog
        open={isProductCategoriesOpen}
        categories={productCategories.categories}
        isLoading={productCategories.isLoading}
        errorMessage={productCategories.errorMessage}
        onOpenChange={setProductCategoriesOpen}
        onRetry={productCategories.retry}
        canManage={canManageProductCategories}
        mutationError={productCategories.mutationError}
        mutatingCategoryId={productCategories.mutatingCategoryId}
        onClearMutationError={productCategories.clearMutationError}
        onCreate={productCategories.create}
        onUpdate={productCategories.update}
        onSetStatus={productCategories.setStatus}
        onDelete={productCategories.remove}
      />

      <ProductOptionsCatalogDialog
        open={isProductOptionsOpen}
        organizationName={selectedOrganization?.name || selectedOrganization?.code || "tổ chức đã chọn"}
        searchTerm={productOptions.searchTerm}
        optionGroups={productOptions.optionGroups}
        productsCount={productOptions.products.length}
        pagination={productOptions.pagination}
        isLoading={productOptions.isLoading}
        errorMessage={productOptions.errorMessage}
        onOpenChange={setProductOptionsOpen}
        onSearchTermChange={productOptions.setSearchTerm}
        onPreviousPage={productOptions.previousPage}
        onNextPage={productOptions.nextPage}
        onRetry={productOptions.retry}
      />

      {selectedOrganizationId && selectedProduct ? (
        <ProductOptionAuthoringDialog
          organizationId={selectedOrganizationId}
          product={selectedProduct}
          open={isOptionAuthoringOpen}
          onOpenChange={setOptionAuthoringOpen}
          onChanged={() => openProductDetail(selectedProduct.id, true)}
        />
      ) : null}

      {selectedOrganizationId && recipeTarget ? (
        <RecipeAuthoringDialog
          organizationId={selectedOrganizationId}
          product={recipeTarget.product}
          variant={recipeTarget.variant}
          open
          onOpenChange={(open) => {
            if (!open) setRecipeTarget(null);
          }}
        />
      ) : null}

      {productCrud.productFormOpen ? (
        <ProductFormDialog
          key={`${selectedOrganizationId ?? "no-organization"}:${productCrud.editingProduct?.id ?? "create-product"}`}
          product={productCrud.editingProduct}
          categories={productCategories.categories}
          isCategoryLoading={productCategories.isLoading}
          categoryErrorMessage={productCategories.errorMessage}
          kiosks={menuScopeOptions.kiosks}
          open
          isSubmitting={productCrud.isSubmitting}
          errorMessage={productCrud.errorMessage}
          scopeErrorMessage={menuScopeOptions.errorMessage}
          scopeOptionsLoading={menuScopeOptions.isLoading}
          stores={menuScopeOptions.stores}
          onOpenChange={productCrud.setProductFormOpen}
          onCreate={productCrud.submitProductCreate}
          onUpdate={productCrud.submitProductUpdate}
        />
      ) : null}

      {productCrud.variantFormOpen && productCrud.variantProduct ? (
        <VariantFormDialog
          key={productCrud.editingVariant?.id ?? `create-${productCrud.variantProduct.id}`}
          product={productCrud.variantProduct}
          variant={productCrud.editingVariant}
          open
          isSubmitting={productCrud.isSubmitting}
          errorMessage={productCrud.errorMessage}
          onOpenChange={productCrud.setVariantFormOpen}
          onCreate={productCrud.submitVariantCreate}
          onUpdate={productCrud.submitVariantUpdate}
        />
      ) : null}

      {productCrud.deleteTarget ? (
        <ProductDeleteDialog
          target={productCrud.deleteTarget}
          open
          isSubmitting={productCrud.isSubmitting}
          errorMessage={productCrud.errorMessage}
          onOpenChange={productCrud.setDeleteOpen}
          onConfirm={productCrud.confirmDelete}
        />
      ) : null}
    </div>
  );
}
