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
  MenuItemStatus,
  MenuResult,
  MenuStatus,
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
  const [status, setStatus] = useState<MenuStatus>(menu?.status ?? "Draft");
  const [currency, setCurrency] = useState(menu?.currency ?? "VND");
  const [displayOrder, setDisplayOrder] = useState(menu?.displayOrder.toString() ?? "0");
  const metadataJson = menu?.metadataJson ?? "";
  const [scopeType, setScopeType] = useState<TenantScopeType>(
    menu?.scopeType ?? "Global",
  );
  const [organizationId, setOrganizationId] = useState(menu?.organizationId ?? "");
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
      scopeType !== "Global" ? [organizationId, "Organization ID"] : null,
      scopeType === "Store" || scopeType === "Kiosk" ? [storeId, "Store ID"] : null,
      scopeType === "Kiosk" ? [kioskId, "Kiosk ID"] : null,
    ].filter(Boolean) as [string, string][];
    const invalidScope = requiredScopeIds.find(
      ([value]) => !UUID_PATTERN.test(value.trim()),
    );
    if (invalidScope) {
      setValidationMessage(`${invalidScope[1]} là bắt buộc và phải là UUID hợp lệ.`);
      return;
    }


    const request: UpdateMenuRequest = {
      organizationId: scopeType === "Global" ? null : organizationId.trim(),
      storeId: scopeType === "Store" || scopeType === "Kiosk" ? storeId.trim() : null,
      kioskId: scopeType === "Kiosk" ? kioskId.trim() : null,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: optional(description),
      status,
      currency: currency.trim().toUpperCase(),
      displayOrder: parsedOrder,
      metadataSchemaVersion: 1,
      metadataJson: optional(metadataJson),
      scopeType,
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
              <label className="text-sm font-medium">Trạng thái</label>
              <Select value={status} disabled={isSubmitting} onValueChange={(value) => setStatus(value as MenuStatus)}>
                <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Bản nháp (Draft)</SelectItem>
                  <SelectItem value="Active">Hoạt động (Active)</SelectItem>
                  <SelectItem value="Paused">Tạm dừng (Paused)</SelectItem>
                  <SelectItem value="Archived">Lưu trữ (Archived)</SelectItem>
                </SelectContent>
              </Select>
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
              <label className="text-sm font-medium">Phạm vi</label>
              <Select value={scopeType} disabled={isSubmitting} onValueChange={(value) => setScopeType(value as TenantScopeType)}>
                <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Global">Toàn hệ thống</SelectItem>
                  <SelectItem value="Organization">Tổ chức</SelectItem>
                  <SelectItem value="Store">Cửa hàng</SelectItem>
                  <SelectItem value="Kiosk">Kiosk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {scopeType !== "Global" ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label htmlFor="menu-org" className="text-xs font-medium">Organization ID</label>
                  <Input id="menu-org" value={organizationId} disabled={isSubmitting} className="h-9 font-mono text-xs" onChange={(event) => setOrganizationId(event.target.value)} />
                </div>
                {scopeType === "Store" || scopeType === "Kiosk" ? (
                  <div className="space-y-1.5">
                    <label htmlFor="menu-store" className="text-xs font-medium">Store ID</label>
                    <Input id="menu-store" value={storeId} disabled={isSubmitting} className="h-9 font-mono text-xs" onChange={(event) => setStoreId(event.target.value)} />
                  </div>
                ) : null}
                {scopeType === "Kiosk" ? (
                  <div className="space-y-1.5">
                    <label htmlFor="menu-kiosk" className="text-xs font-medium">Kiosk ID</label>
                    <Input id="menu-kiosk" value={kioskId} disabled={isSubmitting} className="h-9 font-mono text-xs" onChange={(event) => setKioskId(event.target.value)} />
                  </div>
                ) : null}
              </div>
            ) : null}
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
  const [status, setStatus] = useState<MenuItemStatus>(menuItem?.status ?? "Draft");
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
      setValidationMessage("Sản phẩm và Biến thể là bắt buộc.");
      return;
    }
    if (!code.trim() || !displayName.trim()) {
      setValidationMessage("Mã và Tên hiển thị là bắt buộc.");
      return;
    }
    if (status === "Active" && isMachineProducedWithoutRecipe) {
      setValidationMessage(
        "Không thể bật bán món MachineProduced khi chưa có Recipe. Hãy giữ món ở trạng thái Nháp hoặc Hết hàng.",
      );
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

    const request: UpdateMenuItemRequest = {
      productId,
      productVariantId,
      recipeId: null, // Left empty due to missing backend API
      code: code.trim().toUpperCase(),
      displayName: displayName.trim(),
      description: optional(description),
      status,
      price: parsedPrice,
      discountAmount: parsedDiscount,
      currency: menu.currency,
      displayOrder: parsedOrder,
      metadataSchemaVersion: 1,
      imageUrl: optional(imageUrl),
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
                    <SelectItem key={p.id} value={p.id}>{p.code} - {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Biến thể (Variant) <span className="text-destructive">*</span></label>
              <Select value={productVariantId} disabled={isSubmitting || !productId || !isCreate} onValueChange={handleVariantSelect}>
                <SelectTrigger className="h-10 w-full"><SelectValue placeholder="Chọn biến thể..." /></SelectTrigger>
                <SelectContent>
                  {variants.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.code} - {v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Công thức (Recipe)</label>
              <Input disabled className="h-10 bg-muted" placeholder="Chưa hỗ trợ Recipe API..." />
              {isMachineProducedWithoutRecipe ? (
                <p className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">
                  Biến thể MachineProduced cần Recipe hợp lệ và production route trước khi bật bán. Admin Web hiện chưa có API quản lý Recipe.
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
              <label className="text-sm font-medium">Trạng thái</label>
              <Select value={status} disabled={isSubmitting} onValueChange={(val) => setStatus(val as MenuItemStatus)}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Nháp (Draft)</SelectItem>
                  <SelectItem value="Active" disabled={isMachineProducedWithoutRecipe}>Hoạt động (Active)</SelectItem>
                  <SelectItem value="Unavailable">Hết hàng (Unavailable)</SelectItem>
                  <SelectItem value="Archived">Lưu trữ (Archived)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="mi-order" className="text-sm font-medium">Thứ tự hiển thị</label>
              <Input id="mi-order" type="number" step="1" value={displayOrder} disabled={isSubmitting} className="h-10" onChange={(event) => setDisplayOrder(event.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="mi-desc" className="text-sm font-medium">Mô tả (Description)</label>
              <textarea id="mi-desc" value={description} rows={3} disabled={isSubmitting} className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50" onChange={(event) => setDescription(event.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="mi-img" className="text-sm font-medium">Image URL</label>
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
