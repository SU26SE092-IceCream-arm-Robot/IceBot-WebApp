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
  roleScopeOptions: RoleScopeOptionsResult | null;
  isRoleScopeLoading: boolean;
  setEditRolesOpen: (open: boolean) => void;
  loadRoleScopeOptions: (roleCode: string) => Promise<void>;
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
  const [roleScopeOptions, setRoleScopeOptions] = useState<RoleScopeOptionsResult | null>(null);
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
    setIsRoleScopeLoading(true);
    try {
      const result = await getRoleScopeOptions(roleCode);
      setRoleScopeOptions(result);
    } catch (error) {
      console.error("Failed to load role scopes", error);
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
    roleScopeOptions,
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
