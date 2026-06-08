"use client";

import {
  Activity,
  AlertTriangle,
  MapPin,
  Monitor,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Wifi,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { KioskCard } from "@/components/features/kiosks/kiosk-card";
import { Badge } from "@/components/ui/badge";
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
import type { DashboardRole, KioskStatusFilter } from "@/types";

const STATUS_OPTIONS: { value: KioskStatusFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "ONLINE", label: "Trực tuyến" },
  { value: "OFFLINE", label: "Mất kết nối" },
  { value: "MAINTENANCE", label: "Bảo trì" },
  { value: "ERROR", label: "Đang lỗi" },
];

const ROLE_LABELS: Record<DashboardRole, string> = {
  ADMIN: "Quản trị viên",
  MANAGER: "Quản lý vận hành",
  LOCATION_OWNER: "Chủ địa điểm",
};

type SummaryTone = "neutral" | "primary" | "destructive" | "muted";

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
  muted: {
    iconClassName: "bg-muted text-muted-foreground",
    valueClassName: "text-muted-foreground",
  },
};

interface SummaryCardProps {
  icon: LucideIcon;
  label: string;
  supportingText: string;
  tone: SummaryTone;
  value: number;
}

function SummaryCard({
  icon: Icon,
  label,
  supportingText,
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
          <p className="text-xs text-muted-foreground">{supportingText}</p>
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
    role,
    kiosks,
    summary,
    locations,
    filters,
    isLoading,
    errorMessage,
    scopedCount,
    setSearchTerm,
    setStatusFilter,
    setLocationFilter,
    clearFilters,
    refresh,
  } = useKiosks();

  const scopeLabel = role ? ROLE_LABELS[role] : "Đang xác minh";

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-5 border-b border-border pb-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-2xl space-y-3">
          <Badge variant="outline" className="gap-2 border-primary/20 bg-primary/5 text-primary">
            <Activity className="size-3" />
            Fleet Monitor
          </Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Giám sát Kiosk</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Theo dõi kết nối, phần cứng robot và mức nguyên liệu của đội máy IceBot trong một màn hình vận hành.
            </p>
          </div>
        </div>

        <Card className="w-full border-border/80 bg-card shadow-none xl:max-w-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Phạm vi truy cập
              </p>
              <p className="truncate text-sm font-semibold text-foreground">{scopeLabel}</p>
              <p className="text-xs text-muted-foreground">
                <span className="tabular-nums font-medium text-foreground">{scopedCount}</span> kiosk trong phạm vi
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Monitor}
          label="Tổng số kiosk"
          value={summary.total}
          supportingText="Thiết bị trong phạm vi"
          tone="neutral"
        />
        <SummaryCard
          icon={Wifi}
          label="Đang trực tuyến"
          value={summary.online}
          supportingText="Kết nối ổn định"
          tone="primary"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Đang lỗi"
          value={summary.error}
          supportingText={summary.error > 0 ? "Cần kiểm tra ngay" : "Không có cảnh báo"}
          tone="destructive"
        />
        <SummaryCard
          icon={Wrench}
          label="Đang bảo trì"
          value={summary.maintenance}
          supportingText="Tạm ngưng phục vụ"
          tone="muted"
        />
      </section>

      <Card className="border-border/80 bg-card shadow-none">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <SlidersHorizontal className="size-4" />
              </span>
              <div className="space-y-1">
                <CardTitle className="text-base">Bộ lọc giám sát</CardTitle>
                <CardDescription>
                  Hiển thị <span className="tabular-nums font-medium text-foreground">{kiosks.length}</span> trên{" "}
                  <span className="tabular-nums font-medium text-foreground">{scopedCount}</span> kiosk có thể truy cập.
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="gap-1.5">
              <MapPin className="size-3" />
              {filters.locationId === "ALL" ? "Mọi địa điểm" : "Đã lọc địa điểm"}
            </Badge>
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
                className="pl-9"
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
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Lọc trạng thái" />
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
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Lọc địa điểm" />
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
              <Button variant="outline" onClick={clearFilters}>
                Xóa lọc
              </Button>
              <Button variant="secondary" onClick={() => void refresh()} aria-label="Tải lại dữ liệu kiosk">
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Trạng thái đội máy</h2>
            <p className="text-sm text-muted-foreground">Telemetry gần nhất của từng kiosk trong phạm vi hiển thị.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <StatusLegend className="bg-primary" label="Ổn định" />
            <StatusLegend className="bg-destructive" label="Cần xử lý" />
            <StatusLegend className="bg-muted-foreground" label="Ngoại tuyến / bảo trì" />
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
              <span className="flex size-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
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
