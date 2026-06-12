import { Boxes, Cpu, MapPin, PackageOpen } from "lucide-react";

import {
  formatInventoryDate,
  formatInventoryQuantity,
  getInventoryLevelClassName,
  getInventoryLevelLabel,
  getInventoryPercentage,
} from "@/components/features/inventory/inventory-table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DispenserStateResult } from "@/types/inventory-management";

function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1 rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`break-words text-sm font-medium text-foreground ${mono ? "font-mono tabular-nums" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

interface InventoryDetailDialogProps {
  dispenser: DispenserStateResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InventoryDetailDialog({
  dispenser,
  open,
  onOpenChange,
}: InventoryDetailDialogProps) {
  const percentage = dispenser ? getInventoryPercentage(dispenser) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-8">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <PackageOpen className="size-5" />
            </span>
            <div className="space-y-1">
              <DialogTitle>
                {dispenser?.ingredientName ?? "Chi tiết tồn kho"}
              </DialogTitle>
              <DialogDescription>
                Trạng thái bộ phân phối nguyên liệu từ Inventory Management API.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {dispenser ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-4">
              <Badge
                variant="outline"
                className={`h-6 rounded-full px-2.5 ${getInventoryLevelClassName(dispenser.currentLevelStatus)}`}
              >
                {getInventoryLevelLabel(dispenser.currentLevelStatus)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {percentage === null
                  ? "Chưa đủ dữ liệu để tính tỷ lệ"
                  : `${percentage}% sức chứa`}
              </span>
            </div>

            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <Boxes className="size-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Nguyên liệu và dung lượng
                </h3>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <DetailField
                  label="Mã nguyên liệu"
                  value={dispenser.ingredientCode}
                  mono
                />
                <DetailField
                  label="Mã khay chứa"
                  value={dispenser.containerCode}
                  mono
                />
                <DetailField
                  label="Lượng ước tính"
                  value={formatInventoryQuantity(
                    dispenser.estimatedQuantity,
                    dispenser.unit,
                  )}
                  mono
                />
                <DetailField
                  label="Sức chứa"
                  value={formatInventoryQuantity(
                    dispenser.capacityQuantity,
                    dispenser.unit,
                  )}
                  mono
                />
              </div>
            </section>

            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Vị trí và thiết bị
                </h3>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <DetailField
                  label="Kiosk"
                  value={dispenser.kioskName?.trim() || "Chưa gán kiosk"}
                />
                <DetailField
                  label="Kiosk ID"
                  value={dispenser.kioskId ?? "Chưa có"}
                  mono
                />
                <DetailField
                  label="Mã thiết bị"
                  value={dispenser.deviceCode}
                  mono
                />
                <DetailField
                  label="Device ID"
                  value={dispenser.deviceId}
                  mono
                />
              </div>
            </section>

            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <Cpu className="size-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Thời điểm ghi nhận
                </h3>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <DetailField
                  label="Đo gần nhất"
                  value={formatInventoryDate(dispenser.lastMeasuredAt)}
                  mono
                />
                <DetailField
                  label="Refill gần nhất"
                  value={formatInventoryDate(dispenser.lastRefilledAt)}
                  mono
                />
              </div>
            </section>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Không có dữ liệu tồn kho để hiển thị.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
