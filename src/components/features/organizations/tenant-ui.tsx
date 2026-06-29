import { AlertTriangle, Building2, LoaderCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TenantEntityStatus } from "@/types/tenant-management";

const STATUS_LABELS: Record<TenantEntityStatus, string> = {
  Active: "Đang hoạt động",
  Inactive: "Không hoạt động",
  Suspended: "Tạm ngưng",
  Disabled: "Đã vô hiệu hóa",
  Archived: "Đã lưu trữ",
};

const STATUS_CLASSES: Record<TenantEntityStatus, string> = {
  Active: "border-success/20 bg-success/10 text-success",
  Inactive: "border-border bg-muted/30 text-muted-foreground",
  Suspended: "border-warning/20 bg-warning/10 text-warning",
  Disabled: "border-destructive/20 bg-destructive/10 text-destructive",
  Archived: "border-border bg-muted/30 text-muted-foreground",
};

export function TenantStatusBadge({ status }: { status: string }) {
  const normalized = status as TenantEntityStatus;
  return (
    <Badge
      variant="outline"
      className={`h-6 rounded-full px-2.5 ${STATUS_CLASSES[normalized] ?? STATUS_CLASSES.Inactive}`}
    >
      {STATUS_LABELS[normalized] ?? status}
    </Badge>
  );
}

export function formatTenantDate(value?: string | null): string {
  if (!value) return "Chưa có";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date);
}

export function TenantLoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-muted-foreground">
      <LoaderCircle className="size-4 animate-spin" />
      {label}
    </div>
  );
}

export function TenantErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="font-medium text-destructive">Không thể tải dữ liệu</p>
        <p className="max-w-xl text-sm text-muted-foreground">{message}</p>
      </div>
      <Button variant="outline" onClick={onRetry}>Thử lại</Button>
    </div>
  );
}

export function TenantEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted/20 text-muted-foreground">
        <Building2 className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
