"use client";

import { RefreshCw } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
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
  title?: string;
  description?: string;
  refreshTitle?: string;
}

export function DashboardHeader({
  lastUpdatedAt,
  isRefreshing,
  onRefresh,
  title = "Tổng quan vận hành",
  description = "Theo dõi nhanh trạng thái kiosk, đơn hàng, hoàn tiền và tồn kho trong phạm vi quản lý.",
  refreshTitle = "Làm mới dữ liệu tổng quan",
}: DashboardHeaderProps) {
  return (
    <PageHeader
      title={title}
      description={description}
      actions={
        <>
          <p className="text-xs text-muted-foreground">
          Cập nhật lần cuối:{" "}
          <span className="font-medium text-foreground">
            {formatLastUpdated(lastUpdatedAt)}
          </span>
          </p>
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
