"use client";

import Link from "next/link";
import {
  Building2,
  CreditCard,
  IceCream,
  Microchip,
  Package,
  ShieldCheck,
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { DashboardRoutePath } from "@/types";

const PLATFORM_SHORTCUTS: Array<{
  href: DashboardRoutePath;
  icon: LucideIcon;
  label: string;
  description: string;
}> = [
  {
    href: "/organizations",
    icon: Building2,
    label: "Tổ chức & cửa hàng",
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
    href: "/menu",
    icon: IceCream,
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
    href: "/platform/exceptions",
    icon: ShieldAlert,
    label: "Sự cố đồng bộ",
    description: "Hàng đợi sự kiện cần kiểm tra ở cấp nền tảng",
  },
  {
    href: "/settings/payment-methods",
    icon: CreditCard,
    label: "Phương thức thanh toán",
    description: "Trạng thái phương thức cấp nền tảng",
  },
];

interface PlatformControlShortcutsProps {
  visibleRoutes: ReadonlySet<DashboardRoutePath>;
}

export function PlatformControlShortcuts({
  visibleRoutes,
}: PlatformControlShortcutsProps) {
  const shortcuts = PLATFORM_SHORTCUTS.filter((item) =>
    visibleRoutes.has(item.href),
  );

  return (
    <section className="space-y-3 pt-2">
      <div>
        <h2 className="text-sm font-semibold text-foreground">
          Quản trị nền tảng
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Đi tới module sở hữu dữ liệu hoặc chính sách cần quản trị.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shortcuts.map((item) => {
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className="group">
              <Card className="h-full border-border/80 bg-muted/5 shadow-none transition-colors group-hover:border-primary/30 group-hover:bg-primary/5">
                <CardContent className="flex items-start gap-3 p-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground group-hover:text-primary">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">
                      {item.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
