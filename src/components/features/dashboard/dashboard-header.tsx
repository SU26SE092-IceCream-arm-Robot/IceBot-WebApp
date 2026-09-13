"use client";

import { Circle, RefreshCw } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DashboardRealtimeStatus =
  "connecting" | "connected" | "reconnecting" | "disconnected";

const REALTIME_PRESENTATION: Record<
  DashboardRealtimeStatus,
  { label: string; className: string }
> = {
  connecting: {
    label: "Realtime đang kết nối",
    className: "text-primary",
  },
  connected: {
    label: "Realtime đã kết nối",
    className: "text-success",
  },
  reconnecting: {
    label: "Realtime đang kết nối lại",
    className: "text-warning",
  },
  disconnected: {
    label: "Realtime đã ngắt kết nối",
    className: "text-destructive",
  },
};

function formatLastUpdated(value: Date | null) {
  if (!value) {
    return "Chưa cập nhật";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

interface DashboardHeaderProps {
  lastUpdatedAt: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  title?: string;
  description?: string;
  refreshTitle?: string;
  realtimeStatus?: DashboardRealtimeStatus;
}

export function DashboardHeader({
  lastUpdatedAt,
  isRefreshing,
  onRefresh,
  title = "Tổng quan vận hành",
  description = "Theo dõi nhanh trạng thái kiosk, đơn hàng, hoàn tiền và tồn kho trong phạm vi quản lý.",
  refreshTitle = "Làm mới dữ liệu tổng quan",
  realtimeStatus,
}: DashboardHeaderProps) {
  const realtimePresentation = realtimeStatus
    ? REALTIME_PRESENTATION[realtimeStatus]
    : null;

  return (
    <PageHeader
      title={title}
      description={description}
      actions={
        <>
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs">
            {realtimePresentation ? (
              <p
                className={cn(
                  "inline-flex items-center gap-1.5 font-medium",
                  realtimePresentation.className,
                )}
                role="status"
              >
                <Circle className="size-2 fill-current" aria-hidden="true" />
                {realtimePresentation.label}
              </p>
            ) : null}
            <p className="text-muted-foreground">
              Cập nhật lần cuối:{" "}
              <span className="font-medium text-foreground">
                {formatLastUpdated(lastUpdatedAt)}
              </span>
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            isLoading={isRefreshing}
            title={refreshTitle}
          >
            <RefreshCw className="size-4" />
            Làm mới
          </Button>
        </>
      }
    />
  );
}
