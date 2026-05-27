"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  IceCream,
  Monitor,
  Package,
  ShoppingCart,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { getVisibleRoutes } from "@/lib/rbac";
import type { DashboardRole, DashboardRoutePath } from "@/types";

interface SidebarItem {
  href: DashboardRoutePath;
  label: string;
  icon: LucideIcon;
}

const SIDEBAR_ITEMS: readonly SidebarItem[] = [
  { href: "/kiosks", label: "Quản lý Kiosk", icon: Monitor },
  { href: "/inventory", label: "Tồn kho", icon: Package },
  { href: "/transactions", label: "Giao dịch", icon: ShoppingCart },
  { href: "/menu", label: "Thực đơn", icon: IceCream },
  { href: "/reports", label: "Báo cáo", icon: BarChart3 },
  { href: "/users", label: "Tài khoản", icon: Users },
  { href: "/maintenance", label: "Bảo trì", icon: Wrench },
];

interface AppSidebarProps {
  role: DashboardRole;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function AppSidebar({ role, collapsed, onToggleCollapsed }: AppSidebarProps) {
  const pathname = usePathname();
  const visibleRoutes = new Set(getVisibleRoutes(role));

  const visibleItems = SIDEBAR_ITEMS.filter((item) => visibleRoutes.has(item.href));

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-60"
      } flex shrink-0 flex-col justify-between border-r border-border bg-card transition-all duration-200`}
    >
      <div>
        <div className="flex h-14 items-center gap-3 border-b border-border px-4">
          <div className="shrink-0 rounded-lg bg-primary p-1.5 text-primary-foreground">
            <IceCream size={18} />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="text-sm font-bold tracking-tight text-foreground">ICEBOT</span>
              <span className="block text-[10px] font-medium leading-tight text-muted-foreground">
                Admin Dashboard
              </span>
            </div>
          )}
        </div>

        <nav className="mt-4 space-y-0.5 px-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex w-full items-center gap-3 rounded-md text-sm font-medium transition-colors ${
                  collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2"
                } ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex w-full items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
