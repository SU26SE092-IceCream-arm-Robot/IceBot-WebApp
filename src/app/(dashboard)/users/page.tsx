"use client";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { AccountsTable } from "@/components/features/users/accounts-table";
import { Badge } from "@/components/ui/badge";
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
import type { ManagementAccountStatusFilter } from "@/types/accounts";

const STATUS_OPTIONS: { value: ManagementAccountStatusFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "Active", label: "Hoạt động" },
  { value: "PendingVerification", label: "Chờ xác minh" },
  { value: "Suspended", label: "Tạm khóa" },
  { value: "Disabled", label: "Vô hiệu hóa" },
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

export default function UsersPage() {
  const {
    accounts,
    query,
    pagination,
    isLoading,
    errorMessage,
    setSearchTerm,
    setStatus,
    clearFilters,
    previousPage,
    nextPage,
    refresh,
  } = useAccounts();

  const roleCount = accounts.reduce((count, account) => count + account.roles.length, 0);
  const activeOnPage = accounts.filter((account) => account.status === "Active").length;

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <Badge variant="outline" className="gap-2 border-primary/20 bg-primary/5 text-primary">
            <ShieldCheck className="size-3" />
            Chỉ dành cho SystemAdmin
          </Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Quản lý tài khoản</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Theo dõi tài khoản nội bộ và phạm vi vai trò được cấp trong hệ thống IceBot.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => void refresh()} isLoading={isLoading}>
          <RefreshCw className="size-4" />
          Làm mới
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/80 shadow-none">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm text-muted-foreground">Tổng tài khoản</p>
            <p className="tabular-nums text-3xl font-semibold tracking-tight text-foreground">
              {pagination.totalCount}
            </p>
            <p className="text-xs text-muted-foreground">Theo kết quả đang lọc</p>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-none">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm text-muted-foreground">Hoạt động trên trang</p>
            <p className="tabular-nums text-3xl font-semibold tracking-tight text-primary">
              {activeOnPage}
            </p>
            <p className="text-xs text-muted-foreground">Trong trang dữ liệu hiện tại</p>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-none">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm text-muted-foreground">Role scope hiển thị</p>
            <p className="tabular-nums text-3xl font-semibold tracking-tight text-foreground">
              {roleCount}
            </p>
            <p className="text-xs text-muted-foreground">Phân quyền trên trang hiện tại</p>
          </CardContent>
        </Card>
      </section>

      <Card className="border-border/80 shadow-none">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <UsersRound className="size-4" />
            </span>
            <div>
              <CardTitle className="text-base">Danh sách tài khoản nội bộ</CardTitle>
              <CardDescription>
                Dữ liệu thật từ Management Accounts API, được bảo vệ bởi policy `accounts.manage`.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-[minmax(240px,1fr)_220px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                value={query.searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm tên, username hoặc email..."
                className="pl-9"
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
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={clearFilters}>
              Xóa lọc
            </Button>
          </div>
        </CardContent>

        <div className="border-t border-border">
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
              <span className="flex size-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                <UsersRound className="size-5" />
              </span>
              <p className="text-sm font-medium text-foreground">Không có tài khoản phù hợp</p>
              <p className="text-sm text-muted-foreground">
                Thử thay đổi từ khóa hoặc bộ lọc trạng thái.
              </p>
            </div>
          ) : (
            <AccountsTable accounts={accounts} />
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
    </div>
  );
}
