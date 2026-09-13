"use client";

import Link from "next/link";
import {
  BarChart3,
  Building2,
  ClipboardCheck,
  CreditCard,
  FileCode2,
  FileText,
  ShoppingBag,
  Microchip,
  Package,
  ShieldCheck,
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { DashboardRoutePath } from "@/types";

interface PlatformShortcut {
  href: DashboardRoutePath;
  icon: LucideIcon;
  label: string;
  description: string;
}

const PRIMARY_SHORTCUTS: PlatformShortcut[] = [
  {
    href: "/organizations",
    icon: Building2,
    label: "Tổ chức",
    description: "Vòng đời tenant và cấu trúc vận hành",
  },
  {
    href: "/users",
    icon: Users,
    label: "Tài khoản",
    description: "Tài khoản và phạm vi được giao",
  },
  {
    href: "/roles",
    icon: ShieldCheck,
    label: "Vai trò & quyền",
    description: "Ma trận policy hiện hành",
  },
  {
    href: "/platform/service-registrations",
    icon: ClipboardCheck,
    label: "Đơn đăng ký dịch vụ",
    description: "Yêu cầu đang chờ quản trị nền tảng",
  },
  {
    href: "/platform/exceptions",
    icon: ShieldAlert,
    label: "Sự cố đồng bộ",
    description: "Hàng đợi sự kiện cần kiểm tra",
  },
  {
    href: "/settings/payment-methods",
    icon: CreditCard,
    label: "Phương thức thanh toán",
    description: "Trạng thái phương thức cấp nền tảng",
  },
];

const SECONDARY_SHORTCUTS: PlatformShortcut[] = [
  {
    href: "/platform/organization-sales",
    icon: BarChart3,
    label: "Doanh thu tổ chức",
    description: "Số liệu đã tổng hợp theo từng tổ chức",
  },
  {
    href: "/products",
    icon: ShoppingBag,
    label: "Danh mục sản phẩm",
    description: "Sản phẩm, mẫu và danh mục dùng chung",
  },
  {
    href: "/inventory",
    icon: Package,
    label: "Danh mục nguyên liệu",
    description: "Nguyên liệu và topology tồn kho",
  },
  {
    href: "/kiosks",
    icon: Microchip,
    label: "Danh mục thiết bị",
    description: "Loại, model và cấu hình kiosk",
  },
  {
    href: "/platform/lua-templates",
    icon: FileCode2,
    label: "Mẫu LUA hệ thống",
    description: "Mẫu chương trình và cấu hình dùng chung",
  },
  {
    href: "/platform/content-pages",
    icon: FileText,
    label: "Trang nội dung tĩnh",
    description: "Nội dung công khai của nền tảng",
  },
];

interface PlatformControlShortcutsProps {
  visibleRoutes: ReadonlySet<DashboardRoutePath>;
}

export function PlatformControlShortcuts({
  visibleRoutes,
}: PlatformControlShortcutsProps) {
  const primaryShortcuts = PRIMARY_SHORTCUTS.filter((item) =>
    visibleRoutes.has(item.href),
  );
  const secondaryShortcuts = SECONDARY_SHORTCUTS.filter((item) =>
    visibleRoutes.has(item.href),
  );

  const renderShortcut = (item: PlatformShortcut, compact = false) => {
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Card className="h-full border-border/80 bg-muted/5 shadow-none transition-colors group-hover:border-primary/30 group-hover:bg-primary/5">
          <CardContent
            className={
              compact
                ? "flex items-center gap-3 p-3"
                : "flex items-start gap-3 p-4"
            }
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground group-hover:text-primary">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">
                {item.label}
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                {item.description}
              </span>
            </span>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <section className="space-y-5 pt-1">
      <div>
        <h2 className="text-sm font-semibold text-foreground">
          Hoạt động quản trị
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Đi tới module sở hữu dữ liệu hoặc chính sách cần quản trị.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {primaryShortcuts.map((item) => renderShortcut(item))}
      </div>
      {secondaryShortcuts.length > 0 ? (
        <div className="space-y-3 border-t border-border pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Lối tắt nền tảng
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {secondaryShortcuts.map((item) => renderShortcut(item, true))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
