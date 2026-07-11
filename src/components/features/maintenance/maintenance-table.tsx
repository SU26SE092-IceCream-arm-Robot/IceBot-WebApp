"use client";

import { AlertTriangle, Eye, Gauge, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  MaintenancePriority,
  MaintenanceTicketResult,
  MaintenanceTicketStatus,
} from "@/types/maintenance";

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceTicketStatus, string> = {
  Open: "Đang mở",
  Assigned: "Đã phân công",
  InProgress: "Đang xử lý",
  Resolved: "Đã xử lý",
  Closed: "Đã đóng",
  Cancelled: "Đã hủy",
};

export const MAINTENANCE_PRIORITY_LABELS: Record<MaintenancePriority, string> = {
  Low: "Thấp",
  Medium: "Trung bình",
  High: "Cao",
  Critical: "Khẩn cấp",
};

const STATUS_CLASS_NAMES: Record<MaintenanceTicketStatus, string> = {
  Open: "border-primary/20 bg-primary/10 text-primary",
  Assigned: "border-warning/20 bg-warning/10 text-warning",
  InProgress: "border-warning/20 bg-warning/10 text-warning",
  Resolved: "border-success/20 bg-success/10 text-success",
  Closed: "border-border bg-muted/20 text-muted-foreground",
  Cancelled: "border-border bg-muted/20 text-muted-foreground",
};

const PRIORITY_CLASS_NAMES: Record<MaintenancePriority, string> = {
  Low: "border-border bg-muted/20 text-muted-foreground",
  Medium: "border-primary/20 bg-primary/10 text-primary",
  High: "border-warning/20 bg-warning/10 text-warning",
  Critical: "border-destructive/20 bg-destructive/10 text-destructive",
};

export function formatMaintenanceDate(value: string | null | undefined): string {
  if (!value) {
    return "Chưa có";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function MaintenanceStatusBadge({
  status,
}: {
  status: MaintenanceTicketStatus;
}) {
  return (
    <Badge
      variant="outline"
      className={`h-6 rounded-full px-2.5 ${STATUS_CLASS_NAMES[status]}`}
    >
      {MAINTENANCE_STATUS_LABELS[status]}
    </Badge>
  );
}

export function MaintenancePriorityBadge({
  priority,
}: {
  priority: MaintenancePriority;
}) {
  const Icon = priority === "Critical" ? AlertTriangle : Gauge;

  return (
    <Badge
      variant="outline"
      className={`h-6 gap-1 rounded-full px-2.5 ${PRIORITY_CLASS_NAMES[priority]}`}
    >
      <Icon className="size-3" />
      {MAINTENANCE_PRIORITY_LABELS[priority]}
    </Badge>
  );
}

interface MaintenanceTableProps {
  tickets: MaintenanceTicketResult[];
  onViewDetail: (ticketId: string) => void;
}

export function MaintenanceTable({
  tickets,
  onViewDetail,
}: MaintenanceTableProps) {
  return (
    <Table className="min-w-[1080px] table-fixed">
      <TableHeader className="bg-muted/40">
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[26%] px-4">Ticket</TableHead>
          <TableHead className="w-[13%] text-center">Trạng thái</TableHead>
          <TableHead className="w-[12%] text-center">Mức độ</TableHead>
          <TableHead className="w-[14%] text-center">Kiosk</TableHead>
          <TableHead className="w-[15%] text-center">Phụ trách</TableHead>
          <TableHead className="w-[13%] text-center">Báo lúc</TableHead>
          <TableHead className="w-[7%] px-4 text-center">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => (
          <TableRow key={ticket.id} className="hover:bg-muted/30">
            <TableCell className="h-16 px-4 py-2.5">
              <div className="min-w-0 space-y-0.5">
                <p className="truncate font-medium text-foreground">
                  {ticket.title}
                </p>
                <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                  <span className="shrink-0 font-mono tabular-nums">
                    {ticket.ticketNumber}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{ticket.issueCode}</span>
                </div>
              </div>
            </TableCell>
            <TableCell className="py-2.5 text-center">
              <div className="flex justify-center">
                <MaintenanceStatusBadge status={ticket.status} />
              </div>
            </TableCell>
            <TableCell className="py-2.5 text-center">
              <div className="flex justify-center">
                <MaintenancePriorityBadge priority={ticket.priority} />
              </div>
            </TableCell>
            <TableCell className="py-2.5 text-center">
              <Badge variant="outline" className="bg-muted/20 text-muted-foreground">
                {ticket.kioskId ? "Đã liên kết" : "Chưa có"}
              </Badge>
            </TableCell>
            <TableCell className="py-2.5 text-center">
              {ticket.assignedToAccountId ? (
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  Đã phân công
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-muted/20 text-muted-foreground">
                  Chưa phân công
                </Badge>
              )}
            </TableCell>
            <TableCell className="py-2.5 text-center text-xs tabular-nums text-muted-foreground">
              {formatMaintenanceDate(ticket.reportedAt)}
            </TableCell>
            <TableCell className="px-4 py-2.5 text-center">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                title={`Xem chi tiết ${ticket.ticketNumber}`}
                aria-label={`Xem chi tiết ${ticket.ticketNumber}`}
                onClick={() => onViewDetail(ticket.id)}
              >
                <Eye className="size-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function MaintenanceEmptyIcon() {
  return (
    <span className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted/20 text-muted-foreground">
      <Wrench className="size-5" />
    </span>
  );
}
