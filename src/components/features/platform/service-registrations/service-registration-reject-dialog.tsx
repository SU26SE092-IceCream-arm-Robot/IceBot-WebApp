"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type {
  ManagementServiceRegistrationDetail,
  RejectServiceRegistrationRequest,
} from "@/types/service-registrations";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ManagementServiceRegistrationDetail | null;
  loading: boolean;
  onReject: (id: string, request: RejectServiceRegistrationRequest) => Promise<void>;
}

export function ServiceRegistrationRejectDialog({
  open,
  onOpenChange,
  item,
  loading,
  onReject,
}: Props) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setReason("");
      setError(null);
    }
  }, [item]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!item) return;

    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Vui lòng nhập lý do từ chối đơn đăng ký.");
      return;
    }
    if (trimmed.length > 1000) {
      setError("Lý do từ chối không được vượt quá 1000 ký tự.");
      return;
    }

    try {
      await onReject(item.id, {
        reason: trimmed,
        expectedRevision: item.revision,
      });
    } catch {
      // Handled by toast
    }
  }

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-destructive">
              <XCircle className="size-5" />
              Từ chối Đơn đăng ký dịch vụ
            </DialogTitle>
            <DialogDescription>
              Đơn đăng ký <span className="font-semibold text-foreground">#{item.referenceCode}</span>{" "}
              sẽ được chuyển sang trạng thái Từ chối.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label htmlFor="rejectReason" className="text-sm font-medium text-foreground">
                Lý do từ chối <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="rejectReason"
                rows={4}
                maxLength={1000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập chi tiết lý do từ chối (thông tin không hợp lệ, không khả thi mặt bằng, v.v.)..."
                required
              />
            </div>

            {error ? (
              <p className="rounded border border-destructive/20 bg-destructive/10 p-2 text-xs text-destructive flex items-center gap-1.5">
                <AlertTriangle className="size-3.5 shrink-0" />
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" variant="destructive" isLoading={loading}>
              Xác nhận Từ chối
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
