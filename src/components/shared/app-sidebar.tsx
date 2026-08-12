"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  IceCream,
  LogOut,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { ThemeModeToggle } from "@/components/shared/theme-mode-toggle";
import {
  DASHBOARD_NAVIGATION_GROUPS,
  DASHBOARD_NAVIGATION_ITEMS,
} from "@/lib/navigation/dashboard-routes";
import { getVisibleRoutes, hasPermission } from "@/lib/rbac";
import { getRoleLabel } from "@/lib/role-labels";
import type { DashboardUser } from "@/types";
import type { EffectiveAccessResult } from "@/types/identity/accounts";

interface AppSidebarProps {
  currentUser: DashboardUser;
  effectiveAccess: EffectiveAccessResult;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onLogout: () => Promise<void>;
}

export function AppSidebar({
  currentUser,
  effectiveAccess,
  collapsed,
  onToggleCollapsed,
  onLogout,
}: AppSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountAreaRef = useRef<HTMLDivElement>(null);
  const visibleRoutes = new Set(getVisibleRoutes(effectiveAccess));
  const groupedItems = DASHBOARD_NAVIGATION_GROUPS.map((group) => ({
    label: group.label,
    items: DASHBOARD_NAVIGATION_ITEMS.flatMap((item) => {
      if (
        item.group !== group.key ||
        !visibleRoutes.has(item.routePath) ||
        (item.requiredPermission &&
          !hasPermission(effectiveAccess, item.requiredPermission))
      ) {
        return [];
      }

      return [item];
    }),
  })).filter((group) => group.items.length > 0);

  useEffect(() => {
    if (!accountMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        accountAreaRef.current &&
        !accountAreaRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [accountMenuOpen]);

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-56"
      } relative flex shrink-0 flex-col border-r border-border bg-card transition-all duration-300 ease-out`}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div
          className={`flex h-14 items-center border-b border-border transition-all duration-300 ease-out ${
            collapsed ? "justify-center px-2" : "gap-3 px-4"
          }`}
        >
          <div className="shrink-0 rounded-lg bg-primary p-1.5 text-primary-foreground">
            <IceCream size={18} />
          </div>
          <div
            className={`overflow-hidden whitespace-nowrap transition-all duration-200 ease-out ${
              collapsed ? "w-0 -translate-x-1 opacity-0" : "w-36 translate-x-0 opacity-100"
            }`}
            aria-hidden={collapsed}
          >
            <span className="text-sm font-bold tracking-tight text-foreground">ICEBOT</span>
            <span className="block text-[10px] font-medium leading-tight text-muted-foreground">
              Trung tâm vận hành
            </span>
          </div>
        </div>

        <nav
          className={`mt-4 min-h-0 flex-1 overflow-y-auto px-2 pb-4 ${
            collapsed ? "space-y-3" : "space-y-4"
          }`}
        >
          {groupedItems.map((group) => (
            <div key={group.label} className="space-y-1">
              <div
                className={`overflow-hidden px-3 transition-all duration-200 ease-out ${
                  collapsed ? "h-0 opacity-0" : "h-5 opacity-100"
                }`}
                aria-hidden={collapsed}
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                  {group.label}
                </span>
              </div>

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const itemPath = item.href ?? item.routePath;
                  const itemSearch = item.query
                    ? new URLSearchParams(item.query).toString()
                    : "";
                  const href = itemSearch ? `${itemPath}?${itemSearch}` : itemPath;
                  const matchesDefaultQuery =
                    (item.routePath === "/transactions" &&
                      item.query?.tab === "orders" &&
                      searchParams.get("tab") === null) ||
                    (item.routePath === "/production" &&
                      item.query?.stage === "programs" &&
                      searchParams.get("stage") === null);
                  const isActive =
                    (pathname === item.routePath ||
                      pathname.startsWith(`${item.routePath}/`)) &&
                    (!item.query ||
                      Object.entries(item.query).every(
                        ([key, value]) =>
                          searchParams.get(key) === value ||
                          matchesDefaultQuery,
                      ));

                  return (
                    <Link
                      key={href}
                      href={href}
                      title={collapsed ? item.label : undefined}
                      className={`flex w-full items-center gap-3 rounded-md text-sm font-medium transition-all duration-200 ease-out ${
                        collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2"
                      } ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      <Icon size={18} className="shrink-0" />
                      <span
                        className={`overflow-hidden whitespace-nowrap transition-all duration-200 ease-out ${
                          collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div
        ref={accountAreaRef}
        className={`relative border-t border-border p-2 ${
          collapsed ? "space-y-2" : "flex items-center gap-2"
        }`}
      >
        {accountMenuOpen ? (
          <div
            className={`absolute z-30 rounded-xl border border-border bg-card p-2 shadow-md animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-150 ${
              collapsed
                ? "bottom-2 left-full ml-3 w-64"
                : "right-2 bottom-full mb-2 left-2"
            }`}
          >
            <div className="px-2 py-2">
              <p className="truncate text-sm font-semibold text-foreground">
                {currentUser.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {currentUser.email}
              </p>
              <p className="mt-1 text-xs font-medium text-primary">
                {getRoleLabel(currentUser.primaryRole)}
              </p>
            </div>
            <Link
              href="/profile"
              onClick={() => setAccountMenuOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <UserRound className="size-4 text-muted-foreground" />
              Thông tin cá nhân
            </Link>
            <div className="my-1 h-px bg-border" />
            <div className="px-2 pb-2">
              <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
                Giao diện
              </p>
              <ThemeModeToggle />
            </div>
            <div className="my-1 h-px bg-border" />
            <button
              type="button"
              onClick={() => void onLogout()}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              Đăng xuất
            </button>
          </div>
        ) : null}

        {visibleRoutes.has("/alerts") ? (
          <Link
            href="/alerts"
            className={`flex shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              collapsed ? "mx-auto size-9" : "size-9"
            }`}
            title="Mở cảnh báo"
            aria-label="Mở cảnh báo"
          >
            <Bell className="size-4" />
          </Link>
        ) : null}

        <button
          type="button"
          onClick={() => setAccountMenuOpen((open) => !open)}
          className={`flex min-w-0 items-center rounded-lg text-left transition-colors hover:bg-accent ${
            collapsed ? "mx-auto size-9 justify-center" : "flex-1 gap-2.5 px-2 py-1.5"
          }`}
          aria-expanded={accountMenuOpen}
          aria-haspopup="menu"
          title={collapsed ? currentUser.name : undefined}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-xs font-bold text-primary">
            {currentUser.avatarInitials}
          </span>
          <span
            className={`min-w-0 overflow-hidden transition-all duration-200 ease-out ${
              collapsed ? "w-0 opacity-0" : "flex-1 opacity-100"
            }`}
          >
            <span className="block truncate text-sm font-medium text-foreground">
              {currentUser.name}
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {getRoleLabel(currentUser.primaryRole)}
            </span>
          </span>
        </button>
      </div>

      <button
        type="button"
        onClick={onToggleCollapsed}
        className="absolute top-7 right-0 z-10 flex size-7 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-all duration-200 ease-out hover:border-primary/30 hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
