"use client";

import { AlertTriangle, ClipboardList, Wrench } from "lucide-react";

import {
  MaintenancePriorityBadge,
  MaintenanceStatusBadge,
  formatMaintenanceDate,
} from "@/components/features/maintenance/maintenance-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MaintenanceTicketResult } from "@/types/maintenance";

interface MaintenanceDetailDialogProps {
  errorMessage: string | null;
  isLoading: boolean;
  open: boolean;
  ticket: MaintenanceTicketResult | null;
  onOpenChange: (open: boolean) => void;
}

function DetailTile({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 break-words text-sm font-medium text-foreground">
        {value}
      </div>
    </div>
  );
}

function IdValue({ value }: { value?: string | null }) {
  return value ? (
    <span className="font-mono text-xs tabular-nums">{value}</span>
  ) : (
    <span className="text-muted-foreground">Chưa có</span>
  );
}

export function MaintenanceDetailDialog({
  errorMessage,
  isLoading,
  open,
  ticket,
  onOpenChange,
}: MaintenanceDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader className="gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-warning/20 bg-warning/10 text-warning">
              <Wrench className="size-5" />
            </span>
            <div className="min-w-0 space-y-1">
              <DialogTitle>Chi tiết yêu cầu bảo trì</DialogTitle>
              <DialogDescription>
                Dữ liệu thật từ Management Maintenance Tickets API, hiển thị read-only.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`maintenance-detail-skeleton-${index}`} className="space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-5 w-full animate-pulse rounded bg-muted/60" />
              </div>
            ))}
          </div>
        ) : errorMessage ? (
          <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{errorMessage}</p>
          </div>
        ) : ticket ? (
          <div className="space-y-4 py-1">
            <div className="rounded-xl border border-border bg-muted/15 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-base font-semibold text-foreground">
                    {ticket.title}
                  </p>
                  <p className="font-mono text-xs tabular-nums text-muted-foreground">
                    {ticket.ticketNumber} · {ticket.id}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <MaintenanceStatusBadge status={ticket.status} />
                  <MaintenancePriorityBadge priority={ticket.priority} />
                </div>
              </div>
              {ticket.description ? (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {ticket.description}
                </p>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <DetailTile label="Mã lỗi" value={ticket.issueCode} />
              <DetailTile label="Kiosk" value={<IdValue value={ticket.kioskId} />} />
              <DetailTile label="Store" value={<IdValue value={ticket.storeId} />} />
              <DetailTile
                label="Organization"
                value={<IdValue value={ticket.organizationId} />}
              />
              <DetailTile label="Thiết bị" value={<IdValue value={ticket.deviceId} />} />
              <DetailTile label="Đơn hàng" value={<IdValue value={ticket.orderId} />} />
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <ClipboardList className="size-4" />
                </span>
                <p className="text-sm font-semibold text-foreground">
                  Mốc xử lý
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <DetailTile
                  label="Báo lúc"
                  value={formatMaintenanceDate(ticket.reportedAt)}
                />
                <DetailTile
                  label="Hạn xử lý"
                  value={formatMaintenanceDate(ticket.dueAt)}
                />
                <DetailTile
                  label="Phân công lúc"
                  value={formatMaintenanceDate(ticket.assignedAt)}
                />
                <DetailTile
                  label="Bắt đầu lúc"
                  value={formatMaintenanceDate(ticket.startedAt)}
                />
                <DetailTile
                  label="Xử lý lúc"
                  value={formatMaintenanceDate(ticket.resolvedAt)}
                />
                <DetailTile
                  label="Đóng lúc"
                  value={formatMaintenanceDate(ticket.closedAt)}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailTile
                label="Người phụ trách"
                value={<IdValue value={ticket.assignedToAccountId} />}
              />
              <DetailTile
                label="Người tạo"
                value={<IdValue value={ticket.createdByAccountId} />}
              />
              <DetailTile
                label="Cập nhật lần cuối"
                value={formatMaintenanceDate(ticket.updatedAt)}
              />
              <DetailTile
                label="Device event"
                value={<IdValue value={ticket.deviceEventId} />}
              />
            </div>

            {ticket.resolutionNotes || ticket.cancelReason ? (
              <div className="rounded-xl border border-border bg-card p-4">
                {ticket.resolutionNotes ? (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Ghi chú xử lý
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                      {ticket.resolutionNotes}
                    </p>
                  </div>
                ) : null}
                {ticket.cancelReason ? (
                  <div className={ticket.resolutionNotes ? "mt-4" : undefined}>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Lý do hủy
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                      {ticket.cancelReason}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <DialogFooter className="bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
