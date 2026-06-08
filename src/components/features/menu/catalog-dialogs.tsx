"use client";

import {
  AlertTriangle,
  Boxes,
  CirclePause,
  CirclePlay,
  PackageCheck,
  PackageX,
  ShoppingBasket,
} from "lucide-react";

import type { CatalogManagementAction } from "@/hooks/use-menu-management";
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
import type {
  MenuItemResult,
  MenuItemStatus,
  MenuResult,
  MenuStatus,
  ProductResult,
  ProductVariantResult,
  TenantScopeType,
} from "@/types/menu-management";

interface ProductDetailDialogProps {
  canManage: boolean;
  errorMessage: string | null;
  isLoading: boolean;
  open: boolean;
  product: ProductResult | null;
  productActionId: string | null;
  variantActionId: string | null;
  onOpenChange: (open: boolean) => void;
  onToggleProduct: (product: ProductResult) => void;
  onToggleVariant: (variant: ProductVariantResult) => void;
}

interface MenuDetailDialogProps {
  canManage: boolean;
  errorMessage: string | null;
  isLoading: boolean;
  menu: MenuResult | null;
  menuActionId: string | null;
  menuItemActionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleMenu: (menu: MenuResult, status: MenuStatus) => void;
  onToggleMenuItem: (item: MenuItemResult, status: MenuItemStatus) => void;
}

interface CatalogActionDialogProps {
  action: CatalogManagementAction | null;
  errorMessage: string | null;
  isSubmitting: boolean;
  open: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
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
    case "Global":
      return "Toàn hệ thống";
    case "Organization":
      return "Tổ chức";
    case "Store":
      return "Cửa hàng";
    case "Kiosk":
      return "Kiosk";
    case "Device":
      return "Thiết bị";
  }
}

function getScopeId(
  resource: Pick<ProductResult | MenuResult, "organizationId" | "storeId" | "kioskId">
): string | null {
  return resource.kioskId ?? resource.storeId ?? resource.organizationId ?? null;
}

function getMenuStatusLabel(status: MenuStatus): string {
  switch (status) {
    case "Draft":
      return "Bản nháp";
    case "Active":
      return "Đang bán";
    case "Paused":
      return "Tạm dừng";
    case "Archived":
      return "Lưu trữ";
  }
}

function getMenuItemStatusLabel(status: MenuItemStatus): string {
  switch (status) {
    case "Draft":
      return "Nháp";
    case "Active":
      return "Đang bán";
    case "Unavailable":
      return "Ngừng bán";
    case "Archived":
      return "Lưu trữ";
  }
}

export function getNextMenuStatus(status: MenuStatus): MenuStatus | null {
  switch (status) {
    case "Active":
      return "Paused";
    case "Draft":
    case "Paused":
      return "Active";
    case "Archived":
      return null;
  }
}

export function getNextMenuItemStatus(status: MenuItemStatus): MenuItemStatus | null {
  switch (status) {
    case "Active":
      return "Unavailable";
    case "Draft":
    case "Unavailable":
      return "Active";
    case "Archived":
      return null;
  }
}

function DetailError({ message }: { message: string }) {
  return (
    <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
      <p className="text-sm text-destructive">{message}</p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4 py-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={`catalog-detail-skeleton-${index}`} className="space-y-2">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="h-5 w-full animate-pulse rounded bg-muted/60" />
        </div>
      ))}
    </div>
  );
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

function AvailabilityBadge({ isAvailable }: { isAvailable: boolean }) {
  return isAvailable ? (
    <Badge className="border-0 bg-success/10 text-success">Đang bán</Badge>
  ) : (
    <Badge className="border-0 bg-muted text-muted-foreground">Ngừng bán</Badge>
  );
}

export function ProductDetailDialog({
  canManage,
  errorMessage,
  isLoading,
  open,
  product,
  productActionId,
  variantActionId,
  onOpenChange,
  onToggleProduct,
  onToggleVariant,
}: ProductDetailDialogProps) {
  const scopeId = product ? getScopeId(product) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chi tiết sản phẩm</DialogTitle>
          <DialogDescription>
            Dữ liệu danh mục và biến thể từ Management Products API.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <DetailSkeleton />
        ) : errorMessage ? (
          <DetailError message={errorMessage} />
        ) : product ? (
          <div className="space-y-6 py-2">
            <div className="grid gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
              <DetailField label="Tên sản phẩm">
                {product.displayName?.trim() || product.name || "Chưa cập nhật"}
              </DetailField>
              <DetailField label="Mã sản phẩm">
                <span className="tabular-nums">{product.code || "Chưa cập nhật"}</span>
              </DetailField>
              <DetailField label="Trạng thái">
                <AvailabilityBadge isAvailable={product.isAvailable} />
              </DetailField>
              <DetailField label="Giá cơ bản">
                <span className="tabular-nums font-medium">
                  {formatMoney(product.basePrice, product.currency)}
                </span>
              </DetailField>
              <DetailField label="Phạm vi">
                <div className="space-y-1">
                  <Badge variant="outline">{getScopeLabel(product.scopeType)}</Badge>
                  {scopeId ? (
                    <p className="break-all tabular-nums text-xs text-muted-foreground">{scopeId}</p>
                  ) : null}
                </div>
              </DetailField>
              <DetailField label="Loại sản phẩm">
                {product.productType || "Chưa cập nhật"}
              </DetailField>
              <div className="sm:col-span-2">
                <DetailField label="Mô tả">
                  {product.description?.trim() || "Chưa có mô tả."}
                </DetailField>
              </div>
            </div>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium text-foreground">Biến thể sản phẩm</h3>
                  <p className="text-xs text-muted-foreground">
                    Giá và trạng thái khả dụng của từng biến thể.
                  </p>
                </div>
                {canManage ? (
                  <Button
                    variant={product.isAvailable ? "outline" : "default"}
                    size="sm"
                    isLoading={productActionId === product.id}
                    onClick={() => onToggleProduct(product)}
                  >
                    {product.isAvailable ? (
                      <PackageX className="size-3.5" />
                    ) : (
                      <PackageCheck className="size-3.5" />
                    )}
                    {product.isAvailable ? "Tắt sản phẩm" : "Bật sản phẩm"}
                  </Button>
                ) : null}
              </div>

              {product.variants.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                  Sản phẩm chưa có biến thể.
                </div>
              ) : (
                <div className="space-y-2">
                  {product.variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-foreground">
                            {variant.displayName?.trim() || variant.name}
                          </p>
                          <AvailabilityBadge isAvailable={variant.isAvailable} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <span className="tabular-nums">{variant.code}</span>
                          {variant.sizeCode ? ` · Kích cỡ ${variant.sizeCode}` : ""}
                          {variant.variantType ? ` · ${variant.variantType}` : ""}
                        </p>
                        <p className="tabular-nums text-sm font-medium text-foreground">
                          {formatMoney(variant.basePrice, variant.currency)}
                        </p>
                      </div>
                      {canManage ? (
                        <Button
                          variant="outline"
                          size="sm"
                          isLoading={variantActionId === variant.id}
                          onClick={() => onToggleVariant(variant)}
                        >
                          {variant.isAvailable ? "Tắt biến thể" : "Bật biến thể"}
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

export function MenuDetailDialog({
  canManage,
  errorMessage,
  isLoading,
  menu,
  menuActionId,
  menuItemActionId,
  open,
  onOpenChange,
  onToggleMenu,
  onToggleMenuItem,
}: MenuDetailDialogProps) {
  const scopeId = menu ? getScopeId(menu) : null;
  const nextMenuStatus = menu ? getNextMenuStatus(menu.status) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chi tiết thực đơn</DialogTitle>
          <DialogDescription>
            Trạng thái phân phối và danh sách món từ Management Menus API.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <DetailSkeleton />
        ) : errorMessage ? (
          <DetailError message={errorMessage} />
        ) : menu ? (
          <div className="space-y-6 py-2">
            <div className="grid gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
              <DetailField label="Tên thực đơn">{menu.name || "Chưa cập nhật"}</DetailField>
              <DetailField label="Mã thực đơn">
                <span className="tabular-nums">{menu.code || "Chưa cập nhật"}</span>
              </DetailField>
              <DetailField label="Trạng thái">
                <Badge variant="outline">{getMenuStatusLabel(menu.status)}</Badge>
              </DetailField>
              <DetailField label="Phạm vi">
                <div className="space-y-1">
                  <Badge variant="outline">{getScopeLabel(menu.scopeType)}</Badge>
                  {scopeId ? (
                    <p className="break-all tabular-nums text-xs text-muted-foreground">{scopeId}</p>
                  ) : null}
                </div>
              </DetailField>
              <div className="sm:col-span-2">
                <DetailField label="Mô tả">
                  {menu.description?.trim() || "Chưa có mô tả."}
                </DetailField>
              </div>
            </div>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium text-foreground">Món trong thực đơn</h3>
                  <p className="text-xs text-muted-foreground">
                    Giá, thứ tự và trạng thái phân phối của từng món.
                  </p>
                </div>
                {canManage && nextMenuStatus ? (
                  <Button
                    variant={nextMenuStatus === "Active" ? "default" : "outline"}
                    size="sm"
                    isLoading={menuActionId === menu.id}
                    onClick={() => onToggleMenu(menu, nextMenuStatus)}
                  >
                    {nextMenuStatus === "Active" ? (
                      <CirclePlay className="size-3.5" />
                    ) : (
                      <CirclePause className="size-3.5" />
                    )}
                    {nextMenuStatus === "Active" ? "Kích hoạt" : "Tạm dừng"}
                  </Button>
                ) : null}
              </div>

              {menu.items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                  Thực đơn chưa có món.
                </div>
              ) : (
                <div className="space-y-2">
                  {menu.items
                    .slice()
                    .sort((left, right) => left.displayOrder - right.displayOrder)
                    .map((item) => {
                      const nextItemStatus = getNextMenuItemStatus(item.status);

                      return (
                        <div
                          key={item.id}
                          className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-foreground">
                                {item.displayName || item.code}
                              </p>
                              <Badge variant="outline">
                                {getMenuItemStatusLabel(item.status)}
                              </Badge>
                            </div>
                            <p className="break-all tabular-nums text-xs text-muted-foreground">
                              Product: {item.productId}
                            </p>
                            <p className="break-all tabular-nums text-xs text-muted-foreground">
                              Variant: {item.productVariantId}
                            </p>
                            <p className="tabular-nums text-sm font-medium text-foreground">
                              {formatMoney(item.price, item.currency)}
                              <span className="ml-2 text-xs font-normal text-muted-foreground">
                                Thứ tự {item.displayOrder}
                              </span>
                            </p>
                          </div>
                          {canManage && nextItemStatus ? (
                            <Button
                              variant="outline"
                              size="sm"
                              isLoading={menuItemActionId === item.id}
                              onClick={() => onToggleMenuItem(item, nextItemStatus)}
                            >
                              {nextItemStatus === "Active" ? "Bật bán" : "Ngừng bán"}
                            </Button>
                          ) : null}
                        </div>
                      );
                    })}
                </div>
              )}
            </section>
          </div>
        ) : null}

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

function getActionCopy(action: CatalogManagementAction | null): {
  title: string;
  description: string;
  confirmLabel: string;
} {
  if (!action) {
    return {
      title: "Xác nhận thay đổi",
      description: "Xác nhận cập nhật trạng thái dữ liệu.",
      confirmLabel: "Xác nhận",
    };
  }

  switch (action.kind) {
    case "product-availability":
      return {
        title: action.nextAvailable ? "Bật sản phẩm?" : "Tắt sản phẩm?",
        description: `${action.label} sẽ được chuyển sang trạng thái ${action.nextAvailable ? "đang bán" : "ngừng bán"}.`,
        confirmLabel: action.nextAvailable ? "Bật sản phẩm" : "Tắt sản phẩm",
      };
    case "variant-availability":
      return {
        title: action.nextAvailable ? "Bật biến thể?" : "Tắt biến thể?",
        description: `${action.label} sẽ được chuyển sang trạng thái ${action.nextAvailable ? "đang bán" : "ngừng bán"}.`,
        confirmLabel: action.nextAvailable ? "Bật biến thể" : "Tắt biến thể",
      };
    case "menu-status":
      return {
        title: action.nextStatus === "Active" ? "Kích hoạt thực đơn?" : "Tạm dừng thực đơn?",
        description: `${action.label} sẽ được chuyển sang trạng thái ${getMenuStatusLabel(action.nextStatus)}.`,
        confirmLabel: action.nextStatus === "Active" ? "Kích hoạt" : "Tạm dừng",
      };
    case "menu-item-status":
      return {
        title: action.nextStatus === "Active" ? "Bật bán món?" : "Ngừng bán món?",
        description: `${action.label} sẽ được chuyển sang trạng thái ${getMenuItemStatusLabel(action.nextStatus)}.`,
        confirmLabel: action.nextStatus === "Active" ? "Bật bán" : "Ngừng bán",
      };
  }
}

export function CatalogActionDialog({
  action,
  errorMessage,
  isSubmitting,
  open,
  onConfirm,
  onOpenChange,
}: CatalogActionDialogProps) {
  const copy = getActionCopy(action);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isSubmitting}>
        <DialogHeader>
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {action?.kind === "menu-status" || action?.kind === "menu-item-status" ? (
              <ShoppingBasket className="size-5" />
            ) : (
              <Boxes className="size-5" />
            )}
          </span>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        {errorMessage ? <DetailError message={errorMessage} /> : null}

        <DialogFooter>
          <Button variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            variant={
              action?.kind === "product-availability" && !action.nextAvailable
                ? "destructive"
                : "default"
            }
            isLoading={isSubmitting}
            onClick={onConfirm}
          >
            {copy.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
