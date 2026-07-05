"use client";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Info,
  RefreshCw,
  ShieldAlert,
  AlertOctagon,
  AlertCircle,
  Bell,
} from "lucide-react";

import { AlertDetailDrawer } from "@/components/features/alerts/alert-detail-drawer";
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
import { useAlerts } from "@/hooks/use-alerts";
import type { AlertSeverity, AlertStatus } from "@/types/alerts";

const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; icon: React.ElementType; className: string }> = {
  Debug: { label: "Gỡ lỗi", icon: Info, className: "border-muted bg-muted/50 text-muted-foreground" },
  Info: { label: "Thông tin", icon: Info, className: "border-blue-500/20 bg-blue-500/10 text-blue-500" },
  Warning: { label: "Cảnh báo", icon: AlertTriangle, className: "border-yellow-500/20 bg-yellow-500/10 text-yellow-600" },
  Error: { label: "Lỗi", icon: AlertCircle, className: "border-red-500/20 bg-red-500/10 text-red-600" },
  Critical: { label: "Nghiêm trọng", icon: AlertOctagon, className: "border-destructive/20 bg-destructive/10 text-destructive" },
};

const STATUS_CONFIG: Record<AlertStatus, { label: string; className: string }> = {
  Open: { label: "Mới", className: "border-destructive/20 bg-destructive/10 text-destructive" },
  Acknowledged: { label: "Đã tiếp nhận", className: "border-warning/20 bg-warning/10 text-warning" },
  Resolved: { label: "Đã xử lý", className: "border-success/20 bg-success/10 text-success" },
  Suppressed: { label: "Đã ẩn", className: "border-border bg-muted/20 text-muted-foreground" },
};

function formatDateTime(isoString: string) {
  return new Date(isoString).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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
    isMutationSubmitting,
    setStatusFilter,
    setSeverityFilter,
    previousPage,
    nextPage,
    openAlertDetail,
    setIsDetailOpen,
    acknowledgeAlert,
    resolveAlert,
    refresh,
  } = useAlerts();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cảnh báo hệ thống</h1>
          <p className="mt-2 text-muted-foreground">
            Theo dõi, tiếp nhận và xử lý các sự cố hoặc cảnh báo kỹ thuật.
          </p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={isLoading}>
          <RefreshCw className={`mr-2 size-4 ${isLoading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="size-5" />
              Danh sách cảnh báo
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-md border p-1 shadow-sm">
                <Filter className="ml-2 size-4 text-muted-foreground" />
                <Select
                  value={filters.severity || "ALL"}
                  onValueChange={(val) => setSeverityFilter(val as AlertSeverity | "ALL")}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-8 w-[140px] border-0 bg-transparent focus:ring-0">
                    <SelectValue placeholder="Mức độ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả mức độ</SelectItem>
                    {Object.entries(SEVERITY_CONFIG).map(([val, conf]) => (
                      <SelectItem key={val} value={val}>{conf.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="h-4 w-px bg-border" />
                <Select
                  value={filters.status || "ALL"}
                  onValueChange={(val) => setStatusFilter(val as AlertStatus | "ALL")}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-8 w-[160px] border-0 bg-transparent focus:ring-0">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([val, conf]) => (
                      <SelectItem key={val} value={val}>{conf.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {errorMessage ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShieldAlert className="mb-4 size-10 text-destructive/50" />
              <p className="text-lg font-medium text-destructive">{errorMessage}</p>
              <Button variant="outline" className="mt-4" onClick={refresh}>
                Thử lại
              </Button>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã & Mức độ</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="min-w-[200px]">Nội dung</TableHead>
                    <TableHead>Nguồn</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        {isLoading ? "Đang tải dữ liệu..." : "Không tìm thấy cảnh báo nào."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    alerts.map((alert) => {
                      const SevIcon = SEVERITY_CONFIG[alert.severity].icon;
                      return (
                        <TableRow key={alert.id}>
                          <TableCell>
                            <div className="flex flex-col items-start gap-1">
                              <Badge variant="outline" className={`h-6 gap-1 rounded-full px-2.5 ${SEVERITY_CONFIG[alert.severity].className}`}>
                                <SevIcon className="size-3" />
                                {SEVERITY_CONFIG[alert.severity].label}
                              </Badge>
                              <span className="font-mono text-xs text-muted-foreground">{alert.alertCode}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`h-6 rounded-full px-2.5 ${STATUS_CONFIG[alert.status].className}`}>
                              {STATUS_CONFIG[alert.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex max-w-[300px] flex-col">
                              <span className="truncate font-medium">{alert.title}</span>
                              <div className="flex items-center gap-2 mt-1">
                                {alert.occurrenceCount > 1 && (
                                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-primary/10 text-primary hover:bg-primary/20 border-0">
                                    {alert.occurrenceCount} lần
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-xs text-muted-foreground">
                              {alert.kioskId ? (
                                <span className="font-medium text-foreground">Kiosk: {alert.kioskId}</span>
                              ) : alert.storeId ? (
                                <span className="font-medium text-foreground">Store: {alert.storeId}</span>
                              ) : alert.organizationId ? (
                                <span>Org: {alert.organizationId}</span>
                              ) : (
                                <span>Hệ thống</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-xs">
                              <span className="font-medium text-foreground">{formatDateTime(alert.lastOccurredAt)}</span>
                              <span className="text-muted-foreground">Lần đầu: {formatDateTime(alert.raisedAt)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => openAlertDetail(alert.id)}>
                              <Eye className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {!errorMessage && (
            <div className="flex items-center justify-between border-t px-6 py-4">
              <div className="text-sm text-muted-foreground">
                Tổng cộng: <span className="font-medium text-foreground">{pagination.totalCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previousPage}
                  disabled={!pagination.hasPrevious || isLoading}
                >
                  <ChevronLeft className="mr-1 size-4" />
                  Trước
                </Button>
                <div className="flex items-center justify-center text-sm font-medium">
                  {pagination.page} / {Math.max(1, pagination.totalPages)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={!pagination.hasNext || isLoading}
                >
                  Sau
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDetailDrawer
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        alert={selectedAlert}
        onAcknowledge={acknowledgeAlert}
        onResolve={resolveAlert}
        isSubmitting={isMutationSubmitting}
      />
    </div>
  );
}
