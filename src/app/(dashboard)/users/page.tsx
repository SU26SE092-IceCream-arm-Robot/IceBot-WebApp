"use client";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ContactRound,
  RefreshCw,
  Search,
  UserPlus,
  UserRoundCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { AccountsTable } from "@/components/features/users/accounts-table";
import {
  AccountDetailDialog,
  DisableAccountDialog,
} from "@/components/features/users/account-dialogs";
import {
  CreateAccountDialog,
  InvitationResultDialog,
  RegenerateInvitationDialog,
} from "@/components/features/users/invitation-dialogs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccounts } from "@/hooks/use-accounts";
import { useAuth } from "@/hooks/use-auth";
import type { ManagementAccountStatusFilter } from "@/types/accounts";

const STATUS_OPTIONS: { value: ManagementAccountStatusFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "Active", label: "Hoạt động" },
  { value: "PendingVerification", label: "Chờ xác minh" },
  { value: "Suspended", label: "Tạm khóa" },
  { value: "Disabled", label: "Vô hiệu hóa" },
  { value: "Invited", label: "Đã mời" },
];

function isAccountStatusFilter(value: string | null): value is ManagementAccountStatusFilter {
  return STATUS_OPTIONS.some((option) => option.value === value);
}

function AccountsLoadingTable() {
  return (
    <div className="space-y-1 px-5 py-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={`account-skeleton-${index}`} className="grid grid-cols-5 items-center gap-4 border-b border-border py-4 last:border-0">
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

type StatTone = "primary" | "success" | "warning";

const STAT_TONES: Record<StatTone, { iconClassName: string; valueClassName: string }> = {
  primary: {
    iconClassName: "bg-primary/10 text-primary",
    valueClassName: "text-foreground",
  },
  success: {
    iconClassName: "bg-success/10 text-success",
    valueClassName: "text-success",
  },
  warning: {
    iconClassName: "bg-warning/10 text-warning",
    valueClassName: "text-foreground",
  },
};

function StatCard({
  icon: Icon,
  label,
  supportingText,
  tone,
  value,
}: {
  icon: LucideIcon;
  label: string;
  supportingText: string;
  tone: StatTone;
  value: number;
}) {
  const toneClasses = STAT_TONES[tone];

  return (
    <Card className="rounded-xl border border-border/80 bg-card shadow-none">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${toneClasses.iconClassName}`}>
            <Icon className="size-5" />
          </span>
        </div>
        <p className={`tabular-nums text-3xl font-semibold tracking-tight ${toneClasses.valueClassName}`}>
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{supportingText}</p>
      </CardContent>
    </Card>
  );
}

export default function UsersPage() {
  const { currentUser } = useAuth();
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
  } = useAccounts();

  const canManageAccounts = currentUser?.role === "ADMIN";
  const roleCount = accounts.reduce((count, account) => count + account.roles.length, 0);
  const activeOnPage = accounts.filter((account) => account.status === "Active").length;

  return (
    <div className="space-y-7">
      {successMessage ? (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success"
        >
          <span>{successMessage}</span>
          <Button variant="ghost" size="sm" className="h-7 text-success" onClick={clearSuccessMessage}>
            Đóng
          </Button>
        </div>
      ) : null}

      <section className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Quản lý tài khoản</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Theo dõi tài khoản nội bộ và phạm vi vai trò được cấp trong hệ thống IceBot.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-10" onClick={() => void refresh()} isLoading={isLoading}>
            <RefreshCw className="size-4" />
            Làm mới
          </Button>
          {canManageAccounts ? (
            <Button className="h-10" onClick={() => setCreateOpen(true)}>
              <UserPlus className="size-4" />
              Tạo tài khoản
            </Button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={UsersRound}
          label="Tổng tài khoản"
          value={pagination.totalCount}
          supportingText="Theo kết quả đang lọc"
          tone="primary"
        />
        <StatCard
          icon={UserRoundCheck}
          label="Hoạt động trên trang"
          value={activeOnPage}
          supportingText="Trong trang dữ liệu hiện tại"
          tone="success"
        />
        <StatCard
          icon={ContactRound}
          label="Role scope hiển thị"
          value={roleCount}
          supportingText="Phân quyền trên trang hiện tại"
          tone="warning"
        />
      </section>

      <Card className="rounded-xl border border-border bg-card shadow-none">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <UsersRound className="size-5" />
            </span>
            <div>
              <CardTitle className="text-base">Danh sách tài khoản nội bộ</CardTitle>
              <CardDescription>
                Dữ liệu thật từ Management Accounts API, được bảo vệ bởi policy `accounts.manage`.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="border-b border-border p-4">
          <div className="grid gap-2 md:grid-cols-[minmax(240px,1fr)_220px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
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
              <SelectTrigger className="h-9 w-full bg-card">
                <SelectValue>
                  {STATUS_OPTIONS.find((option) => option.value === query.status)?.label ??
                    "Tất cả trạng thái"}
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
            <Button variant="outline" size="sm" className="h-9" onClick={clearFilters}>
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
                <p className="text-sm font-medium text-destructive">Không thể tải tài khoản</p>
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
              <p className="text-sm font-medium text-foreground">Không có tài khoản phù hợp</p>
              <p className="text-sm text-muted-foreground">
                Thử thay đổi từ khóa hoặc bộ lọc trạng thái.
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
            Trang <span className="tabular-nums font-medium text-foreground">{pagination.page}</span> /{" "}
            <span className="tabular-nums font-medium text-foreground">{Math.max(pagination.totalPages, 1)}</span>
            {" - "}
            <span className="tabular-nums font-medium text-foreground">{pagination.totalCount}</span> tài khoản
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!pagination.hasPrevious || isLoading} onClick={previousPage}>
              <ChevronLeft className="size-4" />
              Trước
            </Button>
            <Button variant="outline" size="sm" disabled={!pagination.hasNext || isLoading} onClick={nextPage}>
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
        onOpenChange={setDetailOpen}
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
