"use client";

import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  Boxes,
  Cpu,
  MapPin,
  PackageOpen,
  PackagePlus,
  SlidersHorizontal,
} from "lucide-react";

import {
  formatInventoryDate,
  formatInventoryQuantity,
  getInventoryLevelClassName,
  getInventoryLevelLabel,
  getInventoryPercentage,
} from "@/components/features/inventory/inventory-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AdjustDispenserEstimateRequest,
  DispenserStateResult,
  IngredientLevelStatus,
  InventoryMutationKind,
  RefillDispenserRequest,
} from "@/types/inventory-management";

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
                Trạng thái bộ phân phối nguyên liệu.
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

const REPORTED_LEVEL_OPTIONS: {
  value: IngredientLevelStatus;
  label: string;
}[] = [
  { value: "Full", label: "Đầy" },
  { value: "Medium", label: "Trung bình" },
  { value: "Low", label: "Sắp hết" },
  { value: "Unknown", label: "Chưa xác định" },
];

interface InventoryMutationDialogProps {
  dispenser: DispenserStateResult;
  kind: InventoryMutationKind;
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmitRefill: (request: RefillDispenserRequest) => Promise<boolean>;
  onSubmitAdjustment: (
    request: AdjustDispenserEstimateRequest,
  ) => Promise<boolean>;
}

export function InventoryMutationDialog({
  dispenser,
  kind,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onSubmitRefill,
  onSubmitAdjustment,
}: InventoryMutationDialogProps) {
  const [quantity, setQuantity] = useState("");
  const [reasonCode, setReasonCode] = useState("");
  const [reportedLevelAfter, setReportedLevelAfter] = useState<
    IngredientLevelStatus | "UNCHANGED"
  >("UNCHANGED");
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );

  const isRefill = kind === "refill";
  const fieldLabel = isRefill ? "Lượng refill" : "Lượng ước tính mới";
  const title = isRefill ? "Ghi nhận refill" : "Điều chỉnh lượng ước tính";
  const Icon = isRefill ? PackagePlus : SlidersHorizontal;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const parsedQuantity = Number(quantity);
    if (!quantity.trim() || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setValidationMessage(`${fieldLabel} phải là một số lớn hơn 0.`);
      return;
    }

    setValidationMessage(null);
    const normalizedReasonCode = reasonCode.trim() || null;

    if (isRefill) {
      await onSubmitRefill({
        quantity: parsedQuantity,
        reportedLevelAfter:
          reportedLevelAfter === "UNCHANGED" ? null : reportedLevelAfter,
        reasonCode: normalizedReasonCode,
      });
      return;
    }

    await onSubmitAdjustment({
      estimatedQuantity: parsedQuantity,
      reasonCode: normalizedReasonCode,
    });
  };

  const visibleError = validationMessage || errorMessage;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        showCloseButton={!isSubmitting}
      >
        <DialogHeader>
          <div className="flex items-start gap-3 pr-8">
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${
                isRefill
                  ? "border-success/20 bg-success/10 text-success"
                  : "border-primary/20 bg-primary/10 text-primary"
              }`}
            >
              <Icon className="size-5" />
            </span>
            <div className="space-y-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                {dispenser.ingredientName} · {dispenser.containerCode}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Lượng hiện tại</span>
              <span className="font-medium tabular-nums text-foreground">
                {formatInventoryQuantity(
                  dispenser.estimatedQuantity,
                  dispenser.unit,
                )}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="inventory-quantity" className="text-sm font-medium">
              {fieldLabel} ({dispenser.unit})
              <span className="ml-1 text-destructive">*</span>
            </label>
            <Input
              id="inventory-quantity"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              autoFocus
              value={quantity}
              disabled={isSubmitting}
              aria-invalid={Boolean(validationMessage)}
              placeholder="Nhập số lượng lớn hơn 0"
              className="h-10"
              onChange={(event) => {
                setQuantity(event.target.value);
                if (validationMessage) {
                  setValidationMessage(null);
                }
              }}
            />
          </div>

          {isRefill ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Trạng thái sau refill
                <span className="ml-1 font-normal text-muted-foreground">
                  (không bắt buộc)
                </span>
              </label>
              <Select
                value={reportedLevelAfter}
                disabled={isSubmitting}
                onValueChange={(value) => {
                  if (
                    value === "UNCHANGED" ||
                    REPORTED_LEVEL_OPTIONS.some(
                      (option) => option.value === value,
                    )
                  ) {
                    setReportedLevelAfter(
                      value as IngredientLevelStatus | "UNCHANGED",
                    );
                  }
                }}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue>
                    {reportedLevelAfter === "UNCHANGED"
                      ? "Giữ nguyên trạng thái hiện tại"
                      : getInventoryLevelLabel(reportedLevelAfter)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNCHANGED">
                    Giữ nguyên trạng thái hiện tại
                  </SelectItem>
                  {REPORTED_LEVEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label htmlFor="inventory-reason" className="text-sm font-medium">
              Mã lý do
              <span className="ml-1 font-normal text-muted-foreground">
                (không bắt buộc)
              </span>
            </label>
            <Input
              id="inventory-reason"
              value={reasonCode}
              disabled={isSubmitting}
              maxLength={100}
              placeholder={isRefill ? "Ví dụ: REFILL" : "Ví dụ: ADJUST"}
              className="h-10 font-mono"
              onChange={(event) => setReasonCode(event.target.value)}
            />
          </div>

          {visibleError ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{visibleError}</p>
            </div>
          ) : null}

          <DialogFooter className="mt-1">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              <Icon className="size-4" />
              {isRefill ? "Xác nhận refill" : "Lưu điều chỉnh"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
