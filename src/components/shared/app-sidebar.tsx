"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  IceCream,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import {
  DASHBOARD_NAVIGATION_GROUPS,
  DASHBOARD_NAVIGATION_ITEMS,
  type DashboardNavigationGroup,
} from "@/lib/navigation/dashboard-routes";
import { getVisibleRoutes, hasPermission } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import type { EffectiveAccessResult } from "@/types/identity/accounts";

interface AppSidebarProps {
  effectiveAccess: EffectiveAccessResult;
  collapsed: boolean;
  mobile?: boolean;
  className?: string;
  onToggleCollapsed: () => void;
  onNavigate?: () => void;
  onClose?: () => void;
}

export function AppSidebar({
  effectiveAccess,
  collapsed,
  mobile = false,
  className,
  onToggleCollapsed,
  onNavigate,
  onClose,
}: AppSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isCollapsed = collapsed && !mobile;
  const [expandedGroups, setExpandedGroups] = useState<
    ReadonlySet<DashboardNavigationGroup>
  >(() => new Set(DASHBOARD_NAVIGATION_GROUPS.map((group) => group.key)));

  const groupedItems = useMemo(() => {
    const visibleRoutes = new Set(getVisibleRoutes(effectiveAccess));
    return DASHBOARD_NAVIGATION_GROUPS.map((group) => ({
      ...group,
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
  }, [effectiveAccess]);

  const toggleGroup = (group: DashboardNavigationGroup) => {
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out",
        isCollapsed ? "w-[72px]" : "w-64",
        mobile && "w-[min(86vw,288px)] shadow-xl",
        className,
      )}
    >
      <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-3">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={cn(
            "flex min-w-0 items-center gap-2.5 rounded-md focus-visible:ring-2 focus-visible:ring-sidebar-ring",
            isCollapsed && "mx-auto",
          )}
          aria-label="Đi tới Tổng quan"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <IceCream className="size-[18px]" />
          </span>
          {!isCollapsed ? (
            <span className="min-w-0">
              <span className="block text-sm font-semibold tracking-tight">
                ICEBOT
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                Vận hành và quản trị
              </span>
            </span>
          ) : null}
        </Link>

        {mobile ? (
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            aria-label="Đóng menu điều hướng"
          >
            <X className="size-5" />
          </button>
        ) : null}
      </div>

      <nav
        className={cn(
          "min-h-0 flex-1 overflow-y-auto py-3",
          isCollapsed ? "px-2" : "px-3",
        )}
        aria-label="Điều hướng chính"
      >
        <div className="space-y-2">
          {groupedItems.map((group) => {
            const expanded = expandedGroups.has(group.key);

            return (
              <section key={group.key} aria-label={group.label}>
                {isCollapsed ? (
                  <div
                    className="mx-2 my-2 border-t border-sidebar-border"
                    aria-hidden="true"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="flex min-h-11 w-full items-center justify-between rounded-md px-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                    aria-expanded={expanded}
                  >
                    {group.label}
                    <ChevronDown
                      className={cn(
                        "size-3.5 transition-transform duration-150",
                        !expanded && "-rotate-90",
                      )}
                    />
                  </button>
                )}

                {(isCollapsed || expanded) && (
                  <div className="mt-0.5 space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const itemPath = item.href ?? item.routePath;
                      const itemSearch = item.query
                        ? new URLSearchParams(item.query).toString()
                        : "";
                      const href = itemSearch
                        ? `${itemPath}?${itemSearch}`
                        : itemPath;
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
                          onClick={onNavigate}
                          title={isCollapsed ? item.label : undefined}
                          className={cn(
                            "relative flex min-h-10 w-full items-center gap-3 rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                            isCollapsed ? "justify-center px-2" : "px-2.5",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-primary"
                              : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          )}
                          aria-current={isActive ? "page" : undefined}
                        >
                          {isActive && !isCollapsed ? (
                            <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-sidebar-primary" />
                          ) : null}
                          <Icon className="size-[18px] shrink-0" />
                          {!isCollapsed ? (
                            <span className="min-w-0 truncate">
                              {item.label}
                            </span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </nav>

      {!mobile ? (
        <div className="shrink-0 border-t border-sidebar-border p-2">
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={cn(
              "flex min-h-10 w-full items-center gap-3 rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              isCollapsed && "justify-center px-2",
            )}
            aria-label={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            title={isCollapsed ? "Mở rộng sidebar" : undefined}
          >
            {isCollapsed ? (
              <ChevronRight className="size-[18px]" />
            ) : (
              <ChevronLeft className="size-[18px]" />
            )}
            {!isCollapsed ? <span>Thu gọn menu</span> : null}
          </button>
        </div>
      ) : null}
    </aside>
  );
}
