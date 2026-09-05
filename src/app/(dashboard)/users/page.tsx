"use client";

import { useCallback, useEffect } from "react";

import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  ContactRound,
  KeyRound,
  RefreshCw,
  Search,
  UserPlus,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import { AccountsTable } from "@/components/features/identity/accounts/accounts-table";
import { AccountDetailDialog } from "@/components/features/identity/accounts/account-detail-dialog";
import {
  EditRolesDialog,
  ResetPasswordDialog,
} from "@/components/features/identity/accounts/account-action-dialogs";
import { DisableAccountDialog } from "@/components/features/identity/accounts/account-dialogs";
import {
  CreateAccountDialog,
  InvitationResultDialog,
  RegenerateInvitationDialog,
} from "@/components/features/identity/accounts/invitation-dialogs";
import { MetricStrip, MetricStripItem } from "@/components/shared/metric-strip";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccounts } from "@/hooks/identity/use-accounts";
import { useAccountActions } from "@/hooks/identity/use-account-actions";
import { useAccountOrganizationScope } from "@/hooks/identity/use-account-organization-scope";
import { useAuth } from "@/hooks/identity/use-auth";
import { hasPermission } from "@/lib/rbac";
import type { ManagementAccountStatusFilter } from "@/types/identity/accounts";

const STATUS_OPTIONS: {
  value: ManagementAccountStatusFilter;
  label: string;
}[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "Active", label: "Đang hoạt động" },
  { value: "PendingVerification", label: "Chờ xác minh" },
  { value: "Suspended", label: "Tạm khóa" },
  { value: "Disabled", label: "Đã vô hiệu hóa" },
  { value: "Invited", label: "Đã mời" },
];

function isAccountStatusFilter(
  value: string | null,
): value is ManagementAccountStatusFilter {
  return STATUS_OPTIONS.some((option) => option.value === value);
}

function AccountsLoadingTable() {
  return (
    <div className="space-y-1 px-5 py-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={`account-skeleton-${index}`}
          className="grid grid-cols-5 items-center gap-4 border-b border-border py-4 last:border-0"
        >
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-muted/50" />
            <div className="h-3 w-44 animate-pulse rounded bg-muted/30" />
          </div>
          <div className="h-5 w-20 animate-pulse rounded-full bg-muted/40" />
          <div className="h-5 w-32 animate-pulse rounded-full bg-muted/40" />
          <div className="h-5 w-24 animate-pulse rounded-full bg-muted/30" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted/30" />
        </div>
      ))}
    </div>
  );
}

export default function UsersPage() {
  const { currentUser, effectiveAccess } = useAuth();
  const organizationScope = useAccountOrganizationScope();
  const {
    accounts,
    query,
    pagination,
    isLoading,
    errorMessage,
    selectedAccount,
    accountPendingDisable,
    isDetailOpen,
    isDetailLoading,
    detailErrorMessage,
    isDisableOpen,
    isDisabling,
    disableErrorMessage,
    isCreateOpen,
    isCreating,
    createErrorMessage,
    managementRoles,
    createRoleCode,
    isRoleCatalogLoading,
    roleCatalogErrorMessage,
    roleScopeOptions,
    isRoleScopeLoading,
    roleScopeErrorMessage,
    accountPendingInvitation,
    isRegenerateOpen,
    isRegenerating,
    regenerateErrorMessage,
    regenerateSendEmail,
    invitationResult,
    invitationAccount,
    invitationResultMode,
    isInvitationResultOpen,
    successMessage,
    setSearchTerm,
    setStatus,
    clearFilters,
    previousPage,
    nextPage,
    refresh,
    openAccountDetail,
    setDetailOpen,
    requestDisableAccount,
    setDisableOpen,
    confirmDisableAccount,
    setCreateOpen,
    selectCreateRole,
    submitCreateAccount,
    requestRegenerateInvitation,
    setRegenerateOpen,
    setRegenerateSendEmail,
    confirmRegenerateInvitation,
    setInvitationResultOpen,
    clearSuccessMessage,
  } = useAccounts(organizationScope.selectedOrganizationId);

  const handleAccountActionSuccess = useCallback(
    (message: string, account?: { id: string }) => {
      toast.success(message);
      void refresh();
      if (account && isDetailOpen) {
        void openAccountDetail(account.id);
      }
    },
    [isDetailOpen, openAccountDetail, refresh],
  );
  const accountActions = useAccountActions(
    organizationScope.selectedOrganizationId,
    handleAccountActionSuccess,
  );
  const handleDetailOpenChange = useCallback(
    (open: boolean) => {
      setDetailOpen(open);
      if (!open) {
        accountActions.cancelEffectiveAccessLoad();
      }
    },
    [accountActions, setDetailOpen],
  );

  // Watch for legacy success message from useAccounts and toast it
  useEffect(() => {
    if (successMessage) {
      if (successMessage.includes("vô hiệu hóa")) {
        toast.warning(successMessage);
      } else {
        toast.success(successMessage);
      }
      clearSuccessMessage();
    }
  }, [successMessage, clearSuccessMessage]);

  const canManageAccounts = hasPermission(effectiveAccess, "accounts.manage");
  const roleCount = accounts.reduce(
    (count, account) => count + account.roles.length,
    0,
  );
  const activeOnPage = accounts.filter(
    (account) => account.status === "Active",
  ).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tài khoản"
        description="Mời người dùng, kiểm tra trạng thái truy cập và cấp role hệ thống trong phạm vi tổ chức đã chọn."
        metadata={
          <p className="text-xs text-muted-foreground">
            {organizationScope.selectedOrganization
              ? `Phạm vi: ${organizationScope.selectedOrganization.name}`
              : "Chọn tổ chức trước khi thực hiện thao tác tài khoản"}
          </p>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refresh()}
              isLoading={isLoading}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Làm mới
            </Button>
            {canManageAccounts ? (
              <Button
                size="sm"
                disabled={!organizationScope.selectedOrganizationId}
                onClick={() => setCreateOpen(true)}
              >
                <UserPlus className="size-4" aria-hidden="true" />
                Tạo tài khoản
              </Button>
            ) : null}
          </>
        }
      />

      <Card className="gap-0 rounded-lg border border-border bg-card py-0 shadow-none">
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Building2 className="size-5" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <p className="font-medium text-foreground">Phạm vi tổ chức</p>
              <p className="text-sm text-muted-foreground">
                Danh sách và thao tác tài khoản chỉ áp dụng trong tổ chức được
                chọn.
              </p>
            </div>
          </div>
          <div className="w-full lg:max-w-md">
            <Select
              value={organizationScope.selectedOrganizationId ?? ""}
              onValueChange={(value) =>
                organizationScope.setSelectedOrganizationId(value || null)
              }
              disabled={
                organizationScope.isLoading ||
                organizationScope.organizations.length === 0
              }
            >
              <SelectTrigger
                className="w-full bg-card"
                aria-label="Chọn tổ chức quản lý tài khoản"
              >
                <SelectValue>
                  {organizationScope.selectedOrganization
                    ? `${organizationScope.selectedOrganization.name} — ${organizationScope.selectedOrganization.code}`
                    : organizationScope.isLoading
                      ? "Đang tải tổ chức..."
                      : "Chọn tổ chức"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {organizationScope.organizations.map((organization) => (
                  <SelectItem key={organization.id} value={organization.id}>
                    {organization.name} — {organization.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {organizationScope.errorMessage ? (
              <p className="mt-2 text-sm text-destructive">
                {organizationScope.errorMessage}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <MetricStrip>
        <MetricStripItem
          icon={UsersRound}
          label="Tổng tài khoản"
          value={pagination.totalCount.toLocaleString("vi-VN")}
          tone="primary"
          description="Trong tổ chức đã chọn"
        />
        <MetricStripItem
          icon={ContactRound}
          label="Đang hiển thị"
          value={accounts.length.toLocaleString("vi-VN")}
          tone="neutral"
          description="Kết quả trên trang hiện tại"
        />
        <MetricStripItem
          icon={UserRoundCheck}
          label="Hoạt động trên trang"
          value={activeOnPage.toLocaleString("vi-VN")}
          tone="success"
          description="Có thể đăng nhập hệ thống"
        />
        <MetricStripItem
          icon={KeyRound}
          label="Lượt cấp role trên trang"
          value={roleCount.toLocaleString("vi-VN")}
          tone="warning"
          description="Một tài khoản có thể có nhiều role"
        />
      </MetricStrip>

      <Card className="rounded-xl border border-border bg-card shadow-none">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <UsersRound className="size-5" />
            </span>
            <div>
              <CardTitle className="text-base">
                Danh sách tài khoản nội bộ
              </CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="border-b border-border p-4">
          <div className="grid gap-2 md:grid-cols-[minmax(240px,1fr)_220px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Tìm kiếm tài khoản nội bộ"
                type="search"
                value={query.searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm tên, username hoặc email..."
                className="h-9 bg-card pl-9 text-sm"
              />
            </div>
            <Select
              value={query.status}
              onValueChange={(value) => {
                if (isAccountStatusFilter(value)) {
                  setStatus(value);
                }
              }}
            >
              <SelectTrigger
                aria-label="Lọc trạng thái tài khoản"
                className="h-9 w-full bg-card"
              >
                <SelectValue>
                  {STATUS_OPTIONS.find(
                    (option) => option.value === query.status,
                  )?.label ?? "Tất cả trạng thái"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={clearFilters}
            >
              Xóa lọc
            </Button>
          </div>
        </CardContent>

        <div>
          {isLoading ? (
            <AccountsLoadingTable />
          ) : errorMessage ? (
            <div className="flex flex-col items-center gap-4 p-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="size-5" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">
                  Không thể tải tài khoản
                </p>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
              </div>
              <Button variant="destructive" onClick={() => void refresh()}>
                Thử lại
              </Button>
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted/20 text-muted-foreground">
                <UsersRound className="size-5" />
              </span>
              <p className="text-sm font-medium text-foreground">
                {organizationScope.selectedOrganizationId
                  ? "Không có tài khoản phù hợp"
                  : "Chưa chọn tổ chức"}
              </p>
              <p className="text-sm text-muted-foreground">
                {organizationScope.selectedOrganizationId
                  ? "Thử thay đổi từ khóa hoặc bộ lọc trạng thái."
                  : "Chọn một tổ chức để xem và quản lý tài khoản thuộc phạm vi đó."}
              </p>
            </div>
          ) : (
            <AccountsTable
              accounts={accounts}
              canManageAccounts={canManageAccounts}
              currentAccountId={currentUser?.id}
              onViewAccount={(accountId) => void openAccountDetail(accountId)}
              onDisableAccount={requestDisableAccount}
              onRegenerateInvitation={requestRegenerateInvitation}
            />
          )}
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-border px-5 py-4 text-sm sm:flex-row sm:items-center">
          <p className="text-muted-foreground">
            Trang{" "}
            <span className="tabular-nums font-medium text-foreground">
              {pagination.page}
            </span>{" "}
            /{" "}
            <span className="tabular-nums font-medium text-foreground">
              {Math.max(pagination.totalPages, 1)}
            </span>
            {" - "}
            <span className="tabular-nums font-medium text-foreground">
              {pagination.totalCount}
            </span>{" "}
            tài khoản
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevious || isLoading}
              onClick={previousPage}
            >
              <ChevronLeft className="size-4" />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext || isLoading}
              onClick={nextPage}
            >
              Sau
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </Card>

      <AccountDetailDialog
        account={selectedAccount}
        errorMessage={detailErrorMessage}
        isLoading={isDetailLoading}
        open={isDetailOpen}
        onOpenChange={handleDetailOpenChange}
        accountActions={accountActions}
        canManageAccounts={canManageAccounts}
      />

      <EditRolesDialog
        account={selectedAccount}
        open={accountActions.isEditRolesOpen}
        onOpenChange={accountActions.setEditRolesOpen}
        isSubmitting={accountActions.isEditingRoles}
        errorMessage={accountActions.editRolesErrorMessage}
        managementRoles={managementRoles}
        roleScopeOptionsByRole={accountActions.roleScopeOptionsByRole}
        roleScopeErrorsByRole={accountActions.roleScopeErrorsByRole}
        isRoleScopeLoading={accountActions.isRoleScopeLoading}
        onLoadRoleScopeOptions={accountActions.loadRoleScopeOptions}
        onSubmit={accountActions.submitEditRoles}
      />

      <ResetPasswordDialog
        account={selectedAccount}
        open={accountActions.isResetPasswordOpen}
        onOpenChange={accountActions.setResetPasswordOpen}
        isSubmitting={accountActions.isResettingPassword}
        errorMessage={accountActions.resetPasswordErrorMessage}
        onSubmit={accountActions.submitResetPassword}
      />

      <DisableAccountDialog
        account={accountPendingDisable}
        errorMessage={disableErrorMessage}
        isSubmitting={isDisabling}
        open={isDisableOpen}
        onConfirm={() => void confirmDisableAccount()}
        onOpenChange={setDisableOpen}
      />

      <CreateAccountDialog
        errorMessage={createErrorMessage}
        isSubmitting={isCreating}
        managementRoles={managementRoles}
        open={isCreateOpen}
        roleCode={createRoleCode}
        roleCatalogErrorMessage={roleCatalogErrorMessage}
        roleScopeErrorMessage={roleScopeErrorMessage}
        roleScopeOptions={roleScopeOptions}
        isRoleCatalogLoading={isRoleCatalogLoading}
        isRoleScopeLoading={isRoleScopeLoading}
        onOpenChange={setCreateOpen}
        onRoleChange={selectCreateRole}
        onSubmit={submitCreateAccount}
      />

      <RegenerateInvitationDialog
        account={accountPendingInvitation}
        errorMessage={regenerateErrorMessage}
        isSubmitting={isRegenerating}
        open={isRegenerateOpen}
        sendEmail={regenerateSendEmail}
        onConfirm={() => void confirmRegenerateInvitation()}
        onOpenChange={setRegenerateOpen}
        onSendEmailChange={setRegenerateSendEmail}
      />

      <InvitationResultDialog
        account={invitationAccount}
        mode={invitationResultMode}
        open={isInvitationResultOpen}
        result={invitationResult}
        onOpenChange={setInvitationResultOpen}
      />
    </div>
  );
}
