import { Activity } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ReportActivityItem } from "@/types/reports";

const TYPE_LABELS: Record<ReportActivityItem["type"], string> = {
  order: "Đơn hàng",
  refund: "Hoàn tiền",
  maintenance: "Bảo trì",
  inventory: "Tồn kho",
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
    <Card className="gap-0 rounded-lg border border-border/80 bg-card py-0 shadow-none">
      <CardHeader className="border-b border-border/70 bg-muted/5 px-5 py-4">
        <div className="flex items-start gap-2.5">
          <Activity className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="space-y-0.5">
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>15 sự kiện mới nhất trong phạm vi thời gian đã chọn.</CardDescription>
          </div>
        </div>
      </CardHeader>
      {items.length === 0 ? (
        <CardContent className="p-10 text-center text-sm text-muted-foreground">Chưa có hoạt động trong khoảng thời gian này.</CardContent>
      ) : (
        <Table className="min-w-[860px]">
          <TableHeader className="bg-muted/15">
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
                <TableCell><Badge variant="outline">{TYPE_LABELS[item.type]}</Badge></TableCell>
                <TableCell className="font-medium text-foreground">{item.entity}</TableCell>
                <TableCell className="max-w-md whitespace-normal text-muted-foreground">{item.summary}</TableCell>
                <TableCell className="pr-5"><Badge variant={item.tone === "destructive" ? "destructive" : "outline"}>{item.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
