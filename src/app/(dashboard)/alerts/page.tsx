"use client";

import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Filter,
  Info,
  RefreshCw,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

import { AlertDetailDrawer } from "@/components/features/operations/alerts/alert-detail-drawer";
import { MetricStrip, MetricStripItem } from "@/components/shared/metric-strip";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAlerts } from "@/hooks/operations/use-alerts";
import type {
  AlertResult,
  AlertSeverity,
  AlertStatus,
} from "@/types/operations/alerts";

const SEVERITY_CONFIG: Record<
  AlertSeverity,
  { label: string; icon: LucideIcon; className: string }
> = {
  Debug: {
    label: "Gỡ lỗi",
    icon: Info,
    className: "border-border bg-muted/40 text-muted-foreground",
  },
  Info: {
    label: "Thông tin",
    icon: Info,
    className: "border-primary/20 bg-primary/10 text-primary",
  },
  Warning: {
    label: "Cảnh báo",
    icon: AlertTriangle,
    className: "border-warning/20 bg-warning/10 text-warning",
  },
  Error: {
    label: "Lỗi",
    icon: AlertCircle,
    className: "border-destructive/20 bg-destructive/10 text-destructive",
  },
  Critical: {
    label: "Nghiêm trọng",
    icon: AlertOctagon,
    className: "border-destructive/20 bg-destructive/10 text-destructive",
  },
};

const STATUS_CONFIG: Record<AlertStatus, { label: string; className: string }> =
  {
    Open: {
      label: "Mới",
      className: "border-destructive/20 bg-destructive/10 text-destructive",
    },
    Acknowledged: {
      label: "Đã tiếp nhận",
      className: "border-warning/20 bg-warning/10 text-warning",
    },
    Resolved: {
      label: "Đã xử lý",
      className: "border-success/20 bg-success/10 text-success",
    },
    Suppressed: {
      label: "Đã ẩn",
      className: "border-border bg-muted/30 text-muted-foreground",
    },
  };

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Chưa xác định"
    : DATE_TIME_FORMATTER.format(date);
}

function getAlertScope(alert: AlertResult) {
  if (alert.kioskId) return "Kiosk";
  if (alert.storeId) return "Cửa hàng";
  if (alert.organizationId) return "Tổ chức";
  return "Toàn hệ thống";
}

function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const config = SEVERITY_CONFIG[severity];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`gap-1 ${config.className}`}>
      <Icon className="size-3" aria-hidden="true" />
      {config.label}
    </Badge>
  );
}

function StatusBadge({ status }: { status: AlertStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

function AlertsLoadingState() {
  return (
    <div className="space-y-1 px-4 py-3" aria-label="Đang tải cảnh báo">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`alert-loading-${index}`}
          className="grid grid-cols-[120px_1fr_140px] items-center gap-4 border-b border-border py-4 last:border-0"
        >
          <div className="h-6 animate-pulse rounded bg-muted/50" />
          <div className="space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted/50" />
            <div className="h-3 w-2/5 animate-pulse rounded bg-muted/30" />
          </div>
          <div className="h-4 animate-pulse rounded bg-muted/30" />
        </div>
      ))}
    </div>
  );
}

function AlertsEmptyState({ isFiltered }: { isFiltered: boolean }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex size-11 items-center justify-center rounded-lg border border-border bg-muted/20 text-muted-foreground">
        <Bell className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-semibold text-foreground">
        {isFiltered ? "Không có cảnh báo phù hợp" : "Chưa ghi nhận cảnh báo"}
      </p>
      <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
        {isFiltered
          ? "Thử thay đổi mức độ hoặc trạng thái để mở rộng kết quả."
          : "Các cảnh báo vận hành mới sẽ xuất hiện tại đây để đội ngũ tiếp nhận."}
      </p>
    </div>
  );
}

function MobileAlertList({
  alerts,
  onOpen,
}: {
  alerts: AlertResult[];
  onOpen: (alertId: string) => void;
}) {
  return (
    <div className="divide-y divide-border md:hidden">
      {alerts.map((alert) => (
        <article key={alert.id} className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="line-clamp-2 text-sm font-semibold leading-5 text-foreground">
                {alert.title}
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                {alert.alertCode}
              </p>
            </div>
            <StatusBadge status={alert.status} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={alert.severity} />
            {alert.occurrenceCount > 1 ? (
              <span className="text-xs font-medium text-muted-foreground">
                Lặp lại {alert.occurrenceCount.toLocaleString("vi-VN")} lần
              </span>
            ) : null}
          </div>
          <dl className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-muted-foreground">Phạm vi</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {getAlertScope(alert)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Gần nhất</dt>
              <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                {formatDateTime(alert.lastOccurredAt)}
              </dd>
            </div>
          </dl>
          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={() => onOpen(alert.id)}
          >
            <Eye className="size-4" aria-hidden="true" />
            Xem và xử lý
          </Button>
        </article>
      ))}
    </div>
  );
}

export default function AlertsPage() {
  const {
    alerts,
    pagination,
    filters,
    isLoading,
    errorMessage,
    selectedAlert,
    isDetailOpen,
    isDetailLoading,
    detailErrorMessage,
    isMutationSubmitting,
    mutationErrorMessage,
    successMessage,
    setStatusFilter,
    setSeverityFilter,
    previousPage,
    nextPage,
    openAlertDetail,
    setIsDetailOpen,
    acknowledgeAlert,
    resolveAlert,
    clearSuccessMessage,
    refresh,
  } = useAlerts();

  const openOnPage = alerts.filter((alert) => alert.status === "Open").length;
  const acknowledgedOnPage = alerts.filter(
    (alert) => alert.status === "Acknowledged",
  ).length;
  const resolvedOnPage = alerts.filter(
    (alert) => alert.status === "Resolved",
  ).length;
  const urgentOnPage = alerts.filter(
    (alert) => alert.severity === "Critical" || alert.severity === "Error",
  ).length;
  const isFiltered = filters.status !== "ALL" || filters.severity !== "ALL";

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cảnh báo vận hành"
        description="Ưu tiên sự cố theo mức độ, tiếp nhận trách nhiệm và lưu bằng chứng xử lý trong đúng phạm vi được cấp."
        metadata={
          <p className="text-xs text-muted-foreground">
            {pagination.totalCount.toLocaleString("vi-VN")} cảnh báo trong bộ
            lọc hiện tại
          </p>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refresh()}
            isLoading={isLoading}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Làm mới
          </Button>
        }
      />

      {successMessage ? (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{successMessage}</span>
          <Button
            variant="ghost"
            size="sm"
            className="self-start text-success sm:self-auto"
            onClick={clearSuccessMessage}
          >
            Đóng
          </Button>
        </div>
      ) : null}

      <MetricStrip>
        <MetricStripItem
          icon={Bell}
          label="Mới trên trang"
          value={openOnPage.toLocaleString("vi-VN")}
          description="Chưa có người tiếp nhận"
          tone={openOnPage > 0 ? "destructive" : "neutral"}
        />
        <MetricStripItem
          icon={Clock3}
          label="Đang xử lý trên trang"
          value={acknowledgedOnPage.toLocaleString("vi-VN")}
          description="Đã có người chịu trách nhiệm"
          tone={acknowledgedOnPage > 0 ? "warning" : "neutral"}
        />
        <MetricStripItem
          icon={ShieldAlert}
          label="Lỗi nghiêm trọng trên trang"
          value={urgentOnPage.toLocaleString("vi-VN")}
          description="Mức Lỗi hoặc Nghiêm trọng"
          tone={urgentOnPage > 0 ? "destructive" : "neutral"}
        />
        <MetricStripItem
          icon={CheckCircle2}
          label="Đã xử lý trên trang"
          value={resolvedOnPage.toLocaleString("vi-VN")}
          description="Có kết quả xử lý"
          tone="success"
        />
      </MetricStrip>

      <section
        className="rounded-lg border border-border bg-card p-3"
        aria-labelledby="alert-filter-title"
      >
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Filter className="size-4 text-primary" aria-hidden="true" />
          <h2 id="alert-filter-title">Lọc hàng đợi xử lý</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:max-w-2xl">
          <Select
            value={filters.severity || "ALL"}
            onValueChange={(value) =>
              setSeverityFilter(value as AlertSeverity | "ALL")
            }
            disabled={isLoading}
          >
            <SelectTrigger
              className="w-full bg-card"
              aria-label="Lọc theo mức độ"
            >
              <SelectValue placeholder="Mức độ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả mức độ</SelectItem>
              {Object.entries(SEVERITY_CONFIG).map(([value, config]) => (
                <SelectItem key={value} value={value}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.status || "ALL"}
            onValueChange={(value) =>
              setStatusFilter(value as AlertStatus | "ALL")
            }
            disabled={isLoading}
          >
            <SelectTrigger
              className="w-full bg-card"
              aria-label="Lọc theo trạng thái"
            >
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                <SelectItem key={value} value={value}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <Card className="gap-0 overflow-hidden rounded-lg border-border py-0 shadow-none">
        <CardHeader className="border-b border-border px-4 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold">
              Hàng đợi cảnh báo
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {alerts.length.toLocaleString("vi-VN")} dòng trên trang
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <AlertsLoadingState />
          ) : errorMessage ? (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <span className="flex size-11 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <ShieldAlert className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-semibold text-destructive">
                Không thể tải hàng đợi cảnh báo
              </p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {errorMessage}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => void refresh()}
              >
                Thử lại
              </Button>
            </div>
          ) : alerts.length === 0 ? (
            <AlertsEmptyState isFiltered={isFiltered} />
          ) : (
            <>
              <MobileAlertList alerts={alerts} onOpen={openAlertDetail} />
              <div className="hidden overflow-x-auto md:block">
                <Table className="min-w-[920px] table-fixed">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[17%]">Ưu tiên</TableHead>
                      <TableHead className="w-[13%]">Trạng thái</TableHead>
                      <TableHead className="w-[31%]">Cảnh báo</TableHead>
                      <TableHead className="w-[13%]">Phạm vi</TableHead>
                      <TableHead className="w-[18%]">Gần nhất</TableHead>
                      <TableHead className="w-[8%] text-right">Xử lý</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <SeverityBadge severity={alert.severity} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={alert.status} />
                        </TableCell>
                        <TableCell>
                          <p
                            className="truncate font-medium text-foreground"
                            title={alert.title}
                          >
                            {alert.title}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono">{alert.alertCode}</span>
                            {alert.occurrenceCount > 1 ? (
                              <span>· {alert.occurrenceCount} lần</span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {getAlertScope(alert)}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium tabular-nums text-foreground">
                            {formatDateTime(alert.lastOccurredAt)}
                          </p>
                          <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                            Lần đầu {formatDateTime(alert.raisedAt)}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Xem và xử lý cảnh báo ${alert.alertCode}`}
                            onClick={() => openAlertDetail(alert.id)}
                          >
                            <Eye className="size-4" aria-hidden="true" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {!errorMessage && !isLoading ? (
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground">
                Trang{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {pagination.page}
                </span>{" "}
                /{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {Math.max(1, pagination.totalPages)}
                </span>{" "}
                ·{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {pagination.totalCount}
                </span>{" "}
                cảnh báo
              </p>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previousPage}
                  disabled={!pagination.hasPrevious}
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={!pagination.hasNext}
                >
                  Sau
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <AlertDetailDrawer
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        alert={selectedAlert}
        isLoading={isDetailLoading}
        loadErrorMessage={detailErrorMessage}
        onAcknowledge={acknowledgeAlert}
        onResolve={resolveAlert}
        isSubmitting={isMutationSubmitting}
        mutationErrorMessage={mutationErrorMessage}
      />
    </div>
  );
}
