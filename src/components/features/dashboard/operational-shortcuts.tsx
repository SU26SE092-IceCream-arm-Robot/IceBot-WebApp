"use client";

import Link from "next/link";
import {
  BarChart3,
  Boxes,
  Monitor,
  ReceiptText,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { getVisibleRoutes } from "@/lib/rbac";
import type { DashboardRoutePath } from "@/types";

const SHORTCUTS: Array<{
  href: DashboardRoutePath;
  icon: LucideIcon;
  label: string;
  description: string;
}> = [
  {
    href: "/kiosks",
    icon: Monitor,
    label: "Quản lý Kiosk",
    description: "Metadata và bằng chứng vận hành",
  },
  {
    href: "/inventory",
    icon: Boxes,
    label: "Tồn kho",
    description: "Mức nguyên liệu và biến động",
  },
  {
    href: "/maintenance",
    icon: Wrench,
    label: "Bảo trì",
    description: "Theo dõi phiếu cần xử lý",
  },
  {
    href: "/transactions",
    icon: ReceiptText,
    label: "Giao dịch",
    description: "Đơn hàng và hoàn tiền",
  },
  {
    href: "/reports",
    icon: BarChart3,
    label: "Báo cáo",
    description: "Phân tích theo khoảng thời gian",
  },
];

export function OperationalShortcuts() {
  const { currentUser } = useAuth();
  const visibleRoutes = new Set(
    currentUser ? getVisibleRoutes(currentUser.role) : [],
  );
  const visibleShortcuts = SHORTCUTS.filter((item) =>
    visibleRoutes.has(item.href),
  );

  if (visibleShortcuts.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-foreground">Lối tắt vận hành</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Đi thẳng đến nghiệp vụ cần xử lý.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {visibleShortcuts.map((item) => {
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className="group">
              <Card className="h-full border-border/80 shadow-none transition-colors group-hover:border-primary/30 group-hover:bg-primary/5">
                <CardContent className="flex items-start gap-3 p-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
