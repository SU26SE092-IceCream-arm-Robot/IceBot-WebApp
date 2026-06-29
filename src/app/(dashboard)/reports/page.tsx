"use client";

import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";

import { KioskAttentionTable } from "@/components/features/reports/kiosk-attention-table";
import { OperationsSignals } from "@/components/features/reports/operations-signals";
import { OrderStatusBreakdown } from "@/components/features/reports/order-status-breakdown";
import { RecentActivityTable } from "@/components/features/reports/recent-activity-table";
import { ReportKpiCard } from "@/components/features/reports/report-kpi-card";
import { RevenueSummary } from "@/components/features/reports/revenue-summary";
import {
  ReportsDataQualityBanner,
  ReportsLoadingState,
  ReportsSectionUnavailable,
  ReportsUnavailableState,
} from "@/components/features/reports/reports-states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReports } from "@/hooks/use-reports";
import type { ReportCurrencyAmount, ReportsRangeDays } from "@/types/reports";

const RANGE_OPTIONS: Array<{ value: ReportsRangeDays; label: string }> = [
  { value: 7, label: "7 ngày gần nhất" },
  { value: 30, label: "30 ngày gần nhất" },
  { value: 90, label: "90 ngày gần nhất" },
];

function isRangeDays(value: string | null): value is `${ReportsRangeDays}` {
  return value === "7" || value === "30" || value === "90";
}

function formatMoney(value: ReportCurrencyAmount) {
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: value.currency,
      maximumFractionDigits: 0,
    }).format(value.amount);
  } catch {
    return `${value.amount.toLocaleString("vi-VN")} ${value.currency}`;
  }
}

function formatUpdatedAt(value: Date | null) {
  if (!value) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(value);
}

export default function ReportsPage() {
  const {
    filters,
    snapshot,
    kioskOptions,
    isLoading,
    isRefreshing,
    lastUpdatedAt,
    setRangeDays,
    setStoreId,
    setKioskId,
    refresh,
  } = useReports();

  const revenueValue = snapshot?.kpis.collectedRevenue.length ? (
    <div className="space-y-0.5">
      {snapshot.kpis.collectedRevenue.map((value) => (
        <p key={value.currency}>{formatMoney(value)}</p>
      ))}
    </div>
  ) : (
    "0 ₫"
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-border/80 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Báo cáo vận hành</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Tổng hợp đơn hàng, doanh thu và tín hiệu cần chú ý từ dữ liệu quản trị hiện có.
          </p>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock3 className="size-3.5" />
            Cập nhật lần cuối: {formatUpdatedAt(lastUpdatedAt)}
          </p>
        </div>
        <Button variant="outline" onClick={refresh} isLoading={isRefreshing}>
          <RefreshCw className="size-4" />
          Làm mới dữ liệu
        </Button>
      </section>

      <Card className="gap-0 rounded-lg border border-border/80 bg-card/90 py-0 shadow-none">
        <CardContent className="grid gap-3 p-4 lg:grid-cols-3">
          <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
            Khoảng thời gian
            <Select
              value={String(filters.rangeDays)}
              onValueChange={(value) => {
                if (isRangeDays(value)) setRangeDays(Number(value) as ReportsRangeDays);
              }}
            >
              <SelectTrigger className="h-9 w-full bg-card text-foreground">
                <SelectValue>{RANGE_OPTIONS.find((item) => item.value === filters.rangeDays)?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
            Cửa hàng
            <Select value={filters.storeId} onValueChange={(value) => setStoreId(value ?? "ALL")}>
              <SelectTrigger className="h-9 w-full bg-card text-foreground">
                <SelectValue>{filters.storeId === "ALL" ? "Tất cả cửa hàng" : snapshot?.storeOptions.find((item) => item.id === filters.storeId)?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả cửa hàng</SelectItem>
                {snapshot?.storeOptions.map((store) => (
                  <SelectItem key={store.id} value={store.id}>{store.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
            Kiosk
            <Select value={filters.kioskId} onValueChange={(value) => setKioskId(value ?? "ALL")}>
              <SelectTrigger className="h-9 w-full bg-card text-foreground">
                <SelectValue>{filters.kioskId === "ALL" ? "Tất cả kiosk" : kioskOptions.find((item) => item.id === filters.kioskId)?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả kiosk</SelectItem>
                {kioskOptions.map((kiosk) => (
                  <SelectItem key={kiosk.id} value={kiosk.id}>{kiosk.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </CardContent>
      </Card>

      {isLoading ? (
        <ReportsLoadingState />
      ) : !snapshot || !snapshot.hasUsableData ? (
        <ReportsUnavailableState onRetry={refresh} />
      ) : (
        <>
          <ReportsDataQualityBanner messages={snapshot.dataQualityMessages} />

          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Tổng quan trong kỳ</h2>
              <p className="mt-1 text-xs text-muted-foreground">Các chỉ số chính theo phạm vi đang chọn.</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              <ReportKpiCard
              icon={ShoppingBag}
              label="Đơn hàng trong kỳ"
              value={snapshot.availability.orders ? snapshot.kpis.orderCount.toLocaleString("vi-VN") : "—"}
              helper={`Từ ${new Date(snapshot.rangeStart).toLocaleDateString("vi-VN")} đến nay`}
              coverage={snapshot.kpis.coverageLabel}
            />
              <ReportKpiCard
              icon={Banknote}
              label="Doanh thu đã thu"
              value={snapshot.availability.orders ? revenueValue : "—"}
              helper="Chỉ tính các khoản đã thanh toán thành công."
              coverage={snapshot.kpis.coverageLabel}
              tone="success"
            />
              <ReportKpiCard
              icon={CheckCircle2}
              label="Tỷ lệ hoàn tất"
              value={snapshot.availability.orders ? `${snapshot.kpis.completionRate.toFixed(1)}%` : "—"}
              helper={
                snapshot.availability.orders && snapshot.kpis.orderCount > 0
                  ? `${snapshot.kpis.completedOrderCount.toLocaleString("vi-VN")} / ${snapshot.kpis.orderCount.toLocaleString("vi-VN")} đơn hoàn tất`
                  : snapshot.availability.orders
                    ? "Chưa có đơn trong kỳ"
                    : "Nguồn đơn hàng không khả dụng"
              }
              coverage={snapshot.kpis.coverageLabel}
              tone="success"
            />
              <ReportKpiCard
              icon={AlertTriangle}
              label="Đơn cần chú ý"
              value={snapshot.availability.orders ? snapshot.kpis.attentionOrderCount.toLocaleString("vi-VN") : "—"}
              helper="Lỗi, từ chối thực thi, cần hoàn tiền hoặc cần nhân viên"
              coverage={snapshot.kpis.coverageLabel}
              tone={snapshot.kpis.attentionOrderCount > 0 ? "destructive" : "primary"}
              />
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Phân tích giao dịch</h2>
              <p className="mt-1 text-xs text-muted-foreground">Xu hướng theo thời gian và cơ cấu trạng thái đơn hàng.</p>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {snapshot.availability.orders ? (
                <>
                  <RevenueSummary trend={snapshot.trend} />
                  <OrderStatusBreakdown buckets={snapshot.statusBreakdown} />
                </>
              ) : (
                <div className="xl:col-span-2">
                  <ReportsSectionUnavailable message="Không thể tải đơn hàng nên phân bổ trạng thái và xu hướng doanh thu chưa được hiển thị." />
                </div>
              )}
            </div>
          </section>

          {snapshot.availability.kiosks ? (
            <KioskAttentionTable rows={snapshot.kioskAttention} />
          ) : (
            <ReportsSectionUnavailable message="Không thể tải metadata kiosk nên danh sách kiosk cần chú ý chưa được hiển thị." />
          )}
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Tín hiệu vận hành</h2>
              <p className="mt-1 text-xs text-muted-foreground">Danh mục, tồn kho và các tác vụ cần theo dõi.</p>
            </div>
            <OperationsSignals panels={snapshot.signalPanels} />
          </section>
          {snapshot.availability.activity ? (
            <RecentActivityTable items={snapshot.recentActivity} />
          ) : (
            <ReportsSectionUnavailable message="Không có nguồn hoạt động nào khả dụng với vai trò hoặc kết nối hiện tại." />
          )}
        </>
      )}
    </div>
  );
}
