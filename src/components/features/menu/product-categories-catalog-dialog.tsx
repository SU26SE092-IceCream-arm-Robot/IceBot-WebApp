"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Image as ImageIcon,
  ListTree,
  PackageSearch,
  RotateCcw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProductCategoryResult } from "@/types/menu-management";

function ProductCategoriesLoading() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-32 animate-pulse rounded-lg bg-muted/40" />
      ))}
    </div>
  );
}

function getProductTypeLabel(productType: string): string {
  switch (productType) {
    case "IceCream":
      return "Kem";
    default:
      return productType;
  }
}

function ProductCategoryCard({ category }: { category: ProductCategoryResult }) {
  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">{category.name}</h3>
            <Badge variant={category.isActive ? "default" : "outline"}>
              {category.isActive ? "Đang dùng" : "Đã tắt"}
            </Badge>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            {category.code}
          </p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {category.imageUrl ? (
            <ImageIcon className="size-5" />
          ) : (
            <PackageSearch className="size-5" />
          )}
        </span>
      </div>

      {category.description ? (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
          {category.description}
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Chưa có mô tả.
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-muted-foreground">Loại sản phẩm</p>
          <p className="mt-1 font-medium text-foreground">
            {getProductTypeLabel(category.productType)}
          </p>
        </div>
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-muted-foreground">Thứ tự</p>
          <p className="mt-1 tabular-nums font-medium text-foreground">
            {category.displayOrder}
          </p>
        </div>
      </div>
    </article>
  );
}

interface ProductCategoriesCatalogDialogProps {
  open: boolean;
  categories: ProductCategoryResult[];
  isLoading: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
}

export function ProductCategoriesCatalogDialog({
  open,
  categories,
  isLoading,
  errorMessage,
  onOpenChange,
  onRetry,
}: ProductCategoriesCatalogDialogProps) {
  const [includeInactive, setIncludeInactive] = useState(false);
  const visibleCategories = useMemo(
    () =>
      includeInactive
        ? categories
        : categories.filter((category) => category.isActive),
    [categories, includeInactive],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader className="gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <ListTree className="size-5" />
            </span>
            <div className="min-w-0 space-y-1">
              <DialogTitle>Danh mục sản phẩm</DialogTitle>
              <DialogDescription>
                Xem các nhóm phân loại sản phẩm dùng khi tạo và chỉnh sửa catalog.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {visibleCategories.length}
            </span>{" "}
            danh mục hiển thị /{" "}
            <span className="font-medium text-foreground">{categories.length}</span>{" "}
            tổng
          </div>
          <Button
            type="button"
            variant={includeInactive ? "secondary" : "outline"}
            size="sm"
            onClick={() => setIncludeInactive((value) => !value)}
          >
            {includeInactive ? "Ẩn danh mục đã tắt" : "Hiển thị đã tắt"}
          </Button>
        </div>

        {isLoading ? (
          <ProductCategoriesLoading />
        ) : errorMessage ? (
          <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{errorMessage}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RotateCcw className="size-4" />
              Thử lại
            </Button>
          </div>
        ) : visibleCategories.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center">
            <ListTree className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="text-sm font-medium">Chưa có danh mục sản phẩm</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Backend chưa trả danh mục phù hợp với bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleCategories.map((category) => (
              <ProductCategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
