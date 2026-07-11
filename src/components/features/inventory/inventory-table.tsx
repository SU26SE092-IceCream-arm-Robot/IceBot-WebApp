import { Eye, History, PackagePlus, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  DispenserStateResult,
  IngredientLevelStatus,
  StockMovementResult,
} from "@/types/inventory-management";

const LEVEL_LABELS: Record<IngredientLevelStatus, string> = {
  Unknown: "Chưa xác định",
  Low: "Sắp hết",
  Medium: "Trung bình",
  Full: "Đầy",
};

const LEVEL_CLASS_NAMES: Record<IngredientLevelStatus, string> = {
  Unknown: "border-border bg-muted/20 text-muted-foreground",
  Low: "border-destructive bg-destructive/15 text-destructive font-medium",
  Medium: "border-primary/20 bg-primary/10 text-primary",
  Full: "border-success/20 bg-success/10 text-success",
};

const PROGRESS_CLASS_NAMES: Record<IngredientLevelStatus, string> = {
  Unknown: "bg-muted-foreground/40",
  Low: "bg-destructive",
  Medium: "bg-primary",
  Full: "bg-success",
};

export function getInventoryLevelLabel(
  status: IngredientLevelStatus,
): string {
  return LEVEL_LABELS[status];
}

export function getInventoryLevelClassName(
  status: IngredientLevelStatus,
): string {
  return LEVEL_CLASS_NAMES[status];
}

export function getInventoryPercentage(
  state: DispenserStateResult,
): number | null {
  if (
    state.estimatedQuantity === null ||
    state.estimatedQuantity === undefined ||
    state.capacityQuantity === null ||
    state.capacityQuantity === undefined ||
    state.capacityQuantity <= 0
  ) {
    return null;
  }

  return Math.round(
    Math.min(Math.max(state.estimatedQuantity / state.capacityQuantity, 0), 1) *
      100,
  );
}

export function formatInventoryQuantity(
  value: number | null | undefined,
  unit: string,
): string {
  if (value === null || value === undefined) {
    return "Chưa có";
  }

  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 2,
  }).format(value)} ${unit}`;
}

export function formatInventoryDate(value: string | null | undefined): string {
  if (!value) {
    return "Chưa có";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function InventoryLevelBadge({
  status,
}: {
  status: IngredientLevelStatus;
}) {
  return (
    <Badge
      variant="outline"
      className={`h-6 rounded-full px-2.5 ${getInventoryLevelClassName(status)}`}
    >
      {getInventoryLevelLabel(status)}
    </Badge>
  );
}

function InventoryProgress({ state }: { state: DispenserStateResult }) {
  const percentage = getInventoryPercentage(state);

  if (percentage === null) {
    return <span className="text-xs text-muted-foreground">Chưa có dữ liệu</span>;
  }

  return (
    <div className="flex min-w-28 items-center gap-2">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={`Mức tồn ${state.ingredientName}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <div
          className={`h-full rounded-full transition-[width] ${PROGRESS_CLASS_NAMES[state.currentLevelStatus]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
        {percentage}%
      </span>
    </div>
  );
}

interface InventoryTableProps {
  dispensers: DispenserStateResult[];
  onViewDetail: (dispenser: DispenserStateResult) => void;
  onViewHistory: (dispenser: DispenserStateResult) => void;
  onRefill: (dispenser: DispenserStateResult) => void;
  onAdjustEstimate: (dispenser: DispenserStateResult) => void;
}

export function InventoryTable({
  dispensers,
  onViewDetail,
  onViewHistory,
  onRefill,
  onAdjustEstimate,
}: InventoryTableProps) {
  return (
    <Table className="min-w-[1120px] table-fixed">
      <TableHeader className="bg-muted/40">
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[22%] px-4 text-xs text-muted-foreground">
            Nguyên liệu
          </TableHead>
          <TableHead className="w-[15%] text-xs text-muted-foreground">
            Kiosk
          </TableHead>
          <TableHead className="w-[12%] text-right text-xs text-muted-foreground">
            Hiện tại
          </TableHead>
          <TableHead className="w-[12%] text-right text-xs text-muted-foreground">
            Sức chứa
          </TableHead>
          <TableHead className="w-[16%] text-xs text-muted-foreground">
            Tỷ lệ
          </TableHead>
          <TableHead className="w-[11%] text-center text-xs text-muted-foreground">
            Trạng thái
          </TableHead>
          <TableHead className="w-[9%] text-center text-xs text-muted-foreground">
            Cập nhật
          </TableHead>
          <TableHead className="w-[11%] px-4 text-center text-xs text-muted-foreground">
            Thao tác
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dispensers.map((dispenser) => (
          <TableRow key={dispenser.id} className="hover:bg-muted/40">
            <TableCell className="h-16 px-4 py-2.5">
              <div className="min-w-0 space-y-0.5">
                <p className="truncate font-medium text-foreground">
                  {dispenser.ingredientName}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {dispenser.ingredientCode} · {dispenser.containerCode}
                </p>
              </div>
            </TableCell>
            <TableCell className="py-2.5">
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm text-foreground">
                  {dispenser.kioskName?.trim() || "Chưa gán kiosk"}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {dispenser.deviceCode}
                </p>
              </div>
            </TableCell>
            <TableCell className="py-2.5 text-right tabular-nums">
              {formatInventoryQuantity(
                dispenser.estimatedQuantity,
                dispenser.unit,
              )}
            </TableCell>
            <TableCell className="py-2.5 text-right tabular-nums text-muted-foreground">
              {formatInventoryQuantity(
                dispenser.capacityQuantity,
                dispenser.unit,
              )}
            </TableCell>
            <TableCell className="py-2.5">
              <InventoryProgress state={dispenser} />
            </TableCell>
            <TableCell className="py-2.5 text-center">
              <div className="flex justify-center">
                <InventoryLevelBadge status={dispenser.currentLevelStatus} />
              </div>
            </TableCell>
            <TableCell className="py-2.5 text-center text-xs tabular-nums text-muted-foreground">
              {formatInventoryDate(dispenser.lastMeasuredAt)}
            </TableCell>
            <TableCell className="px-4 py-2.5 text-center">
              <div className="flex items-center justify-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-lg text-success hover:bg-success/10 hover:text-success"
                  title={`Ghi nhận refill ${dispenser.ingredientName}`}
                  aria-label={`Ghi nhận refill ${dispenser.ingredientName}`}
                  onClick={() => onRefill(dispenser)}
                >
                  <PackagePlus className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-lg text-primary hover:bg-primary/10 hover:text-primary"
                  title={`Điều chỉnh lượng ước tính ${dispenser.ingredientName}`}
                  aria-label={`Điều chỉnh lượng ước tính ${dispenser.ingredientName}`}
                  onClick={() => onAdjustEstimate(dispenser)}
                >
                  <SlidersHorizontal className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-lg text-warning hover:bg-warning/10 hover:text-warning"
                  title={`Xem lịch sử ${dispenser.ingredientName}`}
                  aria-label={`Xem lịch sử ${dispenser.ingredientName}`}
                  onClick={() => onViewHistory(dispenser)}
                >
                  <History className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  title={`Xem chi tiết ${dispenser.ingredientName}`}
                  aria-label={`Xem chi tiết ${dispenser.ingredientName}`}
                  onClick={() => onViewDetail(dispenser)}
                >
                  <Eye className="size-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function StockMovementsTable({
  movements,
}: {
  movements: StockMovementResult[];
}) {
  return (
    <Table className="min-w-[860px] table-fixed">
      <TableHeader className="bg-muted/40">
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[25%] px-4 text-xs text-muted-foreground">
            Nguyên liệu
          </TableHead>
          <TableHead className="w-[18%] text-xs text-muted-foreground">
            Kiosk
          </TableHead>
          <TableHead className="w-[15%] text-center text-xs text-muted-foreground">
            Loại biến động
          </TableHead>
          <TableHead className="w-[14%] text-right text-xs text-muted-foreground">
            Số lượng
          </TableHead>
          <TableHead className="w-[14%] text-right text-xs text-muted-foreground">
            Sau biến động
          </TableHead>
          <TableHead className="w-[14%] px-4 text-center text-xs text-muted-foreground">
            Thời gian
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((movement) => (
          <TableRow key={movement.id} className="hover:bg-muted/40">
            <TableCell className="h-14 px-4 py-2">
              <div className="space-y-0.5">
                <p className="truncate font-medium text-foreground">
                  {movement.ingredientName?.trim() || "Không có tên nguyên liệu"}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {movement.containerCode}
                </p>
              </div>
            </TableCell>
            <TableCell className="truncate py-2 text-muted-foreground">
              {movement.kioskName?.trim() || "Chưa gán kiosk"}
            </TableCell>
            <TableCell className="py-2 text-center">
              <Badge variant="outline" className="bg-background font-mono text-xs">
                {movement.movementType}
              </Badge>
            </TableCell>
            <TableCell className="py-2 text-right font-medium tabular-nums">
              {formatInventoryQuantity(movement.quantity, movement.unit)}
            </TableCell>
            <TableCell className="py-2 text-right tabular-nums text-muted-foreground">
              {formatInventoryQuantity(movement.balanceAfter, movement.unit)}
            </TableCell>
            <TableCell className="px-4 py-2 text-center text-xs tabular-nums text-muted-foreground">
              {formatInventoryDate(movement.occurredAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
