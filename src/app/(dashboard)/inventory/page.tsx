"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  PackageCheck,
  RefreshCw,
  Search,
  SlidersHorizontal,
  TriangleAlert,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

import {
  InventoryDetailDialog,
  InventoryHistoryDialog,
  InventoryMutationDialog,
} from "@/components/features/inventory/inventory-dialog";
import {
  InventoryTable,
  StockMovementsTable,
} from "@/components/features/inventory/inventory-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { useInventory } from "@/hooks/use-inventory";
import type {
  DispenserStateResult,
  InventoryStatusFilter,
} from "@/types/inventory-management";

const STATUS_OPTIONS: {
  value: InventoryStatusFilter;
  label: string;
}[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "Full", label: "Đầy" },
  { value: "Medium", label: "Trung bình" },
  { value: "Low", label: "Sắp hết" },
  { value: "Unknown", label: "Chưa xác định" },
];

function isInventoryStatusFilter(
  value: string | null,
): value is InventoryStatusFilter {
  return STATUS_OPTIONS.some((option) => option.value === value);
}

type StatTone = "primary" | "success" | "warning" | "muted";

const STAT_TONES: Record<StatTone, string> = {
  primary: "border-primary/20 bg-primary/10 text-primary",
  success: "border-success/20 bg-success/10 text-success",
  warning: "border-warning/20 bg-warning/10 text-warning",
  muted: "border-border bg-muted/20 text-muted-foreground",
};

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: StatTone;
}) {
  return (
    <Card className="rounded-xl border border-border/80 bg-card py-0 shadow-none">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${STAT_TONES[tone]}`}
          >
            <Icon className="size-5" strokeWidth={1.8} />
          </span>
        </div>
        <p className="mt-3 text-3xl font-semibold leading-none tracking-tight tabular-nums text-foreground">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function TableLoading({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-1 px-4 py-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={`inventory-skeleton-${index}`}
          className="grid grid-cols-6 items-center gap-4 border-b border-border py-4 last:border-0"
        >
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-muted/60" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted/40" />
          </div>
          <div className="h-4 w-24 animate-pulse rounded bg-muted/40" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted/40" />
          <div className="h-2 w-full animate-pulse rounded bg-muted/50" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-muted/50" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted/40" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium text-destructive">
          Không thể tải dữ liệu
        </p>
        <p className="max-w-lg text-sm text-muted-foreground">{message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="size-4" />
        Thử lại
      </Button>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-full border border-border bg-muted/20 text-muted-foreground shadow-sm">
        <Warehouse className="size-6 opacity-70" />
      </span>
      <div className="max-w-md space-y-1.5">
        <p className="text-base font-semibold tracking-tight text-foreground">{title}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function PaginationFooter({
  page,
  totalPages,
  totalCount,
  hasPrevious,
  hasNext,
  isLoading,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
  isLoading: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 border-t border-border bg-muted/10 px-4 py-3 text-sm sm:flex-row sm:items-center">
      <p className="text-muted-foreground">
        Trang{" "}
        <span className="font-medium tabular-nums text-foreground">{page}</span>{" "}
        /{" "}
        <span className="font-medium tabular-nums text-foreground">
          {Math.max(totalPages, 1)}
        </span>
        {" · "}
        <span className="font-medium tabular-nums text-foreground">
          {totalCount}
        </span>{" "}
        bản ghi
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrevious || isLoading}
          onClick={onPrevious}
        >
          <ChevronLeft className="size-4" />
          Trước
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNext || isLoading}
          onClick={onNext}
        >
          Sau
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const [historyDispenser, setHistoryDispenser] =
    useState<DispenserStateResult | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const {
    dispensers,
    visibleDispensers,
    movements,
    stores,
    availableKiosks,
    filters,
    summary,
    lookupWarning,
    selectedDispenser,
    isDetailOpen,
    mutationDispenser,
    mutationKind,
    isMutationOpen,
    isMutationSubmitting,
    mutationErrorMessage,
    mutationSuccessMessage,
    setIngredientSearch,
    setStatusFilter,
    setStoreFilter,
    setKioskFilter,
    clearFilters,
    previousDispenserPage,
    nextDispenserPage,
    previousMovementPage,
    nextMovementPage,
    openDispenserDetail,
    setDetailOpen,
    openRefillDialog,
    openAdjustDialog,
    setMutationOpen,
    submitRefill,
    submitAdjustment,
    refresh,
  } = useInventory();

  const openDispenserHistory = (dispenser: DispenserStateResult) => {
    setHistoryDispenser(dispenser);
    setIsHistoryOpen(true);
  };

  const setHistoryOpen = (open: boolean) => {
    setIsHistoryOpen(open);
    if (!open) {
      setHistoryDispenser(null);
    }
  };

  const hasClientFilters =
    filters.ingredientSearch.trim().length > 0 || filters.status !== "ALL";
  const isRefreshing = dispensers.isLoading || movements.isLoading;

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Quản lý tồn kho
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Theo dõi lượng nguyên liệu trong từng bộ phân phối và lịch sử biến
            động theo phạm vi được cấp.
          </p>
        </div>
        <Button
          variant="outline"
          className="h-10 w-fit"
          isLoading={isRefreshing}
          onClick={() => void refresh()}
        >
          <RefreshCw className="size-4" />
          Làm mới
        </Button>
      </section>

      {lookupWarning ? (
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>{lookupWarning} Danh sách tồn kho vẫn có thể được tải riêng.</p>
        </div>
      ) : null}

      {mutationSuccessMessage ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success"
        >
          <CircleCheck className="mt-0.5 size-4 shrink-0" />
          <p>{mutationSuccessMessage}</p>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Boxes}
          label="Tổng bộ phân phối"
          value={summary.total}
          tone="primary"
        />
        <StatCard
          icon={TriangleAlert}
          label="Sắp hết"
          value={summary.lowOnPage}
          tone="warning"
        />
        <StatCard
          icon={PackageCheck}
          label="Đầy"
          value={summary.fullOnPage}
          tone="success"
        />
        <StatCard
          icon={CircleHelp}
          label="Chưa xác định"
          value={summary.unknownOnPage}
          tone="muted"
        />
      </section>

      <Card className="gap-0 rounded-xl border border-border/80 bg-card py-0 shadow-none">
        <CardHeader className="border-b border-border px-4 py-4">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <SlidersHorizontal className="size-5" />
            </span>
            <div className="space-y-0.5">
              <CardTitle className="text-base font-semibold">
                Bộ lọc tồn kho
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2 bg-muted/10 px-4 py-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_180px_220px_220px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.ingredientSearch}
              onChange={(event) => setIngredientSearch(event.target.value)}
              placeholder="Tìm nguyên liệu, khay hoặc thiết bị..."
              className="h-9 bg-card pl-9"
            />
          </div>

          <Select
            value={filters.status}
            onValueChange={(value) => {
              if (isInventoryStatusFilter(value)) {
                setStatusFilter(value);
              }
            }}
          >
            <SelectTrigger className="h-9 w-full bg-card">
              <SelectValue>
                {STATUS_OPTIONS.find(
                  (option) => option.value === filters.status,
                )?.label ?? "Tất cả trạng thái"}
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
            value={filters.storeId}
            onValueChange={(value) =>
              setStoreFilter(value === "ALL" ? null : value)
            }
          >
            <SelectTrigger className="h-9 w-full bg-card">
              <SelectValue>
                {filters.storeId === "ALL"
                  ? "Tất cả cửa hàng"
                  : stores.find((store) => store.id === filters.storeId)?.name ??
                    "Cửa hàng đã chọn"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả cửa hàng</SelectItem>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name} ({store.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.kioskId}
            onValueChange={(value) =>
              setKioskFilter(value === "ALL" ? null : value)
            }
          >
            <SelectTrigger className="h-9 w-full bg-card">
              <SelectValue>
                {filters.kioskId === "ALL"
                  ? "Tất cả kiosk"
                  : availableKiosks.find(
                        (kiosk) => kiosk.id === filters.kioskId,
                      )?.name ?? "Kiosk đã chọn"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả kiosk</SelectItem>
              {availableKiosks.map((kiosk) => (
                <SelectItem key={kiosk.id} value={kiosk.id}>
                  {kiosk.name} ({kiosk.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            className="h-9 border border-transparent px-3 text-muted-foreground hover:border-border hover:bg-card hover:text-foreground"
            onClick={clearFilters}
          >
            Xóa lọc
          </Button>
        </CardContent>
      </Card>

      <Card className="gap-0 rounded-xl border border-border/80 bg-card py-0 shadow-none">
        <CardHeader className="border-b border-border px-4 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <Warehouse className="size-5" />
              </span>
              <div className="space-y-0.5">
                <CardTitle className="text-base font-semibold">
                  Trạng thái nguyên liệu
                </CardTitle>
              </div>
            </div>
            <span className="w-fit rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground">
              <span className="font-medium tabular-nums text-foreground">
                {visibleDispensers.length}
              </span>{" "}
              dòng đang hiển thị
            </span>
          </div>
        </CardHeader>

        {dispensers.isLoading ? (
          <TableLoading />
        ) : dispensers.errorMessage ? (
          <ErrorState
            message={dispensers.errorMessage}
            onRetry={() => void refresh()}
          />
        ) : visibleDispensers.length === 0 ? (
          <EmptyState
            title={
              hasClientFilters
                ? "Không có nguyên liệu phù hợp"
                : "Chưa có dữ liệu tồn kho"
            }
            description={
              hasClientFilters
                ? "Thử thay đổi từ khóa hoặc trạng thái đang lọc."
                : "Chưa có trạng thái bộ phân phối."
            }
          />
        ) : (
          <InventoryTable
            dispensers={visibleDispensers}
            onViewDetail={openDispenserDetail}
            onViewHistory={openDispenserHistory}
            onRefill={openRefillDialog}
            onAdjustEstimate={openAdjustDialog}
          />
        )}

        <PaginationFooter
          page={dispensers.pagination.page}
          totalPages={dispensers.pagination.totalPages}
          totalCount={dispensers.pagination.totalCount}
          hasPrevious={dispensers.pagination.hasPrevious}
          hasNext={dispensers.pagination.hasNext}
          isLoading={dispensers.isLoading}
          onPrevious={previousDispenserPage}
          onNext={nextDispenserPage}
        />
      </Card>

      <Card className="gap-0 rounded-xl border border-border/80 bg-card py-0 shadow-none">
        <CardHeader className="border-b border-border px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-warning/20 bg-warning/10 text-warning">
              <RefreshCw className="size-5" />
            </span>
            <div className="space-y-0.5">
              <CardTitle className="text-base font-semibold">
                Biến động tồn kho gần đây
              </CardTitle>
            </div>
          </div>
        </CardHeader>

        {movements.isLoading ? (
          <TableLoading rows={4} />
        ) : movements.errorMessage ? (
          <ErrorState
            message={movements.errorMessage}
            onRetry={() => void refresh()}
          />
        ) : movements.data.length === 0 ? (
          <EmptyState
            title="Chưa có biến động tồn kho"
            description="Chưa ghi nhận biến động tồn kho."
          />
        ) : (
          <StockMovementsTable movements={movements.data} />
        )}

        <PaginationFooter
          page={movements.pagination.page}
          totalPages={movements.pagination.totalPages}
          totalCount={movements.pagination.totalCount}
          hasPrevious={movements.pagination.hasPrevious}
          hasNext={movements.pagination.hasNext}
          isLoading={movements.isLoading}
          onPrevious={previousMovementPage}
          onNext={nextMovementPage}
        />
      </Card>

      <InventoryDetailDialog
        dispenser={selectedDispenser}
        open={isDetailOpen}
        onOpenChange={setDetailOpen}
      />

      <InventoryHistoryDialog
        key={historyDispenser?.id ?? "inventory-history"}
        dispenser={historyDispenser}
        open={isHistoryOpen}
        onOpenChange={setHistoryOpen}
      />

      {mutationDispenser && mutationKind ? (
        <InventoryMutationDialog
          dispenser={mutationDispenser}
          kind={mutationKind}
          open={isMutationOpen}
          isSubmitting={isMutationSubmitting}
          errorMessage={mutationErrorMessage}
          onOpenChange={setMutationOpen}
          onSubmitRefill={submitRefill}
          onSubmitAdjustment={submitAdjustment}
        />
      ) : null}
    </div>
  );
}
