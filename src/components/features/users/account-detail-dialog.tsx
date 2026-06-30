"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, IdCard, KeyRound, Mail, ShieldCheck, UserRound, Lock, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  InternalAccountResult,
  InternalAccountRoleResult,
  ManagementAccountStatus,
} from "@/types/accounts";
import type { UseAccountActionsResult } from "@/hooks/use-account-actions";

interface AccountDetailDialogProps {
  account: InternalAccountResult | null;
  errorMessage: string | null;
  isLoading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountActions: UseAccountActionsResult;
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

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/80 bg-background p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-1.5 text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

export function AccountDetailDialog({
  account,
  errorMessage,
  isLoading,
  open,
  onOpenChange,
  accountActions,
}: AccountDetailDialogProps) {
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    if (open && account) {
      // eslint-disable-next-line
      setActiveTab("info");
    }
  }, [open, account]);

  useEffect(() => {
    if (activeTab === "access" && account && !accountActions.effectiveAccess) {
      void accountActions.loadEffectiveAccess(account.id);
    }
  }, [activeTab, account, accountActions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border bg-gradient-to-br from-primary/10 via-card to-card p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <UserRound className="size-5" />
            </span>
            <div className="min-w-0 space-y-1">
              <DialogTitle className="text-lg">Chi tiết tài khoản</DialogTitle>
              <DialogDescription>
                Thông tin định danh, bảo mật, vai trò và quyền hạn.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 p-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={`detail-skeleton-${index}`} className="space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-5 w-full animate-pulse rounded bg-muted/60" />
              </div>
            ))}
          </div>
        ) : errorMessage ? (
          <div className="m-5 flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{errorMessage}</p>
          </div>
        ) : account ? (
          <div className="flex flex-col h-[500px]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="px-5 pt-4 border-b">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                  <TabsTrigger
                    value="info"
                    className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    Tổng quan
                  </TabsTrigger>
                  <TabsTrigger
                    value="roles"
                    className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    Vai trò
                  </TabsTrigger>
                  <TabsTrigger
                    value="access"
                    className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    Quyền thực tế
                  </TabsTrigger>
                  <TabsTrigger
                    value="security"
                    className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    Bảo mật
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 p-5">
                <TabsContent value="info" className="mt-0 space-y-4 outline-none">
                  <div className="rounded-2xl border border-border/80 bg-card p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-sm font-semibold text-primary">
                          {(account.fullName?.trim() || account.userName || "?").slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-base font-semibold text-foreground">
                            {account.fullName?.trim() || account.userName || "Chưa cập nhật"}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">
                            {account.email || "Chưa cập nhật"}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={account.status} />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailField label="Username">
                      <span className="tabular-nums">{account.userName || "Chưa cập nhật"}</span>
                    </DetailField>
                    <DetailField label="Email">
                      <span className="break-all">{account.email || "Chưa cập nhật"}</span>
                    </DetailField>
                  </div>

                  <div className="rounded-xl border border-dashed border-border bg-muted/10 px-3.5 py-3 mt-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Mã kỹ thuật
                      </span>
                      <span className="break-all font-mono text-xs tabular-nums text-muted-foreground">
                        {account.id}
                      </span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="roles" className="mt-0 space-y-4 outline-none">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Các vai trò và phạm vi đã được gán cho tài khoản này.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => accountActions.setEditRolesOpen(true)}>
                      Sửa vai trò
                    </Button>
                  </div>
                  
                  {account.roles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg border-dashed bg-muted/20">
                      <ShieldCheck className="h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">Chưa gán vai trò.</p>
                    </div>
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
                          <span className="break-all text-xs font-medium text-muted-foreground sm:text-right">
                            {getScopeLabel(role)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="access" className="mt-0 space-y-4 outline-none">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">
                      Quyền hạn thực tế từ backend dựa trên các vai trò.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => void accountActions.loadEffectiveAccess(account.id)} disabled={accountActions.isEffectiveAccessLoading}>
                      Làm mới
                    </Button>
                  </div>

                  {accountActions.isEffectiveAccessLoading ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : accountActions.effectiveAccessErrorMessage ? (
                    <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      {accountActions.effectiveAccessErrorMessage}
                    </div>
                  ) : accountActions.effectiveAccess && accountActions.effectiveAccess.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {accountActions.effectiveAccess.map((perm) => (
                        <Badge key={perm} variant="secondary" className="font-mono text-[10px] uppercase">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg border-dashed bg-muted/20">
                      <ShieldCheck className="h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">Không có quyền truy cập nào.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="security" className="mt-0 space-y-4 outline-none">
                  <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex size-8 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                          <IdCard className="size-4" />
                        </span>
                        <p className="text-sm font-semibold text-foreground">Phương thức đăng nhập</p>
                      </div>
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

                  <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex size-8 items-center justify-center rounded-xl border border-warning/20 bg-warning/10 text-warning">
                          <Lock className="size-4" />
                        </span>
                        <p className="text-sm font-semibold text-foreground">Bảo mật tài khoản</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-muted/20 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Info className="h-4 w-4" />
                        Đặt lại mật khẩu cho tài khoản này
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => accountActions.setResetPasswordOpen(true)}>
                        Đặt lại
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
