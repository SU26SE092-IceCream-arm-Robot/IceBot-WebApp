"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Pencil,
  Plus,
  RefreshCw,
  Settings2,
  Trash2,
} from "lucide-react";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIngredients } from "@/hooks/catalog/use-ingredients";
import { useProductOptionsAuthoring } from "@/hooks/catalog/use-product-options-authoring";
import type {
  OptionGroupResult,
  OptionSelectionType,
  ProductOptionExecutionImpact,
  ProductOptionIngredientRequirementResult,
  ProductOptionResult,
  ProductResult,
  UpsertOptionGroupRequest,
  UpsertProductOptionRequest,
} from "@/types/catalog/menu-management";

function optional(value: string) {
  return value.trim() || null;
}

function GroupForm({
  group,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: {
  group: OptionGroupResult | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (request: UpsertOptionGroupRequest) => Promise<boolean>;
}) {
  const [code, setCode] = useState(group?.code ?? "");
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [selectionType, setSelectionType] = useState<OptionSelectionType>(
    group?.selectionType ?? "Single",
  );
  const [minSelections, setMinSelections] = useState(
    String(group?.minSelections ?? 0),
  );
  const [maxSelections, setMaxSelections] = useState(
    String(group?.maxSelections ?? 1),
  );
  const [isRequired, setIsRequired] = useState(group?.isRequired ?? false);
  const [displayOrder, setDisplayOrder] = useState(
    String(group?.displayOrder ?? 0),
  );
  const [validation, setValidation] = useState<string | null>(null);
  const submit = async () => {
    const min = Number(minSelections);
    const max = Number(maxSelections);
    const order = Number(displayOrder);
    if (
      !code.trim() ||
      code.trim().length > 100 ||
      !name.trim() ||
      name.trim().length > 200
    )
      return setValidation(
        "Mã và tên nhóm là bắt buộc; mã tối đa 100 và tên tối đa 200 ký tự.",
      );
    if (
      !Number.isInteger(min) ||
      !Number.isInteger(max) ||
      min < 0 ||
      max <= 0 ||
      min > max
    )
      return setValidation("Số lựa chọn tối thiểu/tối đa không hợp lệ.");
    if (selectionType === "Single" && max !== 1)
      return setValidation("Nhóm chọn một phải có tối đa 1 lựa chọn.");
    if (isRequired && min === 0)
      return setValidation("Nhóm bắt buộc phải yêu cầu ít nhất 1 lựa chọn.");
    const ok = await onSubmit({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: optional(description),
      selectionType,
      minSelections: min,
      maxSelections: max,
      isRequired,
      displayOrder: Number.isInteger(order) ? order : 0,
    });
    if (ok) onClose();
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {group ? "Chỉnh sửa nhóm tùy chọn" : "Tạo nhóm tùy chọn"}
          </DialogTitle>
          <DialogDescription>
            Quy tắc chọn được backend dùng để kiểm tra khả năng bán món.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Mã nhóm</Label>
            <Input
              value={code}
              maxLength={100}
              disabled={isSubmitting}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tên nhóm</Label>
            <Input
              value={name}
              maxLength={200}
              disabled={isSubmitting}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Kiểu chọn</Label>
            <Select
              value={selectionType}
              disabled={isSubmitting}
              onValueChange={(v) => {
                const next = v as OptionSelectionType;
                setSelectionType(next);
                if (next === "Single") setMaxSelections("1");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {selectionType === "Single" ? "Chọn một" : "Chọn nhiều"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Single">Chọn một</SelectItem>
                <SelectItem value="Multiple">Chọn nhiều</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 self-end rounded-lg border border-border px-3 py-2">
            <input
              type="checkbox"
              checked={isRequired}
              disabled={isSubmitting}
              onChange={(e) => {
                setIsRequired(e.target.checked);
                if (e.target.checked && Number(minSelections) === 0)
                  setMinSelections("1");
              }}
            />
            <span className="text-sm">Bắt buộc chọn</span>
          </label>
          <div className="space-y-1.5">
            <Label>Tối thiểu</Label>
            <Input
              type="number"
              min="0"
              value={minSelections}
              disabled={isSubmitting}
              onChange={(e) => setMinSelections(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tối đa</Label>
            <Input
              type="number"
              min="1"
              value={maxSelections}
              disabled={isSubmitting || selectionType === "Single"}
              onChange={(e) => setMaxSelections(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Thứ tự</Label>
            <Input
              type="number"
              value={displayOrder}
              disabled={isSubmitting}
              onChange={(e) => setDisplayOrder(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Mô tả</Label>
            <Input
              value={description}
              disabled={isSubmitting}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        {validation || errorMessage ? (
          <p role="alert" className="text-sm text-destructive">
            {validation || errorMessage}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" disabled={isSubmitting} onClick={onClose}>
            Hủy
          </Button>
          <Button disabled={isSubmitting} onClick={() => void submit()}>
            {group ? "Lưu nhóm" : "Tạo nhóm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OptionForm({
  option,
  currency,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: {
  option: ProductOptionResult | null;
  currency: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (request: UpsertProductOptionRequest) => Promise<boolean>;
}) {
  const [code, setCode] = useState(option?.code ?? "");
  const [name, setName] = useState(option?.name ?? "");
  const [description, setDescription] = useState(option?.description ?? "");
  const [priceDelta, setPriceDelta] = useState(String(option?.priceDelta ?? 0));
  const [executionImpact, setExecutionImpact] =
    useState<ProductOptionExecutionImpact>(
      option?.executionImpact ?? "CommercialOnly",
    );
  const [isDefault, setIsDefault] = useState(option?.isDefault ?? false);
  const [displayOrder, setDisplayOrder] = useState(
    String(option?.displayOrder ?? 0),
  );
  const [validation, setValidation] = useState<string | null>(null);
  const submit = async () => {
    const price = Number(priceDelta);
    if (
      !code.trim() ||
      code.trim().length > 100 ||
      !name.trim() ||
      name.trim().length > 200
    )
      return setValidation("Mã và tên tùy chọn là bắt buộc.");
    if (!Number.isFinite(price) || price < 0)
      return setValidation("Phần giá tăng thêm phải là số không âm.");
    const ok = await onSubmit({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: optional(description),
      priceDelta: price,
      executionImpact,
      isDefault,
      displayOrder: Number(displayOrder) || 0,
    });
    if (ok) onClose();
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {option ? "Chỉnh sửa tùy chọn" : "Tạo tùy chọn"}
          </DialogTitle>
          <DialogDescription>
            Giá sử dụng đơn vị {currency}. Ảnh hưởng thực thi phải phản ánh đúng
            việc tùy chọn có thay đổi sản xuất hay không.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Mã tùy chọn</Label>
            <Input
              value={code}
              maxLength={100}
              disabled={isSubmitting}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tên tùy chọn</Label>
            <Input
              value={name}
              maxLength={200}
              disabled={isSubmitting}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Giá tăng thêm ({currency})</Label>
            <Input
              type="number"
              min="0"
              value={priceDelta}
              disabled={isSubmitting}
              onChange={(e) => setPriceDelta(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Ảnh hưởng</Label>
            <Select
              value={executionImpact}
              disabled={isSubmitting}
              onValueChange={(v) =>
                setExecutionImpact(v as ProductOptionExecutionImpact)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {executionImpact === "CommercialOnly"
                    ? "Chỉ thương mại"
                    : "Ảnh hưởng sản xuất"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CommercialOnly">Chỉ thương mại</SelectItem>
                <SelectItem value="ProductionAffecting">
                  Ảnh hưởng sản xuất
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
            <input
              type="checkbox"
              checked={isDefault}
              disabled={isSubmitting}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            <span className="text-sm">Chọn mặc định</span>
          </label>
          <div className="space-y-1.5">
            <Label>Thứ tự</Label>
            <Input
              type="number"
              value={displayOrder}
              disabled={isSubmitting}
              onChange={(e) => setDisplayOrder(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Mô tả</Label>
            <Input
              value={description}
              disabled={isSubmitting}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        {validation || errorMessage ? (
          <p role="alert" className="text-sm text-destructive">
            {validation || errorMessage}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" disabled={isSubmitting} onClick={onClose}>
            Hủy
          </Button>
          <Button disabled={isSubmitting} onClick={() => void submit()}>
            {option ? "Lưu tùy chọn" : "Tạo tùy chọn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type RequirementDraft = ProductOptionIngredientRequirementResult & {
  key: string;
};

function RequirementsForm({
  option,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: {
  option: ProductOptionResult;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (
    items: ProductOptionIngredientRequirementResult[],
  ) => Promise<boolean>;
}) {
  const ingredients = useIngredients(true);
  const [items, setItems] = useState<RequirementDraft[]>(() =>
    (option.ingredientRequirements ?? []).map((item, index) => ({
      ...item,
      key: `${item.ingredientId}-${index}`,
    })),
  );
  const [validation, setValidation] = useState<string | null>(null);
  const update = (key: string, patch: Partial<RequirementDraft>) =>
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  const submit = async () => {
    if (
      items.some(
        (item) =>
          !item.ingredientId ||
          item.quantity <= 0 ||
          !item.unit.trim() ||
          !item.requiredWorkcellCapabilityCode.trim(),
      )
    )
      return setValidation(
        "Mỗi dòng cần nguyên liệu, số lượng dương, đơn vị và capability.",
      );
    if (new Set(items.map((item) => item.ingredientId)).size !== items.length)
      return setValidation("Một nguyên liệu chỉ được xuất hiện một lần.");
    const ok = await onSubmit(
      items.map((item) => ({
        ingredientId: item.ingredientId,
        quantity: item.quantity,
        unit: item.unit,
        requiredWorkcellCapabilityCode:
          item.requiredWorkcellCapabilityCode,
      })),
    );
    if (ok) onClose();
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nguyên liệu thực thi</DialogTitle>
          <DialogDescription>
            {option.name}. Đây là form typed, không nhập JSON kỹ thuật.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            value={ingredients.search}
            onChange={(e) => ingredients.setSearch(e.target.value)}
            placeholder="Tìm nguyên liệu..."
          />
          <Button
            variant="outline"
            onClick={ingredients.retry}
            disabled={ingredients.isLoading}
          >
            <RefreshCw className="size-4" />
            Tải lại
          </Button>
        </div>
        {ingredients.errorMessage ? (
          <p className="text-sm text-warning">{ingredients.errorMessage}</p>
        ) : null}
        <div className="space-y-3">
          {items.map((item) => {
            const selected = ingredients.ingredients.find(
              (ingredient) => ingredient.id === item.ingredientId,
            );
            return (
              <div
                key={item.key}
                className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1.5fr_0.7fr_0.8fr_1.2fr_auto]"
              >
                <Select
                  value={item.ingredientId || null}
                  disabled={isSubmitting}
                  onValueChange={(value) => {
                    const found = ingredients.ingredients.find(
                      (ingredient) => ingredient.id === value,
                    );
                    update(item.key, {
                      ingredientId: value ?? "",
                      unit: found?.unit ?? item.unit,
                    });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {selected
                        ? `${selected.name} — ${selected.code}`
                        : item.ingredientId
                          ? "Nguyên liệu hiện tại"
                          : "Chọn nguyên liệu"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ingredients.ingredients.map((ingredient) => (
                      <SelectItem key={ingredient.id} value={ingredient.id}>
                        {ingredient.name} — {ingredient.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="0.000001"
                  step="any"
                  value={item.quantity}
                  onChange={(e) =>
                    update(item.key, { quantity: Number(e.target.value) })
                  }
                  aria-label="Số lượng"
                />
                <Input
                  value={item.unit}
                  onChange={(e) => update(item.key, { unit: e.target.value })}
                  aria-label="Đơn vị"
                />
                <Input
                  value={item.requiredWorkcellCapabilityCode}
                  onChange={(e) =>
                    update(item.key, {
                      requiredWorkcellCapabilityCode: e.target.value,
                    })
                  }
                  placeholder="Capability"
                  aria-label="Capability workcell"
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Xóa nguyên liệu"
                  onClick={() =>
                    setItems((current) =>
                      current.filter((row) => row.key !== item.key),
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            );
          })}
        </div>
        <Button
          variant="outline"
          onClick={() =>
            setItems((current) => [
              ...current,
              {
                key: crypto.randomUUID(),
                ingredientId: "",
                quantity: 1,
                unit: "gram",
                requiredWorkcellCapabilityCode: "",
              },
            ])
          }
        >
          <Plus className="size-4" />
          Thêm nguyên liệu
        </Button>
        {validation || errorMessage ? (
          <p role="alert" className="text-sm text-destructive">
            {validation || errorMessage}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" disabled={isSubmitting} onClick={onClose}>
            Hủy
          </Button>
          <Button disabled={isSubmitting} onClick={() => void submit()}>
            Lưu nguyên liệu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProductOptionAuthoringDialog({
  organizationId,
  product,
  open,
  onOpenChange,
  onChanged,
}: {
  organizationId: string;
  product: ProductResult;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => Promise<void>;
}) {
  const authoring = useProductOptionsAuthoring({
    organizationId,
    productId: product.id,
    onChanged,
  });
  const [groupForm, setGroupForm] = useState<
    OptionGroupResult | "create" | null
  >(null);
  const [optionForm, setOptionForm] = useState<{
    group: OptionGroupResult;
    option: ProductOptionResult | null;
  } | null>(null);
  const [requirements, setRequirements] = useState<{
    group: OptionGroupResult;
    option: ProductOptionResult;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    group: OptionGroupResult;
    option?: ProductOptionResult;
  } | null>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Tùy chọn sản phẩm</DialogTitle>
          <DialogDescription>
            {product.displayName || product.name}. Nhóm bắt buộc phải có cấu
            hình khả dụng trước khi món được kích hoạt.
          </DialogDescription>
        </DialogHeader>
        {authoring.refreshWarningMessage ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
            <span>{authoring.refreshWarningMessage}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void authoring.retryRefresh()}
              isLoading={authoring.isRefreshRetrying}
            >
              Tải lại
            </Button>
          </div>
        ) : null}
        <div className="flex justify-end">
          <Button
            onClick={() => {
              authoring.clearError();
              setGroupForm("create");
            }}
          >
            <Plus className="size-4" />
            Tạo nhóm
          </Button>
        </div>
        {product.optionGroups.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Sản phẩm chưa có nhóm tùy chọn.
          </p>
        ) : (
          <div className="space-y-4">
            {product.optionGroups.map((group) => (
              <section
                key={group.id}
                className="rounded-xl border border-border"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{group.name}</h3>
                      <span className="text-xs text-muted-foreground">
                        {group.isActive ? "Đang hoạt động" : "Đã tắt"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {group.selectionType === "Single"
                        ? "Chọn một"
                        : "Chọn nhiều"}{" "}
                      · {group.minSelections}-{group.maxSelections} lựa chọn
                      {group.isRequired ? " · Bắt buộc" : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setOptionForm({ group, option: null })}
                    >
                      <Plus className="size-4" />
                      Thêm tùy chọn
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Chỉnh sửa nhóm"
                      onClick={() => setGroupForm(group)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void authoring.toggleGroup(group.id, !group.isActive)
                      }
                      disabled={authoring.isSubmitting}
                    >
                      {group.isActive ? "Tắt nhóm" : "Bật nhóm"}
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      aria-label="Xóa nhóm"
                      onClick={() => setDeleteTarget({ group })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {group.options.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">
                      Nhóm chưa có tùy chọn.
                    </p>
                  ) : (
                    group.options.map((option) => (
                      <div
                        key={option.id}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium">
                            {option.name}{" "}
                            <span className="font-normal text-muted-foreground">
                              · +{option.priceDelta.toLocaleString("vi-VN")}{" "}
                              {option.currency}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {option.executionImpact === "CommercialOnly"
                              ? "Chỉ thương mại"
                              : "Ảnh hưởng sản xuất"}{" "}
                            · {option.isAvailable ? "Đang bán" : "Ngừng bán"}
                            {option.isDefault ? " · Mặc định" : ""} ·{" "}
                              {(option.ingredientRequirements ?? []).length} nguyên liệu
                            thực thi
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label="Nguyên liệu thực thi"
                            onClick={() => setRequirements({ group, option })}
                          >
                            <Settings2 className="size-4" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label="Chỉnh sửa tùy chọn"
                            onClick={() => setOptionForm({ group, option })}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={authoring.isSubmitting}
                            onClick={() =>
                              void authoring.toggleOption(
                                group.id,
                                option.id,
                                !option.isAvailable,
                              )
                            }
                          >
                            {option.isAvailable ? "Tắt" : "Bật"}
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            aria-label="Xóa tùy chọn"
                            onClick={() => setDeleteTarget({ group, option })}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
        {authoring.errorMessage &&
        !groupForm &&
        !optionForm &&
        !requirements &&
        !deleteTarget ? (
          <p className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="size-4" />
            {authoring.errorMessage}
          </p>
        ) : null}
        <DialogFooter showCloseButton />
        {groupForm ? (
          <GroupForm
            key={groupForm === "create" ? "create" : groupForm.id}
            group={groupForm === "create" ? null : groupForm}
            isSubmitting={authoring.isSubmitting}
            errorMessage={authoring.errorMessage}
            onClose={() => setGroupForm(null)}
            onSubmit={(request) =>
              groupForm === "create"
                ? authoring.createGroup(request)
                : authoring.updateGroup(groupForm.id, request)
            }
          />
        ) : null}
        {optionForm ? (
          <OptionForm
            key={optionForm.option?.id ?? `create-${optionForm.group.id}`}
            option={optionForm.option}
            currency={product.currency}
            isSubmitting={authoring.isSubmitting}
            errorMessage={authoring.errorMessage}
            onClose={() => setOptionForm(null)}
            onSubmit={(request) =>
              optionForm.option
                ? authoring.updateOption(
                    optionForm.group.id,
                    optionForm.option.id,
                    request,
                  )
                : authoring.createOption(optionForm.group.id, request)
            }
          />
        ) : null}
        {requirements ? (
          <RequirementsForm
            key={requirements.option.id}
            option={requirements.option}
            isSubmitting={authoring.isSubmitting}
            errorMessage={authoring.errorMessage}
            onClose={() => setRequirements(null)}
            onSubmit={(items) =>
              authoring.replaceRequirements(
                requirements.group.id,
                requirements.option.id,
                { items },
              )
            }
          />
        ) : null}
        {deleteTarget ? (
          <Dialog
            open
            onOpenChange={(value) => {
              if (!value && !authoring.isSubmitting) setDeleteTarget(null);
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {deleteTarget.option ? "Xóa tùy chọn" : "Xóa nhóm tùy chọn"}
                </DialogTitle>
                <DialogDescription>
                  Backend sẽ từ chối nếu dữ liệu đang được tham chiếu hoặc không
                  còn hợp lệ để xóa.
                </DialogDescription>
              </DialogHeader>
              {authoring.errorMessage ? (
                <p className="text-sm text-destructive">
                  {authoring.errorMessage}
                </p>
              ) : null}
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                  Hủy
                </Button>
                <Button
                  variant="destructive"
                  disabled={authoring.isSubmitting}
                  onClick={async () => {
                    const ok = deleteTarget.option
                      ? await authoring.deleteOption(
                          deleteTarget.group.id,
                          deleteTarget.option.id,
                        )
                      : await authoring.deleteGroup(deleteTarget.group.id);
                    if (ok) setDeleteTarget(null);
                  }}
                >
                  Xóa
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
