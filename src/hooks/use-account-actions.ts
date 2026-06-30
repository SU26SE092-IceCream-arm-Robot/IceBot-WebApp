"use client";

import { useCallback, useState } from "react";

import { assignAccountRoles, getEffectiveAccess, resetAccountPassword } from "@/lib/services/accounts";
import { getRoleScopeOptions } from "@/lib/services/roles";
import type { AccountRoleScopeRequest, EffectiveAccessResult, InternalAccountResult, RoleScopeOptionsResult } from "@/types/accounts";

export interface UseAccountActionsResult {
  // Effective Access
  effectiveAccess: EffectiveAccessResult | null;
  isEffectiveAccessLoading: boolean;
  effectiveAccessErrorMessage: string | null;
  loadEffectiveAccess: (accountId: string) => Promise<void>;

  // Roles Assignment
  isEditRolesOpen: boolean;
  isEditingRoles: boolean;
  editRolesErrorMessage: string | null;
  roleScopeOptionsByRole: Record<string, RoleScopeOptionsResult>;
  roleScopeErrorsByRole: Record<string, string>;
  isRoleScopeLoading: boolean;
  setEditRolesOpen: (open: boolean) => void;
  loadRoleScopeOptions: (roleCode: string) => Promise<RoleScopeOptionsResult | null>;
  submitEditRoles: (accountId: string, roles: AccountRoleScopeRequest[]) => Promise<boolean>;

  // Reset Password
  isResetPasswordOpen: boolean;
  isResettingPassword: boolean;
  resetPasswordErrorMessage: string | null;
  setResetPasswordOpen: (open: boolean) => void;
  submitResetPassword: (accountId: string, newPassword: string) => Promise<boolean>;
}

export function useAccountActions(
  onSuccess?: (message: string, account?: InternalAccountResult) => void
): UseAccountActionsResult {
  const [effectiveAccess, setEffectiveAccess] = useState<EffectiveAccessResult | null>(null);
  const [isEffectiveAccessLoading, setIsEffectiveAccessLoading] = useState(false);
  const [effectiveAccessErrorMessage, setEffectiveAccessErrorMessage] = useState<string | null>(null);

  const [isEditRolesOpen, setIsEditRolesOpen] = useState(false);
  const [isEditingRoles, setIsEditingRoles] = useState(false);
  const [editRolesErrorMessage, setEditRolesErrorMessage] = useState<string | null>(null);
  const [roleScopeOptionsByRole, setRoleScopeOptionsByRole] = useState<
    Record<string, RoleScopeOptionsResult>
  >({});
  const [roleScopeErrorsByRole, setRoleScopeErrorsByRole] = useState<Record<string, string>>({});
  const [isRoleScopeLoading, setIsRoleScopeLoading] = useState(false);

  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordErrorMessage, setResetPasswordErrorMessage] = useState<string | null>(null);

  const loadEffectiveAccess = useCallback(async (accountId: string) => {
    setIsEffectiveAccessLoading(true);
    setEffectiveAccessErrorMessage(null);
    try {
      const result = await getEffectiveAccess(accountId);
      setEffectiveAccess(result);
    } catch (error) {
      setEffectiveAccessErrorMessage(error instanceof Error ? error.message : "Đã xảy ra lỗi.");
    } finally {
      setIsEffectiveAccessLoading(false);
    }
  }, []);

  const loadRoleScopeOptions = useCallback(async (roleCode: string) => {
    if (!roleCode) {
      return null;
    }

    setIsRoleScopeLoading(true);
    setRoleScopeErrorsByRole((current) => ({ ...current, [roleCode]: "" }));
    try {
      const result = await getRoleScopeOptions(roleCode);
      setRoleScopeOptionsByRole((current) => ({ ...current, [roleCode]: result }));
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải phạm vi vai trò.";
      setRoleScopeErrorsByRole((current) => ({ ...current, [roleCode]: message }));
      return null;
    } finally {
      setIsRoleScopeLoading(false);
    }
  }, []);

  const submitEditRoles = useCallback(
    async (accountId: string, roles: AccountRoleScopeRequest[]) => {
      setIsEditingRoles(true);
      setEditRolesErrorMessage(null);
      try {
        const result = await assignAccountRoles(accountId, { roles });
        setEffectiveAccess(null);
        setIsEditRolesOpen(false);
        onSuccess?.("Đã cập nhật vai trò thành công.", result);
        return true;
      } catch (error) {
        setEditRolesErrorMessage(error instanceof Error ? error.message : "Không thể cập nhật vai trò.");
        return false;
      } finally {
        setIsEditingRoles(false);
      }
    },
    [onSuccess]
  );

  const submitResetPassword = useCallback(
    async (accountId: string, newPassword: string) => {
      setIsResettingPassword(true);
      setResetPasswordErrorMessage(null);
      try {
        await resetAccountPassword(accountId, { newPassword });
        setIsResetPasswordOpen(false);
        onSuccess?.("Đã đặt lại mật khẩu thành công.");
        return true;
      } catch (error) {
        setResetPasswordErrorMessage(error instanceof Error ? error.message : "Không thể đặt lại mật khẩu.");
        return false;
      } finally {
        setIsResettingPassword(false);
      }
    },
    [onSuccess]
  );

  return {
    effectiveAccess,
    isEffectiveAccessLoading,
    effectiveAccessErrorMessage,
    loadEffectiveAccess,

    isEditRolesOpen,
    isEditingRoles,
    editRolesErrorMessage,
    roleScopeOptionsByRole,
    roleScopeErrorsByRole,
    isRoleScopeLoading,
    setEditRolesOpen: setIsEditRolesOpen,
    loadRoleScopeOptions,
    submitEditRoles,

    isResetPasswordOpen,
    isResettingPassword,
    resetPasswordErrorMessage,
    setResetPasswordOpen: setIsResetPasswordOpen,
    submitResetPassword,
  };
}
