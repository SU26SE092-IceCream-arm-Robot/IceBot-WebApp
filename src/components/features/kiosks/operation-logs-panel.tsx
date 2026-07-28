"use client";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ClipboardClock,
  RefreshCw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOperationLogs } from "@/hooks/use-operation-logs";
import type { OperationLogSeverity } from "@/types/operation-logs";

const SEVERITY_LABELS: Record<OperationLogSeverity, string> = {
  Debug: "Gỡ lỗi",
  Info: "Thông tin",
  Warning: "Cảnh báo",
  Error: "Lỗi",
  Critical: "Nghiêm trọng",
};

function formatOccurredAt(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function OperationLogsPanel({ kioskId }: { kioskId: string }) {
  const operationLogs = useOperationLogs(kioskId);

  return (
    <Card className="shadow-none">
      <CardHeader className="border-b border-border">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardClock className="size-4" />
              Nhật ký vận hành
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Bằng chứng vận hành do backend ghi nhận; không hiển thị payload chẩn đoán thô.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            isLoading={operationLogs.isLoading}
            onClick={() => void operationLogs.refresh()}
          >
            <RefreshCw className="size-4" />
            Làm mới
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {operationLogs.errorMessage ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <AlertTriangle className="size-6 text-destructive" />
            <p className="text-sm text-destructive">
              {operationLogs.errorMessage}
            </p>
            <Button variant="outline" onClick={() => void operationLogs.refresh()}>
              Thử lại
            </Button>
          </div>
        ) : operationLogs.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-lg bg-muted/40"
              />
            ))}
          </div>
        ) : operationLogs.logs.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Kiosk chưa có nhật ký vận hành trong phạm vi hiện tại.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {operationLogs.logs.map((log) => (
              <div
                key={log.id}
                className="grid gap-2 px-4 py-3 sm:grid-cols-[150px_120px_minmax(0,1fr)] sm:items-start"
              >
                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatOccurredAt(log.occurredAt)}
                </span>
                <Badge variant="outline" className="w-fit">
                  {SEVERITY_LABELS[log.severity] ?? log.severity}
                </Badge>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {log.action}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {log.category}
                    {log.message ? ` · ${log.message}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <span className="text-xs text-muted-foreground">
            {operationLogs.pagination.totalCount} bản ghi
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!operationLogs.pagination.hasPrevious}
              onClick={operationLogs.previousPage}
            >
              <ChevronLeft className="size-4" />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!operationLogs.pagination.hasNext}
              onClick={operationLogs.nextPage}
            >
              Sau
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
