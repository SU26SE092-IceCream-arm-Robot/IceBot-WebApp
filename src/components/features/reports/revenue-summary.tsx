import { ChartNoAxesCombined } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportCurrencyAmount, ReportTrendBucket } from "@/types/reports";

function formatMoney(value: ReportCurrencyAmount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: value.currency,
    maximumFractionDigits: 0,
  }).format(value.amount);
}

export function RevenueSummary({ trend }: { trend: ReportTrendBucket[] }) {
  const maxOrders = Math.max(...trend.map((item) => item.orderCount), 1);
  const hasActivity = trend.some(
    (bucket) =>
      bucket.orderCount > 0 || bucket.revenue.some((value) => value.amount > 0),
  );

  return (
    <Card className="gap-0 rounded-lg border border-border/80 bg-card py-0 shadow-none">
      <CardHeader className="border-b border-border/70 bg-muted/5 px-5 py-4">
        <div className="flex items-start gap-2.5">
          <ChartNoAxesCombined className="mt-0.5 size-4 shrink-0 text-success" />
          <div className="space-y-0.5">
            <CardTitle>Xu hướng đơn hàng và doanh thu</CardTitle>
            <CardDescription>Theo ngày với kỳ 7/30 ngày, theo tuần với kỳ 90 ngày.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {!hasActivity ? (
          <div className="flex min-h-64 items-center justify-center px-6 text-center">
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              Chưa có đơn hàng hoặc doanh thu đã thu trong khoảng thời gian này.
            </p>
          </div>
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {trend.map((bucket) => (
              <div key={bucket.id} className="grid grid-cols-[84px_minmax(0,1fr)_minmax(104px,auto)] items-center gap-3 border-b border-border/50 py-1.5 text-xs last:border-0">
                <span className="text-muted-foreground">{bucket.label}</span>
                {bucket.orderCount > 0 ? (
                  <div className="h-6 overflow-hidden rounded bg-border/60">
                    <div
                      className="flex h-full min-w-0 items-center rounded bg-primary/80 px-2 font-medium text-primary-foreground"
                      style={{ width: `${Math.max((bucket.orderCount / maxOrders) * 100, 8)}%` }}
                    >
                      {bucket.orderCount}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-6 items-center gap-2 text-muted-foreground/70">
                    <span className="h-px w-5 bg-border" />
                    Không có đơn
                  </div>
                )}
                <span className="text-right tabular-nums text-foreground">
                  {bucket.revenue.some((value) => value.amount > 0)
                    ? bucket.revenue.filter((value) => value.amount > 0).map(formatMoney).join(" · ")
                    : "Chưa thu"}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
