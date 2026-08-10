"use client";

import { AlertTriangle, LoaderCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SyncDeadLetterResult } from "@/types/sync-dead-letters";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: SyncDeadLetterResult | null;
  loading: boolean;
  error: string | null;
}

function formatDateTime(value?: string | null): string {
  return value
    ? new Date(value).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Chưa có";
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    Open: "Đang mở",
    RetryInProgress: "Đang thử lại",
    Resolved: "Đã xử lý",
    Ignored: "Đã bỏ qua",
  };
  return labels[status] || status;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-border py-3 sm:grid-cols-[160px_1fr]">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function SyncDeadLetterDetailDialog({ open, onOpenChange, item, loading, error }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Chi tiết sự cố đồng bộ</DialogTitle>
          <DialogDescription>
            Bằng chứng xử lý do backend ghi nhận. Màn hình này không thực hiện chạy lại hoặc đóng sự cố.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center text-muted-foreground">
            <LoaderCircle className="mr-2 size-5 animate-spin" /> Đang tải chi tiết...
          </div>
        ) : error ? (
          <div className="flex min-h-48 flex-col items-center justify-center text-center text-destructive">
            <AlertTriangle className="mb-3 size-8" />
            <p>{error}</p>
          </div>
        ) : item ? (
          <ScrollArea className="max-h-[65vh] pr-4">
            <dl>
              <DetailRow label="Loại sự kiện" value={item.eventType} />
              <DetailRow label="Trạng thái" value={statusLabel(item.status)} />
              <DetailRow label="Kiosk" value={item.kioskCode || "Không gắn kiosk"} />
              <DetailRow label="Đối tượng liên quan" value={item.aggregateType || "Không có"} />
              <DetailRow label="Số lần xử lý" value={String(item.processingAttempts)} />
              <DetailRow label="Thời điểm lỗi" value={formatDateTime(item.failedAt)} />
              <DetailRow label="Thời điểm xử lý xong" value={formatDateTime(item.resolvedAt)} />
              <DetailRow label="Thông báo lỗi" value={item.errorMessage} />
              <DetailRow label="Ghi chú xử lý" value={item.resolutionNotes || "Chưa có"} />
            </dl>

            <section className="mt-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Lịch sử thử lại ({item.retryAttempts.length})
              </h3>
              {item.retryAttempts.length === 0 ? (
                <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Chưa có lần thử lại nào được ghi nhận.
                </p>
              ) : (
                item.retryAttempts.map((attempt) => (
                  <div key={attempt.attemptNumber} className="space-y-2 rounded-md border border-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">Lần {attempt.attemptNumber}</span>
                      <Badge variant="outline">
                        {attempt.succeeded === true
                          ? "Thành công"
                          : attempt.succeeded === false
                            ? "Không thành công"
                            : "Đang chờ kết quả"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{attempt.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(attempt.requestedAt)}
                      {attempt.resultMessage ? ` · ${attempt.resultMessage}` : ""}
                    </p>
                  </div>
                ))
              )}
            </section>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
