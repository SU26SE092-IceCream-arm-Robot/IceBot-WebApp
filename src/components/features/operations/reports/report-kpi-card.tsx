import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

type KpiTone = "primary" | "success" | "warning" | "destructive";

const TONES: Record<KpiTone, { icon: string; value: string }> = {
  primary: {
    icon: "border-primary/20 bg-primary/10 text-primary",
    value: "text-foreground",
  },
  success: {
    icon: "border-success/20 bg-success/10 text-success",
    value: "text-success",
  },
  warning: {
    icon: "border-warning/20 bg-warning/10 text-warning",
    value: "text-warning",
  },
  destructive: {
    icon: "border-destructive/20 bg-destructive/10 text-destructive",
    value: "text-destructive",
  },
};

export function ReportKpiCard({
  icon: Icon,
  label,
  value,
  tone = "primary",
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  tone?: KpiTone;
}) {
  return (
    <Card className="rounded-xl border border-border/80 bg-card shadow-none">
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${TONES[tone].icon}`}
          >
            <Icon className="size-5" />
          </span>
        </div>
        <div className="mt-3 flex-1">
          <div className={`tabular-nums text-3xl font-semibold tracking-tight ${TONES[tone].value}`}>
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
