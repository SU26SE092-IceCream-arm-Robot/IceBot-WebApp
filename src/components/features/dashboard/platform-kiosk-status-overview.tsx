import type { CSSProperties } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getKioskConnectivityLabel,
  getKioskLifecycleLabel,
} from "@/lib/presenters/kiosk-state-labels";
import type { DashboardStatusCount } from "@/types/dashboard/overview";

type PlatformKioskStatusKind = "lifecycle" | "connectivity";

const STATUS_CONFIG = {
  lifecycle: [
    { status: "Provisioning", color: "var(--primary)" },
    { status: "Active", color: "var(--success)" },
    { status: "Disabled", color: "var(--warning)" },
    { status: "Retired", color: "var(--muted-foreground)" },
  ],
  connectivity: [
    { status: "Online", color: "var(--success)" },
    { status: "Degraded", color: "var(--warning)" },
    { status: "Unreachable", color: "var(--destructive)" },
    { status: "Unknown", color: "var(--muted-foreground)" },
  ],
} as const;

function statusLabel(kind: PlatformKioskStatusKind, status: string) {
  return kind === "lifecycle"
    ? getKioskLifecycleLabel(status)
    : getKioskConnectivityLabel(status);
}

function buildSegments(
  items: Array<{ count: number; color: string }>,
  total: number,
) {
  if (total <= 0) return "var(--muted) 0deg 360deg";
  let cursor = 0;
  const segments = items
    .filter((item) => item.count > 0)
    .map((item) => {
      const start = cursor;
      cursor += (item.count / total) * 360;
      return `${item.color} ${start}deg ${cursor}deg`;
    })
    .join(", ");
  return segments || "var(--muted) 0deg 360deg";
}

function StatusPanel({
  kind,
  title,
  description,
  items,
  total,
}: {
  kind: PlatformKioskStatusKind;
  title: string;
  description: string;
  items: DashboardStatusCount[];
  total: number;
}) {
  const counts = new Map(items.map((item) => [item.status, item.count]));
  const configuredItems = STATUS_CONFIG[kind].map((item) => ({
    ...item,
    count: counts.get(item.status) ?? 0,
  }));
  const ringStyle = {
    background: `conic-gradient(${buildSegments(configuredItems, total)})`,
  } satisfies CSSProperties;

  return (
    <Card className="gap-3 border-border/80 py-0 shadow-none">
      <CardHeader className="border-b border-border px-4 py-3.5">
        <CardTitle className="text-sm font-semibold text-foreground">
          {title}
        </CardTitle>
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="grid items-center gap-5 px-4 pb-4 sm:grid-cols-[112px_minmax(0,1fr)]">
        <div
          className="relative mx-auto size-24 rounded-full"
          style={ringStyle}
          role="img"
          aria-label={`${title}: ${total.toLocaleString("vi-VN")} kiosk`}
        >
          <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-card">
            <span className="text-xl font-semibold tabular-nums text-foreground">
              {total.toLocaleString("vi-VN")}
            </span>
            <span className="text-[10px] text-muted-foreground">
              Tổng kiosk
            </span>
          </div>
        </div>
        <dl className="grid gap-2">
          {configuredItems.map((item) => {
            const percent = total > 0 ? (item.count / total) * 100 : 0;
            return (
              <div
                key={item.status}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 text-xs"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <dt className="truncate text-muted-foreground">
                  {statusLabel(kind, item.status)}
                </dt>
                <dd className="tabular-nums font-medium text-foreground">
                  {item.count.toLocaleString("vi-VN")}
                  <span className="ml-2 text-muted-foreground">
                    {percent.toLocaleString("vi-VN", {
                      maximumFractionDigits: 1,
                    })}
                    %
                  </span>
                </dd>
              </div>
            );
          })}
        </dl>
      </CardContent>
    </Card>
  );
}

export function PlatformKioskStatusOverview({
  lifecycleItems,
  connectivityItems,
  total,
}: {
  lifecycleItems: DashboardStatusCount[];
  connectivityItems: DashboardStatusCount[];
  total: number;
}) {
  return (
    <div className="grid h-full content-start gap-4">
      <StatusPanel
        kind="lifecycle"
        title="Vòng đời kiosk"
        description="Trạng thái quản trị của kiosk. Không bao gồm kết nối hoặc vận hành."
        items={lifecycleItems}
        total={total}
      />
      <StatusPanel
        kind="connectivity"
        title="Trạng thái kết nối"
        description="Tín hiệu connectivity do backend ghi nhận."
        items={connectivityItems}
        total={total}
      />
    </div>
  );
}
