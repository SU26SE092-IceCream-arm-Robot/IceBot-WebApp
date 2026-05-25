"use client";

import { Search, RefreshCw } from "lucide-react";

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
import { useKiosks, isStatusFilter } from "@/hooks/use-kiosks";
import type { KioskStatusFilter } from "@/types";

const STATUS_OPTIONS: { value: KioskStatusFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "ONLINE", label: "Trực tuyến" },
  { value: "OFFLINE", label: "Mất kết nối" },
  { value: "MAINTENANCE", label: "Bảo trì" },
  { value: "ERROR", label: "Đang lỗi" },
];

interface SummaryCardProps {
  title: string;
  value: number;
  highlightClassName?: string;
}

function SummaryCard({ title, value, highlightClassName }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className={`tabular-nums text-2xl tracking-tight ${highlightClassName ?? "text-foreground"}`}>
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
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

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Giám sát Kiosk</h1>
        <p className="text-sm text-muted-foreground">
          Fleet Monitor cho phép theo dõi trạng thái hoạt động, phần cứng và tồn kho cơ bản của toàn bộ kiosk.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Tổng số kiosk" value={summary.total} />
        <SummaryCard title="Đang trực tuyến" value={summary.online} highlightClassName="text-primary" />
        <SummaryCard title="Đang lỗi" value={summary.error} highlightClassName="text-destructive" />
        <SummaryCard title="Đang bảo trì" value={summary.maintenance} highlightClassName="text-muted-foreground" />
      </section>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Bộ lọc Fleet</CardTitle>
          <CardDescription>
            Đang hiển thị <span className="tabular-nums font-medium text-foreground">{kiosks.length}</span> /{" "}
            <span className="tabular-nums font-medium text-foreground">{scopedCount}</span> kiosk trong phạm vi role {role}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative md:col-span-2">
              <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                value={filters.searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm theo kioskId, tên kiosk, địa điểm..."
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
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={filters.locationId} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="Lọc theo địa điểm" />
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

            <Button variant="outline" onClick={clearFilters}>
              Xóa bộ lọc
            </Button>

            <Button variant="secondary" onClick={() => void refresh()}>
              <RefreshCw className="mr-1 size-4" />
              Tải lại
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={`kiosk-skeleton-${index}`}>
              <CardContent className="space-y-3 p-4">
                <div className="h-4 w-24 animate-pulse rounded bg-muted/60" />
                <div className="h-3 w-44 animate-pulse rounded bg-muted/40" />
                <div className="h-24 animate-pulse rounded bg-muted/30" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : errorMessage ? (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <p className="text-sm text-destructive">{errorMessage}</p>
            <Button variant="destructive" onClick={() => void refresh()}>
              Thử lại
            </Button>
          </CardContent>
        </Card>
      ) : kiosks.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Không tìm thấy kiosk phù hợp với bộ lọc hiện tại.
            </p>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {kiosks.map((kiosk) => (
            <KioskCard key={kiosk.kioskId} kiosk={kiosk} />
          ))}
        </section>
      )}
    </div>
  );
}
