"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
  { value: "light", label: "Sáng", icon: Sun },
  { value: "dark", label: "Tối", icon: Moon },
  { value: "system", label: "Hệ thống", icon: Monitor },
] as const;

export function ThemeModeToggle({ compact = false }: { compact?: boolean }) {
  const { setTheme, theme = "system" } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const activeTheme = mounted ? theme : "system";

  return (
    <div
      className={cn(
        "grid gap-1 rounded-lg border border-border bg-muted/30 p-1",
        compact ? "grid-cols-1" : "grid-cols-3"
      )}
      aria-label="Chọn giao diện"
    >
      {THEME_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isActive = activeTheme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
            aria-pressed={isActive}
            title={`Giao diện ${option.label.toLowerCase()}`}
          >
            <Icon className="size-3.5" />
            {!compact ? <span>{option.label}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
