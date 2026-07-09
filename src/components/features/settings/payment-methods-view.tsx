"use client";

import { useState } from "react";
import { AlertCircle, CreditCard, RefreshCw, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import type { DashboardUser } from "@/types";
import { hasPermission } from "@/lib/rbac";

interface PaymentMethodsViewProps {
  currentUser: DashboardUser;
}

export function PaymentMethodsView({ currentUser }: PaymentMethodsViewProps) {
  const { methods, state, error, updatingId, refresh, updateStatus } = usePaymentMethods();
  const [confirmDialog, setConfirmDialog] = useState<{ id: number; isActive: boolean; name: string } | null>(null);

  const canEdit = hasPermission(currentUser.role, "payments.manage");

  const handleToggle = (id: number, currentStatus: boolean, name: string) => {
    if (!canEdit) return;
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

  if (state === "LOADING") {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-border bg-card">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <RefreshCw className="size-6 animate-spin" />
          <p className="text-sm">Đang tải cấu hình thanh toán...</p>
        </div>
      </div>
    );
  }

  if (state === "ERROR") {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-destructive/20 bg-destructive/10">
        <div className="flex flex-col items-center gap-2 text-destructive">
          <AlertCircle className="size-6" />
          <p className="text-sm">{error || "Không thể tải cấu hình thanh toán."}</p>
          <Button variant="outline" size="sm" onClick={refresh} className="mt-2">
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Cổng thanh toán</h2>
          <p className="text-sm text-muted-foreground">
            Quản lý trạng thái bật/tắt các phương thức thanh toán trên hệ thống Kiosk.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="mr-2 size-4" />
          Làm mới
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {methods.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Không tìm thấy phương thức thanh toán nào.
          </div>
        ) : (
          methods.map((method) => {
            const isUpdating = updatingId === method.id;
            return (
              <Card key={method.id} className="overflow-hidden transition-colors hover:bg-muted/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <CreditCard className="size-4" />
                    </div>
                    <CardTitle className="text-base font-medium">{method.name}</CardTitle>
                  </div>
                  <Button
                    variant={method.isActive ? "default" : "secondary"}
                    size="sm"
                    className="w-20"
                    disabled={!canEdit || isUpdating}
                    onClick={() => handleToggle(method.id, method.isActive, method.name)}
                  >
                    {isUpdating ? "Đang xử lý" : method.isActive ? "Tắt" : "Bật"}
                  </Button>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mt-2 text-sm">
                    {method.description || `Thanh toán qua ${method.name}`}
                  </CardDescription>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">Mã hệ thống:</span>
                    <span className="font-mono text-foreground">{method.code}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">Trạng thái:</span>
                    <span
                      className={`font-medium ${
                        method.isActive ? "text-success" : "text-destructive"
                      }`}
                    >
                      {isUpdating ? "Đang cập nhật..." : method.isActive ? "Đang hoạt động" : "Đã tắt"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent showCloseButton={true}>
          <DialogHeader>
            <span className="flex size-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <AlertTriangle className="size-5" />
            </span>
            <DialogTitle>Xác nhận tắt thanh toán?</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn tắt cổng thanh toán <strong>{confirmDialog?.name}</strong>? Việc này có thể ảnh hưởng đến khả năng thanh toán của khách hàng tại Kiosk.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDisable}
            >
              Vẫn tắt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
