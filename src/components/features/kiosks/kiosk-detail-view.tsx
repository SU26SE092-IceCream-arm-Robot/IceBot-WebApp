"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Clock3,
  Cpu,
  CupSoda,
  Lock,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Snowflake,
  Unlock,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useKioskDetail } from "@/hooks/use-kiosk-detail";
import { hasPermission } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import type { KioskStatus, RobotArmStatus } from "@/types";
import type {
  KioskDetail,
  KioskEvent,
  KioskEventSeverity,
  KioskTemperaturePoint,
} from "@/types/kiosk-detail";

interface KioskDetailViewProps {
  kioskId: string;
}

type ControlCommand = "Khóa kiosk" | "Mở khóa kiosk" | "Đặt trạng thái READY" | "Tạo phiếu bảo trì";

function formatTimestamp(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(parsed);
}

function formatShortTime(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function getStatusLabel(status: KioskStatus): string {
  switch (status) {
    case "ONLINE":
      return "Trực tuyến";
    case "OFFLINE":
      return "Mất kết nối";
    case "MAINTENANCE":
      return "Bảo trì";
    case "ERROR":
      return "Đang lỗi";
  }
}

function getStatusVariant(status: KioskStatus): "default" | "destructive" | "secondary" {
  if (status === "ONLINE") {
    return "default";
  }

  if (status === "ERROR") {
    return "destructive";
  }

  return "secondary";
}

function getRobotLabel(status: RobotArmStatus): string {
  switch (status) {
    case "READY":
      return "Sẵn sàng";
    case "BUSY":
      return "Đang phục vụ";
    case "IDLE":
      return "Đang nghỉ";
    case "ERROR":
      return "Lỗi phần cứng";
  }
}

function getSeverityVariant(severity: KioskEventSeverity): "outline" | "secondary" | "destructive" {
  if (severity === "ERROR") {
    return "destructive";
  }

  if (severity === "WARNING") {
    return "secondary";
  }

  return "outline";
}

function getSeverityLabel(severity: KioskEventSeverity): string {
  switch (severity) {
    case "ERROR":
      return "Lỗi";
    case "WARNING":
      return "Cảnh báo";
    case "INFO":
      return "Thông tin";
  }
}

function StatePanel({
  description,
  destructive = false,
  title,
}: {
  description: string;
  destructive?: boolean;
  title: string;
}) {
  return (
    <Card className={destructive ? "border-destructive/30 bg-destructive/5 shadow-none" : "border-border shadow-none"}>
      <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
        <span
          className={cn(
            "flex size-12 items-center justify-center rounded-xl",
            destructive ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"
          )}
        >
          {destructive ? <ShieldAlert className="size-5" /> : <Cpu className="size-5" />}
        </span>
        <div className="space-y-1">
          <p className="font-medium text-foreground">{title}</p>
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
        <Link href="/kiosks" className={buttonVariants({ variant: "outline", size: "md" })}>
          <ArrowLeft className="size-4" />
          Về Fleet Monitor
        </Link>
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
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
        <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-72 animate-pulse rounded-xl border border-border bg-card" />
        <div className="h-72 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    </div>
  );
}

function MetricTile({
  children,
  icon: Icon,
  label,
  warning = false,
}: {
  children: React.ReactNode;
  icon: typeof Activity;
  label: string;
  warning?: boolean;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border bg-background/70 p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className={cn("text-sm font-semibold text-foreground", warning && "text-destructive")}>
        {children}
      </div>
    </div>
  );
}

function IngredientLevel({ label, value }: { label: string; value: number }) {
  const warning = value < 15;

  return (
    <div className="space-y-2.5">
      <div className="flex justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("tabular-nums font-semibold text-foreground", warning && "text-warning")}>
          {value}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", warning ? "bg-warning" : "bg-primary")}
          style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
        />
      </div>
    </div>
  );
}

function TemperatureTrend({ history }: { history: KioskTemperaturePoint[] }) {
  const current = history.at(-1);

  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Snowflake className="size-4 text-primary" />
          Xu hướng nhiệt độ
        </CardTitle>
        <CardDescription>Telemetry mô phỏng trong 50 phút gần nhất.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Nhiệt độ gần nhất</p>
            <p className="tabular-nums text-2xl font-semibold tracking-tight text-foreground">
              {current ? `${current.temperature.toFixed(1)}°C` : "--"}
            </p>
          </div>
          <Badge variant="outline">Ngưỡng mục tiêu -18°C</Badge>
        </div>

        <div className="flex h-36 items-end gap-3 rounded-xl border border-border bg-background/70 p-4">
          {history.map((point) => {
            const barHeight = Math.max(14, Math.min(94, ((point.temperature + 22) / 14) * 100));
            const tooWarm = point.temperature > -15;

            return (
              <div key={point.timestamp} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <span className={cn("tabular-nums text-[11px] font-medium", tooWarm ? "text-destructive" : "text-muted-foreground")}>
                  {point.temperature.toFixed(1)}
                </span>
                <div
                  className={cn("w-full max-w-9 rounded-t-md", tooWarm ? "bg-destructive" : "bg-primary")}
                  style={{ height: `${barHeight}%` }}
                />
                <span className="tabular-nums text-[11px] text-muted-foreground">
                  {formatShortTime(point.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function EventsTable({ events }: { events: KioskEvent[] }) {
  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-base">Sự kiện gần đây</CardTitle>
        <CardDescription>Lịch sử lỗi và tín hiệu vận hành mô phỏng gần nhất.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-5">Thời gian</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Sự kiện</TableHead>
              <TableHead className="px-5">Mã</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="px-5 tabular-nums text-xs text-muted-foreground">
                  {formatTimestamp(event.timestamp)}
                </TableCell>
                <TableCell>
                  <Badge variant={getSeverityVariant(event.severity)}>{getSeverityLabel(event.severity)}</Badge>
                </TableCell>
                <TableCell className="max-w-72 whitespace-normal">
                  <p className="font-medium text-foreground">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.description}</p>
                </TableCell>
                <TableCell className="px-5 tabular-nums text-xs text-muted-foreground">
                  {event.code ?? "--"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ControlsPanel({
  canControl,
  onCommand,
}: {
  canControl: boolean;
  onCommand: (command: ControlCommand) => void;
}) {
  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-base">Điều khiển quản trị</CardTitle>
        <CardDescription>
          Lệnh chỉ mô phỏng trên giao diện, chưa gửi tới kiosk hoặc backend.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="destructive" disabled={!canControl} onClick={() => onCommand("Khóa kiosk")}>
            <Lock className="size-4" />
            Khóa kiosk
          </Button>
          <Button variant="outline" disabled={!canControl} onClick={() => onCommand("Mở khóa kiosk")}>
            <Unlock className="size-4" />
            Mở khóa
          </Button>
          <Button variant="secondary" disabled={!canControl} onClick={() => onCommand("Đặt trạng thái READY")}>
            <Activity className="size-4" />
            Đặt READY
          </Button>
          <Button variant="outline" disabled={!canControl} onClick={() => onCommand("Tạo phiếu bảo trì")}>
            <Wrench className="size-4" />
            Tạo bảo trì
          </Button>
        </div>
        {!canControl ? (
          <p className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            Chỉ Admin hoặc Manager có quyền thực hiện thao tác điều khiển kiosk.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DetailHeader({
  kiosk,
  onRefresh,
}: {
  kiosk: KioskDetail;
  onRefresh: () => void;
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-4">
        <Link
          href="/kiosks"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-3 text-muted-foreground")}
        >
          <ArrowLeft className="size-4" />
          Fleet Monitor
        </Link>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="tabular-nums text-3xl font-semibold tracking-tight text-foreground">
              {kiosk.kioskId}
            </h1>
            <Badge variant={getStatusVariant(kiosk.status)}>{getStatusLabel(kiosk.status)}</Badge>
          </div>
          <p className="text-base font-medium text-foreground">{kiosk.name}</p>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            {kiosk.locationName}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="tabular-nums px-3 py-2">
          Serial {kiosk.deviceSerial}
        </Badge>
        <Button variant="outline" onClick={onRefresh}>
          <RefreshCw className="size-4" />
          Làm mới
        </Button>
      </div>
    </header>
  );
}

function CurrentStatusPanel({ kiosk }: { kiosk: KioskDetail }) {
  const isError = kiosk.status === "ERROR" || kiosk.hardwareState.robotArmStatus === "ERROR";

  return (
    <Card className={cn("border-border/80 shadow-none", isError && "border-destructive/40 ring-2 ring-destructive/20")}>
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Trạng thái hiện tại</CardTitle>
            <CardDescription>Kết nối và telemetry phần cứng gần nhất.</CardDescription>
          </div>
          {isError ? (
            <AlertTriangle className="size-5 animate-pulse text-destructive" />
          ) : (
            <Activity className="size-5 text-primary" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <MetricTile icon={Activity} label="Kết nối" warning={kiosk.status === "ERROR" || kiosk.status === "OFFLINE"}>
            {getStatusLabel(kiosk.status)}
          </MetricTile>
          <MetricTile icon={Cpu} label="Robot Arm" warning={kiosk.hardwareState.robotArmStatus === "ERROR"}>
            {getRobotLabel(kiosk.hardwareState.robotArmStatus)}
          </MetricTile>
          <MetricTile icon={Snowflake} label="Nhiệt độ tủ đông" warning={kiosk.hardwareState.freezerTemperature > -15}>
            <span className="tabular-nums">{kiosk.hardwareState.freezerTemperature.toFixed(1)}°C</span>
          </MetricTile>
          <MetricTile icon={Clock3} label="Heartbeat cuối">
            <span className="tabular-nums">{formatTimestamp(kiosk.hardwareState.lastHeartbeat)}</span>
          </MetricTile>
        </div>

        {kiosk.currentOrderId ? (
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
            <Cpu className="size-4 shrink-0 text-primary" />
            <span className="text-muted-foreground">Đơn đang xử lý</span>
            <span className="tabular-nums font-semibold text-foreground">{kiosk.currentOrderId}</span>
          </div>
        ) : null}

        {kiosk.hardwareState.errorCode ? (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="size-4 shrink-0" />
            <span>Mã lỗi phần cứng</span>
            <span className="tabular-nums font-semibold">{kiosk.hardwareState.errorCode}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function InventoryPanel({ kiosk }: { kiosk: KioskDetail }) {
  const cupsWarning = kiosk.hardwareState.cupsRemaining < 15;

  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-base">Tồn kho & nguyên liệu</CardTitle>
        <CardDescription>Mức cấp phát hiện tại của kiosk.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <div className={cn("flex items-center justify-between rounded-xl border border-border bg-background/70 p-4", cupsWarning && "border-warning/40 bg-warning/5")}>
          <div className="flex items-center gap-3">
            <span className={cn("flex size-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground", cupsWarning && "bg-warning/10 text-warning")}>
              <CupSoda className="size-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">Ly sẵn sàng</p>
              <p className="text-xs text-muted-foreground">
                {cupsWarning ? "Dưới ngưỡng tiếp liệu" : "Đủ cho vận hành hiện tại"}
              </p>
            </div>
          </div>
          <p className={cn("tabular-nums text-2xl font-semibold text-foreground", cupsWarning && "text-warning")}>
            {kiosk.hardwareState.cupsRemaining}
          </p>
        </div>

        <div className="space-y-4">
          <IngredientLevel label="Syrup Vanilla" value={kiosk.hardwareState.vanillaSyrupLevel} />
          <IngredientLevel label="Syrup Chocolate" value={kiosk.hardwareState.chocolateSyrupLevel} />
          <IngredientLevel label="Topping / Dispenser" value={kiosk.hardwareState.toppingLevel} />
        </div>
      </CardContent>
    </Card>
  );
}

export function KioskDetailView({ kioskId }: KioskDetailViewProps) {
  const { kiosk, role, state, errorMessage, refresh } = useKioskDetail(kioskId);
  const [commandNotice, setCommandNotice] = useState<string | null>(null);
  const canControl = role ? hasPermission(role, "kiosks.control") : false;

  if (state === "LOADING") {
    return <DetailSkeleton />;
  }

  if (state === "NOT_FOUND") {
    return (
      <StatePanel
        title="Không tìm thấy kiosk"
        description={`Không có kiosk mã ${kioskId} trong dữ liệu vận hành hiện tại.`}
      />
    );
  }

  if (state === "FORBIDDEN") {
    return (
      <StatePanel
        destructive
        title="Ngoài phạm vi truy cập"
        description="Kiosk này không thuộc địa điểm được cấp quyền cho tài khoản hiện tại."
      />
    );
  }

  if (state === "ERROR" || !kiosk) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 shadow-none">
        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
          <AlertTriangle className="size-6 text-destructive" />
          <p className="text-sm font-medium text-destructive">
            {errorMessage ?? "Không thể tải chi tiết kiosk."}
          </p>
          <Button variant="destructive" onClick={() => void refresh()}>
            Thử lại
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <DetailHeader kiosk={kiosk} onRefresh={() => void refresh()} />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <CurrentStatusPanel kiosk={kiosk} />
        <InventoryPanel kiosk={kiosk} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <TemperatureTrend history={kiosk.temperatureHistory} />
        <EventsTable events={kiosk.recentEvents} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.68fr_0.32fr]">
        <ControlsPanel
          canControl={canControl}
          onCommand={(command) => {
            setCommandNotice(`${command}: thao tác mô phỏng đã được ghi nhận, chưa gửi tới thiết bị.`);
          }}
        />
        <Card className="border-border/80 shadow-none">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base">Thông tin thiết bị</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Chế độ</span>
              <Badge variant="outline">{kiosk.operationMode}</Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Firmware</span>
              <span className="tabular-nums font-medium text-foreground">{kiosk.firmwareVersion}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Serial</span>
              <span className="tabular-nums font-medium text-foreground">{kiosk.deviceSerial}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {commandNotice ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground" role="status">
          {commandNotice}
        </div>
      ) : null}
    </div>
  );
}
