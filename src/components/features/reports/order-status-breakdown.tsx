import { ListChecks } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportStatusBucket } from "@/types/reports";

const BAR_TONES: Record<ReportStatusBucket["tone"], string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  muted: "bg-muted-foreground/50",
};

export function OrderStatusBreakdown({ buckets }: { buckets: ReportStatusBucket[] }) {
  return (
    <Card className="rounded-xl border border-border bg-card shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <ListChecks className="size-5" />
          </span>
          <div>
            <CardTitle>Trạng thái đơn hàng</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        {buckets.map((bucket) => (
          <div key={bucket.id} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-foreground">{bucket.label}</span>
              <span className="tabular-nums text-muted-foreground">
                {bucket.count.toLocaleString("vi-VN")} · {bucket.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted/40">
              <div
                className={`h-full rounded-full ${BAR_TONES[bucket.tone]}`}
                style={{ width: `${Math.max(bucket.percentage, bucket.count > 0 ? 2 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
