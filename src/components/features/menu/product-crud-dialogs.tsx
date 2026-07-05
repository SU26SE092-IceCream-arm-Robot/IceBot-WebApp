"use client";

import { useState, type FormEvent } from "react";
import { AlertTriangle, Box, PackagePlus, Trash2 } from "lucide-react";

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
import type { ProductDeleteTarget } from "@/hooks/use-product-crud";
import type {
  CreateProductRequest,
  FulfillmentType,
  ProductResult,
  ProductVariantResult,
  TenantScopeType,
  UpdateProductRequest,
  UpdateProductVariantRequest,
  UpsertProductVariantRequest,
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

interface ProductFormDialogProps {
  product: ProductResult | null;
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onCreate: (request: CreateProductRequest) => Promise<boolean>;
  onUpdate: (request: UpdateProductRequest) => Promise<boolean>;
}

export function ProductFormDialog({
  product,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onCreate,
  onUpdate,
}: ProductFormDialogProps) {
  const isCreate = !product;
  const [code, setCode] = useState(product?.code ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [displayName, setDisplayName] = useState(product?.displayName ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [productType, setProductType] = useState(product?.productType ?? "IceCream");
  const [basePrice, setBasePrice] = useState(product?.basePrice.toString() ?? "0");
  const [currency, setCurrency] = useState(product?.currency ?? "VND");
  const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);
  const [preparationTime, setPreparationTime] = useState(
    product?.preparationTimeSeconds?.toString() ?? "",
  );
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const metadataJson = product?.metadataJson ?? "";
  const [scopeType, setScopeType] = useState<TenantScopeType>(
    product?.scopeType ?? "Organization",
  );
  const [storeId, setStoreId] = useState(product?.storeId ?? "");
  const [kioskId, setKioskId] = useState(product?.kioskId ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId?.toString() ?? "");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!code.trim() || !name.trim()) {
      setValidationMessage("Mã và tên sản phẩm là bắt buộc.");
      return;
    }
    const parsedPrice = Number(basePrice);
    const parsedPreparation = preparationTime.trim() ? Number(preparationTime) : null;
    const parsedCategory = categoryId.trim() ? Number(categoryId) : null;
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setValidationMessage("Giá cơ bản phải là số không âm.");
      return;
    }
    if (parsedPreparation !== null && (!Number.isInteger(parsedPreparation) || parsedPreparation < 0)) {
      setValidationMessage("Thời gian chuẩn bị phải là số nguyên không âm.");
      return;
    }
    if (parsedCategory !== null && (!Number.isInteger(parsedCategory) || parsedCategory <= 0)) {
      setValidationMessage("Category ID phải là số nguyên dương.");
      return;
    }
    const requiredScopeIds = [
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


    const request = {
      categoryId: parsedCategory,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      displayName: optional(displayName),
      description: optional(description),
      productType: productType.trim() || "IceCream",
      basePrice: parsedPrice,
      currency: currency.trim().toUpperCase(),
      isAvailable,
      preparationTimeSeconds: parsedPreparation,
      imageUrl: optional(imageUrl),
      metadataJson: optional(metadataJson),
    };
    setValidationMessage(null);
    if (isCreate) {
      await onCreate({
        ...request,
        storeId: scopeType === "Store" || scopeType === "Kiosk" ? storeId.trim() : null,
        kioskId: scopeType === "Kiosk" ? kioskId.trim() : null,
        scopeType,
        variants: [],
      });
    } else {
      await onUpdate(request);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl" showCloseButton={!isSubmitting}>
        <DialogHeader><div className="flex items-start gap-3 pr-8"><span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Box className="size-5" /></span><div className="space-y-1"><DialogTitle>{isCreate ? "Tạo sản phẩm" : "Chỉnh sửa sản phẩm"}</DialogTitle><DialogDescription>{isCreate ? "Tạo sản phẩm trước, sau đó thêm biến thể trong phần chi tiết." : product.code}</DialogDescription></div></div></DialogHeader>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><label htmlFor="product-code" className="text-sm font-medium">Mã sản phẩm <span className="text-destructive">*</span></label><Input id="product-code" value={code} disabled={isSubmitting} className="h-10 font-mono uppercase" onChange={(event) => setCode(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="product-name" className="text-sm font-medium">Tên nội bộ <span className="text-destructive">*</span></label><Input id="product-name" value={name} disabled={isSubmitting} className="h-10" onChange={(event) => setName(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="product-display" className="text-sm font-medium">Tên hiển thị</label><Input id="product-display" value={displayName} disabled={isSubmitting} className="h-10" onChange={(event) => setDisplayName(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="product-type" className="text-sm font-medium">Loại sản phẩm</label><Input id="product-type" value={productType} disabled={isSubmitting} className="h-10" onChange={(event) => setProductType(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="product-price" className="text-sm font-medium">Giá cơ bản <span className="text-destructive">*</span></label><Input id="product-price" type="number" min="0" step="any" value={basePrice} disabled={isSubmitting} className="h-10" onChange={(event) => setBasePrice(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="product-currency" className="text-sm font-medium">Tiền tệ</label><Input id="product-currency" value={currency} disabled={isSubmitting} className="h-10 font-mono uppercase" onChange={(event) => setCurrency(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="product-preparation" className="text-sm font-medium">Thời gian chuẩn bị (giây)</label><Input id="product-preparation" type="number" min="0" step="1" value={preparationTime} disabled={isSubmitting} className="h-10" onChange={(event) => setPreparationTime(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="product-category" className="text-sm font-medium">Category ID</label><Input id="product-category" type="number" min="1" step="1" value={categoryId} disabled={isSubmitting} className="h-10" placeholder="Không bắt buộc" onChange={(event) => setCategoryId(event.target.value)} /></div>
            <div className="space-y-1.5 sm:col-span-2"><label htmlFor="product-description" className="text-sm font-medium">Mô tả</label><textarea id="product-description" value={description} rows={3} disabled={isSubmitting} className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50" onChange={(event) => setDescription(event.target.value)} /></div>
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-muted/15 p-4">
            <div className="space-y-1.5"><label className="text-sm font-medium">Phạm vi trong tổ chức</label><Select value={scopeType} disabled={isSubmitting || !isCreate} onValueChange={(value) => { if (["Organization", "Store", "Kiosk"].includes(value ?? "")) setScopeType(value as TenantScopeType); }}><SelectTrigger className="h-10 w-full"><SelectValue>{scopeType === "Organization" ? "Toàn tổ chức" : scopeType === "Store" ? "Cửa hàng" : "Kiosk"}</SelectValue></SelectTrigger><SelectContent><SelectItem value="Organization">Toàn tổ chức</SelectItem><SelectItem value="Store">Cửa hàng</SelectItem><SelectItem value="Kiosk">Kiosk</SelectItem></SelectContent></Select></div>
            {isCreate && (scopeType === "Store" || scopeType === "Kiosk") ? <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><label htmlFor="product-store" className="text-xs font-medium">Store ID</label><Input id="product-store" value={storeId} disabled={isSubmitting} className="h-9 font-mono text-xs" onChange={(event) => setStoreId(event.target.value)} /></div>{scopeType === "Kiosk" ? <div className="space-y-1.5"><label htmlFor="product-kiosk" className="text-xs font-medium">Kiosk ID</label><Input id="product-kiosk" value={kioskId} disabled={isSubmitting} className="h-9 font-mono text-xs" onChange={(event) => setKioskId(event.target.value)} /></div> : null}</div> : null}
            {!isCreate ? <p className="text-xs text-muted-foreground">Backend không cho phép chuyển phạm vi sở hữu khi cập nhật sản phẩm.</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2"><label htmlFor="product-image" className="text-sm font-medium">Image URL</label><Input id="product-image" type="url" value={imageUrl} disabled={isSubmitting} className="h-10" onChange={(event) => setImageUrl(event.target.value)} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isAvailable} disabled={isSubmitting} className="size-4 accent-primary" onChange={(event) => setIsAvailable(event.target.checked)} />Cho phép bán sản phẩm</label>
          </div>
          <FormError message={validationMessage || errorMessage} />
          <DialogFooter><Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Hủy</Button><Button type="submit" isLoading={isSubmitting}>{isCreate ? "Tạo sản phẩm" : "Lưu thay đổi"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface VariantFormDialogProps {
  product: ProductResult;
  variant: ProductVariantResult | null;
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onCreate: (request: UpsertProductVariantRequest) => Promise<boolean>;
  onUpdate: (request: UpdateProductVariantRequest) => Promise<boolean>;
}

export function VariantFormDialog({
  product,
  variant,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onCreate,
  onUpdate,
}: VariantFormDialogProps) {
  const isCreate = !variant;
  const [code, setCode] = useState(variant?.code ?? "");
  const [name, setName] = useState(variant?.name ?? "");
  const [displayName, setDisplayName] = useState(variant?.displayName ?? "");
  const [description, setDescription] = useState(variant?.description ?? "");
  const [variantType, setVariantType] = useState(variant?.variantType ?? "Default");
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>(
    variant?.fulfillmentType ?? "Packaged",
  );
  const [sizeCode, setSizeCode] = useState(variant?.sizeCode ?? "");
  const [basePrice, setBasePrice] = useState(
    variant?.basePrice.toString() ?? product.basePrice.toString(),
  );
  const [currency, setCurrency] = useState(variant?.currency ?? product.currency);
  const [isAvailable, setIsAvailable] = useState(variant?.isAvailable ?? true);
  const [displayOrder, setDisplayOrder] = useState(variant?.displayOrder.toString() ?? "0");
  const [preparationTime, setPreparationTime] = useState(
    variant?.preparationTimeSeconds?.toString() ?? "",
  );
  const [imageUrl, setImageUrl] = useState(variant?.imageUrl ?? "");
  const metadataJson = variant?.metadataJson ?? "";
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!code.trim() || !name.trim()) {
      setValidationMessage("Mã và tên biến thể là bắt buộc.");
      return;
    }
    const price = Number(basePrice);
    const order = Number(displayOrder);
    const preparation = preparationTime.trim() ? Number(preparationTime) : null;
    if (!Number.isFinite(price) || price < 0) {
      setValidationMessage("Giá biến thể phải là số không âm.");
      return;
    }
    if (!Number.isInteger(order)) {
      setValidationMessage("Thứ tự hiển thị phải là số nguyên.");
      return;
    }
    if (preparation !== null && (!Number.isInteger(preparation) || preparation < 0)) {
      setValidationMessage("Thời gian chuẩn bị phải là số nguyên không âm.");
      return;
    }
    if (!currency.trim()) {
      setValidationMessage("Tiền tệ là bắt buộc.");
      return;
    }


    const request: UpsertProductVariantRequest = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      displayName: optional(displayName),
      description: optional(description),
      variantType: variantType.trim() || "Default",
      fulfillmentType,
      sizeCode: optional(sizeCode),
      basePrice: price,
      currency: currency.trim().toUpperCase(),
      isAvailable,
      displayOrder: order,
      preparationTimeSeconds: preparation,
      imageUrl: optional(imageUrl),
      metadataJson: optional(metadataJson),
    };
    setValidationMessage(null);
    if (isCreate) await onCreate(request);
    else await onUpdate(request);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" showCloseButton={!isSubmitting}>
        <DialogHeader><div className="flex items-start gap-3 pr-8"><span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><PackagePlus className="size-5" /></span><div className="space-y-1"><DialogTitle>{isCreate ? "Thêm biến thể" : "Chỉnh sửa biến thể"}</DialogTitle><DialogDescription>{product.displayName || product.name}</DialogDescription></div></div></DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><label htmlFor="variant-code" className="text-sm font-medium">Mã biến thể <span className="text-destructive">*</span></label><Input id="variant-code" value={code} disabled={isSubmitting} className="h-10 font-mono uppercase" onChange={(event) => setCode(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="variant-name" className="text-sm font-medium">Tên nội bộ <span className="text-destructive">*</span></label><Input id="variant-name" value={name} disabled={isSubmitting} className="h-10" onChange={(event) => setName(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="variant-display" className="text-sm font-medium">Tên hiển thị</label><Input id="variant-display" value={displayName} disabled={isSubmitting} className="h-10" onChange={(event) => setDisplayName(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="variant-type" className="text-sm font-medium">Loại biến thể</label><Input id="variant-type" value={variantType} disabled={isSubmitting} className="h-10" onChange={(event) => setVariantType(event.target.value)} /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">Cách thực hiện</label><Select value={fulfillmentType} disabled={isSubmitting} onValueChange={(value) => { if (["Packaged", "MachineProduced", "Manual"].includes(value ?? "")) setFulfillmentType(value as FulfillmentType); }}><SelectTrigger className="h-10 w-full"><SelectValue>{fulfillmentType === "Packaged" ? "Đóng gói sẵn" : fulfillmentType === "MachineProduced" ? "Máy sản xuất" : "Thủ công"}</SelectValue></SelectTrigger><SelectContent><SelectItem value="Packaged">Đóng gói sẵn</SelectItem><SelectItem value="MachineProduced">Máy sản xuất</SelectItem><SelectItem value="Manual">Thủ công</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><label htmlFor="variant-size" className="text-sm font-medium">Mã kích cỡ</label><Input id="variant-size" value={sizeCode} disabled={isSubmitting} className="h-10" onChange={(event) => setSizeCode(event.target.value)} /></div>
            {fulfillmentType === "MachineProduced" ? <div className="sm:col-span-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2.5 text-sm text-warning">Backend ProductVariant không có trường recipe. Công thức được liên kết ở MenuItem; Admin hiện chưa có API quản lý recipe nên form này không tạo hoặc giả lập công thức.</div> : null}
            <div className="space-y-1.5"><label htmlFor="variant-price" className="text-sm font-medium">Giá <span className="text-destructive">*</span></label><Input id="variant-price" type="number" min="0" step="any" value={basePrice} disabled={isSubmitting} className="h-10" onChange={(event) => setBasePrice(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="variant-currency" className="text-sm font-medium">Tiền tệ</label><Input id="variant-currency" value={currency} disabled={isSubmitting} className="h-10 font-mono uppercase" onChange={(event) => setCurrency(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="variant-order" className="text-sm font-medium">Thứ tự hiển thị</label><Input id="variant-order" type="number" step="1" value={displayOrder} disabled={isSubmitting} className="h-10" onChange={(event) => setDisplayOrder(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="variant-preparation" className="text-sm font-medium">Thời gian chuẩn bị (giây)</label><Input id="variant-preparation" type="number" min="0" step="1" value={preparationTime} disabled={isSubmitting} className="h-10" onChange={(event) => setPreparationTime(event.target.value)} /></div>
            <div className="space-y-1.5 sm:col-span-2"><label htmlFor="variant-description" className="text-sm font-medium">Mô tả</label><textarea id="variant-description" value={description} rows={3} disabled={isSubmitting} className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50" onChange={(event) => setDescription(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="variant-image" className="text-sm font-medium">Image URL</label><Input id="variant-image" type="url" value={imageUrl} disabled={isSubmitting} className="h-10" onChange={(event) => setImageUrl(event.target.value)} /></div>
            <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={isAvailable} disabled={isSubmitting} className="size-4 accent-primary" onChange={(event) => setIsAvailable(event.target.checked)} />Cho phép bán biến thể</label>
          </div>
          <FormError message={validationMessage || errorMessage} />
          <DialogFooter><Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Hủy</Button><Button type="submit" isLoading={isSubmitting}>{isCreate ? "Thêm biến thể" : "Lưu thay đổi"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ProductDeleteDialogProps {
  target: ProductDeleteTarget;
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<boolean>;
}

export function ProductDeleteDialog({
  target,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onConfirm,
}: ProductDeleteDialogProps) {
  const label =
    target.kind === "product"
      ? target.product.displayName || target.product.name
      : target.variant.displayName || target.variant.name;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isSubmitting}>
        <DialogHeader><span className="flex size-10 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 text-destructive"><Trash2 className="size-5" /></span><DialogTitle>{target.kind === "product" ? "Xóa sản phẩm?" : "Xóa biến thể?"}</DialogTitle><DialogDescription>{label} sẽ bị xóa mềm khỏi danh mục quản lý.</DialogDescription></DialogHeader>
        {target.kind === "product" && target.product.variants.length > 0 ? <p className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2.5 text-sm text-warning">Backend sẽ xóa mềm sản phẩm cùng {target.product.variants.length} biến thể hiện có.</p> : null}
        <FormError message={errorMessage} />
        <DialogFooter><Button variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Quay lại</Button><Button variant="destructive" isLoading={isSubmitting} onClick={() => void onConfirm()}><Trash2 className="size-4" />Xóa</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
