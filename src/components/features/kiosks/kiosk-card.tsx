import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  Cpu,
  CupSoda,
  MapPin,
  Snowflake,
  WifiOff,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Kiosk, KioskStatus, RobotArmStatus } from "@/types";

interface KioskCardProps {
  kiosk: Kiosk;
}

function formatHeartbeat(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(parsed);
}

function getStatusBadgeVariant(status: KioskStatus): "default" | "destructive" | "secondary" {
  if (status === "ERROR") {
    return "destructive";
  }

  if (status === "ONLINE") {
    return "default";
  }

  return "secondary";
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

function getRobotStatusLabel(status: RobotArmStatus): string {
  switch (status) {
    case "READY":
      return "Sẵn sàng";
    case "BUSY":
      return "Đang phục vụ";
    case "IDLE":
      return "Nghỉ";
    case "ERROR":
      return "Lỗi phần cứng";
  }
}

function isLowLevel(level: number): boolean {
  return level < 15;
}

function getCardStateClass(kiosk: Kiosk): string {
  if (kiosk.status === "ERROR" || kiosk.hardwareState.robotArmStatus === "ERROR") {
    return "border-destructive/40 ring-2 ring-destructive/25";
  }

  if (kiosk.status === "ONLINE") {
    return "border-primary/20";
  }

  return "border-border/80 bg-muted/5";
}

function getStatusAccentClass(status: KioskStatus): string {
  switch (status) {
    case "ONLINE":
      return "bg-primary";
    case "ERROR":
      return "bg-destructive";
    case "OFFLINE":
    case "MAINTENANCE":
      return "bg-muted-foreground";
  }
}

function LevelBar({ label, value }: { label: string; value: number }) {
  const low = isLowLevel(value);
  const normalizedValue = Math.max(0, Math.min(value, 100));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`tabular-nums font-semibold ${low ? "text-warning" : "text-foreground"}`}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${low ? "bg-warning" : "bg-primary"}`}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  );
}

function OperatingNotice({ kiosk }: KioskCardProps) {
  if (kiosk.status === "ERROR" || kiosk.hardwareState.robotArmStatus === "ERROR") {
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs font-medium text-destructive">
        <AlertTriangle className="size-4 shrink-0 animate-pulse" />
        Cần kiểm tra phần cứng ngay
      </div>
    );
  }

  if (kiosk.status === "OFFLINE") {
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs font-medium text-muted-foreground">
        <WifiOff className="size-4 shrink-0" />
        Không nhận được kết nối vận hành
      </div>
    );
  }

  if (kiosk.status === "MAINTENANCE") {
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs font-medium text-muted-foreground">
        <Wrench className="size-4 shrink-0" />
        Máy đang trong lịch bảo trì
      </div>
    );
  }

  return null;
}

export function KioskCard({ kiosk }: KioskCardProps) {
  const hasHardwareError = kiosk.hardwareState.robotArmStatus === "ERROR";
  const lowCups = kiosk.hardwareState.cupsRemaining < 15;

  return (
    <Card
      className={`relative overflow-hidden shadow-none transition-colors hover:bg-secondary/15 ${getCardStateClass(kiosk)}`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 ${getStatusAccentClass(kiosk.status)}`} />
      <CardHeader className="space-y-4 pt-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="truncate text-base font-semibold tracking-tight text-foreground">
                {kiosk.name}
              </CardTitle>
              <span className={`size-2 shrink-0 rounded-full ${getStatusAccentClass(kiosk.status)}`} />
            </div>
            <p className="tabular-nums text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {kiosk.kioskId}
            </p>
          </div>
          <Badge variant={getStatusBadgeVariant(kiosk.status)}>{getStatusLabel(kiosk.status)}</Badge>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{kiosk.locationName}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <OperatingNotice kiosk={kiosk} />

        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-background/70 p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Cpu className="size-3.5" />
              Robot Arm
            </div>
            <p className={`text-sm font-semibold ${hasHardwareError ? "text-destructive" : "text-foreground"}`}>
              {getRobotStatusLabel(kiosk.hardwareState.robotArmStatus)}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Snowflake className="size-3.5" />
              Tủ đông
            </div>
            <p className="tabular-nums text-sm font-semibold text-foreground">
              {kiosk.hardwareState.freezerTemperature.toFixed(1)}°C
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CupSoda className="size-3.5" />
              Ly còn lại
            </div>
            <p className={`tabular-nums text-sm font-semibold ${lowCups ? "text-warning" : "text-foreground"}`}>
              {kiosk.hardwareState.cupsRemaining}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock3 className="size-3.5" />
              Heartbeat
            </div>
            <p className="tabular-nums text-sm font-semibold text-foreground">
              {formatHeartbeat(kiosk.hardwareState.lastHeartbeat)}
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-card p-3">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Mức nguyên liệu
          </p>
          <LevelBar label="Vanilla" value={kiosk.hardwareState.vanillaSyrupLevel} />
          <LevelBar label="Chocolate" value={kiosk.hardwareState.chocolateSyrupLevel} />
          <LevelBar label="Topping" value={kiosk.hardwareState.toppingLevel} />
        </div>

        <div className="space-y-2">
          {kiosk.currentOrderId ? (
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground">
              <Cpu className="size-4 shrink-0 text-primary" />
              <span>Đang xử lý</span>
              <span className="tabular-nums font-semibold">{kiosk.currentOrderId}</span>
            </div>
          ) : null}

          {kiosk.hardwareState.errorCode ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <span>Mã lỗi</span>
              <span className="tabular-nums font-semibold">{kiosk.hardwareState.errorCode}</span>
            </div>
          ) : null}
        </div>

        <div className="border-t border-border pt-3">
          <Link
            href={`/kiosks/${encodeURIComponent(kiosk.kioskId)}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "w-full justify-between text-muted-foreground hover:text-foreground"
            )}
          >
            Xem chi tiết kiosk
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
