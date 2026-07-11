"use client";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  RefreshCw,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

export function IngredientCatalogDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    ingredients,
    search,
    status,
    pagination,
    isLoading,
    errorMessage,
    setSearch,
    setStatus,
    previousPage,
    nextPage,
    retry,
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

        <div className="grid gap-3 border-b border-border bg-muted/10 px-5 py-3 md:grid-cols-[minmax(240px,1fr)_220px]">
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
    </Dialog>
  );
}
