import { CirclePause, CirclePlay, Eye, Layers3, Package2 } from "lucide-react";

import { getNextMenuStatus } from "@/components/features/menu/catalog-dialogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  ProductResult,
  TenantScopeType,
} from "@/types/menu-management";

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
    dateStyle: "short",
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="px-5">Thực đơn</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Phạm vi</TableHead>
          <TableHead>Món hiển thị</TableHead>
          <TableHead>Hiệu lực</TableHead>
          <TableHead className="px-5 text-right">Thao tác</TableHead>
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
            <TableCell>
              <MenuStatusBadge status={menu.status} />
            </TableCell>
            <TableCell>
              <Badge variant="outline">{getScopeLabel(menu.scopeType)}</Badge>
            </TableCell>
            <TableCell>
              {menu.items.length === 0 ? (
                <span className="text-xs text-muted-foreground">Chưa có món</span>
              ) : (
                <div className="flex max-w-80 flex-wrap gap-1.5">
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
            <TableCell>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="tabular-nums">Từ: {formatDate(menu.effectiveFrom)}</p>
                <p className="tabular-nums">Đến: {formatDate(menu.effectiveTo)}</p>
              </div>
            </TableCell>
            <TableCell className="px-5">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => onView(menu.id)}
                >
                  <Eye className="size-3.5" />
                  Xem chi tiết
                </Button>
                {canManage && getNextMenuStatus(menu.status) ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    isLoading={menuActionId === menu.id}
                    onClick={() => {
                      const nextStatus = getNextMenuStatus(menu.status);
                      if (nextStatus) {
                        onToggleStatus(menu, nextStatus);
                      }
                    }}
                  >
                    {getNextMenuStatus(menu.status) === "Active" ? (
                      <CirclePlay className="size-3.5" />
                    ) : (
                      <CirclePause className="size-3.5" />
                    )}
                    {getNextMenuStatus(menu.status) === "Active" ? "Kích hoạt" : "Tạm dừng"}
                  </Button>
                ) : null}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

interface ProductsTableProps {
  canManage: boolean;
  productActionId: string | null;
  products: ProductResult[];
  onToggleAvailability: (product: ProductResult) => void;
  onView: (productId: string) => void;
}

export function ProductsTable({
  canManage,
  productActionId,
  products,
  onToggleAvailability,
  onView,
}: ProductsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="px-5">Sản phẩm</TableHead>
          <TableHead>Khả dụng</TableHead>
          <TableHead>Phạm vi</TableHead>
          <TableHead>Biến thể</TableHead>
          <TableHead className="text-right">Giá cơ bản</TableHead>
          <TableHead className="px-5 text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
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
            <TableCell>
              {product.isAvailable ? (
                <Badge className="border-0 bg-success/10 text-success">Đang bán</Badge>
              ) : (
                <Badge className="border border-border bg-muted/20 text-muted-foreground">Ngừng bán</Badge>
              )}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{getScopeLabel(product.scopeType)}</Badge>
            </TableCell>
            <TableCell>
              {product.variants.length === 0 ? (
                <span className="text-xs text-muted-foreground">Không có biến thể</span>
              ) : (
                <div className="flex max-w-80 flex-wrap gap-1.5">
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
            <TableCell className="text-right">
              <span className="tabular-nums font-medium text-foreground">
                {formatMoney(product.basePrice, product.currency)}
              </span>
            </TableCell>
            <TableCell className="px-5">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => onView(product.id)}
                >
                  <Eye className="size-3.5" />
                  Xem chi tiết
                </Button>
                {canManage ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    isLoading={productActionId === product.id}
                    onClick={() => onToggleAvailability(product)}
                  >
                    {product.isAvailable ? "Tắt bán" : "Bật bán"}
                  </Button>
                ) : null}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
