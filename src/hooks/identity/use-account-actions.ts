"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { assignAccountRoles, getEffectiveAccess, requestAccountPasswordReset } from "@/lib/services/identity/accounts";
import { getManagementKiosks } from "@/lib/services/kiosks/management";
import { getRoleScopeOptions } from "@/lib/services/identity/roles";
import { getManagementOrganizationById } from "@/lib/services/tenants/organizations";
import { getManagementStores } from "@/lib/services/tenants/stores";
import type { AccountRoleScopeRequest, EffectiveAccessResult, InternalAccountResult, RoleScopeOptionsResult } from "@/types/identity/accounts";

export interface UseAccountActionsResult {
  // Effective Access
  effectiveAccess: EffectiveAccessResult | null;
  effectiveScopeLabels: EffectiveScopeLabels;
  isEffectiveAccessLoading: boolean;
  effectiveAccessErrorMessage: string | null;
  loadEffectiveAccess: (accountId: string) => Promise<void>;
  cancelEffectiveAccessLoad: () => void;

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
  submitResetPassword: (account: InternalAccountResult) => Promise<boolean>;
}

export interface EffectiveScopeLabels {
  organizations: Record<string, string>;
  stores: Record<string, string>;
  kiosks: Record<string, string>;
}

const EMPTY_EFFECTIVE_SCOPE_LABELS: EffectiveScopeLabels = {
  organizations: {},
  stores: {},
  kiosks: {},
};

function formatScopeEntityLabel(
  name: string | null | undefined,
  code: string | null | undefined,
  fallback: string,
) {
  return name?.trim() || code?.trim() || fallback;
}

export function useAccountActions(
  organizationId: string | null,
  onSuccess?: (message: string, account?: InternalAccountResult) => void
): UseAccountActionsResult {
  const effectiveAccessAbortRef = useRef<AbortController | null>(null);
  const effectiveAccessRequestIdRef = useRef(0);
  const [effectiveAccess, setEffectiveAccess] = useState<EffectiveAccessResult | null>(null);
  const [effectiveScopeLabels, setEffectiveScopeLabels] =
    useState<EffectiveScopeLabels>(EMPTY_EFFECTIVE_SCOPE_LABELS);
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
    if (!organizationId) {
      setEffectiveAccessErrorMessage("Vui lòng chọn tổ chức trước khi xem quyền hạn.");
      return;
    }

    effectiveAccessAbortRef.current?.abort();
    const controller = new AbortController();
    effectiveAccessAbortRef.current = controller;
    const requestId = ++effectiveAccessRequestIdRef.current;

    setIsEffectiveAccessLoading(true);
    setEffectiveAccess(null);
    setEffectiveAccessErrorMessage(null);
    try {
      const result = await getEffectiveAccess(
        organizationId,
        accountId,
        controller.signal,
      );
      if (
        controller.signal.aborted ||
        requestId !== effectiveAccessRequestIdRef.current
      ) {
        return;
      }
      const organizationIds = result.effectiveScope.organizationIds;
      const storeIds = result.effectiveScope.storeIds;
      const kioskIds = result.effectiveScope.kioskIds;
      const [organizationResults, storesResult, kiosksResult] = await Promise.all([
        Promise.allSettled(
          organizationIds.map((id) =>
            getManagementOrganizationById(id, controller.signal),
          ),
        ),
        getManagementStores({ organizationId }, controller.signal).catch(() => []),
        getManagementKiosks({ organizationId }, controller.signal).catch(() => []),
      ]);
      if (
        controller.signal.aborted ||
        requestId !== effectiveAccessRequestIdRef.current
      ) {
        return;
      }
      const nextLabels: EffectiveScopeLabels = {
        organizations: {},
        stores: {},
        kiosks: {},
      };
      organizationResults.forEach((item, index) => {
        if (item.status === "fulfilled") {
          nextLabels.organizations[organizationIds[index]] = formatScopeEntityLabel(
            item.value.name,
            item.value.code,
            organizationIds[index],
          );
        }
      });
      storesResult.forEach((store) => {
        if (storeIds.includes(store.id)) {
          nextLabels.stores[store.id] = formatScopeEntityLabel(store.name, store.code, store.id);
        }
      });
      kiosksResult.forEach((kiosk) => {
        if (kioskIds.includes(kiosk.id)) {
          nextLabels.kiosks[kiosk.id] = formatScopeEntityLabel(kiosk.name, kiosk.code, kiosk.id);
        }
      });
      setEffectiveScopeLabels(nextLabels);
      setEffectiveAccess(result);
    } catch (error) {
      if (
        controller.signal.aborted ||
        requestId !== effectiveAccessRequestIdRef.current
      ) {
        return;
      }
      setEffectiveAccessErrorMessage(error instanceof Error ? error.message : "Đã xảy ra lỗi.");
    } finally {
      if (requestId === effectiveAccessRequestIdRef.current) {
        effectiveAccessAbortRef.current = null;
        setIsEffectiveAccessLoading(false);
      }
    }
  }, [organizationId]);

  const cancelEffectiveAccessLoad = useCallback(() => {
    effectiveAccessRequestIdRef.current += 1;
    effectiveAccessAbortRef.current?.abort();
    effectiveAccessAbortRef.current = null;
    setEffectiveAccess(null);
    setEffectiveScopeLabels(EMPTY_EFFECTIVE_SCOPE_LABELS);
    setIsEffectiveAccessLoading(false);
    setEffectiveAccessErrorMessage(null);
  }, []);

  useEffect(
    () => () => {
      effectiveAccessRequestIdRef.current += 1;
      effectiveAccessAbortRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    effectiveAccessRequestIdRef.current += 1;
    effectiveAccessAbortRef.current?.abort();
    effectiveAccessAbortRef.current = null;
    const timeoutId = window.setTimeout(() => {
      setEffectiveAccess(null);
      setEffectiveScopeLabels(EMPTY_EFFECTIVE_SCOPE_LABELS);
      setEffectiveAccessErrorMessage(null);
      setIsEffectiveAccessLoading(false);
      setIsEditRolesOpen(false);
      setEditRolesErrorMessage(null);
      setRoleScopeOptionsByRole({});
      setRoleScopeErrorsByRole({});
      setIsResetPasswordOpen(false);
      setResetPasswordErrorMessage(null);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [organizationId]);

  const loadRoleScopeOptions = useCallback(async (roleCode: string) => {
    if (!roleCode || !organizationId) {
      return null;
    }

    setIsRoleScopeLoading(true);
    setRoleScopeErrorsByRole((current) => ({ ...current, [roleCode]: "" }));
    try {
      const result = await getRoleScopeOptions(roleCode);
      const scopedResult = {
        ...result,
        organizations: result.organizations.filter(
          (organization) => organization.id === organizationId,
        ),
      };
      setRoleScopeOptionsByRole((current) => ({ ...current, [roleCode]: scopedResult }));
      return scopedResult;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải phạm vi vai trò.";
      setRoleScopeErrorsByRole((current) => ({ ...current, [roleCode]: message }));
      return null;
    } finally {
      setIsRoleScopeLoading(false);
    }
  }, [organizationId]);

  const submitEditRoles = useCallback(
    async (accountId: string, roles: AccountRoleScopeRequest[]) => {
      if (!organizationId) {
        setEditRolesErrorMessage("Vui lòng chọn tổ chức trước khi cập nhật vai trò.");
        return false;
      }

      setIsEditingRoles(true);
      setEditRolesErrorMessage(null);
      try {
        const result = await assignAccountRoles(organizationId, accountId, { roles });
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
    [onSuccess, organizationId]
  );

  const submitResetPassword = useCallback(
    async (account: InternalAccountResult) => {
      if (!account.email && !account.userName) {
        setResetPasswordErrorMessage("Tài khoản chưa có email hoặc tên đăng nhập hợp lệ.");
        return false;
      }

      setIsResettingPassword(true);
      setResetPasswordErrorMessage(null);
      try {
        await requestAccountPasswordReset(account.email || account.userName);
        setIsResetPasswordOpen(false);
        onSuccess?.("Đã gửi yêu cầu. Nếu tài khoản hợp lệ, hướng dẫn đặt lại mật khẩu sẽ được gửi đến email đăng ký.");
        return true;
      } catch (error) {
        setResetPasswordErrorMessage(error instanceof Error ? error.message : "Không thể gửi hướng dẫn đặt lại mật khẩu.");
        return false;
      } finally {
        setIsResettingPassword(false);
      }
    },
    [onSuccess]
  );

  return {
    effectiveAccess,
    effectiveScopeLabels,
    isEffectiveAccessLoading,
    effectiveAccessErrorMessage,
    loadEffectiveAccess,
    cancelEffectiveAccessLoad,

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
