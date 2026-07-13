"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, CircleHelp, XCircle } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { READINESS_STATUS_LABELS } from "@/lib/readiness/readiness-labels";
import { cn } from "@/lib/utils";
import type { ReadinessCheck, ReadinessStatus } from "@/types/setup-readiness";

interface ReadinessCheckItemProps {
  check: ReadinessCheck;
}

const STATUS_TONE: Record<
  ReadinessStatus,
  {
    icon: typeof CheckCircle2;
    iconClassName: string;
    badgeClassName: string;
  }
> = {
  complete: {
    icon: CheckCircle2,
    iconClassName: "text-emerald-600 dark:text-emerald-400",
    badgeClassName: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  warning: {
    icon: AlertTriangle,
    iconClassName: "text-amber-600 dark:text-amber-400",
    badgeClassName: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  missing: {
    icon: XCircle,
    iconClassName: "text-destructive",
    badgeClassName: "bg-destructive/10 text-destructive",
  },
  unknown: {
    icon: CircleHelp,
    iconClassName: "text-muted-foreground",
    badgeClassName: "bg-muted text-muted-foreground",
  },
};

function evidenceText(check: ReadinessCheck) {
  const evidence = check.evidence;
  if (!evidence) {
    return null;
  }

  const parts = [
    evidence.entityName,
    evidence.count !== undefined ? `${evidence.count} bản ghi` : undefined,
    evidence.statusLabel,
    evidence.detail,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : null;
}

export function ReadinessCheckItem({ check }: ReadinessCheckItemProps) {
  const tone = STATUS_TONE[check.status];
  const Icon = tone.icon;
  const evidence = evidenceText(check);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <Icon className={cn("mt-0.5 size-5 shrink-0", tone.iconClassName)} />
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{check.title}</h3>
            <Badge className={tone.badgeClassName}>
              {READINESS_STATUS_LABELS[check.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{check.description}</p>
          {evidence ? (
            <p className="text-xs text-muted-foreground">{evidence}</p>
          ) : null}
        </div>
      </div>

      {check.status !== "complete" && check.action ? (
        <Link
          href={check.action.href}
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "shrink-0",
          })}
        >
          {check.action.label}
          <ArrowRight className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}
