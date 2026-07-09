"use client";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Search,
  SlidersHorizontal,
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
import { Input } from "@/components/ui/input";
import type { ProductOptionGroupCatalogItem } from "@/hooks/use-product-options-catalog";
import type { MenuManagementPagination, OptionSelectionType } from "@/types/menu-management";

const SELECTION_TYPE_LABELS: Record<OptionSelectionType, string> = {
  Single: "Chọn một",
  Multiple: "Chọn nhiều",
};

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
  }).format(value);
}

function OptionGroupsLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-32 animate-pulse rounded-lg bg-muted/40" />
      ))}
    </div>
  );
}

function OptionGroupCard({ item }: { item: ProductOptionGroupCatalogItem }) {
  const { product, group } = item;

  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">{group.name}</h3>
            <Badge variant={group.isActive ? "default" : "outline"}>
              {group.isActive ? "Đang dùng" : "Đã tắt"}
            </Badge>
            {group.isRequired ? <Badge variant="secondary">Bắt buộc</Badge> : null}
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            {group.code} · {product.displayName || product.name}
          </p>
          {group.description ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {group.description}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 lg:min-w-[360px]">
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <p className="text-muted-foreground">Kiểu chọn</p>
            <p className="mt-1 font-medium text-foreground">
              {SELECTION_TYPE_LABELS[group.selectionType] ?? group.selectionType}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <p className="text-muted-foreground">Tối thiểu</p>
            <p className="mt-1 tabular-nums font-medium text-foreground">
              {group.minSelections}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <p className="text-muted-foreground">Tối đa</p>
            <p className="mt-1 tabular-nums font-medium text-foreground">
              {group.maxSelections}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <p className="text-muted-foreground">Thứ tự</p>
            <p className="mt-1 tabular-nums font-medium text-foreground">
              {group.displayOrder}
            </p>
          </div>
        </div>
      </div>

      {group.options.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          Nhóm này chưa có tuỳ chọn nào.
        </div>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {group.options.map((option) => (
            <div
              key={option.id}
              className="rounded-lg border border-border bg-muted/20 px-3 py-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {option.name}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {option.code}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-foreground">
                  {formatMoney(option.priceDelta, option.currency)}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant={option.isAvailable ? "default" : "outline"}>
                  {option.isAvailable ? "Khả dụng" : "Không khả dụng"}
                </Badge>
                {option.isDefault ? <Badge variant="secondary">Mặc định</Badge> : null}
                <Badge variant="outline">#{option.displayOrder}</Badge>
              </div>
              {option.description ? (
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                  {option.description}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

interface ProductOptionsCatalogDialogProps {
  open: boolean;
  organizationName: string;
  searchTerm: string;
  optionGroups: ProductOptionGroupCatalogItem[];
  productsCount: number;
  pagination: MenuManagementPagination;
  isLoading: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onSearchTermChange: (value: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onRetry: () => void;
}

export function ProductOptionsCatalogDialog({
  open,
  organizationName,
  searchTerm,
  optionGroups,
  productsCount,
  pagination,
  isLoading,
  errorMessage,
  onOpenChange,
  onSearchTermChange,
  onPreviousPage,
  onNextPage,
  onRetry,
}: ProductOptionsCatalogDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader className="gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <ListChecks className="size-5" />
            </span>
            <div className="min-w-0 space-y-1">
              <DialogTitle>Nhóm tuỳ chọn sản phẩm</DialogTitle>
              <DialogDescription>
                Xem các nhóm tuỳ chọn và lựa chọn đang gắn với sản phẩm của tổ chức {organizationName}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              placeholder="Tìm theo tên hoặc mã sản phẩm..."
              className="pl-9"
            />
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{optionGroups.length}</span> nhóm /{" "}
            <span className="font-medium text-foreground">{productsCount}</span> sản phẩm trên trang
          </div>
        </div>

        {isLoading ? (
          <OptionGroupsLoading />
        ) : errorMessage ? (
          <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{errorMessage}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Thử lại
            </Button>
          </div>
        ) : optionGroups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center">
            <SlidersHorizontal className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="text-sm font-medium">Chưa có nhóm tuỳ chọn</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Không có nhóm tuỳ chọn nào trong các sản phẩm phù hợp với bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {optionGroups.map((item) => (
              <OptionGroupCard
                key={`${item.product.id}-${item.group.id}`}
                item={item}
              />
            ))}
          </div>
        )}

        <div className="flex flex-col justify-between gap-3 border-t border-border pt-3 text-sm sm:flex-row sm:items-center">
          <p className="text-muted-foreground">
            Trang <span className="font-medium text-foreground">{pagination.page}</span> /{" "}
            {Math.max(pagination.totalPages, 1)} · {pagination.totalCount} sản phẩm
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevious || isLoading}
              onClick={onPreviousPage}
            >
              <ChevronLeft className="size-4" />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext || isLoading}
              onClick={onNextPage}
            >
              Sau
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
