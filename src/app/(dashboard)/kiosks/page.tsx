"use client";

import {
  AlertTriangle,
  Ban,
  Monitor,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Power,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { KioskCard } from "@/components/features/kiosks/kiosk-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isStatusFilter, useKiosks } from "@/hooks/use-kiosks";
import type { KioskStatusFilter } from "@/types";

const STATUS_OPTIONS: { value: KioskStatusFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "Provisioning", label: "Đang cấu hình" },
  { value: "Active", label: "Đang hoạt động" },
  { value: "Offline", label: "Ngoại tuyến" },
  { value: "Maintenance", label: "Bảo trì" },
  { value: "Disabled", label: "Đã vô hiệu hóa" },
  { value: "Retired", label: "Ngừng sử dụng" },
];

type SummaryTone = "neutral" | "primary" | "destructive" | "warning";

const SUMMARY_TONES: Record<
  SummaryTone,
  { iconClassName: string; valueClassName: string }
> = {
  neutral: {
    iconClassName: "bg-secondary text-secondary-foreground",
    valueClassName: "text-foreground",
  },
  primary: {
    iconClassName: "bg-primary/10 text-primary",
    valueClassName: "text-primary",
  },
  destructive: {
    iconClassName: "bg-destructive/10 text-destructive",
    valueClassName: "text-destructive",
  },
  warning: {
    iconClassName: "bg-warning/10 text-warning",
    valueClassName: "text-warning",
  },
};

interface SummaryCardProps {
  icon: LucideIcon;
  label: string;
  tone: SummaryTone;
  value: number;
}

function SummaryCard({
  icon: Icon,
  label,
  tone,
  value,
}: SummaryCardProps) {
  const toneClasses = SUMMARY_TONES[tone];

  return (
    <Card className="border-border/80 bg-card shadow-none">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={`tabular-nums text-3xl font-semibold tracking-tight ${toneClasses.valueClassName}`}>
            {value}
          </p>
        </div>
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${toneClasses.iconClassName}`}>
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}

function StatusLegend({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <span className={`size-2 rounded-full ${className}`} />
      {label}
    </span>
  );
}

export default function KiosksPage() {
  const {
    kiosks,
    summary,
    locations,
    filters,
    isLoading,
    errorMessage,
    metadataWarning,
    scopedCount,
    setSearchTerm,
    setStatusFilter,
    setLocationFilter,
    clearFilters,
    refresh,
  } = useKiosks();

  return (
    <div className="space-y-7">
      <section className="border-b border-border pb-6">
        <div className="max-w-2xl space-y-3">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Giám sát Kiosk</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Theo dõi metadata vòng đời của đội máy IceBot và mở trang chi tiết để xem heartbeat, sự kiện từ backend.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          icon={Monitor}
          label="Tổng số kiosk"
          value={summary.total}
          tone="neutral"
        />
        <SummaryCard
          icon={Power}
          label="Đang hoạt động"
          value={summary.active}
          tone="primary"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Ngoại tuyến"
          value={summary.offline}
          tone="destructive"
        />
        <SummaryCard
          icon={Wrench}
          label="Đang bảo trì"
          value={summary.maintenance}
          tone="warning"
        />
        <SummaryCard
          icon={Ban}
          label="Đã dừng sử dụng"
          value={summary.disabled}
          tone="neutral"
        />
      </section>

      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Nguồn dữ liệu: Backend management API</p>
        <p className="mt-1">
          Danh sách chỉ hiển thị metadata quản lý, không suy diễn trạng thái online từ vòng đời và không sử dụng telemetry mô phỏng.
        </p>
      </div>

      {metadataWarning ? (
        <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3" role="status">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
            <p className="text-xs font-medium text-warning">{metadataWarning}</p>
          </div>
        </div>
      ) : null}

      <Card className="border-border/80 bg-card shadow-none">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <SlidersHorizontal className="size-5" />
            </span>
            <div className="space-y-1">
              <CardTitle className="text-base">Bộ lọc giám sát</CardTitle>
              <CardDescription>
                <span className="tabular-nums font-medium text-foreground">{kiosks.length}</span> /{" "}
                <span className="tabular-nums font-medium text-foreground">{scopedCount}</span> kiosk
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_220px_240px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                value={filters.searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm kiosk ID, tên máy hoặc địa điểm..."
                className="h-9 bg-card pl-9"
              />
            </div>

            <Select
              value={filters.status}
              onValueChange={(value) => {
                if (isStatusFilter(value)) {
                  setStatusFilter(value);
                }
              }}
            >
              <SelectTrigger className="h-9 w-full bg-card">
                <SelectValue>
                  {STATUS_OPTIONS.find((option) => option.value === filters.status)?.label ??
                    "Tất cả trạng thái"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.locationId} onValueChange={setLocationFilter}>
              <SelectTrigger className="h-9 w-full bg-card">
                <SelectValue>
                  {filters.locationId === "ALL"
                    ? "Tất cả địa điểm"
                    : locations.find(
                        (location) => location.locationId === filters.locationId,
                      )?.locationName ?? "Tất cả địa điểm"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả địa điểm</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.locationId} value={location.locationId}>
                    {location.locationName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2 lg:justify-end">
              <Button variant="outline" size="sm" className="h-9" onClick={clearFilters}>
                Xóa lọc
              </Button>
              <Button
                variant="secondary"
                size="icon-sm"
                className="size-9"
                onClick={() => void refresh()}
                aria-label="Tải lại dữ liệu kiosk"
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Vòng đời đội máy</h2>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <StatusLegend className="bg-primary" label="Đang hoạt động" />
            <StatusLegend className="bg-warning" label="Bảo trì" />
            <StatusLegend className="bg-destructive" label="Ngoại tuyến / vô hiệu hóa" />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={`kiosk-skeleton-${index}`} className="border-border/80 shadow-none">
                <CardContent className="space-y-4 p-5">
                  <div className="flex justify-between gap-3">
                    <div className="space-y-2">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted/60" />
                      <div className="h-3 w-44 animate-pulse rounded bg-muted/40" />
                    </div>
                    <div className="h-5 w-20 animate-pulse rounded-full bg-muted/40" />
                  </div>
                  <div className="h-28 animate-pulse rounded-xl bg-muted/30" />
                  <div className="h-16 animate-pulse rounded-xl bg-muted/20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : errorMessage ? (
          <Card className="border-destructive/40 bg-destructive/5 shadow-none">
            <CardContent className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="size-5 shrink-0" />
                <p className="text-sm font-medium">{errorMessage}</p>
              </div>
              <Button variant="destructive" onClick={() => void refresh()}>
                Thử lại
              </Button>
            </CardContent>
          </Card>
        ) : kiosks.length === 0 ? (
          <Card className="border-border/80 shadow-none">
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <Search className="size-5" />
              </span>
              <p className="text-sm font-medium text-foreground">Không có kiosk phù hợp</p>
              <p className="text-sm text-muted-foreground">
                Thử thay đổi từ khóa, trạng thái hoặc địa điểm đang lọc.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {kiosks.map((kiosk) => (
              <KioskCard key={kiosk.kioskId} kiosk={kiosk} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
