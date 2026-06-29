import { ListChecks } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="gap-0 rounded-lg border border-border/80 bg-card py-0 shadow-none">
      <CardHeader className="border-b border-border/70 bg-muted/5 px-5 py-4">
        <div className="flex items-start gap-2.5">
          <ListChecks className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="space-y-0.5">
            <CardTitle>Trạng thái đơn hàng</CardTitle>
            <CardDescription>Phân bổ đơn trong khoảng thời gian đã chọn.</CardDescription>
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
            <div className="h-1.5 overflow-hidden rounded-full bg-border/70">
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
