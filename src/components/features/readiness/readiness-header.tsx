"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ReadinessHeaderProps {
  lastUpdatedAt: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function ReadinessHeader({
  lastUpdatedAt,
  isRefreshing,
  onRefresh,
}: ReadinessHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-primary">Kiểm tra thiết lập</p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Mức độ hoàn tất thiết lập
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Kiểm tra các cấu hình cần thiết trước khi đưa cửa hàng và kiosk vào sử
          dụng.
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
