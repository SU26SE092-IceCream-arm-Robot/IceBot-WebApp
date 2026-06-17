"use client";

import { AlertTriangle, IdCard, KeyRound, Mail, ShieldCheck, UserRound, UserRoundX } from "lucide-react";

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
import type {
  InternalAccountResult,
  InternalAccountRoleResult,
  ManagementAccountStatus,
} from "@/types/accounts";

interface AccountDetailDialogProps {
  account: InternalAccountResult | null;
  errorMessage: string | null;
  isLoading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DisableAccountDialogProps {
  account: InternalAccountResult | null;
  errorMessage: string | null;
  isSubmitting: boolean;
  open: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

const ROLE_LABELS: Record<string, string> = {
  SystemAdmin: "Admin hệ thống",
  Manager: "Quản lý",
  OrgAdmin: "Quản trị tổ chức",
  LocationOwner: "Chủ địa điểm",
  Staff: "Nhân viên",
  Technician: "Kỹ thuật viên",
};

function StatusBadge({ status }: { status: ManagementAccountStatus }) {
  switch (status) {
    case "Active":
      return <Badge className="border border-success/20 bg-success/10 text-success">Hoạt động</Badge>;
    case "PendingVerification":
      return <Badge className="border border-warning/20 bg-warning/10 text-warning">Chờ xác minh</Badge>;
    case "Suspended":
      return <Badge className="border border-warning/20 bg-warning/10 text-warning">Tạm khóa</Badge>;
    case "Disabled":
      return (
        <Badge className="border border-destructive/20 bg-destructive/10 text-destructive">
          Vô hiệu hóa
        </Badge>
      );
    case "Invited":
      return <Badge className="border border-primary/20 bg-primary/10 text-primary">Đã mời</Badge>;
  }
}

function getScopeLabel(role: InternalAccountRoleResult): string {
  if (role.kioskId) {
    return `Kiosk ${role.kioskId}`;
  }
  if (role.storeId) {
    return `Cửa hàng ${role.storeId}`;
  }
  if (role.organizationId) {
    return `Tổ chức ${role.organizationId}`;
  }
  return "Toàn hệ thống";
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

export function AccountDetailDialog({
  account,
  errorMessage,
  isLoading,
  open,
  onOpenChange,
}: AccountDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <UserRound className="size-5" />
            </span>
            <div className="min-w-0 space-y-1">
              <DialogTitle>Chi tiết tài khoản</DialogTitle>
              <DialogDescription>
                Thông tin tài khoản nội bộ.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={`detail-skeleton-${index}`} className="space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-5 w-full animate-pulse rounded bg-muted/60" />
              </div>
            ))}
          </div>
        ) : errorMessage ? (
          <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{errorMessage}</p>
          </div>
        ) : account ? (
          <div className="space-y-4 py-1">
            <div className="rounded-xl border border-border bg-muted/15 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-base font-semibold text-foreground">
                    {account.fullName?.trim() || account.userName || "Chưa cập nhật"}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{account.email || "Chưa cập nhật"}</p>
                </div>
                <StatusBadge status={account.status} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailField label="Username">
                <span className="tabular-nums">{account.userName || "Chưa cập nhật"}</span>
              </DetailField>
              <DetailField label="ID">
                <span className="break-all font-mono text-xs tabular-nums">{account.id}</span>
              </DetailField>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <IdCard className="size-4" />
                </span>
                <p className="text-sm font-semibold text-foreground">Phương thức đăng nhập</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1 border-primary/20 bg-primary/10 text-primary">
                  <KeyRound className="size-3" />
                  Mật khẩu: {account.localLoginEnabled ? "Bật" : "Tắt"}
                </Badge>
                <Badge variant="outline" className="gap-1 border-primary/20 bg-primary/10 text-primary">
                  <Mail className="size-3" />
                  Google: {account.googleLoginEnabled ? "Bật" : "Tắt"}
                </Badge>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <ShieldCheck className="size-4" />
                </span>
                <p className="text-sm font-semibold text-foreground">Vai trò và phạm vi</p>
              </div>
              {account.roles.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa gán vai trò.</p>
              ) : (
                <div className="space-y-2">
                  {account.roles.map((role, index) => (
                    <div
                      key={`${role.roleCode}-${role.organizationId ?? ""}-${role.storeId ?? ""}-${role.kioskId ?? ""}-${index}`}
                      className="flex flex-col gap-2 rounded-lg border border-border bg-muted/15 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <Badge className="w-fit gap-1 border border-primary/20 bg-primary/10 text-primary">
                        <ShieldCheck className="size-3" />
                        {ROLE_LABELS[role.roleCode] ?? role.roleCode}
                      </Badge>
                      <span className="break-all text-xs text-muted-foreground sm:text-right">
                        {getScopeLabel(role)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        <DialogFooter className="bg-background" showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

export function DisableAccountDialog({
  account,
  errorMessage,
  isSubmitting,
  open,
  onConfirm,
  onOpenChange,
}: DisableAccountDialogProps) {
  const accountName = account?.fullName?.trim() || account?.userName || "tài khoản này";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isSubmitting}>
        <DialogHeader>
          <span className="flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <UserRoundX className="size-5" />
          </span>
          <DialogTitle>Vô hiệu hóa tài khoản?</DialogTitle>
          <DialogDescription>
            Tài khoản <span className="font-medium text-foreground">{accountName}</span> sẽ không
            thể đăng nhập sau thao tác này.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{errorMessage}</p>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button variant="destructive" isLoading={isSubmitting} onClick={onConfirm}>
            Vô hiệu hóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
