"use client";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  IceCreamBowl,
  RefreshCw,
  Search,
  ShoppingBasket,
} from "lucide-react";

import {
  CatalogEmptyMarker,
  MenusTable,
  ProductsTable,
} from "@/components/features/menu/catalog-tables";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMenuManagement, type MenuCollectionState } from "@/hooks/use-menu-management";
import type {
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
}: {
  collection: MenuCollectionState<MenuResult>;
  onRetry: () => Promise<void>;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShoppingBasket className="size-4" />
          </span>
          <div>
            <CardTitle className="text-base">Thực đơn đang bán</CardTitle>
            <CardDescription>Lớp thực đơn và các món hiển thị tới kênh bán hàng.</CardDescription>
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
          <MenusTable menus={collection.data} />
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
}: {
  collection: MenuCollectionState<ProductResult>;
  onRetry: () => Promise<void>;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <IceCreamBowl className="size-4" />
          </span>
          <div>
            <CardTitle className="text-base">Danh mục sản phẩm</CardTitle>
            <CardDescription>Danh mục sản phẩm và biến thể làm nguồn cho món bán.</CardDescription>
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
          <ProductsTable products={collection.data} />
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
  const {
    searchTerm,
    menus,
    products,
    setSearchTerm,
    clearSearch,
    previousMenusPage,
    nextMenusPage,
    previousProductsPage,
    nextProductsPage,
    refresh,
  } = useMenuManagement();

  const activeMenusOnPage = menus.data.filter((menu) => menu.status === "Active").length;
  const availableProductsOnPage = products.data.filter((product) => product.isAvailable).length;

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <Badge variant="outline" className="gap-2 border-primary/20 bg-primary/5 text-primary">
            <IceCreamBowl className="size-3" />
            Danh mục và menu bán hàng
          </Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Thực đơn</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Theo dõi danh mục sản phẩm và các thực đơn đang phân phối tới kênh bán của IceBot.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => void refresh()}
          isLoading={menus.isLoading || products.isLoading}
        >
          <RefreshCw className="size-4" />
          Làm mới
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
        <Card className="border-border/80 shadow-none">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm text-muted-foreground">Tổng thực đơn</p>
            <p className="tabular-nums text-3xl font-semibold tracking-tight text-foreground">
              {menus.pagination.totalCount}
            </p>
            <p className="text-xs text-muted-foreground">Theo kết quả đang lọc</p>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-none">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm text-muted-foreground">Đang bán trên trang</p>
            <p className="tabular-nums text-3xl font-semibold tracking-tight text-primary">
              {activeMenusOnPage}
            </p>
            <p className="text-xs text-muted-foreground">Thực đơn đang ở trạng thái bán</p>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-none">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm text-muted-foreground">Tổng sản phẩm</p>
            <p className="tabular-nums text-3xl font-semibold tracking-tight text-foreground">
              {products.pagination.totalCount}
            </p>
            <p className="text-xs text-muted-foreground">Danh mục hiện có</p>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-none">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm text-muted-foreground">Khả dụng trên trang</p>
            <p className="tabular-nums text-3xl font-semibold tracking-tight text-primary">
              {availableProductsOnPage}
            </p>
            <p className="text-xs text-muted-foreground">Sản phẩm đang bán</p>
          </CardContent>
        </Card>
      </section>

      <Card className="border-border/80 shadow-none">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm theo tên hoặc mã sản phẩm / thực đơn..."
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={clearSearch}>
            Xóa tìm kiếm
          </Button>
        </CardContent>
      </Card>

      <MenusPanel
        collection={menus}
        onRetry={refresh}
        onPrevious={previousMenusPage}
        onNext={nextMenusPage}
      />

      <ProductsPanel
        collection={products}
        onRetry={refresh}
        onPrevious={previousProductsPage}
        onNext={nextProductsPage}
      />
    </div>
  );
}
