import { getKioskConnectivityLabel } from "@/lib/presenters/kiosk-state-labels";
import type { DashboardRoutePath } from "@/types";
import type {
  DashboardMetrics,
  InventorySummary,
  KioskStatusOverview,
} from "@/types/dashboard/overview";

export type PlatformInterventionKind =
  "connectivity" | "maintenance" | "emptyInventory" | "lowInventory";

export type PlatformInterventionTone = "warning" | "destructive";

export interface PlatformInterventionItem {
  id: string;
  kind: PlatformInterventionKind;
  tone: PlatformInterventionTone;
  label: string;
  description: string;
  count: number;
  routePath: DashboardRoutePath;
  href: string;
  actionLabel: string;
}

interface BuildPlatformInterventionsInput {
  metrics?: DashboardMetrics | null;
  kioskStatus?: KioskStatusOverview | null;
  inventory?: InventorySummary | null;
  now?: Date;
}

function formatObservedAt(value: string | null | undefined, now: Date): string {
  if (!value) return "Chưa có heartbeat";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Chưa rõ thời điểm";

  const elapsedMinutes = Math.max(
    0,
    Math.floor((now.getTime() - timestamp) / 60_000),
  );
  if (elapsedMinutes < 1) return "Vừa cập nhật";
  if (elapsedMinutes < 60) return `${elapsedMinutes} phút trước`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} giờ trước`;
  return `${Math.floor(elapsedHours / 24)} ngày trước`;
}

function connectivityWeight(status: string): number {
  if (status === "Unreachable") return 0;
  if (status === "Degraded") return 1;
  return 2;
}

export function buildPlatformInterventions({
  metrics,
  kioskStatus,
  inventory,
  now = new Date(),
}: BuildPlatformInterventionsInput): PlatformInterventionItem[] {
  const interventions: PlatformInterventionItem[] = [];
  const actionableKiosks = [...(kioskStatus?.items ?? [])]
    .filter((item) => item.connectivityStatus !== "Online")
    .sort((left, right) => {
      const severityDifference =
        connectivityWeight(left.connectivityStatus) -
        connectivityWeight(right.connectivityStatus);
      if (severityDifference !== 0) return severityDifference;
      return (left.lastHeartbeatAt ?? "").localeCompare(
        right.lastHeartbeatAt ?? "",
      );
    });

  for (const kiosk of actionableKiosks) {
    const connectivityLabel = getKioskConnectivityLabel(
      kiosk.connectivityStatus,
    );
    interventions.push({
      id: `connectivity:${kiosk.kioskId}`,
      kind: "connectivity",
      tone:
        kiosk.connectivityStatus === "Unreachable" ? "destructive" : "warning",
      label: `${kiosk.kioskName || kiosk.kioskCode} · ${connectivityLabel}`,
      description: `${kiosk.storeName || "Chưa xác định cửa hàng"} · ${formatObservedAt(kiosk.lastHeartbeatAt, now)} · ${kiosk.kioskCode}`,
      count: 1,
      routePath: "/kiosks",
      href: `/kiosks/${encodeURIComponent(kiosk.kioskId)}`,
      actionLabel: "Mở kiosk",
    });
  }

  const detailedOfflineCount = actionableKiosks.filter(
    (item) => item.connectivityStatus === "Unreachable",
  ).length;
  const remainingOfflineCount = Math.max(
    0,
    (metrics?.offlineKioskCount ?? 0) - detailedOfflineCount,
  );
  if (remainingOfflineCount > 0) {
    interventions.push({
      id: "connectivity:remaining",
      kind: "connectivity",
      tone: "destructive",
      label: "Kiosk mất kết nối chưa có chi tiết",
      description: "Connectivity backend ghi nhận Unreachable.",
      count: remainingOfflineCount,
      routePath: "/kiosks",
      href: "/kiosks",
      actionLabel: "Xem danh sách",
    });
  }

  if ((metrics?.maintenanceKioskCount ?? 0) > 0) {
    interventions.push({
      id: "operations:maintenance",
      kind: "maintenance",
      tone: "warning",
      label: "Kiosk đang bảo trì",
      description: "Trạng thái vận hành đang tạm dừng để bảo trì.",
      count: metrics?.maintenanceKioskCount ?? 0,
      routePath: "/kiosks",
      href: "/kiosks",
      actionLabel: "Xem kiosk",
    });
  }

  if ((inventory?.emptyCount ?? 0) > 0) {
    interventions.push({
      id: "inventory:empty",
      kind: "emptyInventory",
      tone: "destructive",
      label: "Bộ phân phối đã hết nguyên liệu",
      description: "Cần xử lý trước khi kiosk tiếp tục bán món liên quan.",
      count: inventory?.emptyCount ?? 0,
      routePath: "/inventory",
      href: "/inventory",
      actionLabel: "Mở tồn kho",
    });
  }

  if ((inventory?.lowStockCount ?? 0) > 0) {
    interventions.push({
      id: "inventory:low",
      kind: "lowInventory",
      tone: "warning",
      label: "Bộ phân phối sắp hết nguyên liệu",
      description: "Tồn kho đã xuống dưới mức cảnh báo.",
      count: inventory?.lowStockCount ?? 0,
      routePath: "/inventory",
      href: "/inventory",
      actionLabel: "Mở tồn kho",
    });
  }

  const priority: Record<PlatformInterventionKind, number> = {
    connectivity: 0,
    emptyInventory: 1,
    maintenance: 2,
    lowInventory: 3,
  };

  return interventions.sort((left, right) => {
    if (left.tone !== right.tone) {
      return left.tone === "destructive" ? -1 : 1;
    }
    return priority[left.kind] - priority[right.kind];
  });
}
