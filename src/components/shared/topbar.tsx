"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeModeToggle } from "@/components/shared/theme-mode-toggle";
import { getDashboardRouteDefinition } from "@/lib/navigation/dashboard-routes";
import type { DashboardUser } from "@/types";

interface TopbarProps {
  currentUser: DashboardUser;
  showAlerts: boolean;
  onOpenNavigation: () => void;
  onLogout: () => Promise<void>;
}

export function Topbar({
  currentUser,
  showAlerts,
  onOpenNavigation,
  onLogout,
}: TopbarProps) {
  const pathname = usePathname();
  const route = getDashboardRouteDefinition(pathname);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accountMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        accountAreaRef.current &&
        !accountAreaRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen]);

  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenNavigation}
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          aria-label="Mở menu điều hướng"
        >
          <Menu className="size-5" />
        </button>

        <nav
          className="flex min-w-0 items-center gap-1.5 text-sm"
          aria-label="Vị trí hiện tại"
        >
          <Link
            href="/dashboard"
            className="hidden font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Trung tâm vận hành
          </Link>
          <ChevronRight className="hidden size-4 shrink-0 text-muted-foreground/60 sm:block" />
          <span className="truncate font-medium text-foreground">
            {route?.label ?? "IceBot"}
          </span>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {showAlerts ? (
          <Link
            href="/alerts"
            className="flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            title="Mở cảnh báo"
            aria-label="Mở cảnh báo"
          >
            <Bell className="size-[18px]" />
          </Link>
        ) : null}

        <div ref={accountAreaRef} className="relative">
          <button
            type="button"
            onClick={() => setAccountMenuOpen((open) => !open)}
            className="flex min-h-11 min-w-0 items-center gap-2 rounded-md px-1.5 text-left transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring sm:px-2"
            aria-expanded={accountMenuOpen}
            aria-haspopup="true"
            aria-controls="account-popover"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
              {currentUser.avatarInitials}
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-36 truncate text-xs font-medium text-foreground">
                {currentUser.name}
              </span>
              <span className="block max-w-36 truncate text-[11px] text-muted-foreground">
                {currentUser.primaryRole}
              </span>
            </span>
            <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
          </button>

          {accountMenuOpen ? (
            <div
              id="account-popover"
              className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-md"
            >
              <div className="border-b border-border px-2 pb-2 pt-1">
                <p className="truncate text-sm font-semibold">
                  {currentUser.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {currentUser.email}
                </p>
              </div>

              <Link
                href="/profile"
                onClick={() => setAccountMenuOpen(false)}
                className="mt-1 flex min-h-11 items-center gap-2 rounded-md px-2.5 text-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              >
                <UserRound className="size-4 text-muted-foreground" />
                Thông tin cá nhân
              </Link>

              <div className="my-1 border-t border-border px-2 pt-2">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Giao diện
                </p>
                <ThemeModeToggle />
              </div>

              <div className="mt-1 border-t border-border pt-1">
                <button
                  type="button"
                  onClick={() => void onLogout()}
                  className="flex min-h-11 w-full items-center gap-2 rounded-md px-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <LogOut className="size-4" />
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
