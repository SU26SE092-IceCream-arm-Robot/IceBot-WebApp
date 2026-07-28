"use client";

import { useState } from "react";
import { Pencil, Plus, RefreshCw } from "lucide-react";

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
import { useIngredients } from "@/hooks/use-ingredients";
import { useRecipeAuthoring } from "@/hooks/use-recipe-authoring";
import type {
  CreateRecipeRequest,
  ProductResult,
  ProductVariantResult,
  RecipeItemResult,
  RecipeResult,
  UpdateRecipeRequest,
} from "@/types/menu-management";

function dateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function RecipeForm({
  recipe,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: {
  recipe: RecipeResult | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (
    request: CreateRecipeRequest | UpdateRecipeRequest,
  ) => Promise<unknown>;
}) {
  const [code, setCode] = useState(recipe?.code ?? "");
  const [name, setName] = useState(recipe?.name ?? "");
  const [yieldQuantity, setYieldQuantity] = useState(
    String(recipe?.yieldQuantity ?? 1),
  );
  const [unit, setUnit] = useState(recipe?.unit ?? "serving");
  const [duration, setDuration] = useState(
    recipe?.estimatedDurationSeconds?.toString() ?? "",
  );
  const [effectiveFrom, setEffectiveFrom] = useState(
    dateInput(recipe?.effectiveFrom),
  );
  const [effectiveTo, setEffectiveTo] = useState(
    dateInput(recipe?.effectiveTo),
  );
  const [isDefault, setIsDefault] = useState(recipe?.isDefault ?? false);
  const [validation, setValidation] = useState<string | null>(null);
  const submit = async () => {
    const quantity = Number(yieldQuantity);
    const seconds = duration ? Number(duration) : null;
    if (!recipe && (code.trim().length < 2 || code.trim().length > 50))
      return setValidation("Mã công thức phải có từ 2 đến 50 ký tự.");
    if (
      !name.trim() ||
      name.trim().length > 200 ||
      !unit.trim() ||
      unit.trim().length > 30
    )
      return setValidation("Tên và đơn vị công thức là bắt buộc.");
    if (!Number.isFinite(quantity) || quantity <= 0)
      return setValidation("Sản lượng phải lớn hơn 0.");
    if (
      seconds !== null &&
      (!Number.isInteger(seconds) || seconds < 1 || seconds > 86400)
    )
      return setValidation("Thời gian ước tính phải từ 1 đến 86400 giây.");
    if (
      effectiveFrom &&
      effectiveTo &&
      new Date(effectiveFrom) > new Date(effectiveTo)
    )
      return setValidation(
        "Thời gian bắt đầu không được sau thời gian kết thúc.",
      );
    const common: UpdateRecipeRequest = {
      name: name.trim(),
      yieldQuantity: quantity,
      unit: unit.trim(),
      estimatedDurationSeconds: seconds,
      effectiveFrom: effectiveFrom
        ? new Date(effectiveFrom).toISOString()
        : null,
      effectiveTo: effectiveTo ? new Date(effectiveTo).toISOString() : null,
      isDefault,
    };
    const result = await onSubmit(
      recipe ? common : { ...common, code: code.trim().toUpperCase() },
    );
    if (result) onClose();
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
            {recipe ? "Chỉnh sửa công thức nháp" : "Tạo công thức"}
          </DialogTitle>
          <DialogDescription>
            Thông tin công thức được tách khỏi nguyên liệu và vòng đời xuất bản.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {!recipe ? (
            <div className="space-y-1.5">
              <Label>Mã công thức</Label>
              <Input
                value={code}
                maxLength={50}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label>Tên công thức</Label>
            <Input
              value={name}
              maxLength={200}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Sản lượng</Label>
            <Input
              type="number"
              min="0.000001"
              step="any"
              value={yieldQuantity}
              onChange={(e) => setYieldQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Đơn vị</Label>
            <Input
              value={unit}
              maxLength={30}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Thời gian ước tính (giây)</Label>
            <Input
              type="number"
              min="1"
              max="86400"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 self-end rounded-lg border border-border px-3 py-2">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            <span className="text-sm">Công thức mặc định</span>
          </label>
          <div className="space-y-1.5">
            <Label>Hiệu lực từ</Label>
            <Input
              type="datetime-local"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Hiệu lực đến</Label>
            <Input
              type="datetime-local"
              value={effectiveTo}
              onChange={(e) => setEffectiveTo(e.target.value)}
            />
          </div>
        </div>
        {validation || errorMessage ? (
          <p className="text-sm text-destructive">
            {validation || errorMessage}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button onClick={() => void submit()} disabled={isSubmitting}>
            {recipe ? "Lưu công thức" : "Tạo bản nháp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ItemDraft = Omit<
  RecipeItemResult,
  "id" | "ingredientCode" | "ingredientName"
> & { key: string; ingredientCode?: string; ingredientName?: string };

function RecipeItemsForm({
  recipe,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: {
  recipe: RecipeResult;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (items: ItemDraft[]) => Promise<unknown>;
}) {
  const ingredients = useIngredients(true);
  const [items, setItems] = useState<ItemDraft[]>(() =>
    recipe.items.map((item) => ({ ...item, key: item.id })),
  );
  const [validation, setValidation] = useState<string | null>(null);
  const update = (key: string, patch: Partial<ItemDraft>) =>
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  const submit = async () => {
    if (items.length < 1 || items.length > 100)
      return setValidation("Công thức cần từ 1 đến 100 nguyên liệu.");
    if (items.every((item) => item.isOptional))
      return setValidation(
        "Cần ít nhất một nguyên liệu bắt buộc trước khi xuất bản.",
      );
    if (
      items.some(
        (item) =>
          !item.ingredientId ||
          item.quantity <= 0 ||
          !item.unit.trim() ||
          item.displayOrder <= 0,
      )
    )
      return setValidation(
        "Mỗi nguyên liệu cần số lượng dương, đơn vị và thứ tự lớn hơn 0.",
      );
    if (
      new Set(items.map((item) => item.ingredientId)).size !== items.length ||
      new Set(items.map((item) => item.displayOrder)).size !== items.length
    )
      return setValidation("Nguyên liệu và thứ tự hiển thị không được trùng.");
    const result = await onSubmit(items);
    if (result) onClose();
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Nguyên liệu công thức</DialogTitle>
          <DialogDescription>
            {recipe.name} v{recipe.version}. Chỉ bản nháp mới có thể chỉnh sửa.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            value={ingredients.search}
            onChange={(e) => ingredients.setSearch(e.target.value)}
            placeholder="Tìm nguyên liệu..."
          />
          <Button variant="outline" onClick={ingredients.retry}>
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
                className="grid gap-2 rounded-lg border border-border p-3 md:grid-cols-[1.5fr_0.7fr_0.8fr_0.6fr_1fr_auto]"
              >
                <Select
                  value={item.ingredientId || null}
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
                        : item.ingredientName || "Chọn nguyên liệu"}
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
                  aria-label="Số lượng"
                  onChange={(e) =>
                    update(item.key, { quantity: Number(e.target.value) })
                  }
                />
                <Input
                  value={item.unit}
                  aria-label="Đơn vị"
                  onChange={(e) => update(item.key, { unit: e.target.value })}
                />
                <Input
                  type="number"
                  min="1"
                  value={item.displayOrder}
                  aria-label="Thứ tự"
                  onChange={(e) =>
                    update(item.key, { displayOrder: Number(e.target.value) })
                  }
                />
                <label className="flex items-center gap-2 px-2">
                  <input
                    type="checkbox"
                    checked={item.isOptional}
                    onChange={(e) =>
                      update(item.key, { isOptional: e.target.checked })
                    }
                  />
                  <span className="text-xs">Tùy chọn</span>
                </label>
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
                  ×
                </Button>
                <Input
                  className="md:col-span-6"
                  value={item.notes ?? ""}
                  placeholder="Ghi chú"
                  maxLength={500}
                  onChange={(e) =>
                    update(item.key, { notes: e.target.value || null })
                  }
                />
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
                displayOrder: current.length + 1,
                isOptional: false,
                notes: null,
              },
            ])
          }
        >
          <Plus className="size-4" />
          Thêm nguyên liệu
        </Button>
        {validation || errorMessage ? (
          <p className="text-sm text-destructive">
            {validation || errorMessage}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button onClick={() => void submit()} disabled={isSubmitting}>
            Lưu nguyên liệu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function statusLabel(status: RecipeResult["status"]) {
  return {
    Draft: "Bản nháp",
    Published: "Đã xuất bản",
    Active: "Đang hoạt động",
    Retired: "Đã ngừng sử dụng",
  }[status];
}

export function RecipeAuthoringDialog({
  organizationId,
  product,
  variant,
  open,
  onOpenChange,
}: {
  organizationId: string;
  product: ProductResult;
  variant: ProductVariantResult;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const authoring = useRecipeAuthoring({
    open,
    organizationId,
    productId: product.id,
    variantId: variant.id,
  });
  const [formRecipe, setFormRecipe] = useState<RecipeResult | "create" | null>(
    null,
  );
  const [itemsRecipe, setItemsRecipe] = useState<RecipeResult | null>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Công thức sản xuất</DialogTitle>
          <DialogDescription>
            {product.displayName || product.name} ·{" "}
            {variant.displayName || variant.name}. Công thức là versioned
            lifecycle, không chỉnh trạng thái trong form chung.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button
            onClick={() => {
              authoring.clearError();
              setFormRecipe("create");
            }}
          >
            <Plus className="size-4" />
            Tạo công thức
          </Button>
        </div>
        {authoring.isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Đang tải công thức...
          </p>
        ) : authoring.errorMessage && authoring.recipes.length === 0 ? (
          <div className="space-y-3 p-8 text-center">
            <p className="text-sm text-destructive">{authoring.errorMessage}</p>
            <Button variant="outline" onClick={() => void authoring.retry()}>
              Thử lại
            </Button>
          </div>
        ) : authoring.recipes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Phiên bản sản phẩm chưa có công thức.
          </p>
        ) : (
          <div className="space-y-3">
            {authoring.recipes.map((recipe) => (
              <article
                key={recipe.id}
                className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">
                      {recipe.name} v{recipe.version}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {statusLabel(recipe.status)}
                      {recipe.isDefault ? " · Mặc định" : ""}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {recipe.items.length} nguyên liệu · {recipe.yieldQuantity}{" "}
                    {recipe.unit}
                    {recipe.estimatedDurationSeconds
                      ? ` · ${recipe.estimatedDurationSeconds} giây`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {recipe.status === "Draft" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setItemsRecipe(recipe)}
                      >
                        Nguyên liệu
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Chỉnh sửa công thức"
                        onClick={() => setFormRecipe(recipe)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          void authoring.setStatus(recipe.id, "Published")
                        }
                        disabled={authoring.isSubmitting}
                      >
                        Xuất bản
                      </Button>
                    </>
                  ) : null}
                  {recipe.status === "Published" ? (
                    <Button
                      size="sm"
                      onClick={() =>
                        void authoring.setStatus(recipe.id, "Active")
                      }
                      disabled={authoring.isSubmitting}
                    >
                      Kích hoạt
                    </Button>
                  ) : null}
                  {recipe.status !== "Draft" && recipe.status !== "Retired" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void authoring.createVersion(recipe.id)}
                        disabled={authoring.isSubmitting}
                      >
                        Tạo phiên bản mới
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          void authoring.setStatus(recipe.id, "Retired")
                        }
                        disabled={authoring.isSubmitting}
                      >
                        Ngừng sử dụng
                      </Button>
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
        {authoring.errorMessage && authoring.recipes.length > 0 ? (
          <p className="text-sm text-destructive">{authoring.errorMessage}</p>
        ) : null}
        <DialogFooter showCloseButton />
        {formRecipe ? (
          <RecipeForm
            key={formRecipe === "create" ? "create" : formRecipe.id}
            recipe={formRecipe === "create" ? null : formRecipe}
            isSubmitting={authoring.isSubmitting}
            errorMessage={authoring.errorMessage}
            onClose={() => setFormRecipe(null)}
            onSubmit={(request) =>
              formRecipe === "create"
                ? authoring.create(request as CreateRecipeRequest)
                : authoring.update(
                    formRecipe.id,
                    request as UpdateRecipeRequest,
                  )
            }
          />
        ) : null}
        {itemsRecipe ? (
          <RecipeItemsForm
            key={itemsRecipe.id}
            recipe={itemsRecipe}
            isSubmitting={authoring.isSubmitting}
            errorMessage={authoring.errorMessage}
            onClose={() => setItemsRecipe(null)}
            onSubmit={(items) =>
              authoring.replaceItems(itemsRecipe.id, {
                items: items.map((item) => ({
                  ingredientId: item.ingredientId,
                  quantity: item.quantity,
                  unit: item.unit,
                  displayOrder: item.displayOrder,
                  isOptional: item.isOptional,
                  notes: item.notes,
                })),
              })
            }
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
