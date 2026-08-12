"use client";

import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  PackageCheck,
  PackageX,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProductTypeLabel, getProductReadinessIssues, getVariantReadinessIssues } from "@/lib/presenters/product-catalog";
import type {
  ProductCategoryResult,
  ProductResult,
  ProductVariantResult,
  TenantScopeType,
} from "@/types/catalog/menu-management";

interface ProductDetailPanelProps {
  canManage: boolean;
  categories: ProductCategoryResult[];
  errorMessage: string | null;
  isLoading: boolean;
  product: ProductResult | null;
  productActionId: string | null;
  variantActionId: string | null;
  onClose: () => void;
  onToggleProduct: (product: ProductResult) => void;
  onToggleVariant: (variant: ProductVariantResult) => void;
  onEditProduct: (product: ProductResult) => void;
  onDeleteProduct: (product: ProductResult) => void;
  onCreateVariant: (product: ProductResult) => void;
  onManageOptions: (product: ProductResult) => void;
  onManageRecipes: (product: ProductResult, variant: ProductVariantResult) => void;
  onEditVariant: (product: ProductResult, variant: ProductVariantResult) => void;
  onDeleteVariant: (product: ProductResult, variant: ProductVariantResult) => void;
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getScopeLabel(scopeType: TenantScopeType): string {
  switch (scopeType) {
    case "Global": return "Toàn hệ thống";
    case "Organization": return "Tổ chức";
    case "Store": return "Cửa hàng";
    case "Kiosk": return "Kiosk";
    case "Device": return "Thiết bị";
    default: return "Không xác định";
  }
}

function getFulfillmentTypeLabel(value: ProductVariantResult["fulfillmentType"]): string {
  switch (value) {
    case "MachineProduced": return "Sản xuất bằng máy";
    case "Manual": return "Thủ công";
    case "Packaged": return "Đóng gói sẵn";
  }
}

function getVariantTypeLabel(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized || normalized.toLowerCase() === "default") return null;
  return normalized;
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

function AvailabilityBadge({ isAvailable }: { isAvailable: boolean }) {
  return isAvailable ? (
    <Badge className="border-0 bg-success/10 text-success">Đang bán</Badge>
  ) : (
    <Badge variant="outline">Ngừng bán</Badge>
  );
}

export function ProductDetailPanel({
  canManage,
  categories,
  errorMessage,
  isLoading,
  product,
  productActionId,
  variantActionId,
  onClose,
  onToggleProduct,
  onToggleVariant,
  onEditProduct,
  onDeleteProduct,
  onCreateVariant,
  onManageOptions,
  onManageRecipes,
  onEditVariant,
  onDeleteVariant,
}: ProductDetailPanelProps) {
  const readinessIssues = product ? getProductReadinessIssues(product) : [];

  return (
    <section className="rounded-xl border border-border bg-card shadow-none">
      <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <h2 className="font-semibold text-foreground">Chi tiết và mức độ hoàn thiện</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý phiên bản, tùy chọn và công thức của sản phẩm đang chọn.
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" title="Đóng chi tiết" aria-label="Đóng chi tiết" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </header>

      {isLoading ? (
        <div className="space-y-3 p-5">
          <div className="h-24 animate-pulse rounded-lg bg-muted/40" />
          <div className="h-32 animate-pulse rounded-lg bg-muted/40" />
        </div>
      ) : errorMessage ? (
        <div role="alert" className="m-5 flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {errorMessage}
        </div>
      ) : product ? (
        <div className="space-y-6 p-5">
          <div className="grid gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <DetailField label="Sản phẩm">{product.displayName?.trim() || product.name}</DetailField>
            <DetailField label="Mã"><span className="font-mono">{product.code}</span></DetailField>
            <DetailField label="Loại">{getProductTypeLabel(product.productType)}</DetailField>
            <DetailField label="Trạng thái"><AvailabilityBadge isAvailable={product.isAvailable} /></DetailField>
            <DetailField label="Giá cơ bản">{formatMoney(product.basePrice, product.currency)}</DetailField>
            <DetailField label="Phạm vi"><Badge variant="outline">{getScopeLabel(product.scopeType)}</Badge></DetailField>
            <DetailField label="Danh mục">
              {categories.find((item) => item.id === product.categoryId)?.name || "Chưa phân loại"}
            </DetailField>
            <DetailField label="Mô tả">{product.description?.trim() || "Chưa có mô tả."}</DetailField>
          </div>

          <div className={readinessIssues.length === 0 ? "rounded-lg border border-success/20 bg-success/5 p-4" : "rounded-lg border border-warning/30 bg-warning/5 p-4"}>
            <div className="flex items-start gap-3">
              {readinessIssues.length === 0 ? <CheckCircle2 className="mt-0.5 size-5 text-success" /> : <AlertTriangle className="mt-0.5 size-5 text-warning" />}
              <div>
                <h3 className="font-medium">{readinessIssues.length === 0 ? "Thiết lập sản phẩm đã hoàn thiện" : `${readinessIssues.length} việc cần hoàn thiện`}</h3>
                {readinessIssues.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {readinessIssues.map((issue, index) => <li key={`${issue.code}-${index}`}>• {issue.message}</li>)}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canManage ? (
              <>
                <Button variant="outline" size="sm" onClick={() => onEditProduct(product)}><Pencil className="size-3.5" />Sửa sản phẩm</Button>
                <Button variant="outline" size="sm" onClick={() => onManageOptions(product)}><SlidersHorizontal className="size-3.5" />Tùy chọn</Button>
                <Button variant={product.isAvailable ? "outline" : "default"} size="sm" isLoading={productActionId === product.id} onClick={() => onToggleProduct(product)}>
                  {product.isAvailable ? <PackageX className="size-3.5" /> : <PackageCheck className="size-3.5" />}
                  {product.isAvailable ? "Tắt sản phẩm" : "Bật sản phẩm"}
                </Button>
                <Button size="sm" onClick={() => onCreateVariant(product)}><Plus className="size-3.5" />Thêm phiên bản</Button>
              </>
            ) : null}
          </div>

          <section className="space-y-3">
            <div>
              <h3 className="font-medium">Phiên bản sản phẩm</h3>
              <p className="text-xs text-muted-foreground">Cách thực hiện, giá, công thức và trạng thái của từng phiên bản.</p>
            </div>
            {product.variants.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">Sản phẩm chưa có phiên bản.</div>
            ) : (
              <div className="space-y-2">
                {product.variants.map((variant) => {
                  const variantTypeLabel = getVariantTypeLabel(variant.variantType);
                  const variantIssues = getVariantReadinessIssues(variant);
                  return (
                    <article key={variant.id} className="flex flex-col gap-3 rounded-lg border border-border p-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{variant.displayName?.trim() || variant.name}</p>
                          <AvailabilityBadge isAvailable={variant.isAvailable} />
                          {variantIssues.length > 0 ? <Badge className="border-0 bg-warning/10 text-warning">Cần cấu hình</Badge> : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-mono">{variant.code}</span>
                          {variant.sizeCode ? ` · Kích cỡ ${variant.sizeCode}` : ""}
                          {variantTypeLabel ? ` · ${variantTypeLabel}` : ""}
                          {` · ${getFulfillmentTypeLabel(variant.fulfillmentType)}`}
                        </p>
                        <p className="text-sm font-medium">{formatMoney(variant.basePrice, variant.currency)}</p>
                        {variant.fulfillmentType === "MachineProduced" ? (
                          <p className={variant.sellableRecipeCount > 0 ? "text-xs text-success" : "text-xs text-warning"}>
                            {variant.sellableRecipeCount > 0
                              ? `${variant.sellableRecipeCount} công thức có thể bán`
                              : variant.recipeCount > 0
                                ? `${variant.recipeCount} công thức chưa được phát hành`
                                : "Chưa có công thức"}
                          </p>
                        ) : null}
                      </div>
                      {canManage ? (
                        <div className="flex flex-wrap gap-1">
                          {variant.fulfillmentType === "MachineProduced" ? (
                            <Button variant="outline" size="sm" onClick={() => onManageRecipes(product, variant)}><FlaskConical className="size-3.5" />Công thức</Button>
                          ) : null}
                          <Button variant="outline" size="sm" isLoading={variantActionId === variant.id} onClick={() => onToggleVariant(variant)}>{variant.isAvailable ? "Tắt phiên bản" : "Bật phiên bản"}</Button>
                          <Button variant="ghost" size="icon-sm" title="Chỉnh sửa phiên bản" aria-label="Chỉnh sửa phiên bản" onClick={() => onEditVariant(product, variant)}><Pencil className="size-4" /></Button>
                          <Button variant="ghost" size="icon-sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" title="Xóa phiên bản" aria-label="Xóa phiên bản" onClick={() => onDeleteVariant(product, variant)}><Trash2 className="size-4" /></Button>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {canManage ? (
            <div className="flex justify-end border-t border-border pt-4">
              <Button variant="destructive" size="sm" onClick={() => onDeleteProduct(product)}><Trash2 className="size-4" />Xóa sản phẩm</Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
