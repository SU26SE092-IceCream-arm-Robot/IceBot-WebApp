"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CirclePause,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings2,
} from "lucide-react";

import {
  getOrganizationLifecycleActionLabel,
  getOrganizationLifecycleActions,
  OrganizationLifecycleDialog,
} from "@/components/features/tenants/organizations/organization-lifecycle";

import { OrganizationFormDialog } from "@/components/features/tenants/shared/tenant-management-dialogs";
import { MetricStrip, MetricStripItem } from "@/components/shared/metric-strip";
import { PageHeader } from "@/components/shared/page-header";
import { TenantRefreshWarning } from "@/components/features/tenants/shared/tenant-refresh-warning";
import {
  TenantEmptyState,
  TenantErrorState,
  TenantLoadingState,
  TenantStatusBadge,
  formatTenantDate,
} from "@/components/features/tenants/shared/tenant-ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/identity/use-auth";
import { useTenantMutationRefresh } from "@/hooks/tenants/use-tenant-mutation-refresh";
import { hasPermission } from "@/lib/rbac";
import {
  createManagementOrganization,
  getOrganizationsErrorMessage,
  listAllManagementOrganizations,
  listManagementOrganizations,
  transitionManagementOrganizationLifecycle,
  updateManagementOrganization,
} from "@/lib/services/tenants/organizations";
import { findOrganizationIdentityConflict } from "@/lib/tenant-identity";
import { cn } from "@/lib/utils";
import type {
  CreateOrganizationRequest,
  OrganizationLifecycleAction,
  OrganizationLifecycleTransitionRequest,
  OrganizationResult,
  TenantEntityStatus,
  TenantStatusFilter,
  UpdateOrganizationRequest,
} from "@/types/tenants/management";

const PAGE_SIZE = 12;
const STATUS_OPTIONS: { value: TenantStatusFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "Active", label: "Đang hoạt động" },
  { value: "Inactive", label: "Ngừng hoạt động" },
  { value: "Suspended", label: "Tạm ngưng" },
  { value: "Disabled", label: "Đã vô hiệu hóa" },
  { value: "Archived", label: "Đã lưu trữ" },
];

interface OrganizationListRefreshContext {
  page: number;
  search: string;
  status: TenantStatusFilter;
}

function isSameListContext(
  left: OrganizationListRefreshContext,
  right: OrganizationListRefreshContext,
) {
  return (
    left.page === right.page &&
    left.search === right.search &&
    left.status === right.status
  );
}

export function OrganizationsView() {
  const { effectiveAccess } = useAuth();
  const [organizations, setOrganizations] = useState<OrganizationResult[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TenantStatusFilter>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingOrganization, setEditingOrganization] =
    useState<OrganizationResult | null>(null);
  const [lifecycleTarget, setLifecycleTarget] = useState<{
    organization: OrganizationResult;
  } | null>(null);
  const currentListContext = useMemo(
    () => ({ page, search, status }),
    [page, search, status],
  );
  const currentListContextRef = useRef(currentListContext);
  useEffect(() => {
    currentListContextRef.current = currentListContext;
  }, [currentListContext]);

  const canManageOrganizations =
    effectiveAccess?.isSystemAdmin === true &&
    hasPermission(effectiveAccess, "organizations.manage");
  const canEdit = hasPermission(effectiveAccess, "organizations.update");

  const fetchOrganizations = useCallback(
    async (
      context: OrganizationListRefreshContext,
      signal?: AbortSignal,
      propagateError = false,
    ) => {
      setIsLoading(true);
      if (!propagateError) setErrorMessage(null);
      try {
        const result = await listManagementOrganizations(
          {
            search: context.search || undefined,
            status:
              context.status === "ALL"
                ? undefined
                : (context.status as TenantEntityStatus),
            pageNumber: context.page,
            pageSize: PAGE_SIZE,
          },
          signal,
        );
        if (
          !signal?.aborted &&
          isSameListContext(context, currentListContextRef.current)
        ) {
          setOrganizations(result.data ?? []);
          setTotalCount(result.pagination.totalCount);
          setTotalPages(result.pagination.totalPages);
          setErrorMessage(null);
        }
      } catch (error) {
        if (!signal?.aborted) {
          if (propagateError) throw error;
          setOrganizations([]);
          setErrorMessage(getOrganizationsErrorMessage(error));
        }
      } finally {
        if (
          !signal?.aborted &&
          isSameListContext(context, currentListContextRef.current)
        ) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  const mutationState = useTenantMutationRefresh(
    (context: OrganizationListRefreshContext) =>
      fetchOrganizations(context, undefined, true),
    "Thao tác với tổ chức đã thành công nhưng danh sách mới chưa tải lại được.",
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => void fetchOrganizations(currentListContext, controller.signal),
      0,
    );
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [currentListContext, fetchOrganizations]);

  const activeOnPage = useMemo(
    () =>
      organizations.filter((organization) => organization.status === "Active")
        .length,
    [organizations],
  );

  const submitCreate = async (request: CreateOrganizationRequest) => {
    return mutationState.runMutation({
      mutation: () => createManagementOrganization(request),
      refreshContext: currentListContext,
      successMessage: (organization) => `Đã tạo tổ chức ${organization.name}.`,
      getErrorMessage: getOrganizationsErrorMessage,
      onMutationSuccess: () => setFormOpen(false),
    });
  };

  const submitUpdate = async (request: UpdateOrganizationRequest) => {
    if (!editingOrganization) return false;
    return mutationState.runMutation({
      mutation: () =>
        updateManagementOrganization(editingOrganization.id, request),
      refreshContext: currentListContext,
      successMessage: (organization) => `Đã cập nhật ${organization.name}.`,
      getErrorMessage: getOrganizationsErrorMessage,
      onMutationSuccess: () => {
        setFormOpen(false);
        setEditingOrganization(null);
      },
    });
  };

  const checkOrganizationIdentity = async ({
    name,
    taxCode,
    organizationId,
  }: {
    name: string;
    taxCode: string;
    organizationId?: string;
  }) => {
    try {
      const conflict = findOrganizationIdentityConflict(
        await listAllManagementOrganizations(),
        { name, taxCode },
        organizationId,
      );
      if (conflict === "name") return "Tên tổ chức đã tồn tại.";
      if (conflict === "taxCode")
        return "Mã số thuế đã được dùng cho tổ chức khác.";
      return null;
    } catch (error) {
      return getOrganizationsErrorMessage(
        error,
        "Không thể kiểm tra dữ liệu trùng lặp. Vui lòng thử lại.",
      );
    }
  };

  const confirmLifecycle = async (
    action: OrganizationLifecycleAction,
    request: OrganizationLifecycleTransitionRequest,
  ) => {
    if (!lifecycleTarget) return false;
    const target = lifecycleTarget;
    return mutationState.runMutation({
      mutation: () =>
        transitionManagementOrganizationLifecycle(
          target.organization.id,
          action,
          request,
        ),
      refreshContext: currentListContext,
      successMessage: (organization) =>
        `Đã ${getOrganizationLifecycleActionLabel(action)} ${organization.name}.`,
      getErrorMessage: getOrganizationsErrorMessage,
      tone:
        action === "resume" || action === "reactivate" ? "success" : "warning",
      onMutationSuccess: () => setLifecycleTarget(null),
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tổ chức"
        description="Quản lý vòng đời tổ chức, thông tin liên hệ và cấu trúc cửa hàng thuộc phạm vi nền tảng."
        metadata={
          <p className="text-xs text-muted-foreground">
            Mở hồ sơ tổ chức để quản lý cửa hàng trực thuộc và trạng thái vận hành
          </p>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              isLoading={isLoading}
              onClick={() => void fetchOrganizations(currentListContext)}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Làm mới
            </Button>
            {canManageOrganizations ? (
              <Button
                size="sm"
                onClick={() => {
                  setEditingOrganization(null);
                  mutationState.clearError();
                  setFormOpen(true);
                }}
              >
                <Plus className="size-4" aria-hidden="true" />
                Tạo tổ chức
              </Button>
            ) : null}
          </>
        }
      />

      <TenantRefreshWarning
        message={mutationState.refreshWarningMessage}
        isRetrying={mutationState.isRefreshRetrying}
        onRetry={() => void mutationState.retryRefresh()}
      />

      <MetricStrip>
        <MetricStripItem
          icon={Building2}
          label="Tổng tổ chức"
          value={totalCount.toLocaleString("vi-VN")}
          description="Trong bộ lọc hiện tại"
          tone="primary"
        />
        <MetricStripItem
          icon={Search}
          label="Đang hiển thị"
          value={organizations.length.toLocaleString("vi-VN")}
          description="Kết quả trên trang hiện tại"
          tone="neutral"
        />
        <MetricStripItem
          icon={CircleCheck}
          label="Hoạt động trên trang"
          value={activeOnPage.toLocaleString("vi-VN")}
          description="Sẵn sàng quản lý cửa hàng"
          tone="success"
        />
        <MetricStripItem
          icon={CirclePause}
          label="Không hoạt động trên trang"
          value={(organizations.length - activeOnPage).toLocaleString("vi-VN")}
          description="Tạm ngưng, vô hiệu hóa hoặc lưu trữ"
          tone={organizations.length - activeOnPage > 0 ? "warning" : "neutral"}
        />
      </MetricStrip>

      <Card className="gap-0 rounded-xl border border-border/80 bg-card py-0 shadow-none">
        <CardHeader className="border-b border-border px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <Building2 className="size-5" />
              </span>
              <CardTitle className="text-base font-semibold">
                Danh sách tổ chức
              </CardTitle>
            </div>
            <div className="flex flex-1 items-center gap-2 sm:max-w-md sm:justify-end">
              <form
                className="relative flex-1 sm:max-w-[240px]"
                onSubmit={(event) => {
                  event.preventDefault();
                  setPage(1);
                  setSearch(searchDraft.trim());
                }}
              >
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={searchDraft}
                  placeholder="Tìm tổ chức..."
                  className="h-9 bg-card pl-9 text-sm"
                  onChange={(event) => setSearchDraft(event.target.value)}
                  aria-label="Tìm tổ chức"
                />
              </form>
              <Select
                value={status}
                onValueChange={(value) => {
                  if (STATUS_OPTIONS.some((option) => option.value === value)) {
                    setStatus(value as TenantStatusFilter);
                    setPage(1);
                  }
                }}
              >
                <SelectTrigger
                  className="h-9 w-[180px] bg-card text-sm"
                  aria-label="Lọc tổ chức theo trạng thái"
                >
                  <SelectValue>
                    {
                      STATUS_OPTIONS.find((option) => option.value === status)
                        ?.label
                    }
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
            </div>
          </div>
        </CardHeader>
        {isLoading ? (
          <TenantLoadingState label="Đang tải tổ chức..." />
        ) : errorMessage ? (
          <TenantErrorState
            message={errorMessage}
            onRetry={() => void fetchOrganizations(currentListContext)}
          />
        ) : organizations.length === 0 ? (
          <TenantEmptyState
            title="Chưa có tổ chức phù hợp"
            description="Thử thay đổi bộ lọc hoặc tạo tổ chức mới."
          />
        ) : (
          <>
            <div className="divide-y divide-border md:hidden">
              {organizations.map((organization) => (
                <article key={organization.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {organization.name}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {organization.code}
                      </p>
                    </div>
                    <TenantStatusBadge status={organization.status} />
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Email</dt>
                      <dd className="mt-0.5 truncate font-medium text-foreground">
                        {organization.email || "Chưa có"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Số điện thoại</dt>
                      <dd className="mt-0.5 font-medium text-foreground">
                        {organization.phoneNumber || "Chưa có"}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">Cập nhật</dt>
                      <dd className="mt-0.5 tabular-nums text-foreground">
                        {formatTenantDate(
                          organization.updatedAt ?? organization.createdAt,
                        )}
                      </dd>
                    </div>
                  </dl>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/organizations/${organization.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      <Eye className="size-4" aria-hidden="true" />
                      Chi tiết
                    </Link>
                    {canEdit ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingOrganization(organization);
                          mutationState.clearError();
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                        Chỉnh sửa
                      </Button>
                    ) : null}
                    {canManageOrganizations &&
                    getOrganizationLifecycleActions(organization.status).length >
                      0 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="col-span-2"
                        onClick={() => {
                          mutationState.clearError();
                          setLifecycleTarget({ organization });
                        }}
                      >
                        <Settings2 className="size-4" aria-hidden="true" />
                        Thay đổi trạng thái
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table className="min-w-[900px] table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[28%] px-4 text-xs">Tổ chức</TableHead>
                <TableHead className="w-[24%] text-xs">Liên hệ</TableHead>
                <TableHead className="w-[16%] text-center text-xs">
                  Trạng thái
                </TableHead>
                <TableHead className="w-[18%] text-center text-xs">
                  Cập nhật
                </TableHead>
                <TableHead className="w-[14%] px-4 text-center text-xs">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((organization) => (
                <TableRow key={organization.id} className="hover:bg-muted/40">
                  <TableCell className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {organization.name}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {organization.code}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="truncate text-sm">
                      {organization.email || "Chưa có email"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {organization.phoneNumber || "Chưa có số điện thoại"}
                    </p>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <TenantStatusBadge status={organization.status} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-xs tabular-nums text-muted-foreground">
                    {formatTenantDate(
                      organization.updatedAt ?? organization.createdAt,
                    )}
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex justify-center gap-1.5">
                      <Link
                        href={`/organizations/${organization.id}`}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "icon-sm" }),
                          "rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                        title="Xem chi tiết"
                        aria-label={`Xem chi tiết ${organization.name}`}
                      >
                        <Eye className="size-4" />
                      </Link>
                      {canEdit ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-lg text-primary hover:bg-primary/10 hover:text-primary"
                          title="Chỉnh sửa"
                          aria-label={`Chỉnh sửa ${organization.name}`}
                          onClick={() => {
                            setEditingOrganization(organization);
                            mutationState.clearError();
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      ) : null}
                      {canManageOrganizations &&
                      getOrganizationLifecycleActions(organization.status)
                        .length > 0 ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-lg text-warning hover:bg-warning/10 hover:text-warning"
                          title="Thay đổi trạng thái"
                          aria-label={`Thay đổi trạng thái ${organization.name}`}
                          onClick={() => {
                            mutationState.clearError();
                            setLifecycleTarget({ organization });
                          }}
                        >
                          <Settings2 className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
              </Table>
            </div>
          </>
        )}
        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground">
            Trang{" "}
            <span className="font-medium tabular-nums text-foreground">
              {page}
            </span>{" "}
            /{" "}
            <span className="font-medium tabular-nums text-foreground">
              {Math.max(totalPages, 1)}
            </span>{" "}
            ·{" "}
            <span className="font-medium tabular-nums text-foreground">
              {totalCount}
            </span>{" "}
            tổ chức
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <ChevronLeft className="size-4" />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((value) => value + 1)}
            >
              Sau
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </Card>

      {formOpen ? (
        <OrganizationFormDialog
          key={editingOrganization?.id ?? "create"}
          organization={editingOrganization}
          open={formOpen}
          isSubmitting={mutationState.isSubmitting}
          errorMessage={mutationState.errorMessage}
          onOpenChange={(open) => {
            if (mutationState.mutationRef.current) return;
            setFormOpen(open);
            if (!open) setEditingOrganization(null);
          }}
          onCreate={submitCreate}
          onUpdate={submitUpdate}
          onCheckIdentity={checkOrganizationIdentity}
        />
      ) : null}
      {lifecycleTarget ? (
        <OrganizationLifecycleDialog
          key={`${lifecycleTarget.organization.id}-${lifecycleTarget.organization.statusRevision}`}
          organization={lifecycleTarget.organization}
          open
          isSubmitting={mutationState.isSubmitting}
          errorMessage={mutationState.errorMessage}
          onOpenChange={(open) => {
            if (!open && !mutationState.mutationRef.current)
              setLifecycleTarget(null);
          }}
          onConfirm={confirmLifecycle}
        />
      ) : null}
    </div>
  );
}
