import { Eye, KeyRound, Mail, RefreshCw, ShieldCheck, UserRoundX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  InternalAccountResult,
  ManagementAccountStatus,
} from "@/types/identity/accounts";

interface AccountsTableProps {
  accounts: InternalAccountResult[];
  canManageAccounts: boolean;
  currentAccountId?: string;
  onDisableAccount: (account: InternalAccountResult) => void;
  onRegenerateInvitation: (account: InternalAccountResult) => void;
  onViewAccount: (accountId: string) => void;
}

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

function StatusBadge({ status }: { status: ManagementAccountStatus }) {
  switch (status) {
    case "Active":
      return (
        <Badge className="border-0 bg-success/10 text-success">
          {getStatusLabel(status)}
        </Badge>
      );
    case "PendingVerification":
      return (
        <Badge className="border-0 bg-warning/10 text-warning">
          {getStatusLabel(status)}
        </Badge>
      );
    case "Suspended":
      return (
        <Badge className="border border-warning/20 bg-warning/10 text-warning">
          {getStatusLabel(status)}
        </Badge>
      );
    case "Disabled":
      return (
        <Badge className="border-0 bg-destructive/10 text-destructive">
          {getStatusLabel(status)}
        </Badge>
      );
    case "Invited":
      return (
        <Badge className="border-0 bg-primary/10 text-primary">
          {getStatusLabel(status)}
        </Badge>
      );
  }
}

function LoginMethods({ account }: { account: InternalAccountResult }) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {account.localLoginEnabled ? (
          <Badge variant="outline" className="gap-1 border-primary/20 bg-primary/10 text-primary">
            <KeyRound className="size-3" />
            Mật khẩu
          </Badge>
      ) : null}
      {account.googleLoginEnabled ? (
          <Badge variant="outline" className="gap-1 border-primary/20 bg-primary/10 text-primary">
            <Mail className="size-3" />
            Google
          </Badge>
      ) : null}
      {!account.localLoginEnabled && !account.googleLoginEnabled ? (
        <span className="text-xs text-muted-foreground">Chưa bật</span>
      ) : null}
    </div>
  );
}

export function AccountsTable({
  accounts,
  canManageAccounts,
  currentAccountId,
  onDisableAccount,
  onRegenerateInvitation,
  onViewAccount,
}: AccountsTableProps) {
  return (
    <>
      <div className="divide-y divide-border md:hidden">
        {accounts.map((account) => {
          const accountName = account.fullName?.trim() || account.userName;
          return (
            <article key={account.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {accountName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {account.email}
                  </p>
                </div>
                <StatusBadge status={account.status} />
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Role hệ thống
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {account.roles.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      Chưa gán role
                    </span>
                  ) : (
                    account.roles.map((role, index) => (
                      <Badge
                        key={`${role.roleCode}-${role.organizationId ?? ""}-${role.storeId ?? ""}-${role.kioskId ?? ""}-${index}`}
                        className="gap-1 border-0 bg-primary/10 font-mono text-primary"
                      >
                        <ShieldCheck className="size-3" aria-hidden="true" />
                        {role.roleCode}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Phương thức đăng nhập
                </p>
                <LoginMethods account={account} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewAccount(account.id)}
                >
                  <Eye className="size-4" aria-hidden="true" />
                  Chi tiết
                </Button>
                {canManageAccounts && account.status === "Invited" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRegenerateInvitation(account)}
                  >
                    <RefreshCw className="size-4" aria-hidden="true" />
                    Gửi lại lời mời
                  </Button>
                ) : null}
                {canManageAccounts ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="col-span-2 text-destructive hover:text-destructive"
                    disabled={
                      account.id === currentAccountId ||
                      account.status === "Disabled"
                    }
                    onClick={() => onDisableAccount(account)}
                  >
                    <UserRoundX className="size-4" aria-hidden="true" />
                    Vô hiệu hóa tài khoản
                  </Button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <Table className="min-w-[900px] table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="px-5">Tài khoản</TableHead>
          <TableHead className="text-center">Trạng thái</TableHead>
          <TableHead className="text-center">Vai trò</TableHead>
          <TableHead className="text-center">Đăng nhập</TableHead>
          <TableHead className="px-5 text-center">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {accounts.map((account) => (
          <TableRow key={account.id}>
            <TableCell className="px-5">
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  {account.fullName?.trim() || account.userName}
                </p>
                <p className="text-sm text-muted-foreground">{account.email}</p>
              </div>
            </TableCell>
            <TableCell className="text-center">
              <StatusBadge status={account.status} />
            </TableCell>
            <TableCell className="text-center">
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {account.roles.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Chưa gán role</span>
                ) : (
                  account.roles.map((role, index) => (
                    <Badge
                      key={`${role.roleCode}-${role.organizationId ?? ""}-${role.storeId ?? ""}-${role.kioskId ?? ""}-${index}`}
                      className="gap-1 border-0 bg-primary/10 text-primary"
                    >
                      <ShieldCheck className="size-3" />
                      {role.roleCode}
                    </Badge>
                  ))
                )}
              </div>
            </TableCell>
            <TableCell className="text-center">
              <LoginMethods account={account} />
            </TableCell>
            <TableCell className="px-5">
              <div className="flex items-center justify-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-lg text-muted-foreground hover:bg-muted/35 hover:text-foreground"
                  aria-label={`Xem chi tiết ${account.fullName?.trim() || account.userName}`}
                  title="Xem chi tiết"
                  onClick={() => onViewAccount(account.id)}
                >
                  <Eye className="size-4" />
                </Button>
                {canManageAccounts ? (
                  <>
                    {account.status === "Invited" ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-lg text-primary hover:bg-primary/5 hover:text-primary"
                        aria-label={`Tạo lại lời mời cho ${account.fullName?.trim() || account.userName}`}
                        title="Tạo lại lời mời"
                        onClick={() => onRegenerateInvitation(account)}
                      >
                        <RefreshCw className="size-4" />
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-lg text-destructive hover:bg-destructive/5 hover:text-destructive"
                      disabled={account.id === currentAccountId || account.status === "Disabled"}
                      aria-label={`Vô hiệu hóa ${account.fullName?.trim() || account.userName}`}
                      title={
                        account.id === currentAccountId
                          ? "Không thể vô hiệu hóa tài khoản đang đăng nhập"
                          : account.status === "Disabled"
                            ? "Tài khoản đã bị vô hiệu hóa"
                            : "Vô hiệu hóa tài khoản"
                      }
                      onClick={() => onDisableAccount(account)}
                    >
                      <UserRoundX className="size-4" />
                    </Button>
                  </>
                ) : null}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
        </Table>
      </div>
    </>
  );
}
