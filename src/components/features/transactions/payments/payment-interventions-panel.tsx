"use client";

import axios from "axios";
import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
  getTransactionsErrorMessage,
  listPaymentSessionInterventions,
  reconcilePaymentSession,
} from "@/lib/services/transactions/transactions";
import type {
  PaymentSessionInterventionResult,
  TransactionsPaginationMeta,
} from "@/types/transactions/transactions";
import {
  formatTransactionDate,
  formatTransactionMoney,
} from "@/components/features/transactions/orders/transactions-table";

const PAGE_SIZE = 20;
const EMPTY_PAGE: TransactionsPaginationMeta = {
  page: 1,
  pageSize: PAGE_SIZE,
  totalCount: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

export function PaymentInterventionsPanel({ enabled }: { enabled: boolean }) {
  const mutationRef = useRef(false);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<PaymentSessionInterventionResult[]>([]);
  const [pagination, setPagination] = useState(EMPTY_PAGE);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [target, setTarget] = useState<PaymentSessionInterventionResult | null>(null);
  const [reason, setReason] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!enabled) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await listPaymentSessionInterventions(
        { pageNumber: page, pageSize: PAGE_SIZE },
        signal,
      );
      if (signal?.aborted) return;
      setItems(result.data ?? []);
      setPagination(result.pagination);
    } catch (error) {
      if (axios.isCancel(error) || signal?.aborted) return;
      setItems([]);
      setPagination({ ...EMPTY_PAGE, page });
      setErrorMessage(
        getTransactionsErrorMessage(error, "Không thể tải thanh toán cần can thiệp."),
      );
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [enabled, page]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => void load(controller.signal), 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [enabled, load]);

  const reconcile = async () => {
    if (!target || mutationRef.current) return;
    const normalizedReason = reason.trim();
    if (normalizedReason.length < 3 || normalizedReason.length > 500) {
      setValidationMessage("Lý do đối soát phải có từ 3 đến 500 ký tự.");
      return;
    }
    mutationRef.current = true;
    setIsReconciling(true);
    setValidationMessage(null);
    try {
      const result = await reconcilePaymentSession(
        target.orderId,
        target.paymentTransactionId,
        normalizedReason,
      );
      toast.success(`Đã đối soát lại thanh toán: ${result.outcome}.`);
      setTarget(null);
      setReason("");
      await load();
    } catch (error) {
      setValidationMessage(
        getTransactionsErrorMessage(error, "Không thể đối soát lại thanh toán."),
      );
    } finally {
      mutationRef.current = false;
      setIsReconciling(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Thanh toán cần can thiệp</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Các phiên thanh toán mà backend không thể tự kết luận và cần nhân viên đối soát với nhà cung cấp.
          </p>
        </div>
        <Button variant="outline" size="sm" isLoading={isLoading} onClick={() => void load()}>
          <RefreshCw className="size-4" /> Làm mới
        </Button>
      </div>

      {errorMessage ? (
        <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {errorMessage}
        </div>
      ) : isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-lg bg-muted/40" />)}</div>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Không có thanh toán nào đang chờ can thiệp.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.paymentTransactionId} className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="font-medium">{item.orderNumber} · {item.provider}</p>
                <p className="text-sm text-muted-foreground">
                  {item.interventionCode}{item.interventionMessage ? `: ${item.interventionMessage}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTransactionMoney(item.amount, item.currency)} · Yêu cầu {formatTransactionDate(item.requestedAt)} · Thử {item.retryCount}/{item.maxRetries}
                </p>
              </div>
              <Button
                size="sm"
                disabled={!item.canReconcile || isReconciling}
                onClick={() => { setValidationMessage(null); setReason(""); setTarget(item); }}
              >
                Đối soát lại
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{pagination.totalCount} trường hợp</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!pagination.hasPrevious || isLoading} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft className="size-4" /> Trước</Button>
          <Button variant="outline" size="sm" disabled={!pagination.hasNext || isLoading} onClick={() => setPage((value) => value + 1)}>Sau <ChevronRight className="size-4" /></Button>
        </div>
      </div>

      <Dialog open={target !== null} onOpenChange={(open) => { if (!open && !isReconciling) setTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đối soát lại thanh toán</DialogTitle>
            <DialogDescription>
              Backend sẽ hỏi lại nhà cung cấp và lưu người thao tác cùng lý do. Thao tác không tự đánh dấu đã thanh toán nếu provider chưa xác nhận.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="payment-reconcile-reason">Lý do</Label>
            <Input id="payment-reconcile-reason" maxLength={500} value={reason} disabled={isReconciling} onChange={(event) => setReason(event.target.value)} />
          </div>
          {validationMessage ? <p className="text-sm text-destructive" role="alert">{validationMessage}</p> : null}
          <DialogFooter>
            <Button variant="outline" disabled={isReconciling} onClick={() => setTarget(null)}>Hủy</Button>
            <Button isLoading={isReconciling} onClick={() => void reconcile()}>Xác nhận đối soát</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
