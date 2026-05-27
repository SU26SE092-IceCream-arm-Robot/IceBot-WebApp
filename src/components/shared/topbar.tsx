"use client";

import { Bell, LogOut } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { DashboardUser } from "@/types";

interface TopbarProps {
  currentUser: DashboardUser;
  onLogout: () => Promise<void>;
}

const ROLE_LABELS = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  LOCATION_OWNER: "Location Owner",
} as const;

export function Topbar({ currentUser, onLogout }: TopbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <div className="w-60 lg:w-96">
        <Input placeholder="Tìm kiếm kiosk, đơn hàng..." type="text" />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="Thông báo"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
        </button>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-xs font-bold text-primary">
            {currentUser.avatarInitials}
          </div>
          <div className="hidden md:block">
            <span className="block text-sm font-medium leading-tight text-foreground">
              {currentUser.name}
            </span>
            <span className="block text-[11px] leading-tight text-muted-foreground">
              {ROLE_LABELS[currentUser.role]}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void onLogout()}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="Đăng xuất"
          aria-label="Đăng xuất"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

