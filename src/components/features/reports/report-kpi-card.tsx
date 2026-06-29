import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

type KpiTone = "primary" | "success" | "warning" | "destructive";

const TONES: Record<KpiTone, { icon: string; value: string }> = {
  primary: { icon: "text-primary", value: "text-foreground" },
  success: { icon: "text-success", value: "text-foreground" },
  warning: { icon: "text-warning", value: "text-foreground" },
  destructive: { icon: "text-destructive", value: "text-destructive" },
};

export function ReportKpiCard({
  icon: Icon,
  label,
  value,
  helper,
  coverage,
  tone = "primary",
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  helper: string;
  coverage: string;
  tone?: KpiTone;
}) {
  return (
    <Card className="gap-0 rounded-lg border border-border/80 bg-card py-0 shadow-none">
      <CardContent className="flex min-h-44 flex-col p-5">
        <div className="flex items-center gap-2">
          <Icon className={`size-4 shrink-0 ${TONES[tone].icon}`} />
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
        </div>
        <div className="mt-5 flex-1">
          <div className={`tabular-nums text-[1.75rem] font-semibold leading-tight ${TONES[tone].value}`}>
            {value}
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{helper}</p>
        </div>
        <p className="mt-4 flex items-center gap-2 border-t border-border/70 pt-3 text-[11px] text-muted-foreground">
          <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
          {coverage}
        </p>
      </CardContent>
    </Card>
  );
}
