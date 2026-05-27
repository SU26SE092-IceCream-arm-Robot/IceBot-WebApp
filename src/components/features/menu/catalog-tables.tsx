import { Layers3, Package2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  if (status === "Active") {
    return <Badge variant="default">{getMenuStatusLabel(status)}</Badge>;
  }

  if (status === "Paused") {
    return (
      <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">
        {getMenuStatusLabel(status)}
      </Badge>
    );
  }

  return <Badge variant="secondary">{getMenuStatusLabel(status)}</Badge>;
}

function ItemBadge({ name, status }: { name: string; status: MenuItemStatus }) {
  const variant = status === "Active" ? "outline" : "secondary";

  return (
    <Badge variant={variant}>
      {name} / {getItemStatusLabel(status)}
    </Badge>
  );
}

export function MenusTable({ menus }: { menus: MenuResult[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="px-5">Thực đơn</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Phạm vi</TableHead>
          <TableHead>Món hiển thị</TableHead>
          <TableHead className="px-5">Hiệu lực</TableHead>
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
            <TableCell className="px-5">
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="tabular-nums">Từ: {formatDate(menu.effectiveFrom)}</p>
                <p className="tabular-nums">Đến: {formatDate(menu.effectiveTo)}</p>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ProductsTable({ products }: { products: ProductResult[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="px-5">Sản phẩm</TableHead>
          <TableHead>Khả dụng</TableHead>
          <TableHead>Phạm vi</TableHead>
          <TableHead>Biến thể</TableHead>
          <TableHead className="px-5 text-right">Giá cơ bản</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="px-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
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
                <Badge variant="default">Đang bán</Badge>
              ) : (
                <Badge variant="secondary">Ngừng bán</Badge>
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
                    <Badge key={variant.id} variant={variant.isAvailable ? "outline" : "secondary"}>
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
            <TableCell className="px-5 text-right">
              <span className="tabular-nums font-medium text-foreground">
                {formatMoney(product.basePrice, product.currency)}
              </span>
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
      <span className="flex size-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
        <Layers3 className="size-5" />
      </span>
      <p className="text-sm font-medium text-foreground">Không có {label} phù hợp</p>
      <p className="text-sm text-muted-foreground">Thử thay đổi từ khóa tìm kiếm.</p>
    </div>
  );
}
