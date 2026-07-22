import { AlertTriangle, ExternalLink, MonitorCog } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ReportKioskAttentionRow } from "@/types/reports";

function formatDate(value?: string | null) {
  if (!value) return "Chưa ghi nhận";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const LIFECYCLE_LABELS: Record<
  ReportKioskAttentionRow["lifecycleStatus"],
  string
> = {
  Provisioning: "Đang thiết lập",
  Active: "Đang hoạt động",
  Disabled: "Đã vô hiệu hóa",
  Retired: "Ngừng sử dụng",
};

const LIFECYCLE_CLASS_NAMES: Record<
  ReportKioskAttentionRow["lifecycleStatus"],
  string
> = {
  Provisioning: "border-primary/20 bg-primary/10 text-primary",
  Active: "border-success/20 bg-success/10 text-success",
  Disabled: "border-destructive/20 bg-destructive/10 text-destructive",
  Retired: "border-border bg-muted/20 text-muted-foreground",
};

const OPERATIONAL_LABELS: Record<
  ReportKioskAttentionRow["operationalState"],
  string
> = {
  Operational: "Đang vận hành",
  PausedByOperator: "Tạm dừng bởi nhân viên",
  Maintenance: "Đang bảo trì",
  Cleaning: "Đang vệ sinh",
  Restocking: "Đang bổ sung hàng",
  EmergencyStopRequested: "Đã yêu cầu dừng khẩn cấp",
  OutOfService: "Ngừng phục vụ",
};

export function KioskAttentionTable({ rows }: { rows: ReportKioskAttentionRow[] }) {
  return (
    <Card className="rounded-xl border border-border bg-card shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-warning/20 bg-warning/10 text-warning">
            <MonitorCog className="size-5" />
          </span>
          <div>
            <CardTitle>Kiosk cần chú ý</CardTitle>
          </div>
        </div>
      </CardHeader>
      {rows.length === 0 ? (
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted/20 text-muted-foreground">
            <MonitorCog className="size-5" />
          </span>
          <p className="font-medium text-foreground">Chưa có kiosk cần chú ý</p>
          <p className="max-w-md text-sm text-muted-foreground">Không có tín hiệu cảnh báo trong phạm vi đang chọn.</p>
        </CardContent>
      ) : (
        <Table className="min-w-[1080px]">
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Kiosk</TableHead>
              <TableHead>Cửa hàng</TableHead>
              <TableHead className="text-center">Vòng đời</TableHead>
              <TableHead className="text-center">Tồn kho</TableHead>
              <TableHead className="text-center">Bảo trì</TableHead>
              <TableHead className="text-center">Đơn hàng</TableHead>
              <TableHead>Cần xử lý</TableHead>
              <TableHead className="pr-5 text-center">Chi tiết</TableHead>
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
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className={`h-6 rounded-full px-2.5 ${LIFECYCLE_CLASS_NAMES[row.lifecycleStatus]}`}
                  >
                    {LIFECYCLE_LABELS[row.lifecycleStatus]}
                  </Badge>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Vận hành: {OPERATIONAL_LABELS[row.operationalState]}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Trực tuyến: {formatDate(row.lastOnlineAt)}</p>
                </TableCell>
                <TableCell className="text-center tabular-nums">{row.inventoryIssueCount}</TableCell>
                <TableCell className="text-center tabular-nums">
                  {row.maintenanceIssueCount}
                  {row.criticalMaintenanceCount > 0 ? (
                    <span className="ml-1 text-xs text-destructive">({row.criticalMaintenanceCount} khẩn cấp)</span>
                  ) : null}
                </TableCell>
                <TableCell className="text-center tabular-nums">{row.attentionOrderCount}</TableCell>
                <TableCell>
                  <div className="flex max-w-md items-start gap-2 whitespace-normal">
                    <AlertTriangle className={`mt-0.5 size-4 shrink-0 ${row.level === "critical" ? "text-destructive" : "text-warning"}`} />
                    <span className="text-sm text-foreground">{row.reasons.join(" · ")}</span>
                  </div>
                </TableCell>
                <TableCell className="pr-5 text-center">
                  <Link
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon-sm" }),
                      "rounded-lg text-muted-foreground hover:bg-muted/35 hover:text-foreground",
                    )}
                    href={`/kiosks/${row.kioskId}`}
                    title={`Mở chi tiết ${row.kioskName}`}
                    aria-label={`Mở chi tiết ${row.kioskName}`}
                  >
                    <ExternalLink className="size-4" />
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
