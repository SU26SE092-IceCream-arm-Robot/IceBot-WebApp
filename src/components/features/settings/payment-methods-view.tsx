"use client";

import { useState } from "react";
import {
  AlertCircle,
  CircleCheck,
  CircleOff,
  CreditCard,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { MetricStrip, MetricStripItem } from "@/components/shared/metric-strip";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePaymentMethods } from "@/hooks/operations/use-payment-methods";

interface PaymentMethodsViewProps {
  canManageStatus: boolean;
}

export function PaymentMethodsView({
  canManageStatus,
}: PaymentMethodsViewProps) {
  const { methods, state, error, updatingId, refresh, updateStatus } =
    usePaymentMethods();
  const [confirmDialog, setConfirmDialog] = useState<{
    id: number;
    isActive: boolean;
    name: string;
  } | null>(null);

  const handleToggle = (id: number, currentStatus: boolean, name: string) => {
    if (!canManageStatus) return;
    const newStatus = !currentStatus;

    if (!newStatus) {
      // Show confirmation dialog when disabling
      setConfirmDialog({ id, isActive: newStatus, name });
    } else {
      // Directly enable
      void updateStatus(id, newStatus);
    }
  };

  const handleConfirmDisable = () => {
    if (confirmDialog) {
      void updateStatus(confirmDialog.id, confirmDialog.isActive);
    }
    setConfirmDialog(null);
  };
  const activeCount = methods.filter((method) => method.isActive).length;
  const inactiveCount = methods.length - activeCount;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phương thức thanh toán"
        description="Quản lý khả năng sử dụng từng cổng thanh toán tại kiosk; việc tắt cổng có thể ảnh hưởng trực tiếp đến checkout."
        actions={
          <Button
            variant="outline"
            onClick={refresh}
            isLoading={state === "LOADING"}
          >
            <RefreshCw className="size-4" />
            Làm mới
          </Button>
        }
      />

      <MetricStrip>
        <MetricStripItem
          icon={CreditCard}
          label="Tổng phương thức"
          value={methods.length}
          description="Cổng thanh toán đã cấu hình"
          tone="primary"
        />
        <MetricStripItem
          icon={CircleCheck}
          label="Đang hoạt động"
          value={activeCount}
          description="Có thể dùng tại kiosk"
          tone="success"
        />
        <MetricStripItem
          icon={CircleOff}
          label="Đã tắt"
          value={inactiveCount}
          description="Không hiển thị trong checkout"
          tone={inactiveCount > 0 ? "warning" : "neutral"}
        />
        <MetricStripItem
          icon={ShieldCheck}
          label="Chế độ truy cập"
          value={canManageStatus ? "Quản lý" : "Chỉ xem"}
          description="Theo quyền payment-methods.manage"
          tone={canManageStatus ? "primary" : "neutral"}
        />
      </MetricStrip>

      {state === "LOADING" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-48 animate-pulse rounded-lg border border-border bg-muted/30"
            />
          ))}
        </div>
      ) : state === "ERROR" ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
          <AlertCircle className="size-7" />
          <p className="text-sm">
            {error || "Không thể tải cấu hình thanh toán."}
          </p>
          <Button variant="outline" size="sm" onClick={refresh}>
            Thử tải lại
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {methods.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              Không tìm thấy phương thức thanh toán nào.
            </div>
          ) : (
            methods.map((method) => {
              const isUpdating = updatingId === method.id;
              return (
                <Card
                  key={method.id}
                  className="overflow-hidden transition-colors hover:bg-muted/50"
                >
                  <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <CreditCard className="size-4" />
                      </div>
                      <CardTitle className="truncate text-base font-medium">
                        {method.name}
                      </CardTitle>
                    </div>
                    {canManageStatus ? (
                      <Button
                        variant={method.isActive ? "outline" : "default"}
                        size="sm"
                        className="w-20 shrink-0"
                        disabled={isUpdating}
                        onClick={() =>
                          handleToggle(method.id, method.isActive, method.name)
                        }
                      >
                        {isUpdating
                          ? "Đang xử lý"
                          : method.isActive
                            ? "Tắt"
                            : "Bật"}
                      </Button>
                    ) : null}
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mt-2 text-sm">
                      {method.description || `Thanh toán qua ${method.name}`}
                    </CardDescription>
                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="font-medium text-muted-foreground">
                        Mã hệ thống:
                      </span>
                      <span className="font-mono text-foreground">
                        {method.code}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-muted-foreground">
                        Trạng thái:
                      </span>
                      <span
                        className={`font-medium ${
                          method.isActive ? "text-success" : "text-destructive"
                        }`}
                      >
                        {isUpdating
                          ? "Đang cập nhật..."
                          : method.isActive
                            ? "Đang hoạt động"
                            : "Đã tắt"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      <Dialog
        open={!!confirmDialog}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <DialogContent showCloseButton={true}>
          <DialogHeader>
            <span className="flex size-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <AlertTriangle className="size-5" />
            </span>
            <DialogTitle>Xác nhận tắt thanh toán?</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn tắt cổng thanh toán{" "}
              <strong>{confirmDialog?.name}</strong>? Việc này có thể ảnh hưởng
              đến khả năng thanh toán của khách hàng tại Kiosk.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleConfirmDisable}>
              Vẫn tắt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
