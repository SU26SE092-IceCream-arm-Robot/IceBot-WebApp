"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Cpu,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

import { DeviceCatalogDialog } from "@/components/features/kiosks/catalog/device-catalog-dialog";
import { KioskCreateDialog } from "@/components/features/kiosks/management/kiosk-create-dialog";
import { KioskCard } from "@/components/features/kiosks/kiosk-card";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateKiosk } from "@/hooks/kiosks/use-create-kiosk";
import { isStatusFilter, useKiosks } from "@/hooks/kiosks/use-kiosks";
import { hasPermission, hasScopedPermission } from "@/lib/rbac";
import type { KioskStatusFilter } from "@/types";

const STATUS_OPTIONS: { value: KioskStatusFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả vòng đời" },
  { value: "Provisioning", label: "Đang cấu hình" },
  { value: "Active", label: "Đã kích hoạt" },
  { value: "Disabled", label: "Đã vô hiệu hóa" },
  { value: "Retired", label: "Ngừng sử dụng" },
];

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
  const searchParams = useSearchParams();
  const organizationId = searchParams.get("organizationId");
  const deploymentReleaseId = searchParams.get("releaseId");
  const [isDeviceCatalogOpen, setIsDeviceCatalogOpen] = useState(false);
  const {
    kiosks,
    locations,
    filters,
    isLoading,
    errorMessage,
    metadataWarning,
    scopedCount,
    effectiveAccess,
    setSearchTerm,
    setStatusFilter,
    setLocationFilter,
    clearFilters,
    refresh,
  } = useKiosks({ organizationId });
  const createKiosk = useCreateKiosk({ onCreated: refresh });
  const canCreateKiosk = hasPermission(effectiveAccess, "kiosks.manage");
  const canManageDeviceCatalog = hasPermission(
    effectiveAccess,
    "device-catalog.manage",
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Đội kiosk"
        description="Theo dõi vòng đời, trạng thái vận hành và mở hồ sơ từng máy để kiểm tra heartbeat, thiết bị và lịch sử sự kiện."
        metadata={
          organizationId ? (
            <span className="text-xs font-medium text-primary">
              Đang giới hạn theo tổ chức của bản phát hành được chọn
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {scopedCount.toLocaleString("vi-VN")} kiosk trong phạm vi được cấp
            </span>
          )
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeviceCatalogOpen(true)}
            >
              <Cpu className="size-4" aria-hidden="true" />
              Danh mục thiết bị
            </Button>
            {canCreateKiosk ? (
              <Button size="sm" onClick={createKiosk.open}>
                <Plus className="size-4" aria-hidden="true" />
                Tạo kiosk
              </Button>
            ) : null}
          </>
        }
      />

      {metadataWarning ? (
        <div
          className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3"
          role="status"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
            <p className="text-xs font-medium text-warning">
              {metadataWarning}
            </p>
          </div>
        </div>
      ) : null}

      {organizationId ? (
        <div
          className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm"
          role="status"
        >
          Danh sách đang giới hạn trong tổ chức của bản phát hành đã chọn. Chọn
          một kiosk để tiếp tục triển khai.
        </div>
      ) : null}

      <Card className="gap-0 border-border/80 bg-card py-0 shadow-none">
        <CardHeader className="border-b border-border px-4 py-3.5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <SlidersHorizontal className="size-4" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <CardTitle className="text-sm">Bộ lọc đội máy</CardTitle>
              <CardDescription>
                <span className="tabular-nums font-medium text-foreground">
                  {kiosks.length}
                </span>{" "}
                /{" "}
                <span className="tabular-nums font-medium text-foreground">
                  {scopedCount}
                </span>{" "}
                kiosk
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 bg-muted/10 p-3">
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-[minmax(280px,1fr)_220px_240px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                type="search"
                value={filters.searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm kiosk ID, tên máy hoặc địa điểm..."
                className="h-9 bg-card pl-9"
                aria-label="Tìm kiosk"
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
              <SelectTrigger
                className="h-9 w-full bg-card"
                aria-label="Lọc kiosk theo vòng đời"
              >
                <SelectValue>
                  {STATUS_OPTIONS.find(
                    (option) => option.value === filters.status,
                  )?.label ?? "Tất cả vòng đời"}
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

            <Select
              value={filters.locationId}
              onValueChange={setLocationFilter}
            >
              <SelectTrigger
                className="h-9 w-full bg-card"
                aria-label="Lọc kiosk theo địa điểm"
              >
                <SelectValue>
                  {filters.locationId === "ALL"
                    ? "Tất cả địa điểm"
                    : (locations.find(
                        (location) =>
                          location.locationId === filters.locationId,
                      )?.locationName ?? "Tất cả địa điểm")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả địa điểm</SelectItem>
                {locations.map((location) => (
                  <SelectItem
                    key={location.locationId}
                    value={location.locationId}
                  >
                    {location.locationName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-[1fr_auto] gap-2 md:flex lg:justify-end">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Xóa lọc
              </Button>
              <Button
                variant="secondary"
                size="icon-sm"
                className="size-9 shrink-0"
                onClick={() => void refresh()}
                aria-label="Tải lại dữ liệu kiosk"
              >
                <RefreshCw className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Trạng thái đội máy
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <StatusLegend className="bg-primary" label="Vòng đời: hoạt động" />
            <StatusLegend className="bg-warning" label="Vận hành: bảo trì" />
            <StatusLegend
              className="bg-destructive"
              label="Vòng đời: vô hiệu hóa"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card
                key={`kiosk-skeleton-${index}`}
                className="border-border/80 shadow-none"
              >
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
              <Button variant="outline" onClick={() => void refresh()}>
                Thử lại
              </Button>
            </CardContent>
          </Card>
        ) : kiosks.length === 0 ? (
          <Card className="border-dashed border-2 border-border/80 bg-muted/5 shadow-none">
            <CardContent className="flex flex-col items-center gap-4 px-10 py-16 text-center">
              <span className="flex size-14 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm">
                <Search className="size-6 opacity-70" />
              </span>
              <div className="space-y-1.5">
                <p className="text-base font-semibold tracking-tight text-foreground">
                  Không tìm thấy Kiosk
                </p>
                <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
                  Không có Kiosk nào phù hợp với bộ lọc hiện tại. Thử thay đổi
                  từ khóa, trạng thái hoặc địa điểm để xem kết quả.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {kiosks.map((kiosk) => (
              <KioskCard
                key={kiosk.kioskId}
                kiosk={kiosk}
                deploymentReleaseId={deploymentReleaseId}
                canDeployConfiguration={hasScopedPermission(
                  effectiveAccess,
                  "release.deploy",
                  {
                    organizationId: kiosk.organizationId,
                    storeId: kiosk.locationId,
                    kioskId: kiosk.managementId,
                  },
                )}
              />
            ))}
          </div>
        )}
      </section>

      <DeviceCatalogDialog
        open={isDeviceCatalogOpen}
        onOpenChange={setIsDeviceCatalogOpen}
        canManage={canManageDeviceCatalog}
      />
      <KioskCreateDialog createKiosk={createKiosk} />
    </div>
  );
}
