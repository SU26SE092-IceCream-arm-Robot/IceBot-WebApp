"use client";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  IceCreamBowl,
  Layers3,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBasket,
  type LucideIcon,
} from "lucide-react";

import {
  CatalogActionDialog,
  MenuDetailDialog,
  ProductDetailDialog,
} from "@/components/features/menu/catalog-dialogs";
import {
  CatalogEmptyMarker,
  MenusTable,
  ProductsTable,
} from "@/components/features/menu/catalog-tables";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useMenuManagement, type MenuCollectionState } from "@/hooks/use-menu-management";
import { hasPermission } from "@/lib/rbac";
import type {
  MenuStatus,
  MenuManagementPagination,
  MenuResult,
  ProductResult,
} from "@/types/menu-management";

function CatalogLoadingTable() {
  return (
    <div className="space-y-1 px-5 py-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`catalog-skeleton-${index}`}
          className="grid grid-cols-5 items-center gap-4 border-b border-border py-4 last:border-0"
        >
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-muted/50" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted/30" />
          </div>
          <div className="h-5 w-20 animate-pulse rounded-full bg-muted/40" />
          <div className="h-5 w-24 animate-pulse rounded-full bg-muted/40" />
          <div className="h-5 w-36 animate-pulse rounded-full bg-muted/30" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted/30" />
        </div>
      ))}
    </div>
  );
}

type StatTone = "primary" | "success";

const STAT_TONES: Record<StatTone, { iconClassName: string; valueClassName: string }> = {
  primary: {
    iconClassName: "bg-primary/10 text-primary",
    valueClassName: "text-foreground",
  },
  success: {
    iconClassName: "bg-success/10 text-success",
    valueClassName: "text-success",
  },
};

function StatCard({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: LucideIcon;
  label: string;
  tone: StatTone;
  value: number;
}) {
  const toneClasses = STAT_TONES[tone];

  return (
    <Card className="rounded-xl border border-border/80 bg-card shadow-none">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${toneClasses.iconClassName}`}>
            <Icon className="size-5" />
          </span>
        </div>
        <p className={`tabular-nums text-3xl font-semibold tracking-tight ${toneClasses.valueClassName}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => Promise<void> }) {
  return (
    <div className="flex flex-col items-center gap-4 px-5 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium text-destructive">Không thể tải dữ liệu</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <Button variant="destructive" onClick={() => void onRetry()}>
        Thử lại
      </Button>
    </div>
  );
}

function PaginationControls({
  pagination,
  isLoading,
  onPrevious,
  onNext,
}: {
  pagination: MenuManagementPagination;
  isLoading: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 border-t border-border px-5 py-4 text-sm sm:flex-row sm:items-center">
      <p className="text-muted-foreground">
        Trang <span className="tabular-nums font-medium text-foreground">{pagination.page}</span> /{" "}
        <span className="tabular-nums font-medium text-foreground">{Math.max(pagination.totalPages, 1)}</span>
        {" - "}
        <span className="tabular-nums font-medium text-foreground">{pagination.totalCount}</span> kết quả
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={!pagination.hasPrevious || isLoading} onClick={onPrevious}>
          <ChevronLeft className="size-4" />
          Trước
        </Button>
        <Button variant="outline" size="sm" disabled={!pagination.hasNext || isLoading} onClick={onNext}>
          Sau
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function MenusPanel({
  collection,
  onRetry,
  onPrevious,
  onNext,
  canManage,
  menuActionId,
  onView,
  onToggleStatus,
}: {
  collection: MenuCollectionState<MenuResult>;
  onRetry: () => Promise<void>;
  onPrevious: () => void;
  onNext: () => void;
  canManage: boolean;
  menuActionId: string | null;
  onView: (menuId: string) => void;
  onToggleStatus: (menu: MenuResult, status: MenuStatus) => void;
}) {
  return (
    <Card className="rounded-xl border border-border bg-card shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShoppingBasket className="size-4" />
          </span>
          <div>
            <CardTitle className="text-base">Thực đơn đang bán</CardTitle>
          </div>
        </div>
      </CardHeader>
      <div>
        {collection.isLoading ? (
          <CatalogLoadingTable />
        ) : collection.errorMessage ? (
          <ErrorPanel message={collection.errorMessage} onRetry={onRetry} />
        ) : collection.data.length === 0 ? (
          <CatalogEmptyMarker label="thực đơn" />
        ) : (
          <MenusTable
            canManage={canManage}
            menuActionId={menuActionId}
            menus={collection.data}
            onToggleStatus={onToggleStatus}
            onView={onView}
          />
        )}
      </div>
      <PaginationControls
        pagination={collection.pagination}
        isLoading={collection.isLoading}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    </Card>
  );
}

function ProductsPanel({
  collection,
  onRetry,
  onPrevious,
  onNext,
  canManage,
  productActionId,
  onView,
  onToggleAvailability,
}: {
  collection: MenuCollectionState<ProductResult>;
  onRetry: () => Promise<void>;
  onPrevious: () => void;
  onNext: () => void;
  canManage: boolean;
  productActionId: string | null;
  onView: (productId: string) => void;
  onToggleAvailability: (product: ProductResult) => void;
}) {
  return (
    <Card className="rounded-xl border border-border bg-card shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <IceCreamBowl className="size-4" />
          </span>
          <div>
            <CardTitle className="text-base">Danh mục sản phẩm</CardTitle>
          </div>
        </div>
      </CardHeader>
      <div>
        {collection.isLoading ? (
          <CatalogLoadingTable />
        ) : collection.errorMessage ? (
          <ErrorPanel message={collection.errorMessage} onRetry={onRetry} />
        ) : collection.data.length === 0 ? (
          <CatalogEmptyMarker label="sản phẩm" />
        ) : (
          <ProductsTable
            canManage={canManage}
            productActionId={productActionId}
            products={collection.data}
            onToggleAvailability={onToggleAvailability}
            onView={onView}
          />
        )}
      </div>
      <PaginationControls
        pagination={collection.pagination}
        isLoading={collection.isLoading}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    </Card>
  );
}

export default function MenuPage() {
  const { currentUser } = useAuth();
  const {
    searchTerm,
    menus,
    products,
    selectedProduct,
    selectedMenu,
    pendingAction,
    isProductDetailOpen,
    isProductDetailLoading,
    productDetailError,
    isMenuDetailOpen,
    isMenuDetailLoading,
    menuDetailError,
    isActionDialogOpen,
    productActionId,
    variantActionId,
    menuActionId,
    menuItemActionId,
    actionError,
    successMessage,
    setSearchTerm,
    clearSearch,
    previousMenusPage,
    nextMenusPage,
    previousProductsPage,
    nextProductsPage,
    refresh,
    openProductDetail,
    setProductDetailOpen,
    openMenuDetail,
    setMenuDetailOpen,
    requestProductAvailability,
    requestVariantAvailability,
    requestMenuStatus,
    requestMenuItemStatus,
    setActionDialogOpen,
    confirmAction,
    clearSuccessMessage,
  } = useMenuManagement();

  const canManage = currentUser
    ? hasPermission(currentUser.role, "menu.edit")
    : false;
  const isActionSubmitting =
    productActionId !== null ||
    variantActionId !== null ||
    menuActionId !== null ||
    menuItemActionId !== null;
  const activeMenusOnPage = menus.data.filter((menu) => menu.status === "Active").length;
  const availableProductsOnPage = products.data.filter((product) => product.isAvailable).length;

  return (
    <div className="space-y-7">
      {successMessage ? (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success"
        >
          <span>{successMessage}</span>
          <Button variant="ghost" size="sm" className="h-7 text-success" onClick={clearSuccessMessage}>
            Đóng
          </Button>
        </div>
      ) : null}

      <section className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Thực đơn</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Theo dõi danh mục sản phẩm và các thực đơn đang phân phối tới kênh bán của IceBot.
          </p>
        </div>
        <Button
          variant="outline"
          className="h-10"
          onClick={() => void refresh()}
          isLoading={menus.isLoading || products.isLoading}
        >
          <RefreshCw className="size-4" />
          Làm mới
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Layers3}
          label="Tổng thực đơn"
          value={menus.pagination.totalCount}
          tone="primary"
        />
        <StatCard
          icon={CircleCheckBig}
          label="Đang bán"
          value={activeMenusOnPage}
          tone="success"
        />
        <StatCard
          icon={IceCreamBowl}
          label="Tổng sản phẩm"
          value={products.pagination.totalCount}
          tone="primary"
        />
        <StatCard
          icon={PackageCheck}
          label="Khả dụng"
          value={availableProductsOnPage}
          tone="success"
        />
      </section>

      <Card className="rounded-xl border border-border bg-card shadow-none">
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm theo tên hoặc mã sản phẩm / thực đơn..."
              className="h-9 bg-card pl-9 text-sm"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9" onClick={clearSearch}>
            Xóa tìm kiếm
          </Button>
        </CardContent>
      </Card>

      <MenusPanel
        canManage={canManage}
        collection={menus}
        menuActionId={menuActionId}
        onRetry={refresh}
        onPrevious={previousMenusPage}
        onNext={nextMenusPage}
        onView={(menuId) => void openMenuDetail(menuId)}
        onToggleStatus={requestMenuStatus}
      />

      <ProductsPanel
        canManage={canManage}
        collection={products}
        productActionId={productActionId}
        onRetry={refresh}
        onPrevious={previousProductsPage}
        onNext={nextProductsPage}
        onView={(productId) => void openProductDetail(productId)}
        onToggleAvailability={requestProductAvailability}
      />

      <ProductDetailDialog
        canManage={canManage}
        errorMessage={productDetailError}
        isLoading={isProductDetailLoading}
        open={isProductDetailOpen}
        product={selectedProduct}
        productActionId={productActionId}
        variantActionId={variantActionId}
        onOpenChange={setProductDetailOpen}
        onToggleProduct={requestProductAvailability}
        onToggleVariant={requestVariantAvailability}
      />

      <MenuDetailDialog
        canManage={canManage}
        errorMessage={menuDetailError}
        isLoading={isMenuDetailLoading}
        menu={selectedMenu}
        menuActionId={menuActionId}
        menuItemActionId={menuItemActionId}
        open={isMenuDetailOpen}
        onOpenChange={setMenuDetailOpen}
        onToggleMenu={requestMenuStatus}
        onToggleMenuItem={requestMenuItemStatus}
      />

      <CatalogActionDialog
        action={pendingAction}
        errorMessage={actionError}
        isSubmitting={isActionSubmitting}
        open={isActionDialogOpen}
        onConfirm={() => void confirmAction()}
        onOpenChange={setActionDialogOpen}
      />
    </div>
  );
}
