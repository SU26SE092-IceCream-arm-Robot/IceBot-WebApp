import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type DashboardKpiTone = "neutral" | "primary" | "warning" | "destructive";

const TONES: Record<
  DashboardKpiTone,
  { icon: string; value: string }
> = {
  neutral: {
    icon: "bg-secondary text-secondary-foreground",
    value: "text-foreground",
  },
  primary: {
    icon: "bg-primary/10 text-primary",
    value: "text-primary",
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

interface DashboardKpiCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  description: string;
  href?: string;
  tone?: DashboardKpiTone;
}

export function DashboardKpiCard({
  icon: Icon,
  label,
  value,
  description,
  href,
  tone = "neutral",
}: DashboardKpiCardProps) {
  const card = (
    <Card className="h-full border-border/80 bg-card shadow-none transition-colors group-hover:border-primary/40 group-hover:bg-primary/5">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p
            className={`tabular-nums text-3xl font-bold tracking-tight lg:text-4xl ${TONES[tone].value}`}
          >
            {value.toLocaleString("vi-VN")}
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${TONES[tone].icon}`}
        >
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );

  if (!href) {
    return card;
  }

  return (
    <Link href={href} className="group block h-full">
      {card}
    </Link>
  );
}
