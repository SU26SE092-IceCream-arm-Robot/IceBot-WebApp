"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { READINESS_STATUS_LABELS } from "@/lib/readiness/readiness-labels";
import type { ReadinessCheck } from "@/types/setup-readiness";

interface ReadinessNextActionsProps {
  actions: ReadinessCheck[];
}

export function ReadinessNextActions({ actions }: ReadinessNextActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Việc nên làm tiếp theo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.length === 0 ? (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="font-medium text-foreground">
                Hệ thống hiện không có cấu hình bắt buộc cần xử lý.
              </p>
              <p className="text-muted-foreground">
                Tiếp tục kiểm tra thủ công bằng dữ liệu demo trước khi trình bày.
              </p>
            </div>
          </div>
        ) : (
          actions.map((check) => (
            <div
              key={check.id}
              className="rounded-lg border border-border bg-background p-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {check.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {READINESS_STATUS_LABELS[check.status]} · {check.description}
                  </p>
                </div>
                {check.action ? (
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
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
