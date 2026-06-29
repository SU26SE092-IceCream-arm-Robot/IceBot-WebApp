import { AlertTriangle, ExternalLink, MonitorCog } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ReportKioskAttentionRow } from "@/types/reports";

function formatDate(value?: string | null) {
  if (!value) return "Chưa ghi nhận";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

const LIFECYCLE_LABELS: Record<
  ReportKioskAttentionRow["lifecycleStatus"],
  string
> = {
  Provisioning: "Đang thiết lập",
  Active: "Đang hoạt động",
  Offline: "Ngoại tuyến",
  Maintenance: "Bảo trì",
  Disabled: "Vô hiệu hóa",
  Retired: "Ngừng sử dụng",
};

export function KioskAttentionTable({ rows }: { rows: ReportKioskAttentionRow[] }) {
  return (
    <Card className="gap-0 rounded-lg border border-border/80 bg-card py-0 shadow-none">
      <CardHeader className="border-b border-border/70 bg-muted/5 px-5 py-4">
        <div className="flex items-start gap-2.5">
          <MonitorCog className="mt-0.5 size-4 shrink-0 text-warning" />
          <div className="space-y-0.5">
            <CardTitle>Kiosk cần chú ý</CardTitle>
            <CardDescription>Tổng hợp trạng thái vòng đời, tồn kho, bảo trì và đơn cần xử lý.</CardDescription>
          </div>
        </div>
      </CardHeader>
      {rows.length === 0 ? (
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted/20 text-muted-foreground">
            <MonitorCog className="size-5" />
          </span>
          <p className="font-medium text-foreground">Chưa có kiosk cần chú ý</p>
          <p className="max-w-md text-sm text-muted-foreground">Không có tín hiệu cảnh báo trong phạm vi đang chọn, dựa trên các nguồn đã tải được.</p>
        </CardContent>
      ) : (
        <Table className="min-w-[1080px]">
          <TableHeader className="bg-muted/15">
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Kiosk</TableHead>
              <TableHead>Cửa hàng</TableHead>
              <TableHead>Lifecycle</TableHead>
              <TableHead>Tồn kho</TableHead>
              <TableHead>Bảo trì</TableHead>
              <TableHead>Đơn hàng</TableHead>
              <TableHead>Attention</TableHead>
              <TableHead className="pr-5 text-right">Chi tiết</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.kioskId}>
                <TableCell className="pl-5">
                  <p className="font-medium text-foreground">{row.kioskName}</p>
                  <p className="text-xs text-muted-foreground">{row.kioskCode}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">{row.storeName}</TableCell>
                <TableCell>
                  <Badge variant={row.level === "critical" ? "destructive" : "outline"}>
                    {LIFECYCLE_LABELS[row.lifecycleStatus]}
                  </Badge>
                  <p className="mt-1 text-xs text-muted-foreground">Online: {formatDate(row.lastOnlineAt)}</p>
                </TableCell>
                <TableCell className="tabular-nums">{row.inventoryIssueCount}</TableCell>
                <TableCell className="tabular-nums">
                  {row.maintenanceIssueCount}
                  {row.criticalMaintenanceCount > 0 ? (
                    <span className="ml-1 text-xs text-destructive">({row.criticalMaintenanceCount} khẩn cấp)</span>
                  ) : null}
                </TableCell>
                <TableCell className="tabular-nums">{row.attentionOrderCount}</TableCell>
                <TableCell>
                  <div className="flex max-w-md items-start gap-2 whitespace-normal">
                    <AlertTriangle className={`mt-0.5 size-4 shrink-0 ${row.level === "critical" ? "text-destructive" : "text-warning"}`} />
                    <span className="text-sm text-foreground">{row.reasons.join(" · ")}</span>
                  </div>
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <Link className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline" href={`/kiosks/${row.kioskId}`}>
                    Mở <ExternalLink className="size-3.5" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
