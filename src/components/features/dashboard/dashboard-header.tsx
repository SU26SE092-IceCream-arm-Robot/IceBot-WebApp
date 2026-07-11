"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

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
}

export function DashboardHeader({
  lastUpdatedAt,
  isRefreshing,
  onRefresh,
}: DashboardHeaderProps) {
  return (
    <section className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Tổng quan vận hành
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Theo dõi nhanh trạng thái kiosk, đơn hàng, hoàn tiền và tồn kho trong
          phạm vi quản lý.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <p className="text-xs text-muted-foreground">
          Cập nhật lần cuối:{" "}
          <span className="font-medium text-foreground">
            {formatLastUpdated(lastUpdatedAt)}
          </span>
        </p>
        <Button
          variant="outline"
          onClick={onRefresh}
          isLoading={isRefreshing}
          title="Làm mới dữ liệu tổng quan"
        >
          <RefreshCw className="size-4" />
          Làm mới
        </Button>
      </div>
    </section>
  );
}
