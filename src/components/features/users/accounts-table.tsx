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
} from "@/types/accounts";

interface AccountsTableProps {
  accounts: InternalAccountResult[];
  canManageAccounts: boolean;
  currentAccountId?: string;
  onDisableAccount: (account: InternalAccountResult) => void;
  onRegenerateInvitation: (account: InternalAccountResult) => void;
  onViewAccount: (accountId: string) => void;
}

const ROLE_LABELS: Record<string, string> = {
  SystemAdmin: "Admin",
  Manager: "Manager",
  OrgAdmin: "Org Admin",
  LocationOwner: "Location Owner",
  Staff: "Staff",
  Technician: "Technician",
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="px-5">Tài khoản</TableHead>
          <TableHead className="text-center">Trạng thái</TableHead>
          <TableHead className="text-center">Vai trò</TableHead>
          <TableHead className="text-center">Đăng nhập</TableHead>
          <TableHead className="text-center">ID</TableHead>
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
                      {ROLE_LABELS[role.roleCode] ?? role.roleCode}
                    </Badge>
                  ))
                )}
              </div>
            </TableCell>
            <TableCell className="text-center">
              <LoginMethods account={account} />
            </TableCell>
            <TableCell className="text-center">
              <span className="font-mono tabular-nums text-xs text-muted-foreground">{account.id.slice(0, 8)}</span>
            </TableCell>
            <TableCell className="px-5">
              <div className="flex items-center justify-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
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
                        className="rounded-lg text-primary hover:bg-primary/10 hover:text-primary"
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
                      className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
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
  );
}
