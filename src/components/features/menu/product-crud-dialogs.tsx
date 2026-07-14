"use client";

import { useMemo, useState, type FormEvent } from "react";
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
  KioskResult,
  StoreResult,
} from "@/types/kiosk-management";
import type {
  CreateProductRequest,
  FulfillmentType,
  ProductCategoryResult,
  ProductResult,
  ProductVariantResult,
  TenantScopeType,
  UpdateProductRequest,
  UpdateProductVariantRequest,
  UpsertProductVariantRequest,
} from "@/types/menu-management";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NO_CATEGORY_VALUE = "__none__";

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

function getFulfillmentTypeLabel(value: FulfillmentType): string {
  switch (value) {
    case "MachineProduced":
      return "Sản xuất bằng máy";
    case "Manual":
      return "Thủ công";
    case "Packaged":
    default:
      return "Đóng gói sẵn";
  }
}

function getProductTypeLabel(value: string): string {
  return value.toLowerCase() === "icecream" ? "Kem" : value || "Không xác định";
}

function getVariantTypeLabel(value: string): string {
  return value.toLowerCase() === "default" ? "Mặc định" : value || "Không xác định";
}

function getCategorySelectLabel(
  value: string,
  categories: ProductCategoryResult[],
): string {
  if (value === NO_CATEGORY_VALUE || !value.trim()) {
    return "Không chọn danh mục";
  }

  const categoryId = Number(value);
  if (!Number.isInteger(categoryId)) {
    return "Không chọn danh mục";
  }

  const category = categories.find((item) => item.id === categoryId);
  if (!category) {
    return `Danh mục hiện tại #${categoryId}`;
  }

  return category.isActive ? category.name : `${category.name} (đã tắt)`;
}

function formatScopeOptionLabel(option: {
  code?: string | null;
  name?: string | null;
}): string {
  const name = option.name?.trim();
  const code = option.code?.trim();

  if (name && code) {
    return `${name} — ${code}`;
  }

  return code || "Không xác định";
}

function getStoreSelectLabel(value: string, stores: StoreResult[]): string {
  if (!value.trim()) {
    return "Chọn cửa hàng";
  }

  const store = stores.find((item) => item.id === value);
  return store ? formatScopeOptionLabel(store) : "Không xác định";
}

function getKioskSelectLabel(value: string, kiosks: KioskResult[]): string {
  if (!value.trim()) {
    return "Chọn kiosk";
  }

  const kiosk = kiosks.find((item) => item.id === value);
  return kiosk ? formatScopeOptionLabel(kiosk) : "Không xác định";
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
  categories: ProductCategoryResult[];
  kiosks: KioskResult[];
  isCategoryLoading: boolean;
  categoryErrorMessage: string | null;
  scopeErrorMessage: string | null;
  scopeOptionsLoading: boolean;
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  stores: StoreResult[];
  onOpenChange: (open: boolean) => void;
  onCreate: (request: CreateProductRequest) => Promise<boolean>;
  onUpdate: (request: UpdateProductRequest) => Promise<boolean>;
}

export function ProductFormDialog({
  product,
  categories,
  kiosks,
  isCategoryLoading,
  categoryErrorMessage,
  scopeErrorMessage,
  scopeOptionsLoading,
  open,
  isSubmitting,
  errorMessage,
  stores,
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
  const [preparationTime, setPreparationTime] = useState(
    product?.preparationTimeSeconds?.toString() ?? "",
  );
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [scopeType, setScopeType] = useState<TenantScopeType>(
    product?.scopeType ?? "Organization",
  );
  const [storeId, setStoreId] = useState(product?.storeId ?? "");
  const [kioskId, setKioskId] = useState(product?.kioskId ?? "");
  const [categoryId, setCategoryId] = useState(
    product?.categoryId ? product.categoryId.toString() : NO_CATEGORY_VALUE,
  );
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const currentCategoryId = product?.categoryId ?? null;
  const selectableCategories = useMemo(() => {
    const activeCategories = categories.filter((category) => category.isActive);
    const currentCategory = currentCategoryId
      ? categories.find((category) => category.id === currentCategoryId)
      : undefined;
    const merged =
      currentCategory && !currentCategory.isActive
        ? [...activeCategories, currentCategory]
        : activeCategories;
    return merged.sort(
      (left, right) =>
        left.displayOrder - right.displayOrder ||
        left.name.localeCompare(right.name),
    );
  }, [categories, currentCategoryId]);
  const hasCurrentCategoryOption =
    currentCategoryId !== null &&
    !selectableCategories.some((category) => category.id === currentCategoryId);
  const categorySelectDisabled =
    isSubmitting ||
    isCategoryLoading ||
    Boolean(categoryErrorMessage && !isCreate);
  const scopedStores = stores.filter(
    (store) => !product?.organizationId || store.organizationId === product.organizationId,
  );
  const scopedKiosks = kiosks.filter((kiosk) => !storeId || kiosk.storeId === storeId);
  const hasStoreScopeOptions = scopedStores.length > 0;
  const hasKioskScopeOptions = scopedKiosks.length > 0;

  function handleScopeTypeChange(value: string | null) {
    if (["Organization", "Store", "Kiosk"].includes(value ?? "")) {
      setScopeType(value as TenantScopeType);
      setStoreId("");
      setKioskId("");
      setValidationMessage(null);
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!code.trim() || !name.trim()) {
      setValidationMessage("Mã và tên sản phẩm là bắt buộc.");
      return;
    }
    const parsedPrice = Number(basePrice);
    const parsedPreparation = preparationTime.trim() ? Number(preparationTime) : null;
    const parsedCategory =
      categoryId === NO_CATEGORY_VALUE || !categoryId.trim()
        ? null
        : Number(categoryId);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setValidationMessage("Giá cơ bản phải là số không âm.");
      return;
    }
    if (parsedPreparation !== null && (!Number.isInteger(parsedPreparation) || parsedPreparation < 0)) {
      setValidationMessage("Thời gian chuẩn bị phải là số nguyên không âm.");
      return;
    }
    if (parsedCategory !== null && (!Number.isInteger(parsedCategory) || parsedCategory <= 0)) {
      setValidationMessage("Danh mục sản phẩm không hợp lệ.");
      return;
    }
    if ((scopeType === "Store" || scopeType === "Kiosk") && !storeId) {
      setValidationMessage("Vui lòng chọn cửa hàng.");
      return;
    }
    if (scopeType === "Kiosk" && !kioskId) {
      setValidationMessage("Vui lòng chọn kiosk.");
      return;
    }
    if (
      (storeId && !UUID_PATTERN.test(storeId.trim())) ||
      (kioskId && !UUID_PATTERN.test(kioskId.trim()))
    ) {
      setValidationMessage("Phạm vi đã chọn không hợp lệ. Vui lòng chọn lại từ danh sách.");
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
      preparationTimeSeconds: parsedPreparation,
      imageUrl: optional(imageUrl),
    };
    setValidationMessage(null);
    if (isCreate) {
      await onCreate({
        ...request,
        storeId: scopeType === "Store" || scopeType === "Kiosk" ? storeId.trim() : null,
        kioskId: scopeType === "Kiosk" ? kioskId.trim() : null,
        variants: [],
      });
    } else {
      await onUpdate(request);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl" showCloseButton={!isSubmitting}>
        <DialogHeader><div className="flex items-start gap-3 pr-8"><span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Box className="size-5" /></span><div className="space-y-1"><DialogTitle>{isCreate ? "Tạo sản phẩm" : "Chỉnh sửa sản phẩm"}</DialogTitle><DialogDescription>{isCreate ? "Tạo sản phẩm trước, sau đó thêm phiên bản trong phần chi tiết." : product.code}</DialogDescription></div></div></DialogHeader>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><label htmlFor="product-code" className="text-sm font-medium">Mã sản phẩm <span className="text-destructive">*</span></label><Input id="product-code" value={code} disabled={isSubmitting} className="h-10 font-mono uppercase" onChange={(event) => setCode(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="product-name" className="text-sm font-medium">Tên nội bộ <span className="text-destructive">*</span></label><Input id="product-name" value={name} disabled={isSubmitting} className="h-10" onChange={(event) => setName(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="product-display" className="text-sm font-medium">Tên hiển thị</label><Input id="product-display" value={displayName} disabled={isSubmitting} className="h-10" onChange={(event) => setDisplayName(event.target.value)} /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">Loại sản phẩm</label><Select value={productType} disabled={isSubmitting} onValueChange={(value) => setProductType(value || "IceCream")}><SelectTrigger className="h-10 w-full"><SelectValue>{getProductTypeLabel(productType)}</SelectValue></SelectTrigger><SelectContent>{productType !== "IceCream" ? <SelectItem value={productType}>{getProductTypeLabel(productType)}</SelectItem> : null}<SelectItem value="IceCream">Kem</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><label htmlFor="product-price" className="text-sm font-medium">Giá cơ bản <span className="text-destructive">*</span></label><Input id="product-price" type="number" min="0" step="any" value={basePrice} disabled={isSubmitting} className="h-10" onChange={(event) => setBasePrice(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="product-currency" className="text-sm font-medium">Tiền tệ</label><Input id="product-currency" value={currency} disabled={isSubmitting} className="h-10 font-mono uppercase" onChange={(event) => setCurrency(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="product-preparation" className="text-sm font-medium">Thời gian chuẩn bị (giây)</label><Input id="product-preparation" type="number" min="0" step="1" value={preparationTime} disabled={isSubmitting} className="h-10" onChange={(event) => setPreparationTime(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="product-category" className="text-sm font-medium">Danh mục sản phẩm</label><Select value={categoryId} disabled={categorySelectDisabled} onValueChange={(value) => { if (value) setCategoryId(value); }}><SelectTrigger id="product-category" className="h-10 w-full"><SelectValue>{isCategoryLoading ? "Đang tải danh mục..." : getCategorySelectLabel(categoryId, selectableCategories)}</SelectValue></SelectTrigger><SelectContent><SelectItem value={NO_CATEGORY_VALUE}>Không chọn danh mục</SelectItem>{hasCurrentCategoryOption && currentCategoryId !== null ? <SelectItem value={currentCategoryId.toString()}>Danh mục hiện tại #{currentCategoryId}</SelectItem> : null}{selectableCategories.map((category) => (<SelectItem key={category.id} value={category.id.toString()}>{category.name}{category.isActive ? "" : " (đã tắt)"}</SelectItem>))}</SelectContent></Select>{categoryErrorMessage ? <p className="text-xs text-warning">{isCreate ? "Không tải được danh mục; sản phẩm vẫn có thể tạo không phân loại." : "Không tải được danh mục; hệ thống sẽ giữ danh mục hiện tại nếu bạn lưu."}</p> : null}</div>
            <div className="space-y-1.5 sm:col-span-2"><label htmlFor="product-description" className="text-sm font-medium">Mô tả</label><textarea id="product-description" value={description} rows={3} disabled={isSubmitting} className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50" onChange={(event) => setDescription(event.target.value)} /></div>
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-muted/15 p-4">
            <div className="space-y-1.5"><label className="text-sm font-medium">Phạm vi trong tổ chức</label><Select value={scopeType} disabled={isSubmitting || !isCreate} onValueChange={handleScopeTypeChange}><SelectTrigger className="h-10 w-full"><SelectValue>{getScopeTypeLabel(scopeType)}</SelectValue></SelectTrigger><SelectContent><SelectItem value="Organization">Tổ chức</SelectItem><SelectItem value="Store">Cửa hàng</SelectItem><SelectItem value="Kiosk">Kiosk</SelectItem></SelectContent></Select></div>
            {isCreate && (scopeType === "Store" || scopeType === "Kiosk") ? <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><label htmlFor="product-store" className="text-xs font-medium">Cửa hàng</label><Select value={storeId || null} disabled={isSubmitting || scopeOptionsLoading || !hasStoreScopeOptions} onValueChange={(value) => { setStoreId(value ?? ""); setKioskId(""); setValidationMessage(null); }}><SelectTrigger id="product-store" className="h-9 w-full"><SelectValue>{scopeOptionsLoading ? "Đang tải cửa hàng..." : getStoreSelectLabel(storeId, scopedStores)}</SelectValue></SelectTrigger><SelectContent>{scopedStores.map((store) => (<SelectItem key={store.id} value={store.id}>{formatScopeOptionLabel(store)}</SelectItem>))}</SelectContent></Select></div>{scopeType === "Kiosk" ? <div className="space-y-1.5"><label htmlFor="product-kiosk" className="text-xs font-medium">Kiosk</label><Select value={kioskId || null} disabled={isSubmitting || scopeOptionsLoading || !storeId || !hasKioskScopeOptions} onValueChange={(value) => { setKioskId(value ?? ""); setValidationMessage(null); }}><SelectTrigger id="product-kiosk" className="h-9 w-full"><SelectValue>{!storeId ? "Chọn cửa hàng trước" : scopeOptionsLoading ? "Đang tải kiosk..." : getKioskSelectLabel(kioskId, scopedKiosks)}</SelectValue></SelectTrigger><SelectContent>{scopedKiosks.map((kiosk) => (<SelectItem key={kiosk.id} value={kiosk.id}>{formatScopeOptionLabel(kiosk)}</SelectItem>))}</SelectContent></Select></div> : null}</div> : null}
            {isCreate && scopeErrorMessage ? <p className="text-xs text-warning">{scopeErrorMessage}</p> : null}
            {!isCreate ? <p className="text-xs text-muted-foreground">Backend không cho phép chuyển phạm vi sở hữu khi cập nhật sản phẩm.</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2"><label htmlFor="product-image" className="text-sm font-medium">Đường dẫn hình ảnh</label><Input id="product-image" type="url" value={imageUrl} disabled={isSubmitting} className="h-10" onChange={(event) => setImageUrl(event.target.value)} /></div>
            <p className="text-xs text-muted-foreground sm:col-span-2">Trạng thái bán được quản lý riêng sau khi sản phẩm được tạo.</p>
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
  const [displayOrder, setDisplayOrder] = useState(variant?.displayOrder.toString() ?? "0");
  const [preparationTime, setPreparationTime] = useState(
    variant?.preparationTimeSeconds?.toString() ?? "",
  );
  const [imageUrl, setImageUrl] = useState(variant?.imageUrl ?? "");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!code.trim() || !name.trim()) {
      setValidationMessage("Mã và tên phiên bản là bắt buộc.");
      return;
    }
    const price = Number(basePrice);
    const order = Number(displayOrder);
    const preparation = preparationTime.trim() ? Number(preparationTime) : null;
    if (!Number.isFinite(price) || price < 0) {
      setValidationMessage("Giá phiên bản phải là số không âm.");
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
    const request: UpsertProductVariantRequest = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      displayName: optional(displayName),
      description: optional(description),
      variantType: variantType.trim() || "Default",
      fulfillmentType,
      sizeCode: optional(sizeCode),
      basePrice: price,
      displayOrder: order,
      preparationTimeSeconds: preparation,
      imageUrl: optional(imageUrl),
    };
    setValidationMessage(null);
    if (isCreate) await onCreate(request);
    else await onUpdate(request);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" showCloseButton={!isSubmitting}>
        <DialogHeader><div className="flex items-start gap-3 pr-8"><span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><PackagePlus className="size-5" /></span><div className="space-y-1"><DialogTitle>{isCreate ? "Thêm phiên bản" : "Chỉnh sửa phiên bản"}</DialogTitle><DialogDescription>{product.displayName || product.name}</DialogDescription></div></div></DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><label htmlFor="variant-code" className="text-sm font-medium">Mã phiên bản <span className="text-destructive">*</span></label><Input id="variant-code" value={code} disabled={isSubmitting} className="h-10 font-mono uppercase" onChange={(event) => setCode(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="variant-name" className="text-sm font-medium">Tên nội bộ <span className="text-destructive">*</span></label><Input id="variant-name" value={name} disabled={isSubmitting} className="h-10" onChange={(event) => setName(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="variant-display" className="text-sm font-medium">Tên hiển thị</label><Input id="variant-display" value={displayName} disabled={isSubmitting} className="h-10" onChange={(event) => setDisplayName(event.target.value)} /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">Loại phiên bản</label><Select value={variantType} disabled={isSubmitting} onValueChange={(value) => setVariantType(value || "Default")}><SelectTrigger className="h-10 w-full"><SelectValue>{getVariantTypeLabel(variantType)}</SelectValue></SelectTrigger><SelectContent>{variantType !== "Default" ? <SelectItem value={variantType}>{getVariantTypeLabel(variantType)}</SelectItem> : null}<SelectItem value="Default">Mặc định</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">Cách thực hiện</label><Select value={fulfillmentType} disabled={isSubmitting} onValueChange={(value) => { if (["Packaged", "MachineProduced", "Manual"].includes(value ?? "")) setFulfillmentType(value as FulfillmentType); }}><SelectTrigger className="h-10 w-full"><SelectValue>{getFulfillmentTypeLabel(fulfillmentType)}</SelectValue></SelectTrigger><SelectContent><SelectItem value="Packaged">Đóng gói sẵn</SelectItem><SelectItem value="MachineProduced">Sản xuất bằng máy</SelectItem><SelectItem value="Manual">Thủ công</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><label htmlFor="variant-size" className="text-sm font-medium">Mã kích cỡ</label><Input id="variant-size" value={sizeCode} disabled={isSubmitting} className="h-10" onChange={(event) => setSizeCode(event.target.value)} /></div>
            {fulfillmentType === "MachineProduced" ? <div className="sm:col-span-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2.5 text-sm text-warning">Phiên bản sản xuất bằng máy không chứa công thức trực tiếp. Công thức được liên kết qua món trong thực đơn; màn hình này không tạo hoặc giả lập công thức.</div> : null}
            <div className="space-y-1.5"><label htmlFor="variant-price" className="text-sm font-medium">Giá <span className="text-destructive">*</span></label><Input id="variant-price" type="number" min="0" step="any" value={basePrice} disabled={isSubmitting} className="h-10" onChange={(event) => setBasePrice(event.target.value)} /></div>
            <div className="space-y-1.5"><p className="text-sm font-medium">Tiền tệ</p><p className="flex h-10 items-center font-mono text-sm text-muted-foreground">{product.currency}</p></div>
            <div className="space-y-1.5"><label htmlFor="variant-order" className="text-sm font-medium">Thứ tự hiển thị</label><Input id="variant-order" type="number" step="1" value={displayOrder} disabled={isSubmitting} className="h-10" onChange={(event) => setDisplayOrder(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="variant-preparation" className="text-sm font-medium">Thời gian chuẩn bị (giây)</label><Input id="variant-preparation" type="number" min="0" step="1" value={preparationTime} disabled={isSubmitting} className="h-10" onChange={(event) => setPreparationTime(event.target.value)} /></div>
            <div className="space-y-1.5 sm:col-span-2"><label htmlFor="variant-description" className="text-sm font-medium">Mô tả</label><textarea id="variant-description" value={description} rows={3} disabled={isSubmitting} className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50" onChange={(event) => setDescription(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="variant-image" className="text-sm font-medium">Đường dẫn hình ảnh</label><Input id="variant-image" type="url" value={imageUrl} disabled={isSubmitting} className="h-10" onChange={(event) => setImageUrl(event.target.value)} /></div>
            <p className="flex items-end pb-2 text-xs text-muted-foreground">Trạng thái bán được quản lý riêng sau khi lưu phiên bản.</p>
          </div>
          <FormError message={validationMessage || errorMessage} />
          <DialogFooter><Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Hủy</Button><Button type="submit" isLoading={isSubmitting}>{isCreate ? "Thêm phiên bản" : "Lưu thay đổi"}</Button></DialogFooter>
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
        <DialogHeader><span className="flex size-10 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 text-destructive"><Trash2 className="size-5" /></span><DialogTitle>{target.kind === "product" ? "Xóa sản phẩm?" : "Xóa phiên bản?"}</DialogTitle><DialogDescription>{label} sẽ bị xóa mềm khỏi danh mục quản lý.</DialogDescription></DialogHeader>
        {target.kind === "product" && target.product.variants.length > 0 ? <p className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2.5 text-sm text-warning">Backend sẽ xóa mềm sản phẩm cùng {target.product.variants.length} phiên bản hiện có.</p> : null}
        <FormError message={errorMessage} />
        <DialogFooter><Button variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Quay lại</Button><Button variant="destructive" isLoading={isSubmitting} onClick={() => void onConfirm()}><Trash2 className="size-4" />Xóa</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
