"use client";

import { AlertTriangle, ChevronLeft, ChevronRight, Eye, RefreshCw, ShieldAlert } from "lucide-react";

import { SyncDeadLetterDetailDialog } from "@/components/features/platform/sync-dead-letter-detail-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSyncDeadLetters } from "@/hooks/use-sync-dead-letters";

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

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sự cố đồng bộ</h1>
          <p className="mt-2 text-muted-foreground">
            Theo dõi các sự kiện đồng bộ không xử lý được trên toàn nền tảng.
          </p>
        </div>
        <Button variant="outline" onClick={state.refresh} disabled={state.isLoading}>
          <RefreshCw className={`mr-2 size-4 ${state.isLoading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </header>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldAlert className="size-5 text-warning" /> Hàng đợi cần kiểm tra
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {state.error ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <AlertTriangle className="mb-3 size-9 text-destructive" />
              <p className="font-medium text-destructive">{state.error}</p>
              <Button variant="outline" className="mt-4" onClick={state.refresh}>Thử lại</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[820px] table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[24%]">Loại sự kiện</TableHead>
                    <TableHead className="w-[16%] text-center">Trạng thái</TableHead>
                    <TableHead className="w-[16%]">Kiosk</TableHead>
                    <TableHead className="w-[28%]">Lỗi gần nhất</TableHead>
                    <TableHead className="w-[12%] text-center">Thời gian</TableHead>
                    <TableHead className="w-[4%] text-center"><span className="sr-only">Chi tiết</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                        {state.isLoading ? "Đang tải dữ liệu..." : "Không có sự cố đồng bộ nào."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    state.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="truncate font-medium" title={item.eventType}>{item.eventType}</TableCell>
                        <TableCell className="text-center"><Badge variant="outline">{statusLabel(item.status)}</Badge></TableCell>
                        <TableCell>{item.kioskCode || "Không gắn kiosk"}</TableCell>
                        <TableCell><p className="line-clamp-2 text-sm text-muted-foreground">{item.errorMessage}</p></TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground">{formatDateTime(item.failedAt)}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon-sm" onClick={() => state.openDetail(item.id)} title="Xem chi tiết" aria-label={`Xem chi tiết sự cố ${item.eventType}`}>
                            <Eye className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {!state.error && (
            <footer className="flex items-center justify-between border-t border-border px-6 py-4">
              <span className="text-sm text-muted-foreground">{state.pagination.totalCount} sự cố</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={state.previousPage} disabled={!state.pagination.hasPrevious || state.isLoading}>
                  <ChevronLeft className="mr-1 size-4" /> Trước
                </Button>
                <span className="text-sm font-medium">{state.pagination.page} / {Math.max(1, state.pagination.totalPages)}</span>
                <Button variant="outline" size="sm" onClick={state.nextPage} disabled={!state.pagination.hasNext || state.isLoading}>
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
      />
    </div>
  );
}
