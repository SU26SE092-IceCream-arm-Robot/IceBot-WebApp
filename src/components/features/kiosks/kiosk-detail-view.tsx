"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Building2,
  CircleHelp,
  Clock3,
  Cpu,
  HardDrive,
  MapPin,
  MemoryStick,
  Network,
  RefreshCw,
  Server,
  ShieldAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DevicesTable } from "./devices-table";
import type { KioskEvidenceState } from "@/hooks/use-kiosk-detail";
import { useKioskDetail } from "@/hooks/use-kiosk-detail";
import { cn } from "@/lib/utils";
import type { KioskLifecycleStatus } from "@/types";
import type {
  DeviceEventSeverity,
  KioskDeviceEventResult,
  KioskHeartbeatResult,
  KioskHeartbeatStatus,
  KioskManagementDetail,
} from "@/types/kiosk-detail";

interface KioskDetailViewProps {
  kioskId: string;
}

function formatTimestamp(value?: string | null): string {
  if (!value) {
    return "Chưa cập nhật";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Chưa cập nhật";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getLifecycleLabel(status: KioskLifecycleStatus): string {
  switch (status) {
    case "Provisioning":
      return "Đang cấu hình";
    case "Active":
      return "Đang hoạt động";
    case "Offline":
      return "Ngoại tuyến";
    case "Maintenance":
      return "Bảo trì";
    case "Disabled":
      return "Đã vô hiệu hóa";
    case "Retired":
      return "Ngừng sử dụng";
  }
}

function getLifecycleVariant(
  status: KioskLifecycleStatus,
): "default" | "destructive" | "secondary" | "outline" {
  if (status === "Active") {
    return "default";
  }

  if (status === "Offline" || status === "Disabled") {
    return "destructive";
  }

  if (status === "Maintenance" || status === "Provisioning") {
    return "secondary";
  }

  return "outline";
}

function getHeartbeatLabel(status: KioskHeartbeatStatus): string {
  switch (status) {
    case "Online":
      return "Online theo heartbeat";
    case "Degraded":
      return "Suy giảm";
    case "Offline":
      return "Offline theo heartbeat";
  }
}

function getHeartbeatVariant(
  status: KioskHeartbeatStatus,
): "default" | "destructive" | "secondary" {
  if (status === "Online") {
    return "default";
  }

  if (status === "Offline") {
    return "destructive";
  }

  return "secondary";
}

function getSeverityLabel(severity: DeviceEventSeverity): string {
  switch (severity) {
    case "Debug":
      return "Debug";
    case "Info":
      return "Thông tin";
    case "Warning":
      return "Cảnh báo";
    case "Error":
      return "Lỗi";
    case "Critical":
      return "Nghiêm trọng";
  }
}

function getSeverityVariant(
  severity: DeviceEventSeverity,
): "default" | "destructive" | "secondary" | "outline" {
  if (severity === "Critical" || severity === "Error") {
    return "destructive";
  }

  if (severity === "Warning") {
    return "secondary";
  }

  return severity === "Info" ? "default" : "outline";
}

function formatPercent(value?: number | null): string {
  return value === null || value === undefined
    ? "Chưa có dữ liệu"
    : `${value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;
}

function StatePanel({
  description,
  destructive = false,
  onRetry,
  title,
}: {
  description: string;
  destructive?: boolean;
  onRetry?: () => void;
  title: string;
}) {
  return (
    <Card
      className={
        destructive
          ? "border-destructive/30 bg-destructive/5 shadow-none"
          : "border-border shadow-none"
      }
    >
      <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
        <span
          className={cn(
            "flex size-12 items-center justify-center rounded-xl",
            destructive
              ? "bg-destructive/10 text-destructive"
              : "bg-secondary text-muted-foreground",
          )}
        >
          {destructive ? (
            <ShieldAlert className="size-5" />
          ) : (
            <Server className="size-5" />
          )}
        </span>
        <div className="space-y-1">
          <p className="font-medium text-foreground">{title}</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {onRetry ? (
            <Button variant={destructive ? "destructive" : "outline"} onClick={onRetry}>
              <RefreshCw className="size-4" />
              Thử lại
            </Button>
          ) : null}
          <Link
            href="/kiosks"
            className={buttonVariants({ variant: "outline", size: "md" })}
          >
            <ArrowLeft className="size-4" />
            Về danh sách kiosk
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-8 w-64 animate-pulse rounded bg-muted/50" />
        <div className="h-4 w-80 animate-pulse rounded bg-muted/30" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-72 animate-pulse rounded-xl border border-border bg-card" />
        <div className="h-72 animate-pulse rounded-xl border border-border bg-card" />
      </div>
      <div className="h-80 animate-pulse rounded-xl border border-border bg-card" />
    </div>
  );
}

function DetailHeader({
  kiosk,
  onRefresh,
}: {
  kiosk: KioskManagementDetail;
  onRefresh: () => void;
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-4">
        <Link
          href="/kiosks"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-3 text-muted-foreground",
          )}
        >
          <ArrowLeft className="size-4" />
          Danh sách kiosk
        </Link>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {kiosk.name}
            </h1>
            <Badge variant={getLifecycleVariant(kiosk.lifecycleStatus)}>
              {getLifecycleLabel(kiosk.lifecycleStatus)}
            </Badge>
          </div>
          <p className="tabular-nums text-sm font-medium text-muted-foreground">
            {kiosk.kioskId}
          </p>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            {kiosk.locationName}
          </p>
        </div>
      </div>
      <Button variant="outline" onClick={onRefresh}>
        <RefreshCw className="size-4" />
        Làm mới
      </Button>
    </header>
  );
}

function DetailValue({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/70 py-3 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="max-w-[62%] text-right text-sm font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

function MetadataPanel({ kiosk }: { kiosk: KioskManagementDetail }) {
  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="size-4 text-primary" />
          Metadata quản lý
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <DetailValue
          label="Trạng thái vòng đời"
          value={getLifecycleLabel(kiosk.lifecycleStatus)}
        />
        <DetailValue label="Cửa hàng" value={kiosk.locationName} />
        <DetailValue label="Tổ chức" value={kiosk.organizationId ? "Đã liên kết" : "Chưa có"} />
        <DetailValue label="Loại kiosk" value={kiosk.kioskType} />
        <DetailValue label="Serial" value={kiosk.serialNumber || "Chưa cập nhật"} />
        <DetailValue label="Múi giờ" value={kiosk.timeZone} />
        <DetailValue label="Địa chỉ" value={kiosk.address || "Chưa cập nhật"} />
        <DetailValue
          label="Online gần nhất (metadata)"
          value={<span className="tabular-nums">{formatTimestamp(kiosk.lastOnlineAt)}</span>}
        />
      </CardContent>
    </Card>
  );
}

function EvidenceUnavailable({
  message,
  title,
}: {
  message: string;
  title: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-full border border-border bg-muted/20 text-muted-foreground shadow-sm">
        <CircleHelp className="size-6 opacity-70" />
      </span>
      <div className="max-w-md space-y-1.5">
        <p className="text-base font-semibold tracking-tight text-foreground">{title}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

function LatestHeartbeatPanel({
  state,
}: {
  state: KioskEvidenceState<KioskHeartbeatResult>;
}) {
  const latest = [...state.data].sort(
    (left, right) =>
      new Date(right.reportedAt).getTime() - new Date(left.reportedAt).getTime(),
  )[0];

  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="size-4 text-primary" />
            Bằng chứng vận hành gần nhất
          </CardTitle>
          {latest ? (
            <Badge variant={getHeartbeatVariant(latest.status)}>
              {getHeartbeatLabel(latest.status)}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {state.isLoading ? (
          <div className="space-y-3" aria-label="Đang tải heartbeat">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-9 animate-pulse rounded bg-muted/40" />
            ))}
          </div>
        ) : state.errorMessage ? (
          <EvidenceUnavailable
            title="Không lấy được dữ liệu heartbeat"
            message={state.errorMessage}
          />
        ) : !latest ? (
          <EvidenceUnavailable
            title="Chưa có dữ liệu vận hành"
            message="Backend chưa ghi nhận heartbeat nào cho kiosk này. Không thể kết luận trạng thái online/offline thời gian thực."
          />
        ) : (
          <div>
            <DetailValue label="Kiosk báo cáo lúc" value={<span className="tabular-nums">{formatTimestamp(latest.reportedAt)}</span>} />
            <DetailValue label="Backend nhận lúc" value={<span className="tabular-nums">{formatTimestamp(latest.receivedAt)}</span>} />
            <DetailValue label="Network status" value={latest.networkStatus || "Không được heartbeat cung cấp"} />
            <DetailValue label="Robot status" value={latest.robotStatus || "Không được heartbeat cung cấp"} />
            <DetailValue label="Phiên bản ứng dụng" value={latest.appVersion || "Chưa có dữ liệu"} />
            <DetailValue label="Phiên bản firmware" value={latest.firmwareVersion || "Chưa có dữ liệu"} />
            <DetailValue label="Sự kiện chờ đồng bộ" value={<span className="tabular-nums">{latest.pendingSyncEventCount}</span>} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ResourceTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Cpu;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-background/70 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className="tabular-nums text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function HeartbeatsTable({
  state,
}: {
  state: KioskEvidenceState<KioskHeartbeatResult>;
}) {
  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock3 className="size-4 text-primary" />
            Lịch sử heartbeat
          </CardTitle>
          {state.pagination ? (
            <span className="text-xs text-muted-foreground">
              Hiển thị {state.data.length}/{state.pagination.totalCount} bản ghi
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {state.isLoading ? (
          <EvidenceUnavailable title="Đang tải heartbeat" message="Đang lấy bằng chứng vận hành từ backend." />
        ) : state.errorMessage ? (
          <EvidenceUnavailable title="Không lấy được dữ liệu heartbeat" message={state.errorMessage} />
        ) : state.data.length === 0 ? (
          <EvidenceUnavailable title="Chưa có heartbeat" message="Kiosk chưa gửi heartbeat nào về backend." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Thời gian báo cáo</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Robot</TableHead>
                  <TableHead>Tài nguyên</TableHead>
                  <TableHead className="pr-5">Node ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.data.map((heartbeat) => (
                  <TableRow key={heartbeat.id}>
                    <TableCell className="pl-5 tabular-nums text-xs text-muted-foreground">
                      {formatTimestamp(heartbeat.reportedAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getHeartbeatVariant(heartbeat.status)}>
                        {getHeartbeatLabel(heartbeat.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{heartbeat.networkStatus || "--"}</TableCell>
                    <TableCell>{heartbeat.robotStatus || "--"}</TableCell>
                    <TableCell>
                      <div className="grid min-w-52 grid-cols-3 gap-2">
                        <ResourceTile icon={Cpu} label="CPU" value={formatPercent(heartbeat.cpuUsagePercent)} />
                        <ResourceTile icon={MemoryStick} label="RAM" value={formatPercent(heartbeat.memoryUsagePercent)} />
                        <ResourceTile icon={HardDrive} label="Disk" value={formatPercent(heartbeat.diskUsagePercent)} />
                      </div>
                    </TableCell>
                    <TableCell className="max-w-48 truncate pr-5 font-mono text-xs text-muted-foreground">
                      {heartbeat.nodeId}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EventsTable({
  state,
}: {
  state: KioskEvidenceState<KioskDeviceEventResult>;
}) {
  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Network className="size-4 text-primary" />
            Sự kiện từ kiosk
          </CardTitle>
          {state.pagination ? (
            <span className="text-xs text-muted-foreground">
              Hiển thị {state.data.length}/{state.pagination.totalCount} sự kiện
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {state.isLoading ? (
          <EvidenceUnavailable title="Đang tải sự kiện" message="Đang lấy sự kiện thiết bị từ backend." />
        ) : state.errorMessage ? (
          <EvidenceUnavailable title="Không lấy được sự kiện từ kiosk" message={state.errorMessage} />
        ) : state.data.length === 0 ? (
          <EvidenceUnavailable title="Chưa có sự kiện từ kiosk" message="Backend chưa ghi nhận sự kiện thiết bị nào cho kiosk này." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Thời gian</TableHead>
                  <TableHead>Mức độ</TableHead>
                  <TableHead>Loại sự kiện</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead className="pr-5">Device ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.data.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="pl-5 tabular-nums text-xs text-muted-foreground">
                      {formatTimestamp(event.occurredAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSeverityVariant(event.severity)}>
                        {getSeverityLabel(event.severity)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {event.eventType}
                    </TableCell>
                    <TableCell className="min-w-72 max-w-xl whitespace-normal text-sm text-muted-foreground">
                      {event.message || "Backend không cung cấp nội dung sự kiện."}
                    </TableCell>
                    <TableCell className="max-w-48 truncate pr-5 font-mono text-xs text-muted-foreground">
                      {event.deviceId}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function KioskDetailView({ kioskId }: KioskDetailViewProps) {
  const {
    kiosk,
    state,
    errorMessage,
    metadataWarning,
    heartbeats,
    events,
    refresh,
  } = useKioskDetail(kioskId);

  if (state === "LOADING") {
    return <DetailSkeleton />;
  }

  if (state === "NOT_FOUND") {
    return (
      <StatePanel
        title="Không tìm thấy kiosk"
        description={`Không tìm thấy kiosk có ID ${kioskId} trong backend management API.`}
      />
    );
  }

  if (state === "FORBIDDEN") {
    return (
      <StatePanel
        destructive
        title="Ngoài phạm vi truy cập"
        description="Tài khoản hiện tại không có quyền xem kiosk này."
      />
    );
  }

  if (state === "ERROR" || !kiosk) {
    return (
      <StatePanel
        destructive
        title="Không thể tải chi tiết kiosk"
        description={errorMessage ?? "Không thể tải metadata kiosk từ backend."}
        onRetry={() => void refresh()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <DetailHeader kiosk={kiosk} onRefresh={() => void refresh()} />

      {metadataWarning ? (
        <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3" role="status">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
            <p className="text-xs font-medium text-warning">{metadataWarning}</p>
          </div>
        </div>
      ) : null}

      <Tabs defaultValue="overview" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="heartbeats">Heartbeats</TabsTrigger>
          <TabsTrigger value="events">Sự kiện</TabsTrigger>
          <TabsTrigger value="devices">Thiết bị</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <MetadataPanel kiosk={kiosk} />
            <LatestHeartbeatPanel state={heartbeats} />
          </div>
        </TabsContent>

        <TabsContent value="heartbeats">
          <HeartbeatsTable state={heartbeats} />
        </TabsContent>

        <TabsContent value="events">
          <EventsTable state={events} />
        </TabsContent>

        <TabsContent value="devices">
          <DevicesTable kioskId={kioskId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
