"use client";

import { AlertTriangle, CheckCircle2, CircleHelp, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { READINESS_OVERALL_LABELS } from "@/lib/readiness/readiness-labels";
import { cn } from "@/lib/utils";
import type { ReadinessOverallStatus, ReadinessSummary } from "@/types/setup-readiness";

interface ReadinessSummaryCardProps {
  summary: ReadinessSummary;
}

const STATUS_TONE: Record<
  ReadinessOverallStatus,
  {
    icon: typeof CheckCircle2;
    iconClassName: string;
    surfaceClassName: string;
    badgeClassName: string;
  }
> = {
  complete: {
    icon: CheckCircle2,
    iconClassName: "text-emerald-600 dark:text-emerald-400",
    surfaceClassName: "bg-emerald-500/10",
    badgeClassName: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  needs_attention: {
    icon: AlertTriangle,
    iconClassName: "text-amber-600 dark:text-amber-400",
    surfaceClassName: "bg-amber-500/10",
    badgeClassName: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  missing_configuration: {
    icon: XCircle,
    iconClassName: "text-destructive",
    surfaceClassName: "bg-destructive/10",
    badgeClassName: "bg-destructive/10 text-destructive",
  },
  unknown: {
    icon: CircleHelp,
    iconClassName: "text-muted-foreground",
    surfaceClassName: "bg-muted",
    badgeClassName: "bg-muted text-muted-foreground",
  },
};

export function ReadinessSummaryCard({ summary }: ReadinessSummaryCardProps) {
  const tone = STATUS_TONE[summary.overallStatus];
  const Icon = tone.icon;

  return (
    <Card className="border-primary/20">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div className="space-y-1">
          <CardTitle>Trạng thái thiết lập</CardTitle>
          <p className="text-sm text-muted-foreground">
            Dựa trên các API quản trị hiện có, không dùng dữ liệu giả hoặc suy diễn.
          </p>
        </div>
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-xl",
            tone.surfaceClassName,
          )}
        >
          <Icon className={cn("size-6", tone.iconClassName)} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className={tone.badgeClassName}>
            {READINESS_OVERALL_LABELS[summary.overallStatus]}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {summary.completedCount}/{summary.totalApplicableCount} mục đã hoàn tất
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Cần hoàn thiện</p>
            <p className="text-2xl font-semibold text-foreground">
              {summary.warningCount}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Còn thiếu</p>
            <p className="text-2xl font-semibold text-foreground">
              {summary.missingCount}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Không thể kiểm tra</p>
            <p className="text-2xl font-semibold text-foreground">
              {summary.unknownCount}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
