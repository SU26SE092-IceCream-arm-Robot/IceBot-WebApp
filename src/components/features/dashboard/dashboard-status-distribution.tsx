"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStatusCount } from "@/types/dashboard-overview";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DistributionKind = "kioskLifecycle" | "kioskConnectivity" | "order";

const CHART_COLORS = [
  "var(--primary)",
  "var(--success)",
  "var(--warning)",
  "var(--destructive)",
  "var(--muted-foreground)",
  "var(--accent-foreground)",
];

const LEGEND_TONES = [
  "bg-primary",
  "bg-success",
  "bg-warning",
  "bg-destructive",
  "bg-muted-foreground",
  "bg-accent-foreground",
];

function getKioskLifecycleLabel(status: string) {
  const labels: Record<string, string> = {
    Provisioning: "Đang cấu hình",
    Active: "Đang hoạt động",
    Disabled: "Đã vô hiệu hóa",
    Retired: "Đã ngừng sử dụng",
  };

  return labels[status] ?? status;
}

function getKioskConnectivityLabel(status: string) {
  const labels: Record<string, string> = {
    Online: "Trực tuyến",
    Degraded: "Kết nối không ổn định",
    Unreachable: "Mất kết nối",
    Unknown: "Chưa xác định",
  };

  return labels[status] ?? status;
}

function getOrderStatusLabel(status: string) {
  const labels: Record<string, string> = {
    Draft: "Nháp",
    PendingPayment: "Chờ thanh toán",
    Paid: "Đã thanh toán",
    ReadyForFulfillment: "Sẵn sàng hoàn tất đơn",
    Accepted: "Đã tiếp nhận",
    Preparing: "Đang chuẩn bị",
    Ready: "Sẵn sàng nhận",
    Completed: "Hoàn tất",
    Cancelled: "Đã hủy",
    Failed: "Thất bại",
    ExecutionRejected: "Từ chối thực thi",
    RefundRequired: "Cần hoàn tiền",
    Refunded: "Đã hoàn tiền",
    Compensated: "Đã bù trừ",
    FulfillmentIssue: "Có sự cố khi hoàn tất đơn",
  };

  return labels[status] ?? status;
}

function getStatusLabel(kind: DistributionKind, status: string) {
  if (kind === "kioskLifecycle") return getKioskLifecycleLabel(status);
  if (kind === "kioskConnectivity") return getKioskConnectivityLabel(status);
  return getOrderStatusLabel(status);
}

interface ChartDatum {
  status: string;
  label: string;
  count: number;
  percent: number;
  fill: string;
}

interface DashboardChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload?: ChartDatum;
  }>;
}

function DashboardChartTooltip({
  active,
  payload,
}: DashboardChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0]?.payload as ChartDatum | undefined;
  if (!item) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{item.label}</p>
      <p className="mt-1 text-muted-foreground">
        {item.count.toLocaleString("vi-VN")} mục ·{" "}
        {item.percent.toLocaleString("vi-VN", {
          maximumFractionDigits: 1,
        })}
        %
      </p>
    </div>
  );
}

interface DashboardStatusDistributionProps {
  title: string;
  description: string;
  kind: DistributionKind;
  items: DashboardStatusCount[];
  total: number;
  emptyMessage: string;
}

export function DashboardStatusDistribution({
  title,
  description,
  kind,
  items,
  total,
  emptyMessage,
}: DashboardStatusDistributionProps) {
  const visibleItems = items.filter((item) => item.count > 0);
  const chartData: ChartDatum[] = visibleItems.map((item, index) => ({
    status: item.status,
    label: getStatusLabel(kind, item.status),
    count: item.count,
    percent: total > 0 ? (item.count / total) * 100 : 0,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <Card className="h-full border-border/80 shadow-none">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          {title}
        </CardTitle>
        <p className="text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </CardHeader>
      <CardContent>
        {total <= 0 || visibleItems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-5">
            {kind !== "order" ? (
              <div className="relative h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="count"
                      nameKey="label"
                      innerRadius="62%"
                      outerRadius="86%"
                      paddingAngle={2}
                      stroke="var(--background)"
                      strokeWidth={3}
                    >
                      {chartData.map((item) => (
                        <Cell key={item.status} fill={item.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<DashboardChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-semibold tabular-nums text-foreground">
                      {total.toLocaleString("vi-VN")}
                    </p>
                    <p className="text-xs text-muted-foreground">tổng kiosk</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 4, right: 8, bottom: 4, left: 8 }}
                  >
                    <XAxis type="number" hide domain={[0, "dataMax"]} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={128}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    />
                    <Tooltip content={<DashboardChartTooltip />} />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={18}>
                      {chartData.map((item) => (
                        <Cell key={item.status} fill={item.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {chartData.map((item, index) => (
                <div
                  key={item.status}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-muted/10 px-3 py-2 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`size-2.5 shrink-0 rounded-full ${LEGEND_TONES[index % LEGEND_TONES.length]}`}
                    />
                    <span className="truncate text-foreground">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-right text-xs tabular-nums text-muted-foreground">
                    {item.count.toLocaleString("vi-VN")} ·{" "}
                    {item.percent.toLocaleString("vi-VN", {
                      maximumFractionDigits: 1,
                    })}
                    %
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
