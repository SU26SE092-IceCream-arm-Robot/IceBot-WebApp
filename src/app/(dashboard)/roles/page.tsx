"use client";

import {
  KeyRound,
  RefreshCw,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";

import { PermissionMatrixView } from "@/components/features/identity/roles/permission-matrix-view";
import { RolesTable } from "@/components/features/identity/roles/roles-table";
import { MetricStrip, MetricStripItem } from "@/components/shared/metric-strip";
import { PageHeader } from "@/components/shared/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoles } from "@/hooks/identity/use-roles";

export default function RolesPage() {
  const { roles, permissionMatrix, isLoading, errorMessage, refresh } =
    useRoles();
  const matrix = permissionMatrix ?? [];
  const scopedPermissionCount = matrix.filter(
    (permission) => permission.scopeRequired,
  ).length;
  const systemRoleCount = roles.filter((role) => role.isSystemRole).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Role và quyền truy cập"
        description="Tra cứu role hệ thống được phép làm gì và quyền đó áp dụng trong phạm vi nào. Việc cấp hoặc thay đổi role được thực hiện tại trang Tài khoản."
        metadata={
          <p className="text-xs text-muted-foreground">
            Tên role và mã policy được giữ nguyên để đối chiếu chính xác với
            backend
          </p>
        }
        actions={
          <>
            <Link
              href="/users"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Mở trang Tài khoản
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refresh()}
              isLoading={isLoading}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Làm mới
            </Button>
          </>
        }
      />

      {errorMessage ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Không thể tải dữ liệu phân quyền</p>
            <p className="mt-1">{errorMessage}</p>
          </div>
        </div>
      ) : null}

      <MetricStrip>
        <MetricStripItem
          icon={Shield}
          label="Role hệ thống"
          value={roles.length.toLocaleString("vi-VN")}
          description={`${systemRoleCount} role nền tảng`}
          tone="primary"
        />
        <MetricStripItem
          icon={KeyRound}
          label="Quyền được khai báo"
          value={matrix.length.toLocaleString("vi-VN")}
          description="Từ ma trận policy hiện tại"
          tone="neutral"
        />
        <MetricStripItem
          icon={SlidersHorizontal}
          label="Quyền cần phạm vi"
          value={scopedPermissionCount.toLocaleString("vi-VN")}
          description="Yêu cầu tổ chức, cửa hàng hoặc kiosk"
          tone="warning"
        />
        <MetricStripItem
          icon={ShieldAlert}
          label="Quyền không cần phạm vi"
          value={(matrix.length - scopedPermissionCount).toLocaleString(
            "vi-VN",
          )}
          description="Không yêu cầu chọn scope khi cấp"
          tone="neutral"
        />
      </MetricStrip>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList
          variant="line"
          className="w-full border-b border-border"
          aria-label="Nội dung role và quyền truy cập"
        >
          <TabsTrigger value="roles">Danh sách role</TabsTrigger>
          <TabsTrigger value="matrix">Quyền theo nhóm nghiệp vụ</TabsTrigger>
        </TabsList>
        <TabsContent value="roles" className="space-y-4">
          {isLoading && roles.length === 0 ? (
            <div className="space-y-2 py-2" aria-label="Đang tải role">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`role-loading-${index}`}
                  className="h-20 animate-pulse rounded-lg border border-border bg-muted/20"
                />
              ))}
            </div>
          ) : (
            <RolesTable roles={roles} />
          )}
        </TabsContent>
        <TabsContent value="matrix" className="space-y-4">
          {isLoading && !permissionMatrix ? (
            <div className="space-y-3 py-2" aria-label="Đang tải ma trận quyền">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`permission-loading-${index}`}
                  className="h-28 animate-pulse rounded-lg border border-border bg-muted/20"
                />
              ))}
            </div>
          ) : permissionMatrix ? (
            <PermissionMatrixView matrix={permissionMatrix} />
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
