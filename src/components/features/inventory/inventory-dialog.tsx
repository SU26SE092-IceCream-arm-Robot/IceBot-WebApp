"use client";

import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Cpu,
  History,
  MapPin,
  PackageOpen,
  PackagePlus,
  RefreshCw,
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
import { useDispenserHistory } from "@/hooks/use-dispenser-history";
import type {
  AdjustDispenserEstimateRequest,
  DispenserHistoryResult,
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

function formatOptionalQuantity(
  value: number | null | undefined,
  unit: string | null | undefined,
): string {
  return formatInventoryQuantity(value, unit?.trim() || "gram");
}

const EVENT_KIND_LABELS: Record<string, string> = {
  StockMovement: "Biến động tồn kho",
  TopologyChange: "Cấu hình bộ phân phối",
  TopologyRebind: "Chuyển liên kết",
};

const ACTION_LABELS: Record<string, string> = {
  Refill: "Nạp thêm",
  Consume: "Tiêu thụ",
  AdjustEstimate: "Điều chỉnh ước tính",
  TransferIn: "Chuyển vào",
  TransferOut: "Chuyển ra",
  Created: "Tạo cấu hình",
  Updated: "Cập nhật cấu hình",
  Retired: "Ngừng sử dụng",
  Deleted: "Xóa cấu hình",
  ReboundIn: "Nhận chuyển liên kết",
  ReboundOut: "Chuyển liên kết đi",
};

function getEventKindLabel(kind: string): string {
  return EVENT_KIND_LABELS[kind] ?? kind;
}

function getActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

function formatActor(event: DispenserHistoryResult): string {
  if (event.actorName?.trim()) {
    return event.actorEmail?.trim()
      ? `${event.actorName} · ${event.actorEmail}`
      : event.actorName;
  }

  if (event.actorEmail?.trim()) {
    return event.actorEmail;
  }

  if (event.actorType === "ExecutionEndpoint") {
    return "Edge/robot runtime";
  }

  if (event.actorType === "Account") {
    return "Tài khoản hệ thống";
  }

  return "Hệ thống";
}

function formatActiveTransition(event: DispenserHistoryResult): string | null {
  if (event.activeBefore == null && event.activeAfter == null) {
    return null;
  }

  const formatValue = (value: boolean | null | undefined) => {
    if (value === true) return "Đang hoạt động";
    if (value === false) return "Tạm ngưng";
    return "Chưa có";
  };

  return `${formatValue(event.activeBefore)} → ${formatValue(event.activeAfter)}`;
}

function DispenserHistoryItem({ event }: { event: DispenserHistoryResult }) {
  const activeTransition = formatActiveTransition(event);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-muted/20">
              {getEventKindLabel(event.eventKind)}
            </Badge>
            <Badge variant="outline" className="bg-background font-mono text-xs">
              {getActionLabel(event.action)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatInventoryDate(event.occurredAt)}
          </p>
        </div>
        <p className="max-w-full break-words text-sm text-muted-foreground sm:max-w-64 sm:text-right">
          {formatActor(event)}
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {event.quantityDelta !== null && event.quantityDelta !== undefined ? (
          <DetailField
            label="Số lượng thay đổi"
            value={formatOptionalQuantity(event.quantityDelta, event.unit)}
            mono
          />
        ) : null}
        {event.quantityBefore != null || event.quantityAfter != null ? (
          <DetailField
            label="Tồn trước / sau"
            value={`${formatOptionalQuantity(event.quantityBefore, event.unit)} → ${formatOptionalQuantity(event.quantityAfter, event.unit)}`}
            mono
          />
        ) : null}
        {event.capacityBefore != null || event.capacityAfter != null ? (
          <DetailField
            label="Sức chứa trước / sau"
            value={`${formatOptionalQuantity(event.capacityBefore, event.unit)} → ${formatOptionalQuantity(event.capacityAfter, event.unit)}`}
            mono
          />
        ) : null}
        {activeTransition ? (
          <DetailField label="Trạng thái hoạt động" value={activeTransition} />
        ) : null}
        {event.reason?.trim() ? (
          <DetailField label="Lý do" value={event.reason} />
        ) : null}
        {event.relatedDispenserStateId ? (
          <DetailField
            label="Bộ phân phối liên quan"
            value={event.relatedDispenserStateId}
            mono
          />
        ) : null}
      </div>
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
                  label="Kiosk liên kết"
                  value={dispenser.kioskId ? "Đã liên kết" : "Chưa có"}
                />
                <DetailField
                  label="Mã thiết bị"
                  value={dispenser.deviceCode}
                  mono
                />
                <DetailField
                  label="Thiết bị liên kết"
                  value={dispenser.deviceId ? "Đã liên kết" : "Chưa có"}
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
                  label="Nạp thêm gần nhất"
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

interface InventoryHistoryDialogProps {
  dispenser: DispenserStateResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InventoryHistoryDialog({
  dispenser,
  open,
  onOpenChange,
}: InventoryHistoryDialogProps) {
  const history = useDispenserHistory(dispenser?.kioskId, dispenser?.id, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-8">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-warning/20 bg-warning/10 text-warning">
              <History className="size-5" />
            </span>
            <div className="space-y-1">
              <DialogTitle>Lịch sử bộ phân phối</DialogTitle>
              <DialogDescription>
                {dispenser
                  ? `${dispenser.ingredientName} · ${dispenser.containerCode}`
                  : "Theo dõi các biến động và thay đổi cấu hình."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!dispenser ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Chưa chọn bộ phân phối để xem lịch sử.
          </p>
        ) : history.isLoading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`history-loading-${index}`}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="h-4 w-48 animate-pulse rounded bg-muted/60" />
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="h-14 animate-pulse rounded-lg bg-muted/40" />
                  <div className="h-14 animate-pulse rounded-lg bg-muted/40" />
                </div>
              </div>
            ))}
          </div>
        ) : history.errorMessage ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-4 rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-10 text-center text-destructive"
          >
            <AlertCircle className="size-6" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Không thể tải lịch sử</p>
              <p className="max-w-lg text-sm text-destructive/80">
                {history.errorMessage}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void history.refresh()}>
              <RefreshCw className="size-4" />
              Thử lại
            </Button>
          </div>
        ) : history.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted/10 px-6 py-12 text-center">
            <History className="mb-3 size-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Chưa có lịch sử biến động
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Bộ phân phối này chưa ghi nhận nạp thêm, điều chỉnh, tiêu thụ hoặc
              thay đổi cấu hình.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.data.map((event) => (
              <DispenserHistoryItem key={event.eventId} event={event} />
            ))}
          </div>
        )}

        {dispenser ? (
          <DialogFooter className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Trang{" "}
              <span className="font-medium tabular-nums text-foreground">
                {history.pagination.page}
              </span>{" "}
              /{" "}
              <span className="font-medium tabular-nums text-foreground">
                {Math.max(history.pagination.totalPages, 1)}
              </span>
              {" · "}
              <span className="font-medium tabular-nums text-foreground">
                {history.pagination.totalCount}
              </span>{" "}
              dòng lịch sử
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!history.pagination.hasPrevious || history.isLoading}
                onClick={history.previousPage}
              >
                <ChevronLeft className="size-4" />
                Trước
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!history.pagination.hasNext || history.isLoading}
                onClick={history.nextPage}
              >
                Sau
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </DialogFooter>
        ) : null}
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
  const fieldLabel = isRefill ? "Lượng nạp thêm" : "Lượng ước tính mới";
  const title = isRefill ? "Ghi nhận nạp thêm" : "Điều chỉnh lượng ước tính";
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
                Trạng thái sau khi nạp thêm
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
              placeholder={isRefill ? "Ví dụ: NAP_THEM" : "Ví dụ: DIEU_CHINH"}
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
              {isRefill ? "Xác nhận nạp thêm" : "Lưu điều chỉnh"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
