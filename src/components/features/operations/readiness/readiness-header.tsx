"use client";

import { RefreshCw } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
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
    <PageHeader
      title="Sẵn sàng vận hành"
      description="Xác nhận phạm vi, kiosk, danh mục và thanh toán trước khi mở bán tại cửa hàng."
      metadata={
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Cập nhật lần cuối:{" "}
          <span className="font-medium text-foreground">
            {lastUpdatedAt
              ? DATE_FORMATTER.format(lastUpdatedAt)
              : "Chưa có dữ liệu"}
          </span>
        </p>
      }
      actions={
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          isLoading={isRefreshing}
          aria-label="Làm mới kiểm tra sẵn sàng vận hành"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Làm mới
        </Button>
      }
    />
  );
}
