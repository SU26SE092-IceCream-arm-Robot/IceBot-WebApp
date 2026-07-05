"use client";

import { useState } from "react";
import { AlertTriangle, Info, AlertCircle, AlertOctagon, CheckCircle2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { hasPermission } from "@/lib/rbac";
import type { AlertResult, AlertSeverity, AlertStatus } from "@/types/alerts";

function formatDateTime(isoString: string) {
  return new Date(isoString).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; icon: React.ElementType; className: string }> = {
  Debug: { label: "Gỡ lỗi", icon: Info, className: "text-muted-foreground" },
  Info: { label: "Thông tin", icon: Info, className: "text-blue-500" },
  Warning: { label: "Cảnh báo", icon: AlertTriangle, className: "text-yellow-500" },
  Error: { label: "Lỗi", icon: AlertCircle, className: "text-red-500" },
  Critical: { label: "Nghiêm trọng", icon: AlertOctagon, className: "text-destructive" },
};

const STATUS_CONFIG: Record<AlertStatus, { label: string; className: string }> = {
  Open: { label: "Mới", className: "bg-destructive/10 text-destructive border-destructive/20" },
  Acknowledged: { label: "Đã tiếp nhận", className: "bg-warning/10 text-warning border-warning/20" },
  Resolved: { label: "Đã xử lý", className: "bg-success/10 text-success border-success/20" },
  Suppressed: { label: "Đã ẩn", className: "bg-muted text-muted-foreground border-border" },
};

function DetailTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 break-words text-sm font-medium text-foreground">
        {value || <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  );
}

interface AlertDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alert: AlertResult | null;
  onAcknowledge: (alertId: string) => Promise<boolean>;
  onResolve: (alertId: string, notes: string) => Promise<boolean>;
  isSubmitting: boolean;
}

export function AlertDetailDrawer({
  open,
  onOpenChange,
  alert,
  onAcknowledge,
  onResolve,
  isSubmitting,
}: AlertDetailDrawerProps) {
  const { currentUser } = useAuth();
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [showResolveInput, setShowResolveInput] = useState(false);

  if (!alert) return null;

  const canManage = currentUser && hasPermission(currentUser.role, "alerts.manage");
  const SeverityIcon = SEVERITY_CONFIG[alert.severity].icon;
  const statusConfig = STATUS_CONFIG[alert.status];

  const handleClose = () => {
    setShowResolveInput(false);
    setResolutionNotes("");
    onOpenChange(false);
  };

  const handleAcknowledge = async () => {
    await onAcknowledge(alert.id);
    // Note: keep drawer open to see state change
  };

  const handleResolve = async () => {
    if (!showResolveInput) {
      setShowResolveInput(true);
      return;
    }
    if (!resolutionNotes.trim()) {
      return;
    }
    const success = await onResolve(alert.id, resolutionNotes.trim());
    if (success) {
      setShowResolveInput(false);
      setResolutionNotes("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${SEVERITY_CONFIG[alert.severity].className} bg-muted`}>
                <SeverityIcon className="size-6" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {alert.title}
                </DialogTitle>
                <DialogDescription className="mt-1 flex items-center gap-2 font-mono text-xs">
                  {alert.alertCode}
                  <span className={`rounded-full border px-2 py-0.5 font-sans font-medium ${statusConfig.className}`}>
                    {statusConfig.label}
                  </span>
                  {alert.occurrenceCount > 1 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 font-sans font-semibold text-primary">
                      {alert.occurrenceCount} lần
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4 sm:grid-cols-3">
          <DetailTile label="Mức độ" value={SEVERITY_CONFIG[alert.severity].label} />
          <DetailTile label="Trạng thái" value={statusConfig.label} />
          <DetailTile label="Mã cảnh báo" value={<span className="font-mono">{alert.alertCode}</span>} />
          <DetailTile label="Lần đầu xuất hiện" value={formatDateTime(alert.raisedAt)} />
          <DetailTile label="Lần cuối xuất hiện" value={formatDateTime(alert.lastOccurredAt)} />
          <DetailTile label="Ngày cập nhật" value={alert.updatedAt ? formatDateTime(alert.updatedAt) : formatDateTime(alert.createdAt)} />
        </div>

        <div className="space-y-4">
          <DetailTile 
            label="Nội dung chi tiết" 
            value={<div className="whitespace-pre-wrap">{alert.message}</div>} 
          />
          
          <div className="grid grid-cols-2 gap-4">
            <DetailTile label="Organization ID" value={alert.organizationId && <span className="font-mono text-xs">{alert.organizationId}</span>} />
            <DetailTile label="Store ID" value={alert.storeId && <span className="font-mono text-xs">{alert.storeId}</span>} />
            <DetailTile label="Kiosk ID" value={alert.kioskId && <span className="font-mono text-xs">{alert.kioskId}</span>} />
            <DetailTile label="Device ID" value={alert.deviceId && <span className="font-mono text-xs">{alert.deviceId}</span>} />
          </div>

          {(alert.sourceType || alert.sourceId) && (
            <div className="grid grid-cols-2 gap-4">
              <DetailTile label="Nguồn (Loại)" value={alert.sourceType} />
              <DetailTile label="Nguồn (ID)" value={alert.sourceId && <span className="font-mono text-xs">{alert.sourceId}</span>} />
            </div>
          )}

          {alert.status !== "Open" && (
            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <DetailTile 
                label="Người tiếp nhận" 
                value={alert.acknowledgedByAccountId && <span className="font-mono text-xs">{alert.acknowledgedByAccountId}</span>} 
              />
              <DetailTile 
                label="Thời gian tiếp nhận" 
                value={alert.acknowledgedAt && formatDateTime(alert.acknowledgedAt)} 
              />
            </div>
          )}

          {alert.status === "Resolved" && (
            <div className="grid grid-cols-1 gap-4 border-t pt-4">
              <DetailTile 
                label="Thời gian xử lý" 
                value={alert.resolvedAt && formatDateTime(alert.resolvedAt)} 
              />
              <DetailTile 
                label="Ghi chú xử lý" 
                value={<div className="whitespace-pre-wrap">{alert.resolutionNotes}</div>} 
              />
            </div>
          )}
        </div>

        {canManage && (alert.status === "Open" || alert.status === "Acknowledged") && (
          <div className="mt-6 flex flex-col gap-3 border-t pt-4">
            {showResolveInput ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">Ghi chú xử lý (bắt buộc)</p>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  maxLength={500}
                  placeholder="Mô tả cách xử lý cảnh báo này..."
                  disabled={isSubmitting}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowResolveInput(false)} disabled={isSubmitting}>
                    Hủy
                  </Button>
                  <Button size="sm" onClick={handleResolve} disabled={!resolutionNotes.trim() || isSubmitting}>
                    Xác nhận xử lý
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end gap-2">
                {alert.status === "Open" && (
                  <Button variant="outline" onClick={handleAcknowledge} disabled={isSubmitting}>
                    <ShieldAlert className="mr-2 size-4" />
                    Tiếp nhận
                  </Button>
                )}
                <Button onClick={() => setShowResolveInput(true)} disabled={isSubmitting}>
                  <CheckCircle2 className="mr-2 size-4" />
                  Đánh dấu xử lý
                </Button>
              </div>
            )}
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
