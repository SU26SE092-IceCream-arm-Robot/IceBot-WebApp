"use client";

import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  RefreshCw,
  Search,
  ShoppingBasket,
  type LucideIcon,
} from "lucide-react";

import { CatalogEmptyMarker, MenusTable, ProductsTable } from "@/components/features/menu/catalog-tables";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MenuCollectionState } from "@/hooks/use-menu-management";
import type {
  MenuManagementPagination,
  MenuResult,
  MenuStatus,
  ProductCategoryResult,
  ProductResult,
} from "@/types/menu-management";

type StatTone = "primary" | "success";

const STAT_TONES: Record<StatTone, { iconClassName: string; valueClassName: string }> = {
  primary: {
    iconClassName: "bg-primary/10 text-primary",
    valueClassName: "text-foreground",
  },
  success: {
    iconClassName: "bg-success/10 text-success",
    valueClassName: "text-success",
  },
};

export function CatalogStatCard({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: LucideIcon;
  label: string;
  tone: StatTone;
  value: number;
}) {
  const toneClasses = STAT_TONES[tone];

  return (
    <Card className="rounded-xl border border-border/80 bg-card shadow-none">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${toneClasses.iconClassName}`}>
            <Icon className="size-5" />
          </span>
        </div>
        <p className={`tabular-nums text-3xl font-semibold tracking-tight ${toneClasses.valueClassName}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function CatalogLoadingTable() {
  return (
    <div className="space-y-1 px-5 py-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`catalog-skeleton-${index}`}
          className="grid grid-cols-5 items-center gap-4 border-b border-border py-4 last:border-0"
        >
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-muted/50" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted/30" />
          </div>
          <div className="h-5 w-20 animate-pulse rounded-full bg-muted/40" />
          <div className="h-5 w-24 animate-pulse rounded-full bg-muted/40" />
          <div className="h-5 w-36 animate-pulse rounded-full bg-muted/30" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted/30" />
        </div>
      ))}
    </div>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => Promise<void> }) {
  return (
    <div className="flex flex-col items-center gap-4 px-5 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium text-destructive">Không thể tải dữ liệu</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <Button variant="destructive" onClick={() => void onRetry()}>
        Thử lại
      </Button>
    </div>
  );
}

function PaginationControls({
  pagination,
  isLoading,
  onPrevious,
  onNext,
}: {
  pagination: MenuManagementPagination;
  isLoading: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 border-t border-border px-5 py-4 text-sm sm:flex-row sm:items-center">
      <p className="text-muted-foreground">
        Trang <span className="tabular-nums font-medium text-foreground">{pagination.page}</span> /{" "}
        <span className="tabular-nums font-medium text-foreground">{Math.max(pagination.totalPages, 1)}</span>
        {" - "}
        <span className="tabular-nums font-medium text-foreground">{pagination.totalCount}</span> kết quả
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={!pagination.hasPrevious || isLoading} onClick={onPrevious}>
          <ChevronLeft className="size-4" />
          Trước
        </Button>
        <Button variant="outline" size="sm" disabled={!pagination.hasNext || isLoading} onClick={onNext}>
          Sau
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function MenusPanel({
  collection,
  onRetry,
  onPrevious,
  onNext,
  canManage,
  menuActionId,
  onView,
  onToggleStatus,
}: {
  collection: MenuCollectionState<MenuResult>;
  onRetry: () => Promise<void>;
  onPrevious: () => void;
  onNext: () => void;
  canManage: boolean;
  menuActionId: string | null;
  onView: (menuId: string) => void;
  onToggleStatus: (menu: MenuResult, status: MenuStatus) => void;
}) {
  return (
    <Card className="rounded-xl border border-border bg-card shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShoppingBasket className="size-4" />
          </span>
          <CardTitle className="text-base">Danh sách thực đơn</CardTitle>
        </div>
      </CardHeader>
      <div>
        {collection.isLoading ? (
          <CatalogLoadingTable />
        ) : collection.errorMessage ? (
          <ErrorPanel message={collection.errorMessage} onRetry={onRetry} />
        ) : collection.data.length === 0 ? (
          <CatalogEmptyMarker label="thực đơn" />
        ) : (
          <MenusTable
            canManage={canManage}
            menuActionId={menuActionId}
            menus={collection.data}
            onToggleStatus={onToggleStatus}
            onView={onView}
          />
        )}
      </div>
      <PaginationControls
        pagination={collection.pagination}
        isLoading={collection.isLoading}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    </Card>
  );
}

export function ProductsPanel({
  collection,
  categories,
  onRetry,
  onPrevious,
  onNext,
  canManage,
  productActionId,
  onView,
  onToggleAvailability,
}: {
  collection: MenuCollectionState<ProductResult>;
  categories: ProductCategoryResult[];
  onRetry: () => Promise<void>;
  onPrevious: () => void;
  onNext: () => void;
  canManage: boolean;
  productActionId: string | null;
  onView: (productId: string) => void;
  onToggleAvailability: (product: ProductResult) => void;
}) {
  return (
    <Card className="rounded-xl border border-border bg-card shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <ShoppingBag className="size-4" />
          </span>
          <CardTitle className="text-base">Danh sách sản phẩm</CardTitle>
        </div>
      </CardHeader>
      <div>
        {collection.isLoading ? (
          <CatalogLoadingTable />
        ) : collection.errorMessage ? (
          <ErrorPanel message={collection.errorMessage} onRetry={onRetry} />
        ) : collection.data.length === 0 ? (
          <CatalogEmptyMarker label="sản phẩm" />
        ) : (
          <ProductsTable
            canManage={canManage}
            categories={categories}
            productActionId={productActionId}
            products={collection.data}
            onToggleAvailability={onToggleAvailability}
            onView={onView}
          />
        )}
      </div>
      <PaginationControls
        pagination={collection.pagination}
        isLoading={collection.isLoading}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    </Card>
  );
}

function organizationLabel(organization: { name?: string; code?: string }) {
  const name = organization.name?.trim();
  const code = organization.code?.trim();
  if (name && code) return `${name} — ${code}`;
  return name || code || "Tổ chức trong phạm vi được giao";
}

export function CatalogOrganizationSelector({
  organizations,
  selectedOrganizationId,
  selectedOrganization,
  isLoading,
  errorMessage,
  noun,
  onChange,
}: {
  organizations: Array<{ id: string; name?: string; code?: string }>;
  selectedOrganizationId: string | null;
  selectedOrganization: { id: string; name?: string; code?: string } | null;
  isLoading: boolean;
  errorMessage: string | null;
  noun: string;
  onChange: (organizationId: string | null) => void;
}) {
  return (
    <Card className="rounded-xl border border-border bg-card shadow-none">
      <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium">Tổ chức quản lý</p>
            <p className="text-sm text-muted-foreground">{noun} được quản lý riêng theo từng tổ chức.</p>
          </div>
        </div>
        <Select
          value={selectedOrganizationId ?? ""}
          disabled={isLoading || organizations.length === 0}
          onValueChange={(value) => onChange(value || null)}
        >
          <SelectTrigger className="h-10 w-full lg:w-[360px]">
            <SelectValue placeholder={isLoading ? "Đang tải tổ chức..." : "Chọn tổ chức"}>
              {selectedOrganization ? organizationLabel(selectedOrganization) : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {organizations.map((organization) => (
              <SelectItem key={organization.id} value={organization.id}>
                {organizationLabel(organization)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
      {errorMessage ? (
        <div role="alert" className="border-t border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : !isLoading && !selectedOrganizationId ? (
        <div className="border-t border-warning/20 bg-warning/5 px-4 py-3 text-sm text-warning">
          {organizations.length === 0
            ? "Không có tổ chức khả dụng cho tài khoản này."
            : `Hãy chọn một tổ chức để tải ${noun.toLocaleLowerCase()}.`}
        </div>
      ) : null}
    </Card>
  );
}

export function CatalogSearchBar({
  value,
  placeholder,
  onChange,
  onClear,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <Card className="rounded-xl border border-border bg-card shadow-none">
      <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="h-9 bg-card pl-9 text-sm"
          />
        </div>
        <Button variant="outline" size="sm" className="h-9" onClick={onClear}>
          Xóa tìm kiếm
        </Button>
      </CardContent>
    </Card>
  );
}

export function CatalogRefreshWarning({
  message,
  isRetrying,
  onRetry,
}: {
  message: string | null;
  isRetrying: boolean;
  onRetry: () => Promise<unknown>;
}) {
  if (!message) return null;

  return (
    <div role="alert" className="flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <span>{message}</span>
      </div>
      <Button type="button" variant="outline" size="sm" className="shrink-0" isLoading={isRetrying} onClick={() => void onRetry()}>
        <RefreshCw className="size-4" />
        Tải lại dữ liệu
      </Button>
    </div>
  );
}
