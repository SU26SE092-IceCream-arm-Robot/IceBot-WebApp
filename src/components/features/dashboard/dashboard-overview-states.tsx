import { AlertTriangle, LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function DashboardLoadingState() {
  return (
    <div className="space-y-6" aria-label="Đang tải tổng quan">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-border/80 shadow-none">
            <CardContent className="space-y-4 p-5">
              <div className="h-4 w-28 animate-pulse rounded bg-muted/50" />
              <div className="h-9 w-16 animate-pulse rounded bg-muted/40" />
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-xl border border-border bg-card" />
        <div className="h-80 animate-pulse rounded-xl border border-border bg-card" />
      </section>
      <div className="h-80 animate-pulse rounded-xl border border-border bg-card" />
    </div>
  );
}

export function DashboardErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card className="border-destructive/30 bg-destructive/5 shadow-none">
      <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" />
        </span>
        <div className="space-y-1">
          <p className="font-medium text-destructive">
            Không thể tải tổng quan vận hành
          </p>
          <p className="max-w-lg text-sm text-muted-foreground">{message}</p>
        </div>
        <Button variant="destructive" onClick={onRetry}>
          Thử lại
        </Button>
      </CardContent>
    </Card>
  );
}

export function DashboardEmptyState() {
  return (
    <Card className="border-border/80 shadow-none">
      <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted/20 text-muted-foreground">
          <LayoutDashboard className="size-5" />
        </span>
        <p className="font-medium text-foreground">Chưa có dữ liệu tổng quan</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Backend chưa trả về kiosk, tồn kho hoặc đơn hàng trong phạm vi truy cập hiện tại.
        </p>
      </CardContent>
    </Card>
  );
}
