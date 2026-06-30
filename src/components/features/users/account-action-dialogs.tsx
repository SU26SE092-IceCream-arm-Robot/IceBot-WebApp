"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, KeyRound, ShieldCheck } from "lucide-react";

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
  InternalAccountResult,
  RoleScopeOptionsResult,
  AccountRoleScopeRequest,
  ManagementRoleResult,
} from "@/types/accounts";

interface ResetPasswordDialogProps {
  account: InternalAccountResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (accountId: string, newPassword: string) => Promise<boolean>;
}

export function ResetPasswordDialog({
  account,
  open,
  onOpenChange,
  isSubmitting,
  errorMessage,
  onSubmit,
}: ResetPasswordDialogProps) {
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line
      setPassword("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !password) return;
    await onSubmit(account.id, password);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Đặt lại mật khẩu
          </DialogTitle>
          <DialogDescription>
            Đặt mật khẩu mới cho tài khoản <span className="font-semibold text-foreground">{account?.userName}</span>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Mật khẩu mới</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              placeholder="Nhập mật khẩu mới"
              required
            />
          </div>

          {errorMessage && (
            <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{errorMessage}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting || !password}>
              {isSubmitting ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditRolesDialogProps {
  account: InternalAccountResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  errorMessage: string | null;
  managementRoles: ManagementRoleResult[];
  roleScopeOptions: RoleScopeOptionsResult | null;
  isRoleScopeLoading: boolean;
  onRoleChange: (roleCode: string) => void;
  onSubmit: (accountId: string, roles: AccountRoleScopeRequest[]) => Promise<boolean>;
}

export function EditRolesDialog({
  account,
  open,
  onOpenChange,
  isSubmitting,
  errorMessage,
  managementRoles,
  roleScopeOptions,
  isRoleScopeLoading,
  onRoleChange,
  onSubmit,
}: EditRolesDialogProps) {
  const [roleCode, setRoleCode] = useState("");
  const [organizationId, setOrganizationId] = useState("");

  useEffect(() => {
    if (open && account) {
      // Just a simple single role assignment for now. If account has roles, pick the first one's code.
      const initialRole = account.roles.length > 0 ? account.roles[0].roleCode : "";
      // eslint-disable-next-line
      setRoleCode(initialRole);
      if (initialRole) {
        onRoleChange(initialRole);
      }
    }
  }, [open, account, onRoleChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !roleCode) return;
    
    // In a full implementation, you'd collect organizationId, storeId, etc based on roleScopeOptions.
    // Here we just submit the basic role code and organization if required.
    const roleReq: AccountRoleScopeRequest = {
      roleCode,
      organizationId: organizationId || undefined,
    };
    
    await onSubmit(account.id, [roleReq]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Cập nhật vai trò
          </DialogTitle>
          <DialogDescription>
            Gán vai trò mới cho tài khoản <span className="font-semibold text-foreground">{account?.userName}</span>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role-select">Vai trò</Label>
            <Select
              value={roleCode}
              onValueChange={(val) => {
                const newRole = val || "";
                setRoleCode(newRole);
                onRoleChange(newRole);
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                {managementRoles.map((r) => (
                  <SelectItem key={r.code} value={r.code} disabled={!r.isAssignable}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {roleCode && roleScopeOptions && roleScopeOptions.requiresScope && (
            <div className="space-y-2">
              <Label>Tổ chức (Bắt buộc)</Label>
              <Select
                value={organizationId}
                onValueChange={(val) => setOrganizationId(val || "")}
                disabled={isSubmitting || isRoleScopeLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isRoleScopeLoading ? "Đang tải..." : "Chọn tổ chức"} />
                </SelectTrigger>
                <SelectContent>
                  {roleScopeOptions.organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {errorMessage && (
            <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{errorMessage}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting || !roleCode || (roleScopeOptions?.requiresScope && !organizationId)}>
              {isSubmitting ? "Đang xử lý..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

