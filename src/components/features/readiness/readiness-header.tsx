"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ReadinessHeaderProps {
  lastUpdatedAt: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

export function ReadinessHeader({
  lastUpdatedAt,
  isRefreshing,
  onRefresh,
}: ReadinessHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-primary">Operational readiness</p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Sẵn sàng vận hành
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Kiểm tra nhanh các cấu hình tối thiểu trước khi đưa cửa hàng và kiosk vào
          luồng bán hàng.
        </p>
        <p className="text-xs text-muted-foreground">
          Cập nhật lần cuối:{" "}
          <span className="font-medium text-foreground">
            {lastUpdatedAt ? DATE_FORMATTER.format(lastUpdatedAt) : "Chưa có dữ liệu"}
          </span>
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onRefresh}
        isLoading={isRefreshing}
        aria-label="Làm mới kiểm tra sẵn sàng vận hành"
        title="Làm mới"
      >
        <RefreshCw className="size-4" />
        Làm mới
      </Button>
    </div>
  );
}
