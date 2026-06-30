"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, KeyRound, Plus, ShieldCheck, Trash2 } from "lucide-react";

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
  ManagementScopeType,
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
  roleScopeOptionsByRole: Record<string, RoleScopeOptionsResult>;
  roleScopeErrorsByRole: Record<string, string>;
  isRoleScopeLoading: boolean;
  onLoadRoleScopeOptions: (roleCode: string) => Promise<RoleScopeOptionsResult | null>;
  onSubmit: (accountId: string, roles: AccountRoleScopeRequest[]) => Promise<boolean>;
}

interface EditableRoleRow extends AccountRoleScopeRequest {
  rowId: string;
  scopeType: ManagementScopeType;
}

const SUPPORTED_SCOPE_TYPES: readonly ManagementScopeType[] = [
  "Global",
  "Organization",
  "Store",
  "Kiosk",
];

const SCOPE_LABELS: Record<ManagementScopeType, string> = {
  Global: "Toàn hệ thống",
  Organization: "Tổ chức",
  Store: "Cửa hàng",
  Kiosk: "Kiosk",
  Device: "Thiết bị",
};

function inferScopeType(role: AccountRoleScopeRequest): ManagementScopeType {
  if (role.kioskId) return "Kiosk";
  if (role.storeId) return "Store";
  if (role.organizationId) return "Organization";
  return "Global";
}

function createRoleRow(role?: AccountRoleScopeRequest): EditableRoleRow {
  return {
    rowId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    roleCode: role?.roleCode ?? "",
    scopeType: role ? inferScopeType(role) : "Global",
    organizationId: role?.organizationId ?? null,
    storeId: role?.storeId ?? null,
    kioskId: role?.kioskId ?? null,
  };
}

export function EditRolesDialog({
  account,
  open,
  onOpenChange,
  isSubmitting,
  errorMessage,
  managementRoles,
  roleScopeOptionsByRole,
  roleScopeErrorsByRole,
  isRoleScopeLoading,
  onLoadRoleScopeOptions,
  onSubmit,
}: EditRolesDialogProps) {
  const [roles, setRoles] = useState<EditableRoleRow[]>([]);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open && account) {
      // eslint-disable-next-line
      setRoles(account.roles.map((role) => createRoleRow(role)));
      setValidationMessage(null);
      const roleCodes = Array.from(new Set(account.roles.map((role) => role.roleCode)));
      void Promise.all(roleCodes.map((roleCode) => onLoadRoleScopeOptions(roleCode)));
    }
  }, [open, account, onLoadRoleScopeOptions]);

  const updateRole = (rowId: string, update: Partial<EditableRoleRow>) => {
    setRoles((current) =>
      current.map((role) => (role.rowId === rowId ? { ...role, ...update } : role)),
    );
    setValidationMessage(null);
  };

  const handleRoleChange = (rowId: string, roleCode: string) => {
    const role = managementRoles.find((item) => item.code === roleCode);
    const allowedScopes = (role?.allowedScopeTypes ?? []).filter((scope) =>
      SUPPORTED_SCOPE_TYPES.includes(scope),
    );
    const scopeType = role?.requiresScope
      ? allowedScopes.find((scope) => scope !== "Global") ?? "Organization"
      : allowedScopes.includes("Global")
        ? "Global"
        : allowedScopes[0] ?? "Global";

    updateRole(rowId, {
      roleCode,
      scopeType,
      organizationId: null,
      storeId: null,
      kioskId: null,
    });
    void onLoadRoleScopeOptions(roleCode);
  };

  const addRole = () => {
    const firstAssignableRole = managementRoles.find((role) => role.isAssignable);
    const row = createRoleRow();
    setRoles((current) => [...current, row]);
    if (firstAssignableRole) {
      handleRoleChange(row.rowId, firstAssignableRole.code);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    if (roles.length === 0) {
      setValidationMessage("Tài khoản phải có ít nhất một vai trò.");
      return;
    }

    const requests: AccountRoleScopeRequest[] = [];
    const assignmentKeys = new Set<string>();

    for (const role of roles) {
      const options = roleScopeOptionsByRole[role.roleCode];
      if (!role.roleCode || !options) {
        setValidationMessage("Vui lòng chọn vai trò và chờ tải phạm vi hoàn tất.");
        return;
      }

      const allowedScopes = options.allowedScopeTypes.filter((scope) =>
        SUPPORTED_SCOPE_TYPES.includes(scope),
      );
      if (!allowedScopes.includes(role.scopeType)) {
        setValidationMessage(`Phạm vi đã chọn không hợp lệ cho vai trò ${role.roleCode}.`);
        return;
      }

      if (options.requiresScope && role.scopeType === "Global") {
        setValidationMessage(`Vai trò ${role.roleCode} bắt buộc phải có phạm vi.`);
        return;
      }

      const request: AccountRoleScopeRequest = { roleCode: role.roleCode };
      if (role.scopeType === "Organization") request.organizationId = role.organizationId;
      if (role.scopeType === "Store") request.storeId = role.storeId;
      if (role.scopeType === "Kiosk") request.kioskId = role.kioskId;

      const selectedScopeId = request.organizationId ?? request.storeId ?? request.kioskId;
      if (role.scopeType !== "Global" && !selectedScopeId) {
        setValidationMessage(`Vui lòng chọn ${SCOPE_LABELS[role.scopeType].toLowerCase()} cho vai trò ${role.roleCode}.`);
        return;
      }

      const assignmentKey = `${request.roleCode}|${request.organizationId ?? ""}|${request.storeId ?? ""}|${request.kioskId ?? ""}`;
      if (assignmentKeys.has(assignmentKey)) {
        setValidationMessage("Không thể gán trùng cùng một vai trò và phạm vi.");
        return;
      }
      assignmentKeys.add(assignmentKey);
      requests.push(request);
    }

    await onSubmit(account.id, requests);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Cập nhật vai trò
          </DialogTitle>
          <DialogDescription>
            Toàn bộ danh sách bên dưới sẽ thay thế các vai trò hiện tại của tài khoản <span className="font-semibold text-foreground">{account?.userName}</span>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {roles.map((role, index) => {
              const options = roleScopeOptionsByRole[role.roleCode];
              const allowedScopes = (options?.allowedScopeTypes ?? []).filter((scope) =>
                SUPPORTED_SCOPE_TYPES.includes(scope),
              );
              const stores = options?.organizations.flatMap((organization) => organization.stores) ?? [];
              const kiosks = stores.flatMap((store) => store.kiosks);

              return (
                <div key={role.rowId} className="space-y-3 rounded-xl border border-border bg-muted/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">Vai trò {index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={isSubmitting}
                      onClick={() => setRoles((current) => current.filter((item) => item.rowId !== role.rowId))}
                      aria-label={`Xóa vai trò ${index + 1}`}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Vai trò</Label>
                      <Select
                        value={role.roleCode}
                        onValueChange={(value) => handleRoleChange(role.rowId, value ?? "")}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger><SelectValue placeholder="Chọn vai trò" /></SelectTrigger>
                        <SelectContent>
                          {managementRoles.map((item) => (
                            <SelectItem
                              key={item.code}
                              value={item.code}
                              disabled={!item.isAssignable && item.code !== role.roleCode}
                            >
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Loại phạm vi</Label>
                      <Select
                        value={role.scopeType}
                        onValueChange={(value) => updateRole(role.rowId, {
                          scopeType: value as ManagementScopeType,
                          organizationId: null,
                          storeId: null,
                          kioskId: null,
                        })}
                        disabled={isSubmitting || !options}
                      >
                        <SelectTrigger><SelectValue placeholder={isRoleScopeLoading ? "Đang tải..." : "Chọn phạm vi"} /></SelectTrigger>
                        <SelectContent>
                          {allowedScopes.map((scope) => (
                            <SelectItem key={scope} value={scope}>{SCOPE_LABELS[scope]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {role.scopeType === "Organization" && options ? (
                    <div className="space-y-2">
                      <Label>Tổ chức</Label>
                      <Select value={role.organizationId ?? ""} onValueChange={(value) => updateRole(role.rowId, { organizationId: value })} disabled={isSubmitting}>
                        <SelectTrigger><SelectValue placeholder="Chọn tổ chức" /></SelectTrigger>
                        <SelectContent>{options.organizations.map((organization) => <SelectItem key={organization.id} value={organization.id}>{organization.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  ) : null}

                  {role.scopeType === "Store" && options ? (
                    <div className="space-y-2">
                      <Label>Cửa hàng</Label>
                      <Select value={role.storeId ?? ""} onValueChange={(value) => updateRole(role.rowId, { storeId: value })} disabled={isSubmitting}>
                        <SelectTrigger><SelectValue placeholder="Chọn cửa hàng" /></SelectTrigger>
                        <SelectContent>{stores.map((store) => <SelectItem key={store.id} value={store.id}>{store.name} ({store.code})</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  ) : null}

                  {role.scopeType === "Kiosk" && options ? (
                    <div className="space-y-2">
                      <Label>Kiosk</Label>
                      <Select value={role.kioskId ?? ""} onValueChange={(value) => updateRole(role.rowId, { kioskId: value })} disabled={isSubmitting}>
                        <SelectTrigger><SelectValue placeholder="Chọn kiosk" /></SelectTrigger>
                        <SelectContent>{kiosks.map((kiosk) => <SelectItem key={kiosk.id} value={kiosk.id}>{kiosk.name} ({kiosk.code})</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  ) : null}

                  {roleScopeErrorsByRole[role.roleCode] ? (
                    <p className="text-sm text-destructive">{roleScopeErrorsByRole[role.roleCode]}</p>
                  ) : null}
                </div>
              );
            })}

            <Button type="button" variant="outline" onClick={addRole} disabled={isSubmitting || managementRoles.length === 0}>
              <Plus className="size-4" />
              Thêm vai trò
            </Button>
          </div>

          {(validationMessage || errorMessage) && (
            <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{validationMessage || errorMessage}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting || isRoleScopeLoading || roles.length === 0}>
              {isSubmitting ? "Đang xử lý..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
