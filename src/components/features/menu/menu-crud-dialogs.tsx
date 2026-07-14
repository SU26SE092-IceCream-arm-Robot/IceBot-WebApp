"use client";

import { useState, type FormEvent } from "react";
import { AlertTriangle, Plus, ShoppingBasket, Trash2 } from "lucide-react";

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
import type { MenuDeleteTarget } from "@/hooks/use-menu-crud";
import type {
  CreateMenuItemRequest,
  CreateMenuRequest,
  MenuItemResult,
  MenuResult,
  ProductResult,
  TenantScopeType,
  UpdateMenuItemRequest,
  UpdateMenuRequest,
} from "@/types/menu-management";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function optional(value: string): string | null {
  return value.trim() || null;
}

function getScopeTypeLabel(scopeType: TenantScopeType): string {
  switch (scopeType) {
    case "Organization":
      return "Tổ chức";
    case "Store":
      return "Cửa hàng";
    case "Kiosk":
      return "Kiosk";
    default:
      return "Không xác định";
  }
}

function getProductOptionLabel(product: ProductResult): string {
  const name = product.displayName?.trim() || product.name?.trim() || product.code;
  return product.code ? `${name} · ${product.code}` : name || "Không xác định";
}

function getVariantOptionLabel(variant: ProductResult["variants"][number]): string {
  const name = variant.displayName?.trim() || variant.name?.trim() || variant.code;
  return variant.code ? `${name} · ${variant.code}` : name || "Không xác định";
}

function FormError({ message }: { message: string | null }) {
  return message ? (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <p>{message}</p>
    </div>
  ) : null;
}

interface MenuFormDialogProps {
  menu: MenuResult | null;
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onCreate: (request: CreateMenuRequest) => Promise<boolean>;
  onUpdate: (request: UpdateMenuRequest) => Promise<boolean>;
}

export function MenuFormDialog({
  menu,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onCreate,
  onUpdate,
}: MenuFormDialogProps) {
  const isCreate = !menu;
  const [code, setCode] = useState(menu?.code ?? "");
  const [name, setName] = useState(menu?.name ?? "");
  const [description, setDescription] = useState(menu?.description ?? "");
  const [currency, setCurrency] = useState(menu?.currency ?? "VND");
  const [displayOrder, setDisplayOrder] = useState(menu?.displayOrder.toString() ?? "0");
  const [scopeType, setScopeType] = useState<TenantScopeType>(
    menu?.scopeType ?? "Organization",
  );
  const [storeId, setStoreId] = useState(menu?.storeId ?? "");
  const [kioskId, setKioskId] = useState(menu?.kioskId ?? "");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!code.trim() || !name.trim()) {
      setValidationMessage("Mã và tên thực đơn là bắt buộc.");
      return;
    }
    const parsedOrder = Number(displayOrder);
    if (!Number.isInteger(parsedOrder)) {
      setValidationMessage("Thứ tự hiển thị phải là số nguyên.");
      return;
    }

    const requiredScopeIds = [
      scopeType === "Store" || scopeType === "Kiosk" ? [storeId, "Cửa hàng"] : null,
      scopeType === "Kiosk" ? [kioskId, "Kiosk"] : null,
    ].filter(Boolean) as [string, string][];
    const invalidScope = requiredScopeIds.find(
      ([value]) => !UUID_PATTERN.test(value.trim()),
    );
    if (invalidScope) {
      setValidationMessage(`${invalidScope[1]} là bắt buộc và phải là UUID hợp lệ.`);
      return;
    }


    const request = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: optional(description),
      currency: currency.trim().toUpperCase(),
      displayOrder: parsedOrder,
    };
    
    setValidationMessage(null);
    if (isCreate) {
      await onCreate({
        ...request,
        storeId: scopeType === "Store" || scopeType === "Kiosk" ? storeId.trim() : null,
        kioskId: scopeType === "Kiosk" ? kioskId.trim() : null,
      });
    } else {
      await onUpdate(request);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <div className="flex items-start gap-3 pr-8">
            <span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <ShoppingBasket className="size-5" />
            </span>
            <div className="space-y-1">
              <DialogTitle>{isCreate ? "Tạo thực đơn" : "Chỉnh sửa thực đơn"}</DialogTitle>
              <DialogDescription>{isCreate ? "Tạo danh sách thực đơn để gán cho các kiosk." : menu.code}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="menu-code" className="text-sm font-medium">Mã thực đơn <span className="text-destructive">*</span></label>
              <Input id="menu-code" value={code} disabled={isSubmitting} className="h-10 font-mono uppercase" onChange={(event) => setCode(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="menu-name" className="text-sm font-medium">Tên thực đơn <span className="text-destructive">*</span></label>
              <Input id="menu-name" value={name} disabled={isSubmitting} className="h-10" onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="menu-currency" className="text-sm font-medium">Tiền tệ</label>
              <Input id="menu-currency" value={currency} disabled={isSubmitting} className="h-10 font-mono uppercase" onChange={(event) => setCurrency(event.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="menu-description" className="text-sm font-medium">Mô tả</label>
              <textarea id="menu-description" value={description} rows={3} disabled={isSubmitting} className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50" onChange={(event) => setDescription(event.target.value)} />
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-muted/15 p-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Phạm vi trong tổ chức</label>
              <Select value={scopeType} disabled={isSubmitting || !isCreate} onValueChange={(value) => setScopeType(value as TenantScopeType)}>
                <SelectTrigger className="h-10 w-full"><SelectValue>{getScopeTypeLabel(scopeType)}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Organization">Tổ chức</SelectItem>
                  <SelectItem value="Store">Cửa hàng</SelectItem>
                  <SelectItem value="Kiosk">Kiosk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isCreate && (scopeType === "Store" || scopeType === "Kiosk") ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {scopeType === "Store" || scopeType === "Kiosk" ? (
                  <div className="space-y-1.5">
                    <label htmlFor="menu-store" className="text-xs font-medium">Cửa hàng</label>
                    <Input id="menu-store" value={storeId} disabled={isSubmitting} className="h-9 font-mono text-xs" placeholder="Nhập UUID cửa hàng" onChange={(event) => setStoreId(event.target.value)} />
                  </div>
                ) : null}
                {scopeType === "Kiosk" ? (
                  <div className="space-y-1.5">
                    <label htmlFor="menu-kiosk" className="text-xs font-medium">Kiosk</label>
                    <Input id="menu-kiosk" value={kioskId} disabled={isSubmitting} className="h-9 font-mono text-xs" placeholder="Nhập UUID kiosk" onChange={(event) => setKioskId(event.target.value)} />
                  </div>
                ) : null}
              </div>
            ) : null}
            {!isCreate ? <p className="text-xs text-muted-foreground">Backend không cho phép chuyển phạm vi sở hữu khi cập nhật thực đơn.</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="menu-order" className="text-sm font-medium">Thứ tự hiển thị</label>
              <Input id="menu-order" type="number" step="1" value={displayOrder} disabled={isSubmitting} className="h-10" onChange={(event) => setDisplayOrder(event.target.value)} />
            </div>

          </div>
          <FormError message={validationMessage || errorMessage} />
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" isLoading={isSubmitting}>{isCreate ? "Tạo thực đơn" : "Lưu thay đổi"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MenuDeleteDialog({
  target,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onConfirm,
}: {
  target: MenuDeleteTarget | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<boolean>;
}) {
  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isSubmitting}>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Trash2 className="size-5" />
            </span>
            <div className="space-y-1">
              <DialogTitle>Xác nhận xóa</DialogTitle>
              <DialogDescription>
                Hành động này không thể hoàn tác.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {target && (
          <div className="py-2 text-sm text-foreground">
            {target.kind === "menu" ? (
              <p>Bạn có chắc chắn muốn xóa thực đơn <strong>{target.menu.name}</strong> không?</p>
            ) : (
              <p>Bạn có chắc chắn muốn xóa món <strong>{target.menuItem.displayName}</strong> khỏi thực đơn <strong>{target.menu.name}</strong> không?</p>
            )}
          </div>
        )}
        <FormError message={errorMessage} />
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button variant="destructive" isLoading={isSubmitting} onClick={() => void onConfirm()}>
            Xóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface MenuItemFormDialogProps {
  menu: MenuResult;
  menuItem: MenuItemResult | null;
  products: ProductResult[];
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onCreate: (request: CreateMenuItemRequest) => Promise<boolean>;
  onUpdate: (request: UpdateMenuItemRequest) => Promise<boolean>;
}

export function MenuItemFormDialog({
  menu,
  menuItem,
  products,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onCreate,
  onUpdate,
}: MenuItemFormDialogProps) {
  const isCreate = !menuItem;
  const [productId, setProductId] = useState(menuItem?.productId ?? "");
  const [productVariantId, setProductVariantId] = useState(menuItem?.productVariantId ?? "");
  const [code, setCode] = useState(menuItem?.code ?? "");
  const [displayName, setDisplayName] = useState(menuItem?.displayName ?? "");
  const [description, setDescription] = useState(menuItem?.description ?? "");
  const [price, setPrice] = useState(menuItem?.price.toString() ?? "0");
  const [discountAmount, setDiscountAmount] = useState(menuItem?.discountAmount.toString() ?? "0");
  const [displayOrder, setDisplayOrder] = useState(menuItem?.displayOrder.toString() ?? "0");
  const [imageUrl, setImageUrl] = useState(menuItem?.imageUrl ?? "");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const selectedProduct = products.find(p => p.id === productId);
  const variants = selectedProduct?.variants ?? [];
  const selectedVariant = variants.find((variant) => variant.id === productVariantId);
  const isMachineProducedWithoutRecipe =
    selectedVariant?.fulfillmentType === "MachineProduced" && !menuItem?.recipeId;

  // Auto-fill values when a variant is selected
  const handleVariantSelect = (vId: string | null) => {
    if (!vId) return;
    setProductVariantId(vId);
    const selectedVariant = variants.find(v => v.id === vId);
    if (selectedVariant && isCreate) {
      if (!code) setCode(selectedVariant.code);
      if (!displayName) setDisplayName(selectedVariant.displayName || selectedVariant.name);
      if (price === "0") setPrice(selectedVariant.basePrice.toString());
      if (!imageUrl && selectedVariant.imageUrl) setImageUrl(selectedVariant.imageUrl);
      else if (!imageUrl && selectedProduct?.imageUrl) setImageUrl(selectedProduct.imageUrl);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!productId || !productVariantId) {
      setValidationMessage("Sản phẩm và phiên bản là bắt buộc.");
      return;
    }
    if (!code.trim() || !displayName.trim()) {
      setValidationMessage("Mã và Tên hiển thị là bắt buộc.");
      return;
    }
    const parsedPrice = Number(price);
    const parsedDiscount = Number(discountAmount);
    const parsedOrder = Number(displayOrder);
    
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setValidationMessage("Giá món phải là số không âm.");
      return;
    }
    if (!Number.isFinite(parsedDiscount) || parsedDiscount < 0) {
      setValidationMessage("Giảm giá phải là số không âm.");
      return;
    }

    const request: CreateMenuItemRequest = {
      productVariantId,
      recipeId: menuItem?.recipeId ?? null,
      code: code.trim().toUpperCase(),
      displayName: displayName.trim(),
      description: optional(description),
      price: parsedPrice,
      discountAmount: parsedDiscount,
      displayOrder: parsedOrder,
      imageUrl: optional(imageUrl),
      productOptionIds: menuItem?.productOptionIds ?? [],
    };

    setValidationMessage(null);
    if (isCreate) {
      await onCreate(request);
    } else {
      await onUpdate(request);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Plus className="size-5" />
            </span>
            <div className="space-y-1">
              <DialogTitle>{isCreate ? "Thêm món vào thực đơn" : "Chỉnh sửa món"}</DialogTitle>
              <DialogDescription>{menu.name}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form className="space-y-5" onSubmit={handleSubmit}>
          
          <div className="space-y-4 rounded-xl border border-border bg-muted/15 p-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Sản phẩm <span className="text-destructive">*</span></label>
              <Select value={productId} disabled={isSubmitting || !isCreate} onValueChange={(val) => { setProductId(val || ""); setProductVariantId(""); }}>
                <SelectTrigger className="h-10 w-full"><SelectValue placeholder="Chọn sản phẩm..." /></SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{getProductOptionLabel(p)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Phiên bản sản phẩm <span className="text-destructive">*</span></label>
              <Select value={productVariantId} disabled={isSubmitting || !productId || !isCreate} onValueChange={handleVariantSelect}>
                <SelectTrigger className="h-10 w-full"><SelectValue placeholder="Chọn phiên bản..." /></SelectTrigger>
                <SelectContent>
                  {variants.map(v => (
                    <SelectItem key={v.id} value={v.id}>{getVariantOptionLabel(v)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Công thức</label>
              <Input disabled className="h-10 bg-muted" placeholder="Chưa tích hợp quản lý công thức trong màn hình này" />
              {isMachineProducedWithoutRecipe ? (
                <p className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">
                  Phiên bản sản xuất bằng máy cần công thức hợp lệ trước khi bật bán. Vui lòng cấu hình công thức trước khi kích hoạt món.
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="mi-code" className="text-sm font-medium">Mã món <span className="text-destructive">*</span></label>
              <Input id="mi-code" value={code} disabled={isSubmitting} className="h-10 font-mono uppercase" onChange={(event) => setCode(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="mi-name" className="text-sm font-medium">Tên hiển thị <span className="text-destructive">*</span></label>
              <Input id="mi-name" value={displayName} disabled={isSubmitting} className="h-10" onChange={(event) => setDisplayName(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="mi-price" className="text-sm font-medium">Giá bán ({menu.currency}) <span className="text-destructive">*</span></label>
              <Input id="mi-price" type="number" step="any" value={price} disabled={isSubmitting} className="h-10" onChange={(event) => setPrice(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="mi-discount" className="text-sm font-medium">Giảm giá ({menu.currency})</label>
              <Input id="mi-discount" type="number" step="any" value={discountAmount} disabled={isSubmitting} className="h-10" onChange={(event) => setDiscountAmount(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="mi-order" className="text-sm font-medium">Thứ tự hiển thị</label>
              <Input id="mi-order" type="number" step="1" value={displayOrder} disabled={isSubmitting} className="h-10" onChange={(event) => setDisplayOrder(event.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="mi-desc" className="text-sm font-medium">Mô tả</label>
              <textarea id="mi-desc" value={description} rows={3} disabled={isSubmitting} className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50" onChange={(event) => setDescription(event.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="mi-img" className="text-sm font-medium">Đường dẫn hình ảnh</label>
              <Input id="mi-img" value={imageUrl} disabled={isSubmitting} className="h-10" onChange={(event) => setImageUrl(event.target.value)} />
            </div>
          </div>

          <FormError message={validationMessage || errorMessage} />
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" isLoading={isSubmitting}>{isCreate ? "Thêm món" : "Lưu món"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
