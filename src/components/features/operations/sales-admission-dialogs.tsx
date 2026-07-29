"use client";

import { useState, type FormEvent } from "react";
import { AlertTriangle, CirclePause, CirclePlay } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  KioskOperationalState,
  SetKioskOperationalStateRequest,
} from "@/types/kiosk-management";
import { getKioskOperationalLabel } from "@/lib/presenters/kiosk-state-labels";

const OPERATIONAL_STATE_OPTIONS: Array<{
  value: KioskOperationalState;
  label: string;
}> = [
  "Operational",
  "PausedByOperator",
  "Maintenance",
  "Cleaning",
  "Restocking",
  "EmergencyStopRequested",
  "OutOfService",
].map((value) => ({
  value: value as KioskOperationalState,
  label: getKioskOperationalLabel(value),
}));

function ErrorMessage({ message }: { message: string | null }) {
  return message ? (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <p>{message}</p>
    </div>
  ) : null;
}

interface StoreSalesAdmissionDialogProps {
  storeName: string;
  isPaused: boolean;
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onPause: (request: { reason: string; resumeAt?: string | null }) => Promise<boolean>;
  onResume: () => Promise<boolean>;
}

export function StoreSalesAdmissionDialog({
  storeName,
  isPaused,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onPause,
  onResume,
}: StoreSalesAdmissionDialogProps) {
  const [reason, setReason] = useState("");
  const [resumeAt, setResumeAt] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (isPaused) {
      await onResume();
      return;
    }

    const normalizedReason = reason.trim();
    if (!normalizedReason || normalizedReason.length > 500) {
      setValidationMessage("Lý do là bắt buộc và không vượt quá 500 ký tự.");
      return;
    }

    let normalizedResumeAt: string | null = null;
    if (resumeAt) {
      const date = new Date(resumeAt);
      if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
        setValidationMessage("Thời gian tự tiếp tục phải ở trong tương lai.");
        return;
      }
      normalizedResumeAt = date.toISOString();
    }

    setValidationMessage(null);
    await onPause({ reason: normalizedReason, resumeAt: normalizedResumeAt });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>
              {isPaused ? "Tiếp tục nhận đơn mới" : "Tạm dừng nhận đơn mới"}
            </DialogTitle>
            <DialogDescription>
              {isPaused
                ? `Cho phép ${storeName} tiếp nhận đơn hàng mới trở lại.`
                : `Ngăn ${storeName} tiếp nhận đơn mới trong thời gian tạm dừng.`}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
            Thao tác này không hủy đơn đã thanh toán hoặc công việc đang được xử lý.
          </div>

          {!isPaused ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sales-pause-reason">Lý do</Label>
                <textarea
                  id="sales-pause-reason"
                  className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                  value={reason}
                  maxLength={500}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Ví dụ: Tạm dừng nhận đơn để kiểm tra vận hành"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sales-resume-at">Tự tiếp tục lúc (không bắt buộc)</Label>
                <Input
                  id="sales-resume-at"
                  type="datetime-local"
                  value={resumeAt}
                  onChange={(event) => setResumeAt(event.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          ) : null}

          <ErrorMessage message={validationMessage ?? errorMessage} />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" variant={isPaused ? "default" : "destructive"} disabled={isSubmitting}>
              {isPaused ? <CirclePlay className="size-4" /> : <CirclePause className="size-4" />}
              {isSubmitting
                ? "Đang xử lý..."
                : isPaused
                  ? "Tiếp tục nhận đơn"
                  : "Tạm dừng nhận đơn"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface KioskOperationalStateDialogProps {
  kioskName: string;
  currentState: KioskOperationalState;
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (request: SetKioskOperationalStateRequest) => Promise<boolean>;
}

export function KioskOperationalStateDialog({
  kioskName,
  currentState,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onSubmit,
}: KioskOperationalStateDialogProps) {
  const [state, setState] = useState<KioskOperationalState>(currentState);
  const [reason, setReason] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const normalizedReason = reason.trim();
    if (!normalizedReason || normalizedReason.length > 500) {
      setValidationMessage("Lý do là bắt buộc và không vượt quá 500 ký tự.");
      return;
    }

    setValidationMessage(null);
    await onSubmit({ state, reason: normalizedReason });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái vận hành</DialogTitle>
            <DialogDescription>
              Chọn trạng thái quản lý mới cho {kioskName}. Trạng thái kết nối được theo dõi riêng.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="kiosk-operational-state">Trạng thái</Label>
            <Select
              value={state}
              onValueChange={(value) => setState(value as KioskOperationalState)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="kiosk-operational-state" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPERATIONAL_STATE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kiosk-operational-reason">Lý do</Label>
            <textarea
              id="kiosk-operational-reason"
              className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              value={reason}
              maxLength={500}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ghi rõ lý do thay đổi trạng thái"
              disabled={isSubmitting}
            />
          </div>

          <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
            Thay đổi trạng thái sẽ dừng nhận công việc mới khi kiosk không còn ở trạng thái vận hành; đơn đã nhận vẫn giữ vòng đời riêng.
          </div>

          {state === "EmergencyStopRequested" ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              Hệ thống chỉ ghi nhận yêu cầu dừng khẩn cấp; đây chưa phải bằng chứng thiết bị hoặc robot đã dừng vật lý.
            </div>
          ) : null}

          <ErrorMessage message={validationMessage ?? errorMessage} />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting || state === currentState}>
              {isSubmitting ? "Đang cập nhật..." : "Cập nhật trạng thái"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
