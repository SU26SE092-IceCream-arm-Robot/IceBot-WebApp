"use client";

import { AlertTriangle, KeyRound, Mail, ShieldCheck, UserRoundX } from "lucide-react";

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

function getStatusLabel(status: ManagementAccountStatus): string {
  switch (status) {
    case "Active":
      return "Hoạt động";
    case "PendingVerification":
      return "Chờ xác minh";
    case "Suspended":
      return "Tạm khóa";
    case "Disabled":
      return "Vô hiệu hóa";
    case "Invited":
      return "Đã mời";
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
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground">{children}</div>
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
        <DialogHeader>
          <DialogTitle>Chi tiết tài khoản</DialogTitle>
          <DialogDescription>
            Thông tin mới nhất từ Management Accounts API.
          </DialogDescription>
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
          <div className="grid gap-5 py-2 sm:grid-cols-2">
            <DetailField label="Họ tên">
              {account.fullName?.trim() || "Chưa cập nhật"}
            </DetailField>
            <DetailField label="Username">
              <span className="tabular-nums">{account.userName || "Chưa cập nhật"}</span>
            </DetailField>
            <DetailField label="Email">{account.email || "Chưa cập nhật"}</DetailField>
            <DetailField label="Trạng thái">
              <Badge variant="outline">{getStatusLabel(account.status)}</Badge>
            </DetailField>
            <DetailField label="Phương thức đăng nhập">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1">
                  <KeyRound className="size-3" />
                  Mật khẩu: {account.localLoginEnabled ? "Bật" : "Tắt"}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Mail className="size-3" />
                  Google: {account.googleLoginEnabled ? "Bật" : "Tắt"}
                </Badge>
              </div>
            </DetailField>
            <DetailField label="ID">
              <span className="break-all tabular-nums text-xs">{account.id}</span>
            </DetailField>
            <div className="space-y-2 sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Vai trò và phạm vi
              </p>
              {account.roles.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa gán vai trò.</p>
              ) : (
                <div className="space-y-2">
                  {account.roles.map((role, index) => (
                    <div
                      key={`${role.roleCode}-${role.organizationId ?? ""}-${role.storeId ?? ""}-${role.kioskId ?? ""}-${index}`}
                      className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <Badge className="w-fit gap-1 border-0 bg-primary/10 text-primary">
                        <ShieldCheck className="size-3" />
                        {ROLE_LABELS[role.roleCode] ?? role.roleCode}
                      </Badge>
                      <span className="break-all tabular-nums text-xs text-muted-foreground">
                        {getScopeLabel(role)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        <DialogFooter showCloseButton />
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
