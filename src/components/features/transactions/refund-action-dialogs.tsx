"use client";

import { AlertTriangle, Ban, CheckCircle, HandCoins, Info } from "lucide-react";
import { useRef, useState } from "react";

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
  MarkRefundProcessedRequest,
  OrderResult,
  RefundMethod,
  RefundReasonRequest,
  RefundResult,
  RequestRefundRequest,
} from "@/types/transactions";

interface RequestRefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderResult | null;
  onSubmit: (
    orderId: string,
    request: RequestRefundRequest,
    idempotencyKey: string,
  ) => Promise<void>;
}

export function RequestRefundDialog({
  open,
  onOpenChange,
  order,
  onSubmit,
}: RequestRefundDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [refundMethod, setRefundMethod] = useState<RefundMethod>("FullMoneyRefund");
  const [reason, setReason] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherValue, setVoucherValue] = useState("");
  const [note, setNote] = useState("");
  const submissionIntentRef = useRef<{ orderId: string; idempotencyKey: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    
    if (!reason.trim()) {
      setErrorMessage("Vui lòng nhập lý do yêu cầu hoàn tiền.");
      return;
    }

    if (refundMethod === "Voucher") {
      if (!voucherCode.trim()) {
        setErrorMessage("Vui lòng nhập mã Voucher.");
        return;
      }
      const parsedVoucherValue = Number(voucherValue);
      if (!voucherValue || !Number.isFinite(parsedVoucherValue) || parsedVoucherValue <= 0) {
        setErrorMessage("Vui lòng nhập giá trị Voucher hợp lệ.");
        return;
      }
      if (parsedVoucherValue !== order.totalAmount) {
        setErrorMessage(`Giá trị Voucher phải bằng tổng đơn ${order.totalAmount.toLocaleString("vi-VN")} ${order.currency}.`);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (!submissionIntentRef.current || submissionIntentRef.current.orderId !== order.id) {
        submissionIntentRef.current = {
          orderId: order.id,
          idempotencyKey:
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        };
      }

      await onSubmit(order.id, {
        refundMethod,
        reason: reason.trim(),
        voucherCode: refundMethod === "Voucher" ? voucherCode.trim() : null,
        voucherValue: refundMethod === "Voucher" ? Number(voucherValue) : null,
        note: note.trim() || null,
      }, submissionIntentRef.current.idempotencyKey);
      submissionIntentRef.current = null;
      // Reset form
      setReason("");
      setVoucherCode("");
      setVoucherValue("");
      setNote("");
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Đã xảy ra lỗi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isSubmitting}>
        <DialogHeader className="gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <HandCoins className="size-5" />
          </span>
          <DialogTitle>Yêu cầu hoàn tiền</DialogTitle>
          <DialogDescription>
            Tạo yêu cầu hoàn tiền cho đơn hàng {order?.orderNumber}. Yêu cầu này sẽ cần được xử lý ở bước sau.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMessage ? (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="size-4" />
              <p>{errorMessage}</p>
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium">Phương thức hoàn tiền</label>
            <Select
              value={refundMethod}
              onValueChange={(val) => {
                if (!val) return;
                const method = val as RefundMethod;
                setRefundMethod(method);
                if (method === "Voucher" && order) {
                  setVoucherValue(order.totalAmount.toString());
                }
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn phương thức" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FullMoneyRefund">Hoàn tiền đầy đủ</SelectItem>
                <SelectItem value="Voucher">Voucher</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Lý do <span className="text-destructive">*</span></label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Lỗi không nhả hàng"
              disabled={isSubmitting}
            />
          </div>

          {refundMethod === "Voucher" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mã Voucher <span className="text-destructive">*</span></label>
                <Input
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Mã giảm giá"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Giá trị <span className="text-destructive">*</span></label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={voucherValue}
                  onChange={(e) => setVoucherValue(e.target.value)}
                  placeholder="VNĐ"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Refund V1 yêu cầu bằng tổng đơn {order?.totalAmount.toLocaleString("vi-VN")} {order?.currency}.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Ghi chú thêm (Tùy chọn)</label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Thông tin thêm nếu có"
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ProcessRefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refund: RefundResult | null;
  onSubmit: (refundId: string, request: MarkRefundProcessedRequest) => Promise<void>;
}

export function ProcessRefundDialog({
  open,
  onOpenChange,
  refund,
  onSubmit,
}: ProcessRefundDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [providerRefundId, setProviderRefundId] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refund) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmit(refund.id, {
        providerRefundId: providerRefundId.trim() || null,
        moneyWasRefunded: refund.refundMethod === "Voucher" ? null : true,
      });
      setProviderRefundId("");
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Đã xảy ra lỗi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isSubmitting}>
        <DialogHeader className="gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl border border-success/20 bg-success/10 text-success">
            <CheckCircle className="size-5" />
          </span>
          <DialogTitle>Đánh dấu đã xử lý</DialogTitle>
          <DialogDescription>
            Xác nhận rằng yêu cầu hoàn tiền {refund?.refundNumber} đã được xử lý xong.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMessage ? (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="size-4" />
              <p>{errorMessage}</p>
            </div>
          ) : null}

          {refund?.refundMethod === "Voucher" ? (
             <div className="flex items-start gap-2 rounded-lg bg-primary/10 p-3 text-sm text-primary">
               <Info className="mt-0.5 size-4 shrink-0" />
               <p>Phương thức là Voucher. Vui lòng kiểm tra chắc chắn mã voucher đã được cấp/gửi cho khách hàng.</p>
             </div>
          ) : null}

          {refund?.refundMethod !== "Voucher" ? (
            <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
              <Info className="mt-0.5 size-4 shrink-0" />
              <p>Chỉ xác nhận sau khi khoản tiền đã được hoàn trả đầy đủ. Thao tác này sẽ cập nhật trạng thái đơn và thanh toán.</p>
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium">Mã tham chiếu (Tùy chọn)</label>
            <Input
              value={providerRefundId}
              onChange={(e) => setProviderRefundId(e.target.value)}
              placeholder="Mã giao dịch ngân hàng / gateway..."
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang xử lý..." : "Xác nhận xử lý"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface RejectRefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refund: RefundResult | null;
  onSubmit: (refundId: string, request: RefundReasonRequest) => Promise<void>;
}

export function RejectRefundDialog({
  open,
  onOpenChange,
  refund,
  onSubmit,
}: RejectRefundDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refund) return;
    
    if (!reason.trim()) {
      setErrorMessage("Vui lòng nhập lý do từ chối.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmit(refund.id, { reason: reason.trim() });
      setReason("");
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Đã xảy ra lỗi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isSubmitting}>
        <DialogHeader className="gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 text-destructive">
            <Ban className="size-5" />
          </span>
          <DialogTitle>Từ chối hoàn tiền</DialogTitle>
          <DialogDescription>
            Từ chối yêu cầu hoàn tiền {refund?.refundNumber}. Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMessage ? (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="size-4" />
              <p>{errorMessage}</p>
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium">Lý do từ chối <span className="text-destructive">*</span></label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Không hợp lệ, đã giải quyết..."
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? "Đang xử lý..." : "Từ chối"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface CancelRefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refund: RefundResult | null;
  onSubmit: (refundId: string, request: RefundReasonRequest) => Promise<void>;
}

export function CancelRefundDialog({
  open,
  onOpenChange,
  refund,
  onSubmit,
}: CancelRefundDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refund) return;
    
    if (!reason.trim()) {
      setErrorMessage("Vui lòng nhập lý do hủy.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmit(refund.id, { reason: reason.trim() });
      setReason("");
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Đã xảy ra lỗi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isSubmitting}>
        <DialogHeader className="gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl border border-muted-foreground/20 bg-muted text-muted-foreground">
            <Ban className="size-5" />
          </span>
          <DialogTitle>Hủy yêu cầu hoàn tiền</DialogTitle>
          <DialogDescription>
            Hủy bỏ yêu cầu {refund?.refundNumber}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMessage ? (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="size-4" />
              <p>{errorMessage}</p>
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium">Lý do hủy <span className="text-destructive">*</span></label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do hủy..."
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Trở lại
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang xử lý..." : "Hủy yêu cầu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
