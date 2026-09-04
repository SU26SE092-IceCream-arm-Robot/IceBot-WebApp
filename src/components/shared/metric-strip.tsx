import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type MetricTone = "neutral" | "primary" | "success" | "warning" | "destructive";

const TONES: Record<MetricTone, { icon: string; value: string }> = {
  neutral: {
    icon: "bg-muted text-muted-foreground",
    value: "text-foreground",
  },
  primary: {
    icon: "bg-primary/10 text-primary",
    value: "text-foreground",
  },
  success: {
    icon: "bg-success/10 text-success",
    value: "text-success",
  },
  warning: {
    icon: "bg-warning/10 text-warning",
    value: "text-warning",
  },
  destructive: {
    icon: "bg-destructive/10 text-destructive",
    value: "text-destructive",
  },
};

export function MetricStrip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "grid overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-2 xl:grid-cols-4",
        className,
      )}
    >
      {children}
    </section>
  );
}

interface MetricStripItemProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  description?: string;
  href?: string;
  tone?: MetricTone;
}

export function MetricStripItem({
  icon: Icon,
  label,
  value,
  description,
  href,
  tone = "neutral",
}: MetricStripItemProps) {
  const itemClassName = cn(
    "group flex min-h-24 min-w-0 items-start justify-between gap-4 border-b border-border px-4 py-3.5 transition-colors sm:[&:nth-last-child(-n+2)]:border-b-0 xl:border-r xl:border-b-0 xl:last:border-r-0",
    href && "hover:bg-accent/50",
  );
  const content = (
    <>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-1 tabular-nums text-2xl font-semibold tracking-tight",
            TONES[tone].value,
          )}
        >
          {value}
        </p>
        {description ? (
          <p className="mt-1 truncate text-xs text-muted-foreground" title={description}>
            {description}
          </p>
        ) : null}
      </div>
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md",
          TONES[tone].icon,
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
    </>
  );

  return href ? (
    <Link
      href={href}
      className={cn(
        itemClassName,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
      )}
    >
      {content}
    </Link>
  ) : (
    <div className={itemClassName}>{content}</div>
  );
}
