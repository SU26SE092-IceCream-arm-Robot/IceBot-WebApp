import { KeyRound, Mail, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  InternalAccountRoleResult,
  ManagementAccountStatus,
} from "@/types/accounts";

interface AccountsTableProps {
  accounts: InternalAccountResult[];
}

const ROLE_LABELS: Record<string, string> = {
  SystemAdmin: "Admin",
  Manager: "Manager",
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
  }
}

function StatusBadge({ status }: { status: ManagementAccountStatus }) {
  if (status === "Active") {
    return <Badge variant="default">{getStatusLabel(status)}</Badge>;
  }

  if (status === "Suspended") {
    return (
      <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">
        {getStatusLabel(status)}
      </Badge>
    );
  }

  return <Badge variant="secondary">{getStatusLabel(status)}</Badge>;
}

function ScopeLabel({ role }: { role: InternalAccountRoleResult }) {
  if (role.kioskId) {
    return (
      <span className="tabular-nums text-xs text-muted-foreground">
        Kiosk {role.kioskId.slice(0, 8)}
      </span>
    );
  }

  if (role.storeId) {
    return (
      <span className="tabular-nums text-xs text-muted-foreground">
        Cửa hàng {role.storeId.slice(0, 8)}
      </span>
    );
  }

  if (role.organizationId) {
    return (
      <span className="tabular-nums text-xs text-muted-foreground">
        Tổ chức {role.organizationId.slice(0, 8)}
      </span>
    );
  }

  return <span className="text-xs text-muted-foreground">Toàn hệ thống</span>;
}

function LoginMethods({ account }: { account: InternalAccountResult }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {account.localLoginEnabled ? (
        <Badge variant="outline" className="gap-1">
          <KeyRound className="size-3" />
          Mật khẩu
        </Badge>
      ) : null}
      {account.googleLoginEnabled ? (
        <Badge variant="outline" className="gap-1">
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

export function AccountsTable({ accounts }: AccountsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="px-5">Tài khoản</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Vai trò & phạm vi</TableHead>
          <TableHead>Đăng nhập</TableHead>
          <TableHead className="px-5">ID</TableHead>
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
                <p className="text-xs text-muted-foreground">{account.email}</p>
              </div>
            </TableCell>
            <TableCell>
              <StatusBadge status={account.status} />
            </TableCell>
            <TableCell>
              <div className="space-y-2">
                {account.roles.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Chưa gán role</span>
                ) : (
                  account.roles.map((role, index) => (
                    <div
                      key={`${role.roleCode}-${role.organizationId ?? ""}-${role.storeId ?? ""}-${role.kioskId ?? ""}-${index}`}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <Badge variant="secondary" className="gap-1">
                        <ShieldCheck className="size-3" />
                        {ROLE_LABELS[role.roleCode] ?? role.roleCode}
                      </Badge>
                      <ScopeLabel role={role} />
                    </div>
                  ))
                )}
              </div>
            </TableCell>
            <TableCell>
              <LoginMethods account={account} />
            </TableCell>
            <TableCell className="px-5">
              <span className="tabular-nums text-xs text-muted-foreground">{account.id.slice(0, 8)}</span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
