import { Activity } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ReportActivityItem } from "@/types/reports";

const TYPE_LABELS: Record<ReportActivityItem["type"], string> = {
  order: "Đơn hàng",
  refund: "Hoàn tiền",
  maintenance: "Bảo trì",
  inventory: "Tồn kho",
};

const STATUS_LABELS: Record<string, string> = {
  Draft: "Nháp",
  PendingPayment: "Chờ thanh toán",
  Paid: "Đã thanh toán",
  ReadyForExecution: "Sẵn sàng xử lý",
  Accepted: "Đã nhận",
  Preparing: "Đang chuẩn bị",
  Ready: "Sẵn sàng",
  Completed: "Hoàn tất",
  Cancelled: "Đã hủy",
  Failed: "Thất bại",
  ExecutionRejected: "Từ chối xử lý",
  RefundRequired: "Cần hoàn tiền",
  Refunded: "Đã hoàn tiền",
  Compensated: "Đã bồi hoàn",
  Requested: "Đã yêu cầu",
  Processing: "Đang xử lý",
  Processed: "Đã xử lý",
  Rejected: "Đã từ chối",
  Open: "Đang mở",
  Assigned: "Đã phân công",
  InProgress: "Đang thực hiện",
  Resolved: "Đã giải quyết",
  Closed: "Đã đóng",
};

const STATUS_CLASS_NAMES: Record<ReportActivityItem["tone"], string> = {
  primary: "border-primary/20 bg-primary/10 text-primary",
  success: "border-success/20 bg-success/10 text-success",
  warning: "border-warning/20 bg-warning/10 text-warning",
  destructive: "border-destructive/20 bg-destructive/10 text-destructive",
  muted: "border-border bg-muted/20 text-muted-foreground",
};

function formatDate(value: string) {
  const parts = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(value));
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "--";

  return `${getPart("hour")}:${getPart("minute")} · ${getPart("day")}/${getPart("month")}/${getPart("year")}`;
}

export function RecentActivityTable({ items }: { items: ReportActivityItem[] }) {
  return (
    <Card className="rounded-xl border border-border bg-card shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <Activity className="size-5" />
          </span>
          <div>
            <CardTitle>Hoạt động gần đây</CardTitle>
          </div>
        </div>
      </CardHeader>
      {items.length === 0 ? (
        <CardContent className="p-10 text-center text-sm text-muted-foreground">Chưa có hoạt động trong khoảng thời gian này.</CardContent>
      ) : (
        <Table className="min-w-[860px]">
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Thời gian</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Đối tượng</TableHead>
              <TableHead>Nội dung</TableHead>
              <TableHead className="pr-5">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="py-3 pl-5 text-muted-foreground">{formatDate(item.occurredAt)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="h-6 rounded-full border-border bg-muted/20 px-2.5 text-muted-foreground">
                    {TYPE_LABELS[item.type]}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-foreground">{item.entity}</TableCell>
                <TableCell className="max-w-md whitespace-normal text-muted-foreground">{item.summary}</TableCell>
                <TableCell className="pr-5">
                  <Badge
                    variant="outline"
                    className={`h-6 rounded-full px-2.5 ${STATUS_CLASS_NAMES[item.tone]}`}
                  >
                    {STATUS_LABELS[item.status] ?? item.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
