"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Edit3,
  FlaskConical,
  Plus,
  Power,
  RefreshCw,
  Search,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type IngredientStatusFilter,
  useIngredients,
} from "@/hooks/use-ingredients";
import type {
  CreateIngredientRequest,
  IngredientResult,
  UpdateIngredientRequest,
} from "@/types/ingredients";

const STATUS_OPTIONS: Array<{
  value: IngredientStatusFilter;
  label: string;
}> = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "ACTIVE", label: "Đang sử dụng" },
  { value: "INACTIVE", label: "Đã tắt" },
];

function formatDate(value: string | null | undefined): string {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Không xác định"
    : new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
}

interface IngredientFormState {
  code: string;
  name: string;
  ingredientType: string;
  unit: string;
  description: string;
  storageRequirement: string;
  isPerishable: boolean;
  isAllergen: boolean;
  shelfLifeDays: string;
}

function initialIngredientForm(
  ingredient: IngredientResult | null,
): IngredientFormState {
  return ingredient
    ? {
        code: ingredient.code,
        name: ingredient.name,
        ingredientType: ingredient.ingredientType,
        unit: ingredient.unit,
        description: ingredient.description ?? "",
        storageRequirement: ingredient.storageRequirement ?? "",
        isPerishable: ingredient.isPerishable,
        isAllergen: ingredient.isAllergen,
        shelfLifeDays: ingredient.shelfLifeDays?.toString() ?? "",
      }
    : {
        code: "",
        name: "",
        ingredientType: "Consumable",
        unit: "gram",
        description: "",
        storageRequirement: "",
        isPerishable: false,
        isAllergen: false,
        shelfLifeDays: "",
      };
}

function IngredientFormDialog({
  open,
  ingredient,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  ingredient: IngredientResult | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onCreate: (request: CreateIngredientRequest) => Promise<boolean>;
  onUpdate: (
    ingredientId: string,
    request: UpdateIngredientRequest,
  ) => Promise<boolean>;
}) {
  const [form, setForm] = useState<IngredientFormState>(() =>
    initialIngredientForm(ingredient),
  );
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const setField = <K extends keyof IngredientFormState>(
    field: K,
    value: IngredientFormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationMessage(null);
  };

  const submit = async () => {
    const code = form.code.trim();
    const name = form.name.trim();
    const ingredientType = form.ingredientType.trim();
    const unit = form.unit.trim();
    const shelfLifeDays = form.shelfLifeDays.trim()
      ? Number(form.shelfLifeDays)
      : null;

    if (!ingredient && (code.length < 2 || code.length > 50)) {
      setValidationMessage("Mã nguyên liệu phải có từ 2 đến 50 ký tự.");
      return;
    }
    if (!name || name.length > 200) {
      setValidationMessage("Tên nguyên liệu là bắt buộc và tối đa 200 ký tự.");
      return;
    }
    if (!ingredientType || ingredientType.length > 50) {
      setValidationMessage("Loại nguyên liệu là bắt buộc và tối đa 50 ký tự.");
      return;
    }
    if (!unit || unit.length > 30) {
      setValidationMessage("Đơn vị là bắt buộc và tối đa 30 ký tự.");
      return;
    }
    if (
      shelfLifeDays !== null &&
      (!Number.isInteger(shelfLifeDays) || shelfLifeDays < 1 || shelfLifeDays > 36500)
    ) {
      setValidationMessage("Hạn dùng phải từ 1 đến 36500 ngày.");
      return;
    }
    if (
      form.description.trim().length > 1000 ||
      form.storageRequirement.trim().length > 200
    ) {
      setValidationMessage("Mô tả tối đa 1000 ký tự và yêu cầu bảo quản tối đa 200 ký tự.");
      return;
    }

    const request = {
      name,
      ingredientType,
      unit,
      description: form.description.trim() || null,
      storageRequirement: form.storageRequirement.trim() || null,
      isPerishable: form.isPerishable,
      isAllergen: form.isAllergen,
      shelfLifeDays,
    };
    const succeeded = ingredient
      ? await onUpdate(ingredient.id, request)
      : await onCreate({ code, ...request });
    if (succeeded) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {ingredient ? "Chỉnh sửa nguyên liệu" : "Tạo nguyên liệu"}
          </DialogTitle>
          <DialogDescription>
            Quản lý dữ liệu nguyên liệu dùng chung cho công thức và tồn kho.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="ingredient-code" className="text-sm font-medium">Mã nguyên liệu</label>
            <Input id="ingredient-code" value={form.code} maxLength={50} disabled={Boolean(ingredient) || isSubmitting} onChange={(event) => setField("code", event.target.value)} placeholder="VANILLA_BASE" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="ingredient-name" className="text-sm font-medium">Tên nguyên liệu</label>
            <Input id="ingredient-name" value={form.name} maxLength={200} disabled={isSubmitting} onChange={(event) => setField("name", event.target.value)} placeholder="Kem nền vani" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="ingredient-type" className="text-sm font-medium">Loại nguyên liệu</label>
            <Input id="ingredient-type" value={form.ingredientType} maxLength={50} disabled={isSubmitting} onChange={(event) => setField("ingredientType", event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="ingredient-unit" className="text-sm font-medium">Đơn vị</label>
            <Input id="ingredient-unit" value={form.unit} maxLength={30} disabled={isSubmitting} onChange={(event) => setField("unit", event.target.value)} placeholder="gram" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="ingredient-description" className="text-sm font-medium">Mô tả</label>
            <textarea id="ingredient-description" value={form.description} maxLength={1000} rows={3} disabled={isSubmitting} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" onChange={(event) => setField("description", event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="ingredient-storage" className="text-sm font-medium">Yêu cầu bảo quản</label>
            <Input id="ingredient-storage" value={form.storageRequirement} maxLength={200} disabled={isSubmitting} onChange={(event) => setField("storageRequirement", event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="ingredient-shelf-life" className="text-sm font-medium">Hạn dùng (ngày)</label>
            <Input id="ingredient-shelf-life" type="number" min={1} max={36500} step={1} value={form.shelfLifeDays} disabled={isSubmitting} onChange={(event) => setField("shelfLifeDays", event.target.value)} />
          </div>
          <label className="flex items-center gap-3 rounded-lg border border-border px-3 py-3 text-sm">
            <input type="checkbox" checked={form.isPerishable} disabled={isSubmitting} onChange={(event) => setField("isPerishable", event.target.checked)} className="size-4 accent-primary" />
            Dễ hỏng
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-border px-3 py-3 text-sm">
            <input type="checkbox" checked={form.isAllergen} disabled={isSubmitting} onChange={(event) => setField("isAllergen", event.target.checked)} className="size-4 accent-primary" />
            Có nguy cơ dị ứng
          </label>
        </div>

        {validationMessage || errorMessage ? (
          <p className="text-sm text-destructive" role="alert">{validationMessage ?? errorMessage}</p>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="button" isLoading={isSubmitting} onClick={() => void submit()}>{ingredient ? "Lưu thay đổi" : "Tạo nguyên liệu"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function IngredientCatalogDialog({
  open,
  onOpenChange,
  canManage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
}) {
  const [formTarget, setFormTarget] = useState<IngredientResult | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IngredientResult | null>(null);
  const {
    ingredients,
    search,
    status,
    pagination,
    isLoading,
    errorMessage,
    mutationError,
    mutatingIngredientId,
    setSearch,
    setStatus,
    previousPage,
    nextPage,
    retry,
    clearMutationError,
    create,
    update,
    toggleStatus: setIngredientStatus,
    remove,
  } = useIngredients(open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="border-b border-border px-5 py-4 pr-12">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FlaskConical className="size-5 text-primary" />
            Danh mục nguyên liệu
          </DialogTitle>
          <DialogDescription>
            Tra cứu nguyên liệu dùng trong cấu hình sản phẩm và tồn kho.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 border-b border-border bg-muted/10 px-5 py-3 md:grid-cols-[minmax(240px,1fr)_220px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên hoặc mã nguyên liệu..."
              className="bg-card pl-9"
            />
          </div>
          <Select value={status} onValueChange={(value) => setStatus(value as IngredientStatusFilter)}>
            <SelectTrigger className="w-full bg-card">
              <SelectValue>
                {STATUS_OPTIONS.find((option) => option.value === status)?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canManage ? (
            <Button
              type="button"
              onClick={() => {
                clearMutationError();
                setFormTarget("new");
              }}
            >
              <Plus className="size-4" />
              Tạo nguyên liệu
            </Button>
          ) : null}
        </div>

        <div className="min-h-72 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2 p-5" aria-label="Đang tải danh mục nguyên liệu">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-lg bg-muted/40" />
              ))}
            </div>
          ) : errorMessage ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 px-6 text-center">
              <AlertTriangle className="size-7 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Không thể tải nguyên liệu</p>
                <p className="mt-1 max-w-lg text-sm text-muted-foreground">{errorMessage}</p>
              </div>
              <Button variant="outline" size="sm" onClick={retry}>
                <RefreshCw className="size-4" />
                Thử lại
              </Button>
            </div>
          ) : ingredients.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <FlaskConical className="size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">Không có nguyên liệu phù hợp</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Thử thay đổi từ khóa hoặc trạng thái đang lọc.
              </p>
            </div>
          ) : (
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-5">Nguyên liệu</TableHead>
                  <TableHead>Loại / đơn vị</TableHead>
                  <TableHead>Đặc tính</TableHead>
                  <TableHead>Bảo quản</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="px-5">Cập nhật</TableHead>
                  {canManage ? <TableHead className="text-right">Thao tác</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((ingredient) => (
                  <TableRow key={ingredient.id}>
                    <TableCell className="max-w-64 px-5 py-3 whitespace-normal">
                      <p className="font-medium">{ingredient.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{ingredient.code}</p>
                      {ingredient.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {ingredient.description}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <p>{ingredient.ingredientType}</p>
                      <p className="text-xs text-muted-foreground">{ingredient.unit}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {ingredient.isPerishable ? <Badge variant="secondary">Dễ hỏng</Badge> : null}
                        {ingredient.isAllergen ? <Badge variant="destructive">Dị ứng</Badge> : null}
                        {!ingredient.isPerishable && !ingredient.isAllergen ? (
                          <span className="text-sm text-muted-foreground">Không ghi nhận</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-52 whitespace-normal">
                      <p className="text-sm">{ingredient.storageRequirement || "Chưa có yêu cầu"}</p>
                      <p className="text-xs text-muted-foreground">
                        {ingredient.shelfLifeDays
                          ? `Hạn dùng: ${ingredient.shelfLifeDays} ngày`
                          : "Chưa có hạn dùng"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ingredient.isActive ? "default" : "outline"}>
                        {ingredient.isActive ? "Đang sử dụng" : "Đã tắt"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 text-xs text-muted-foreground">
                      {formatDate(ingredient.updatedAt ?? ingredient.createdAt)}
                    </TableCell>
                    {canManage ? (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button type="button" variant="ghost" size="icon-sm" title="Chỉnh sửa nguyên liệu" aria-label="Chỉnh sửa nguyên liệu" disabled={mutatingIngredientId !== null} onClick={() => { clearMutationError(); setFormTarget(ingredient); }}><Edit3 className="size-4" /></Button>
                          <Button type="button" variant="ghost" size="icon-sm" title={ingredient.isActive ? "Tắt nguyên liệu" : "Kích hoạt nguyên liệu"} aria-label={ingredient.isActive ? "Tắt nguyên liệu" : "Kích hoạt nguyên liệu"} isLoading={mutatingIngredientId === ingredient.id} onClick={() => void setIngredientStatus(ingredient)}><Power className="size-4" /></Button>
                          <Button type="button" variant="ghost" size="icon-sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" title="Xóa nguyên liệu" aria-label="Xóa nguyên liệu" disabled={mutatingIngredientId !== null} onClick={() => { clearMutationError(); setDeleteTarget(ingredient); }}><Trash2 className="size-4" /></Button>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-border bg-muted/10 px-5 py-3 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">
            Trang <span className="font-medium text-foreground">{pagination.page}</span> /{" "}
            <span className="font-medium text-foreground">{Math.max(pagination.totalPages, 1)}</span>
            {" · "}{pagination.totalCount} nguyên liệu
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!pagination.hasPrevious || isLoading} onClick={previousPage}>
              <ChevronLeft className="size-4" />
              Trước
            </Button>
            <Button variant="outline" size="sm" disabled={!pagination.hasNext || isLoading} onClick={nextPage}>
              Sau
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </DialogContent>

      <IngredientFormDialog
        key={formTarget === "new" ? "new" : formTarget?.id ?? "closed"}
        open={formTarget !== null}
        ingredient={formTarget === "new" ? null : formTarget}
        isSubmitting={mutatingIngredientId !== null}
        errorMessage={mutationError}
        onOpenChange={(next) => !next && setFormTarget(null)}
        onCreate={create}
        onUpdate={update}
      />

      <Dialog open={deleteTarget !== null} onOpenChange={(next) => !next && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xóa nguyên liệu?</DialogTitle>
            <DialogDescription>Backend sẽ từ chối nếu nguyên liệu đang được công thức hoặc tồn kho tham chiếu.</DialogDescription>
          </DialogHeader>
          {mutationError ? <p className="text-sm text-destructive" role="alert">{mutationError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={mutatingIngredientId !== null} onClick={() => setDeleteTarget(null)}>Hủy</Button>
            <Button type="button" variant="destructive" isLoading={deleteTarget ? mutatingIngredientId === deleteTarget.id : false} onClick={async () => { if (!deleteTarget) return; const succeeded = await remove(deleteTarget); if (succeeded) setDeleteTarget(null); }}><Trash2 className="size-4" />Xóa nguyên liệu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
