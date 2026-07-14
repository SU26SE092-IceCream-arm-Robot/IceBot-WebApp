"use client";

import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  RefreshCw,
  ShoppingBag,
  SlidersHorizontal,
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export default function ReportsPage() {
  const {
    filters,
    snapshot,
    kioskOptions,
    isLoading,
    isRefreshing,
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

  const filtersPanel = (
    <Card className="gap-0 rounded-xl border border-border/80 bg-card py-0 shadow-none">
      <CardHeader className="border-b border-border px-4 py-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <SlidersHorizontal className="size-5" />
          </span>
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold">
              Bộ lọc báo cáo
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2 bg-muted/10 px-4 py-3 md:grid-cols-2 xl:grid-cols-3">
        <Select
          value={String(filters.rangeDays)}
          onValueChange={(value) => {
            if (isRangeDays(value)) {
              setRangeDays(Number(value) as ReportsRangeDays);
            }
          }}
        >
          <SelectTrigger
            className="h-9 w-full bg-card text-foreground"
            aria-label="Khoảng thời gian báo cáo"
          >
            <SelectValue>
              {
                RANGE_OPTIONS.find(
                  (item) => item.value === filters.rangeDays,
                )?.label
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.storeId}
          onValueChange={(value) => setStoreId(value ?? "ALL")}
        >
          <SelectTrigger
            className="h-9 w-full bg-card text-foreground"
            aria-label="Cửa hàng báo cáo"
          >
            <SelectValue>
              {filters.storeId === "ALL"
                ? "Tất cả cửa hàng"
                : snapshot?.storeOptions.find(
                    (item) => item.id === filters.storeId,
                  )?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả cửa hàng</SelectItem>
            {snapshot?.storeOptions.map((store) => (
              <SelectItem key={store.id} value={store.id}>
                {store.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.kioskId}
          onValueChange={(value) => setKioskId(value ?? "ALL")}
        >
          <SelectTrigger
            className="h-9 w-full bg-card text-foreground md:col-span-2 xl:col-span-1"
            aria-label="Kiosk báo cáo"
          >
            <SelectValue>
              {filters.kioskId === "ALL"
                ? "Tất cả kiosk"
                : kioskOptions.find((item) => item.id === filters.kioskId)
                    ?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả kiosk</SelectItem>
            {kioskOptions.map((kiosk) => (
              <SelectItem key={kiosk.id} value={kiosk.id}>
                {kiosk.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Báo cáo vận hành</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Tổng hợp đơn hàng, doanh thu và tín hiệu cần chú ý từ dữ liệu quản trị hiện có.
          </p>
        </div>
        <Button variant="outline" onClick={refresh} isLoading={isRefreshing}>
          <RefreshCw className="size-4" />
          Làm mới
        </Button>
      </section>

      {isLoading ? (
        <ReportsLoadingState />
      ) : !snapshot || !snapshot.hasUsableData ? (
        <>
          {filtersPanel}
          <ReportsUnavailableState onRetry={refresh} />
        </>
      ) : (
        <>
          <ReportsDataQualityBanner messages={snapshot.dataQualityMessages} />

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ReportKpiCard
              icon={ShoppingBag}
              label="Đơn hàng trong kỳ"
              value={snapshot.availability.orders ? snapshot.kpis.orderCount.toLocaleString("vi-VN") : "--"}
            />
            <ReportKpiCard
              icon={Banknote}
              label="Doanh thu đã thu"
              value={snapshot.availability.orders ? revenueValue : "--"}
              tone="success"
            />
            <ReportKpiCard
              icon={CheckCircle2}
              label="Tỷ lệ hoàn tất"
              value={snapshot.availability.orderStatuses ? `${snapshot.kpis.completionRate.toFixed(1)}%` : "Không khả dụng"}
              tone="success"
            />
            <ReportKpiCard
              icon={AlertTriangle}
              label="Đơn cần chú ý"
              value={snapshot.availability.orderStatuses ? snapshot.kpis.attentionOrderCount.toLocaleString("vi-VN") : "Không khả dụng"}
              tone={snapshot.kpis.attentionOrderCount > 0 ? "destructive" : "primary"}
            />
          </section>

          {filtersPanel}

          <section className="grid gap-4 xl:grid-cols-2">
            {snapshot.availability.orders ? (
              <>
                <RevenueSummary trend={snapshot.trend} />
                {snapshot.availability.orderStatuses ? (
                <OrderStatusBreakdown buckets={snapshot.statusBreakdown} />
                ) : (
                  <ReportsSectionUnavailable message="Backend management chưa cung cấp trạng thái đơn hàng/thanh toán nên phân bổ trạng thái tạm thời không khả dụng." />
                )}
              </>
            ) : (
              <div className="xl:col-span-2">
                <ReportsSectionUnavailable message="Không thể tải đơn hàng nên phân bổ trạng thái và xu hướng doanh thu chưa được hiển thị." />
              </div>
            )}
          </section>

          {snapshot.availability.kiosks ? (
            <KioskAttentionTable rows={snapshot.kioskAttention} />
          ) : (
            <ReportsSectionUnavailable message="Không thể tải thông tin kiosk nên danh sách kiosk cần chú ý chưa được hiển thị." />
          )}
          <OperationsSignals panels={snapshot.signalPanels} />
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
