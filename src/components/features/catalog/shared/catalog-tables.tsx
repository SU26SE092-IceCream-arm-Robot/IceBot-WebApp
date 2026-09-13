import { AlertTriangle, CheckCircle2, CirclePause, CirclePlay, Eye, Layers3, Package2 } from "lucide-react";

import { getNextMenuStatus } from "@/components/features/catalog/shared/catalog-dialogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProductReadinessIssues } from "@/lib/presenters/product-catalog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  MenuItemStatus,
  MenuResult,
  MenuStatus,
  ProductCategoryResult,
  ProductResult,
  TenantScopeType,
} from "@/types/catalog/menu-management";

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateValue?: string | null): string {
  if (!dateValue) {
    return "Không giới hạn";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateValue));
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

function getItemStatusLabel(status: MenuItemStatus): string {
  switch (status) {
    case "Draft":
      return "Nháp";
    case "Active":
      return "Bán";
    case "Unavailable":
      return "Hết bán";
    case "Archived":
      return "Lưu trữ";
  }
}

function MenuStatusBadge({ status }: { status: MenuStatus }) {
  switch (status) {
    case "Active":
      return (
        <Badge className="border-0 bg-success/10 text-success">
          {getMenuStatusLabel(status)}
        </Badge>
      );
    case "Draft":
    case "Paused":
      return (
        <Badge className="border-0 bg-warning/10 text-warning">
          {getMenuStatusLabel(status)}
        </Badge>
      );
    case "Archived":
      return (
        <Badge className="border border-border bg-muted/20 text-muted-foreground">
          {getMenuStatusLabel(status)}
        </Badge>
      );
  }
}

function ItemBadge({ name, status }: { name: string; status: MenuItemStatus }) {
  const statusClassName = {
    Active: "border-0 bg-success/10 text-success",
    Draft: "border-0 bg-warning/10 text-warning",
    Unavailable: "border border-border bg-muted/20 text-muted-foreground",
    Archived: "border border-border bg-muted/20 text-muted-foreground",
  }[status];

  return (
    <Badge className={statusClassName}>
      {name} / {getItemStatusLabel(status)}
    </Badge>
  );
}

interface MenusTableProps {
  canManage: boolean;
  menuActionId: string | null;
  menus: MenuResult[];
  onToggleStatus: (menu: MenuResult, status: MenuStatus) => void;
  onView: (menuId: string) => void;
}

export function MenusTable({
  canManage,
  menuActionId,
  menus,
  onToggleStatus,
  onView,
}: MenusTableProps) {
  return (
    <>
      <div className="divide-y divide-border md:hidden">
        {menus.map((menu) => {
          const nextStatus = getNextMenuStatus(menu.status);
          return (
            <article key={menu.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {menu.name}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {menu.code}
                  </p>
                </div>
                <MenuStatusBadge status={menu.status} />
              </div>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Phạm vi</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {getScopeLabel(menu.scopeType)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Số món</dt>
                  <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                    {menu.items.length}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Hiệu lực</dt>
                  <dd className="mt-0.5 tabular-nums text-foreground">
                    {formatDate(menu.effectiveFrom)} → {formatDate(menu.effectiveTo)}
                  </dd>
                </div>
              </dl>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(menu.id)}
                >
                  <Eye className="size-4" aria-hidden="true" />
                  Chi tiết
                </Button>
                {canManage && nextStatus ? (
                  <Button
                    variant="outline"
                    size="sm"
                    isLoading={menuActionId === menu.id}
                    onClick={() => onToggleStatus(menu, nextStatus)}
                  >
                    {nextStatus === "Active" ? (
                      <CirclePlay className="size-4" aria-hidden="true" />
                    ) : (
                      <CirclePause className="size-4" aria-hidden="true" />
                    )}
                    {nextStatus === "Active" ? "Kích hoạt" : "Tạm dừng"}
                  </Button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <Table className="min-w-[1080px] table-fixed">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[27%] px-5">Thực đơn</TableHead>
          <TableHead className="w-[13%] text-center">Trạng thái</TableHead>
          <TableHead className="w-[12%] text-center">Phạm vi</TableHead>
          <TableHead className="w-[24%] text-center">Món hiển thị</TableHead>
          <TableHead className="w-[15%] text-center">Hiệu lực</TableHead>
          <TableHead className="w-[9%] px-5 text-center">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {menus.map((menu) => (
          <TableRow key={menu.id}>
            <TableCell className="px-5">
              <div className="space-y-1">
                <p className="font-medium text-foreground">{menu.name}</p>
                <p className="tabular-nums text-xs text-muted-foreground">{menu.code}</p>
              </div>
            </TableCell>
            <TableCell className="text-center">
              <div className="flex items-center justify-center">
                <MenuStatusBadge status={menu.status} />
              </div>
            </TableCell>
            <TableCell className="text-center">
              <div className="flex items-center justify-center">
                <Badge variant="outline">{getScopeLabel(menu.scopeType)}</Badge>
              </div>
            </TableCell>
            <TableCell className="text-center">
              {menu.items.length === 0 ? (
                <span className="text-xs text-muted-foreground">Chưa có món</span>
              ) : (
                <div className="flex max-w-80 flex-wrap items-center justify-center gap-1.5">
                  {menu.items.slice(0, 2).map((item) => (
                    <ItemBadge key={item.id} name={item.displayName} status={item.status} />
                  ))}
                  {menu.items.length > 2 ? (
                    <Badge variant="ghost" className="tabular-nums">
                      +{menu.items.length - 2}
                    </Badge>
                  ) : null}
                </div>
              )}
            </TableCell>
            <TableCell className="text-center">
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="tabular-nums">Từ: {formatDate(menu.effectiveFrom)}</p>
                <p className="tabular-nums">Đến: {formatDate(menu.effectiveTo)}</p>
              </div>
            </TableCell>
            <TableCell className="px-5">
              <div className="flex items-center justify-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  title={`Xem chi tiết ${menu.name}`}
                  aria-label={`Xem chi tiết ${menu.name}`}
                  onClick={() => onView(menu.id)}
                >
                  <Eye className="size-4" />
                </Button>
                {canManage && getNextMenuStatus(menu.status) ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={
                      getNextMenuStatus(menu.status) === "Active"
                        ? "rounded-lg text-success hover:bg-success/10 hover:text-success"
                        : "rounded-lg text-warning hover:bg-warning/10 hover:text-warning"
                    }
                    title={getNextMenuStatus(menu.status) === "Active" ? "Kích hoạt" : "Tạm dừng"}
                    aria-label={`${getNextMenuStatus(menu.status) === "Active" ? "Kích hoạt" : "Tạm dừng"} ${menu.name}`}
                    isLoading={menuActionId === menu.id}
                    onClick={() => {
                      const nextStatus = getNextMenuStatus(menu.status);
                      if (nextStatus) {
                        onToggleStatus(menu, nextStatus);
                      }
                    }}
                  >
                    {getNextMenuStatus(menu.status) === "Active" ? (
                      <CirclePlay className="size-4" />
                    ) : (
                      <CirclePause className="size-4" />
                    )}
                  </Button>
                ) : null}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
        </Table>
      </div>
    </>
  );
}

interface ProductsTableProps {
  canManage: boolean;
  categories: ProductCategoryResult[];
  productActionId: string | null;
  products: ProductResult[];
  onToggleAvailability: (product: ProductResult) => void;
  onView: (productId: string) => void;
}

export function ProductsTable({
  canManage,
  categories,
  productActionId,
  products,
  onToggleAvailability,
  onView,
}: ProductsTableProps) {
  return (
    <>
      <div className="divide-y divide-border md:hidden">
        {products.map((product) => {
          const readinessIssues = getProductReadinessIssues(product);
          const category = categories.find(
            (item) => item.id === product.categoryId,
          );
          const productName = product.displayName?.trim() || product.name;
          return (
            <article key={product.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {productName}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {product.code}
                  </p>
                </div>
                <Badge
                  className={
                    product.isAvailable
                      ? "border-0 bg-success/10 text-success"
                      : "border border-border bg-muted/20 text-muted-foreground"
                  }
                >
                  {product.isAvailable ? "Đang bán" : "Ngừng bán"}
                </Badge>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Danh mục</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {category?.name ?? "Chưa phân loại"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Phạm vi</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {getScopeLabel(product.scopeType)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Phiên bản</dt>
                  <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                    {product.variants.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Giá cơ bản</dt>
                  <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                    {formatMoney(product.basePrice, product.currency)}
                  </dd>
                </div>
              </dl>
              {readinessIssues.length > 0 ? (
                <p className="flex items-start gap-2 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  Còn {readinessIssues.length} thiết lập cần hoàn thiện
                </p>
              ) : null}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(product.id)}
                >
                  <Eye className="size-4" aria-hidden="true" />
                  Chi tiết
                </Button>
                {canManage ? (
                  <Button
                    variant="outline"
                    size="sm"
                    isLoading={productActionId === product.id}
                    onClick={() => onToggleAvailability(product)}
                  >
                    {product.isAvailable ? (
                      <CirclePause className="size-4" aria-hidden="true" />
                    ) : (
                      <CirclePlay className="size-4" aria-hidden="true" />
                    )}
                    {product.isAvailable ? "Tắt bán" : "Bật bán"}
                  </Button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <Table className="min-w-[1160px] table-fixed">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[21%] px-5">Sản phẩm</TableHead>
          <TableHead className="w-[12%] text-center">Danh mục</TableHead>
          <TableHead className="w-[10%] text-center">Khả dụng</TableHead>
          <TableHead className="w-[10%] text-center">Phạm vi</TableHead>
          <TableHead className="w-[18%] text-center">Phiên bản</TableHead>
          <TableHead className="w-[11%] text-center">Thiết lập</TableHead>
          <TableHead className="w-[10%] text-right">Giá cơ bản</TableHead>
          <TableHead className="w-[8%] px-5 text-center">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => {
          const readinessIssues = getProductReadinessIssues(product);
          return <TableRow key={product.id}>
            <TableCell className="px-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  <Package2 className="size-4" />
                </span>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    {product.displayName?.trim() || product.name}
                  </p>
                  <p className="tabular-nums text-xs text-muted-foreground">{product.code}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-center">
              <div className="flex items-center justify-center">
                {product.categoryId === null || product.categoryId === undefined ? (
                  <span className="text-xs text-muted-foreground">Chưa phân loại</span>
                ) : (() => {
                  const category = categories.find((item) => item.id === product.categoryId);
                  return category ? (
                    <Badge
                      variant="outline"
                      className={category.isActive ? undefined : "border-border text-muted-foreground"}
                      title={category.isActive ? category.name : `${category.name} (đã tắt)`}
                    >
                      {category.name}{category.isActive ? "" : " (đã tắt)"}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Danh mục không còn khả dụng</span>
                  );
                })()}
              </div>
            </TableCell>
            <TableCell className="text-center">
              <div className="flex items-center justify-center">
                {product.isAvailable ? (
                  <Badge className="border-0 bg-success/10 text-success">Đang bán</Badge>
                ) : (
                  <Badge className="border border-border bg-muted/20 text-muted-foreground">Ngừng bán</Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="text-center">
              <div className="flex items-center justify-center">
                <Badge variant="outline">{getScopeLabel(product.scopeType)}</Badge>
              </div>
            </TableCell>
            <TableCell className="text-center">
              {product.variants.length === 0 ? (
                <span className="text-xs text-muted-foreground">Chưa có phiên bản</span>
              ) : (
                <div className="flex max-w-80 flex-wrap items-center justify-center gap-1.5">
                  {product.variants.slice(0, 2).map((variant) => (
                    <Badge
                      key={variant.id}
                      className={
                        variant.isAvailable
                          ? "border-0 bg-success/10 text-success"
                          : "border border-border bg-muted/20 text-muted-foreground"
                      }
                    >
                      {variant.displayName?.trim() || variant.name}
                    </Badge>
                  ))}
                  {product.variants.length > 2 ? (
                    <Badge variant="ghost" className="tabular-nums">
                      +{product.variants.length - 2}
                    </Badge>
                  ) : null}
                </div>
              )}
            </TableCell>
            <TableCell className="text-center">
              <div className="flex justify-center">
                {readinessIssues.length === 0 ? (
                  <Badge className="gap-1 border-0 bg-success/10 text-success"><CheckCircle2 className="size-3" />Hoàn thiện</Badge>
                ) : (
                  <Badge className="gap-1 border-0 bg-warning/10 text-warning" title={readinessIssues.map((issue) => issue.message).join("\n")}><AlertTriangle className="size-3" />{readinessIssues.length} việc</Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <span className="tabular-nums font-medium text-foreground">
                {formatMoney(product.basePrice, product.currency)}
              </span>
            </TableCell>
            <TableCell className="px-5">
              <div className="flex items-center justify-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  title={`Xem chi tiết ${product.displayName?.trim() || product.name}`}
                  aria-label={`Xem chi tiết ${product.displayName?.trim() || product.name}`}
                  onClick={() => onView(product.id)}
                >
                  <Eye className="size-4" />
                </Button>
                {canManage ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={
                      product.isAvailable
                        ? "rounded-lg text-warning hover:bg-warning/10 hover:text-warning"
                        : "rounded-lg text-success hover:bg-success/10 hover:text-success"
                    }
                    title={product.isAvailable ? "Tắt bán" : "Bật bán"}
                    aria-label={`${product.isAvailable ? "Tắt bán" : "Bật bán"} ${product.displayName?.trim() || product.name}`}
                    isLoading={productActionId === product.id}
                    onClick={() => onToggleAvailability(product)}
                  >
                    {product.isAvailable ? (
                      <CirclePause className="size-4" />
                    ) : (
                      <CirclePlay className="size-4" />
                    )}
                  </Button>
                ) : null}
              </div>
            </TableCell>
          </TableRow>;
        })}
      </TableBody>
        </Table>
      </div>
    </>
  );
}

export function CatalogEmptyMarker({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted/20 text-muted-foreground">
        <Layers3 className="size-5" />
      </span>
      <p className="text-sm font-medium text-foreground">Không có {label} phù hợp</p>
      <p className="text-sm text-muted-foreground">Thử thay đổi từ khóa tìm kiếm.</p>
    </div>
  );
}
