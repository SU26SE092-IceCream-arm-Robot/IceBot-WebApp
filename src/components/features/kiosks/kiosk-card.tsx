import { AlertTriangle, Cpu } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    default:
      return status;
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
      return "Lỗi";
    default:
      return status;
  }
}

function isLowLevel(level: number): boolean {
  return level < 15;
}

function getCardStateClass(kiosk: Kiosk): string {
  if (kiosk.status === "ERROR" || kiosk.hardwareState.robotArmStatus === "ERROR") {
    return "ring-2 ring-destructive animate-pulse";
  }

  if (kiosk.status === "ONLINE") {
    return "ring-1 ring-primary/30";
  }

  if (kiosk.status === "OFFLINE" || kiosk.status === "MAINTENANCE") {
    return "ring-1 ring-muted/40";
  }

  return "";
}

function InventoryValue({ label, value }: { label: string; value: number }) {
  const low = isLowLevel(value);

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`tabular-nums text-sm font-semibold ${low ? "text-warning" : "text-foreground"}`}>
        {value}%
      </p>
    </div>
  );
}

export function KioskCard({ kiosk }: KioskCardProps) {
  const statusVariant = getStatusBadgeVariant(kiosk.status);
  const hasHardwareError = kiosk.hardwareState.robotArmStatus === "ERROR";

  return (
    <Card className={getCardStateClass(kiosk)}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="tabular-nums text-base font-semibold tracking-tight">
              {kiosk.kioskId}
            </CardTitle>
            <p className="text-sm font-medium text-foreground">{kiosk.name}</p>
            <p className="text-xs text-muted-foreground">{kiosk.locationName}</p>
          </div>

          <Badge variant={statusVariant}>{getStatusLabel(kiosk.status)}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-background/60 p-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Robot Arm</p>
            <p className={`text-sm font-semibold ${hasHardwareError ? "text-destructive" : "text-foreground"}`}>
              {getRobotStatusLabel(kiosk.hardwareState.robotArmStatus)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Nhiệt độ tủ đông</p>
            <p className="tabular-nums text-sm font-semibold text-foreground">
              {kiosk.hardwareState.freezerTemperature.toFixed(1)}°C
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Ly còn lại</p>
            <p className={`tabular-nums text-sm font-semibold ${kiosk.hardwareState.cupsRemaining < 15 ? "text-warning" : "text-foreground"}`}>
              {kiosk.hardwareState.cupsRemaining}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Heartbeat</p>
            <p className="tabular-nums text-sm font-medium text-foreground">
              {formatHeartbeat(kiosk.hardwareState.lastHeartbeat)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <InventoryValue label="Vanilla" value={kiosk.hardwareState.vanillaSyrupLevel} />
          <InventoryValue label="Chocolate" value={kiosk.hardwareState.chocolateSyrupLevel} />
          <InventoryValue label="Topping" value={kiosk.hardwareState.toppingLevel} />
        </div>

        {kiosk.currentOrderId ? (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-foreground">
            <Cpu size={14} className="text-primary" />
            <span className="tabular-nums">Đang xử lý: {kiosk.currentOrderId}</span>
          </div>
        ) : null}

        {kiosk.hardwareState.errorCode ? (
          <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertTriangle size={14} />
            <span className="tabular-nums">Mã lỗi: {kiosk.hardwareState.errorCode}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
