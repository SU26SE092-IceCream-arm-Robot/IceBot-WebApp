"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Edit3,
  Image as ImageIcon,
  ListTree,
  PackageSearch,
  Plus,
  Power,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  CreateProductCategoryRequest,
  ProductCategoryResult,
  UpdateProductCategoryRequest,
} from "@/types/menu-management";

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
  switch (productType.toLowerCase()) {
    case "icecream":
      return "Kem";
    default:
      return productType;
  }
}

function ProductCategoryCard({
  category,
  canManage,
  isMutating,
  onEdit,
  onSetStatus,
  onDelete,
}: {
  category: ProductCategoryResult;
  canManage: boolean;
  isMutating: boolean;
  onEdit: () => void;
  onSetStatus: () => void;
  onDelete: () => void;
}) {
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

      {canManage ? (
        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-border pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isMutating}
            onClick={onEdit}
          >
            <Edit3 className="size-4" />
            Chỉnh sửa
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            isLoading={isMutating}
            onClick={onSetStatus}
          >
            <Power className="size-4" />
            {category.isActive ? "Tắt" : "Kích hoạt"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={isMutating}
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
            Xóa
          </Button>
        </div>
      ) : null}
    </article>
  );
}

interface CategoryFormState {
  code: string;
  name: string;
  description: string;
  productType: string;
  imageUrl: string;
  displayOrder: string;
}

const EMPTY_FORM: CategoryFormState = {
  code: "",
  name: "",
  description: "",
  productType: "General",
  imageUrl: "",
  displayOrder: "0",
};

function getInitialForm(category: ProductCategoryResult | null): CategoryFormState {
  return category
    ? {
        code: category.code,
        name: category.name,
        description: category.description ?? "",
        productType: category.productType,
        imageUrl: category.imageUrl ?? "",
        displayOrder: String(category.displayOrder),
      }
    : EMPTY_FORM;
}

function ProductCategoryFormDialog({
  open,
  category,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  category: ProductCategoryResult | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onCreate: (request: CreateProductCategoryRequest) => Promise<boolean>;
  onUpdate: (
    categoryId: number,
    request: UpdateProductCategoryRequest,
  ) => Promise<boolean>;
}) {
  const [form, setForm] = useState<CategoryFormState>(() =>
    getInitialForm(category),
  );
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const setField = (field: keyof CategoryFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationMessage(null);
  };

  const submit = async () => {
    const code = form.code.trim();
    const name = form.name.trim();
    const productType = form.productType.trim();
    const displayOrder = Number(form.displayOrder);

    if (!category && (code.length < 2 || code.length > 50)) {
      setValidationMessage("Mã danh mục phải có từ 2 đến 50 ký tự.");
      return;
    }
    if (!name || name.length > 200) {
      setValidationMessage("Tên danh mục là bắt buộc và tối đa 200 ký tự.");
      return;
    }
    if (!productType || productType.length > 50) {
      setValidationMessage("Loại sản phẩm là bắt buộc và tối đa 50 ký tự.");
      return;
    }
    if (!Number.isInteger(displayOrder) || displayOrder < 0) {
      setValidationMessage("Thứ tự hiển thị phải là số nguyên không âm.");
      return;
    }
    if (form.description.trim().length > 1000 || form.imageUrl.trim().length > 1000) {
      setValidationMessage("Mô tả và URL hình ảnh không được vượt quá 1000 ký tự.");
      return;
    }

    const request = {
      name,
      description: form.description.trim() || null,
      productType,
      imageUrl: form.imageUrl.trim() || null,
      displayOrder,
    };
    const succeeded = category
      ? await onUpdate(category.id, request)
      : await onCreate({ code, ...request });
    if (succeeded) onOpenChange(false);
  };

  const productTypeOptions = Array.from(
    new Set(["General", "IceCream", form.productType]),
  ).filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {category ? "Chỉnh sửa danh mục" : "Tạo danh mục sản phẩm"}
          </DialogTitle>
          <DialogDescription>
            Danh mục này được dùng chung khi phân loại sản phẩm trên nền tảng.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="category-code" className="text-sm font-medium">
              Mã danh mục
            </label>
            <Input
              id="category-code"
              value={form.code}
              disabled={Boolean(category) || isSubmitting}
              maxLength={50}
              onChange={(event) => setField("code", event.target.value)}
              placeholder="ICE_CREAM"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="category-name" className="text-sm font-medium">
              Tên danh mục
            </label>
            <Input
              id="category-name"
              value={form.name}
              disabled={isSubmitting}
              maxLength={200}
              onChange={(event) => setField("name", event.target.value)}
              placeholder="Kem"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="category-product-type" className="text-sm font-medium">
              Loại sản phẩm
            </label>
            <Select
              value={form.productType}
              disabled={isSubmitting}
              onValueChange={(value) => value && setField("productType", value)}
            >
              <SelectTrigger id="category-product-type" className="w-full">
                <SelectValue>{getProductTypeLabel(form.productType)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {productTypeOptions.map((value) => (
                  <SelectItem key={value} value={value}>
                    {getProductTypeLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="category-order" className="text-sm font-medium">
              Thứ tự hiển thị
            </label>
            <Input
              id="category-order"
              type="number"
              min={0}
              step={1}
              value={form.displayOrder}
              disabled={isSubmitting}
              onChange={(event) => setField("displayOrder", event.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="category-description" className="text-sm font-medium">
              Mô tả
            </label>
            <textarea
              id="category-description"
              value={form.description}
              disabled={isSubmitting}
              maxLength={1000}
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              onChange={(event) => setField("description", event.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="category-image" className="text-sm font-medium">
              URL hình ảnh
            </label>
            <Input
              id="category-image"
              value={form.imageUrl}
              disabled={isSubmitting}
              maxLength={1000}
              onChange={(event) => setField("imageUrl", event.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        {validationMessage || errorMessage ? (
          <p className="text-sm text-destructive" role="alert">
            {validationMessage ?? errorMessage}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button type="button" isLoading={isSubmitting} onClick={() => void submit()}>
            {category ? "Lưu thay đổi" : "Tạo danh mục"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ProductCategoriesCatalogDialogProps {
  open: boolean;
  categories: ProductCategoryResult[];
  isLoading: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
  canManage: boolean;
  mutationError: string | null;
  mutatingCategoryId: number | "new" | null;
  onClearMutationError: () => void;
  onCreate: (request: CreateProductCategoryRequest) => Promise<boolean>;
  onUpdate: (
    categoryId: number,
    request: UpdateProductCategoryRequest,
  ) => Promise<boolean>;
  onSetStatus: (category: ProductCategoryResult) => Promise<boolean>;
  onDelete: (category: ProductCategoryResult) => Promise<boolean>;
}

export function ProductCategoriesCatalogDialog({
  open,
  categories,
  isLoading,
  errorMessage,
  onOpenChange,
  onRetry,
  canManage,
  mutationError,
  mutatingCategoryId,
  onClearMutationError,
  onCreate,
  onUpdate,
  onSetStatus,
  onDelete,
}: ProductCategoriesCatalogDialogProps) {
  const [includeInactive, setIncludeInactive] = useState(false);
  const [formTarget, setFormTarget] = useState<ProductCategoryResult | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductCategoryResult | null>(null);
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
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={includeInactive ? "secondary" : "outline"}
              size="sm"
              onClick={() => setIncludeInactive((value) => !value)}
            >
              {includeInactive ? "Ẩn danh mục đã tắt" : "Hiển thị đã tắt"}
            </Button>
            {canManage ? (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onClearMutationError();
                  setFormTarget("new");
                }}
              >
                <Plus className="size-4" />
                Tạo danh mục
              </Button>
            ) : null}
          </div>
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
              <ProductCategoryCard
                key={category.id}
                category={category}
                canManage={canManage}
                isMutating={mutatingCategoryId === category.id}
                onEdit={() => {
                  onClearMutationError();
                  setFormTarget(category);
                }}
                onSetStatus={() => void onSetStatus(category)}
                onDelete={() => {
                  onClearMutationError();
                  setDeleteTarget(category);
                }}
              />
            ))}
          </div>
        )}
      </DialogContent>

      <ProductCategoryFormDialog
        key={formTarget === "new" ? "new" : formTarget?.id ?? "closed"}
        open={formTarget !== null}
        category={formTarget === "new" ? null : formTarget}
        isSubmitting={mutatingCategoryId !== null}
        errorMessage={mutationError}
        onOpenChange={(next) => !next && setFormTarget(null)}
        onCreate={onCreate}
        onUpdate={onUpdate}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(next) => !next && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xóa danh mục sản phẩm?</DialogTitle>
            <DialogDescription>
              Chỉ có thể xóa danh mục chưa được sản phẩm tham chiếu. Nếu đang được sử dụng, backend sẽ từ chối thao tác.
            </DialogDescription>
          </DialogHeader>
          {mutationError ? (
            <p className="text-sm text-destructive" role="alert">{mutationError}</p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={mutatingCategoryId !== null}
              onClick={() => setDeleteTarget(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              isLoading={deleteTarget ? mutatingCategoryId === deleteTarget.id : false}
              onClick={async () => {
                if (!deleteTarget) return;
                const succeeded = await onDelete(deleteTarget);
                if (succeeded) setDeleteTarget(null);
              }}
            >
              <Trash2 className="size-4" />
              Xóa danh mục
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
