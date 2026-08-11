import { AlertTriangle, BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ReportsLoadingState() {
  return (
    <div className="space-y-4" aria-label="Đang tải báo cáo">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-44 animate-pulse rounded-xl border border-border bg-muted/25" />
        ))}
      </div>
      <div className="h-36 animate-pulse rounded-xl border border-border bg-muted/25" />
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-96 animate-pulse rounded-xl border border-border bg-muted/25" />
        <div className="h-96 animate-pulse rounded-xl border border-border bg-muted/25" />
      </div>
    </div>
  );
}

export function ReportsDataQualityBanner({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;
  return (
    <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
      <div>
        <p className="font-medium text-foreground">Một số số liệu có độ bao phủ hạn chế</p>
        <p className="mt-1 leading-6 text-muted-foreground">{messages.join(" ")}</p>
      </div>
    </div>
  );
}

export function ReportsUnavailableState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="rounded-xl border border-border bg-card shadow-none">
      <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted/20 text-muted-foreground">
          <BarChart3 className="size-5" />
        </span>
        <div className="space-y-1">
          <p className="font-medium text-foreground">Chưa thể tổng hợp báo cáo</p>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">Các nguồn dữ liệu hiện không khả dụng. Kiểm tra kết nối hoặc quyền truy cập rồi thử lại.</p>
        </div>
        <Button variant="outline" onClick={onRetry}>Thử lại</Button>
      </CardContent>
    </Card>
  );
}

export function ReportsSectionUnavailable({ message }: { message: string }) {
  return (
    <Card className="rounded-xl border border-border bg-card shadow-none">
      <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
        <span className="flex size-11 items-center justify-center rounded-xl bg-warning/10 text-warning">
          <AlertTriangle className="size-5" />
        </span>
        <p className="font-medium text-foreground">Nguồn dữ liệu không khả dụng</p>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
