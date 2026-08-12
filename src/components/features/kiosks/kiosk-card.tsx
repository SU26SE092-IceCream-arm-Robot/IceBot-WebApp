import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  MapPin,
  Rocket,
  Server,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getKioskLifecycleLabel,
  getKioskOperationalLabel,
} from "@/lib/presenters/kiosk-state-labels";
import { cn } from "@/lib/utils";
import type {
  KioskFleetItem,
  KioskLifecycleStatus,
  KioskOperationalState,
} from "@/types";

interface KioskCardProps {
  kiosk: KioskFleetItem;
  canDeployConfiguration?: boolean;
  deploymentReleaseId?: string | null;
}

function formatTimestamp(value?: string | null): string {
  if (!value) {
    return "Chưa có dữ liệu";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Chưa có dữ liệu";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function getLifecycleVariant(
  status: KioskLifecycleStatus,
): "default" | "destructive" | "secondary" | "outline" {
  if (status === "Active") {
    return "default";
  }

  if (status === "Disabled") {
    return "destructive";
  }

  if (status === "Provisioning") {
    return "secondary";
  }

  return "outline";
}

function getAccentClass(status: KioskLifecycleStatus): string {
  if (status === "Active") {
    return "bg-primary";
  }

  if (status === "Disabled") {
    return "bg-destructive";
  }

  return "bg-muted-foreground";
}

function getOperationalVariant(
  state: KioskOperationalState,
): "default" | "destructive" | "secondary" | "outline" {
  if (state === "Operational") return "outline";
  if (state === "OutOfService" || state === "EmergencyStopRequested") {
    return "destructive";
  }
  return "secondary";
}

export function KioskCard({
  kiosk,
  canDeployConfiguration = false,
  deploymentReleaseId,
}: KioskCardProps) {
  const deploymentQuery = new URLSearchParams({ tab: "deployments" });
  if (deploymentReleaseId)
    deploymentQuery.set("releaseId", deploymentReleaseId);

  return (
    <Card className="relative overflow-hidden border-border/80 shadow-none transition-colors hover:bg-secondary/15">
      <span
        className={`absolute inset-x-0 top-0 h-1 ${getAccentClass(kiosk.lifecycleStatus)}`}
      />

      <CardHeader className="space-y-4 pt-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="truncate text-base font-semibold tracking-tight text-foreground">
              {kiosk.name}
            </CardTitle>
            <p className="tabular-nums text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {kiosk.kioskId}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            <Badge variant={getLifecycleVariant(kiosk.lifecycleStatus)}>
              {getKioskLifecycleLabel(kiosk.lifecycleStatus)}
            </Badge>
            <Badge variant={getOperationalVariant(kiosk.operationalState)}>
              {getKioskOperationalLabel(kiosk.operationalState)}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{kiosk.locationName}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2.5 text-sm">
          <div className="flex items-start justify-between gap-4">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="size-4 shrink-0" />
              Cửa hàng
            </span>
            <span className="max-w-48 truncate text-right font-medium text-foreground">
              {kiosk.locationName}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Server className="size-4 shrink-0" />
              Serial
            </span>
            <span className="tabular-nums text-right font-medium text-foreground">
              {kiosk.serialNumber || "Chưa cập nhật"}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="size-4 shrink-0" />
              Kết nối gần nhất
            </span>
            <span className="tabular-nums text-right font-medium text-foreground">
              {formatTimestamp(kiosk.lastOnlineAt)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-3">
          {canDeployConfiguration ? (
            <Link
              href={`/kiosks/${encodeURIComponent(kiosk.managementId)}?${deploymentQuery.toString()}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-full justify-between",
              )}
            >
              Triển khai cấu hình
              <Rocket className="size-4" />
            </Link>
          ) : null}
          <Link
            href={`/kiosks/${encodeURIComponent(kiosk.managementId)}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "w-full justify-between text-muted-foreground hover:text-foreground",
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
