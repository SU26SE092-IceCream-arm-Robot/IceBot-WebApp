"use client";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  Eye,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

import { SyncDeadLetterDetailDialog } from "@/components/features/platform/sync-dead-letter-detail-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricStrip, MetricStripItem } from "@/components/shared/metric-strip";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSyncDeadLetters } from "@/hooks/platform/use-sync-dead-letters";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

export function SyncDeadLettersView() {
  const state = useSyncDeadLetters();
  const openOnPage = state.items.filter(
    (item) => item.status === "Open",
  ).length;
  const retryingOnPage = state.items.filter(
    (item) => item.status === "RetryInProgress",
  ).length;
  const resolvedOnPage = state.items.filter(
    (item) => item.status === "Resolved" || item.status === "Ignored",
  ).length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader
        title="Sự cố đồng bộ"
        description="Theo dõi bằng chứng lỗi của các sự kiện không thể đồng bộ trên toàn nền tảng."
        actions={
          <Button
            variant="outline"
            onClick={state.refresh}
            isLoading={state.isLoading}
          >
            <RefreshCw className="size-4" />
            Làm mới
          </Button>
        }
      />

      <MetricStrip>
        <MetricStripItem
          icon={ShieldAlert}
          label="Tổng sự cố"
          value={state.pagination.totalCount}
          description="Trong hàng đợi hiện tại"
          tone="primary"
        />
        <MetricStripItem
          icon={AlertTriangle}
          label="Đang mở trên trang"
          value={openOnPage}
          description="Chưa có kết luận xử lý"
          tone={openOnPage > 0 ? "destructive" : "neutral"}
        />
        <MetricStripItem
          icon={Clock3}
          label="Đang thử lại trên trang"
          value={retryingOnPage}
          description="RetryInProgress"
          tone={retryingOnPage > 0 ? "warning" : "neutral"}
        />
        <MetricStripItem
          icon={CircleCheck}
          label="Đã kết luận trên trang"
          value={resolvedOnPage}
          description="Resolved hoặc Ignored"
          tone="success"
        />
      </MetricStrip>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldAlert className="size-5 text-warning" /> Hàng đợi cần kiểm
            tra
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {state.error ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <AlertTriangle className="mb-3 size-9 text-destructive" />
              <p className="font-medium text-destructive">{state.error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={state.refresh}
              >
                Thử lại
              </Button>
            </div>
          ) : (
            <>
              <div className="md:hidden">
                {state.isLoading && state.items.length === 0 ? (
                  <div className="space-y-3 p-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-40 animate-pulse rounded-lg border border-border bg-muted/30"
                      />
                    ))}
                  </div>
                ) : state.items.length === 0 ? (
                  <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                    Không có sự cố đồng bộ nào.
                  </p>
                ) : (
                  <div className="grid gap-3 p-4">
                    {state.items.map((item) => (
                      <article
                        key={item.id}
                        className="space-y-3 rounded-lg border border-border p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-words font-medium text-foreground">
                              {item.eventType}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.kioskCode || "Không gắn kiosk"}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {statusLabel(item.status)}
                          </Badge>
                        </div>
                        <p className="line-clamp-3 text-sm text-muted-foreground">
                          {item.errorMessage}
                        </p>
                        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {formatDateTime(item.failedAt)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => state.openDetail(item.id)}
                          >
                            <Eye className="size-4" />
                            Chi tiết
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <Table className="min-w-[820px] table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[24%]">Loại sự kiện</TableHead>
                      <TableHead className="w-[16%] text-center">
                        Trạng thái
                      </TableHead>
                      <TableHead className="w-[16%]">Kiosk</TableHead>
                      <TableHead className="w-[28%]">Lỗi gần nhất</TableHead>
                      <TableHead className="w-[12%] text-center">
                        Thời gian
                      </TableHead>
                      <TableHead className="w-[4%] text-center">
                        <span className="sr-only">Chi tiết</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.items.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-40 text-center text-muted-foreground"
                        >
                          {state.isLoading
                            ? "Đang tải dữ liệu..."
                            : "Không có sự cố đồng bộ nào."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      state.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell
                            className="truncate font-medium"
                            title={item.eventType}
                          >
                            {item.eventType}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {statusLabel(item.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.kioskCode || "Không gắn kiosk"}
                          </TableCell>
                          <TableCell>
                            <p className="line-clamp-2 text-sm text-muted-foreground">
                              {item.errorMessage}
                            </p>
                          </TableCell>
                          <TableCell className="text-center text-xs text-muted-foreground">
                            {formatDateTime(item.failedAt)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => state.openDetail(item.id)}
                              title="Xem chi tiết"
                              aria-label={`Xem chi tiết sự cố ${item.eventType}`}
                            >
                              <Eye className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {!state.error && (
            <footer className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span className="text-sm text-muted-foreground">
                {state.pagination.totalCount} sự cố
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={state.previousPage}
                  disabled={!state.pagination.hasPrevious || state.isLoading}
                >
                  <ChevronLeft className="mr-1 size-4" /> Trước
                </Button>
                <span className="text-sm font-medium">
                  {state.pagination.page} /{" "}
                  {Math.max(1, state.pagination.totalPages)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={state.nextPage}
                  disabled={!state.pagination.hasNext || state.isLoading}
                >
                  Sau <ChevronRight className="ml-1 size-4" />
                </Button>
              </div>
            </footer>
          )}
        </CardContent>
      </Card>

      <SyncDeadLetterDetailDialog
        open={state.detailOpen}
        onOpenChange={state.setDetailOpen}
        item={state.selected}
        loading={state.detailLoading}
        error={state.detailError}
        onRetry={state.retryDetail}
      />
    </div>
  );
}
