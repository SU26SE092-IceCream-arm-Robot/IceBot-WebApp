"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CircleCheck,
  CirclePause,
  Eye,
  Pencil,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Store as StoreIcon,
  Workflow,
} from "lucide-react";

import {
  getOrganizationLifecycleActionLabel,
  getOrganizationLifecycleActions,
  OrganizationLifecycleDialog,
  OrganizationStatusHistory,
} from "@/components/features/tenants/organizations/organization-lifecycle";

import {
  LifecycleConfirmDialog,
  OrganizationFormDialog,
  StoreFormDialog,
} from "@/components/features/tenants/shared/tenant-management-dialogs";
import { FranchiseOnboardingPanel } from "@/components/features/tenants/onboarding/franchise-onboarding-panel";
import { NotificationDeliveriesPanel } from "@/components/features/tenants/notifications/notification-deliveries-panel";
import { TenantRefreshWarning } from "@/components/features/tenants/shared/tenant-refresh-warning";
import {
  TenantEmptyState,
  TenantErrorState,
  TenantLoadingState,
  TenantStatusBadge,
  formatTenantDate,
} from "@/components/features/tenants/shared/tenant-ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { MetricStrip, MetricStripItem } from "@/components/shared/metric-strip";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/identity/use-auth";
import { useOrganizationStatusHistory } from "@/hooks/tenants/use-organization-status-history";
import { useTenantMutationRefresh } from "@/hooks/tenants/use-tenant-mutation-refresh";
import { hasScopedPermission } from "@/lib/rbac";
import {
  getManagementOrganizationById,
  getOrganizationsErrorMessage,
  listAllManagementOrganizations,
  transitionManagementOrganizationLifecycle,
  updateManagementOrganization,
} from "@/lib/services/tenants/organizations";
import { findOrganizationIdentityConflict } from "@/lib/tenant-identity";
import {
  createManagementStore,
  getManagementStores,
  getStoresErrorMessage,
  setManagementStoreActive,
} from "@/lib/services/tenants/stores";
import { cn } from "@/lib/utils";
import type { StoreResult } from "@/types/kiosks/management";
import type {
  CreateStoreRequest,
  OrganizationLifecycleAction,
  OrganizationLifecycleTransitionRequest,
  OrganizationResult,
  UpdateOrganizationRequest,
} from "@/types/tenants/management";

interface OrganizationDetailViewProps {
  organizationId: string;
}

type LifecycleTarget = { kind: "store"; store: StoreResult; activate: boolean };

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-lg border border-border bg-muted/15 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="break-words text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export function OrganizationDetailView({
  organizationId,
}: OrganizationDetailViewProps) {
  const { effectiveAccess } = useAuth();
  const currentOrganizationIdRef = useRef(organizationId);
  useEffect(() => {
    currentOrganizationIdRef.current = organizationId;
  }, [organizationId]);
  const [organization, setOrganization] = useState<OrganizationResult | null>(
    null,
  );
  const [stores, setStores] = useState<StoreResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [organizationFormOpen, setOrganizationFormOpen] = useState(false);
  const [storeFormOpen, setStoreFormOpen] = useState(false);
  const [organizationLifecycleOpen, setOrganizationLifecycleOpen] =
    useState(false);
  const [lifecycleTarget, setLifecycleTarget] =
    useState<LifecycleTarget | null>(null);

  const organizationScope = { organizationId, storeId: null, kioskId: null };
  const canManageOrganization =
    effectiveAccess?.isSystemAdmin === true &&
    hasScopedPermission(
      effectiveAccess,
      "organizations.manage",
      organizationScope,
    );
  const canEditOrganization = hasScopedPermission(
    effectiveAccess,
    "organizations.update",
    organizationScope,
  );
  const canManageStores = hasScopedPermission(
    effectiveAccess,
    "stores.manage",
    organizationScope,
  );
  const canReadAuthoringImports = hasScopedPermission(
    effectiveAccess,
    "program.read",
    organizationScope,
  );
  const canViewNotificationDeliveries = hasScopedPermission(
    effectiveAccess,
    "notifications.view",
    organizationScope,
  );
  const canManageNotifications =
    canViewNotificationDeliveries &&
    hasScopedPermission(
      effectiveAccess,
      "notifications.manage",
      organizationScope,
    );
  const statusHistory = useOrganizationStatusHistory(
    organizationId,
    canManageOrganization,
  );

  const loadData = useCallback(
    async (
      signal?: AbortSignal,
      propagateError = false,
      targetOrganizationId = organizationId,
    ) => {
      if (targetOrganizationId !== currentOrganizationIdRef.current) return;
      setIsLoading(true);
      if (!propagateError) setErrorMessage(null);
      try {
        const [organizationResult, storesResult] = await Promise.allSettled([
          getManagementOrganizationById(targetOrganizationId, signal),
          getManagementStores({ organizationId: targetOrganizationId }, signal),
        ]);
        if (
          signal?.aborted ||
          targetOrganizationId !== currentOrganizationIdRef.current
        ) {
          return;
        }

        if (organizationResult.status === "rejected") {
          if (propagateError) throw organizationResult.reason;
          setOrganization(null);
          setStores([]);
          setErrorMessage(
            getOrganizationsErrorMessage(organizationResult.reason),
          );
        } else {
          setOrganization(organizationResult.value);
          if (storesResult.status === "fulfilled") {
            setStores(storesResult.value);
            setErrorMessage(null);
          } else if (propagateError) {
            throw storesResult.reason;
          } else {
            setStores([]);
            setErrorMessage(
              getStoresErrorMessage(
                storesResult.reason,
                "Đã tải tổ chức nhưng chưa thể tải danh sách cửa hàng.",
              ),
            );
          }
        }
      } finally {
        if (
          !signal?.aborted &&
          targetOrganizationId === currentOrganizationIdRef.current
        ) {
          setIsLoading(false);
        }
      }
    },
    [organizationId],
  );

  const mutationState = useTenantMutationRefresh(
    ({ organizationId: targetOrganizationId }: { organizationId: string }) =>
      loadData(undefined, true, targetOrganizationId),
    "Thao tác đã thành công nhưng thông tin tổ chức và cửa hàng chưa tải lại được.",
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => void loadData(controller.signal),
      0,
    );
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadData]);

  const submitOrganizationUpdate = async (
    request: UpdateOrganizationRequest,
  ) => {
    if (!organization) return false;
    return mutationState.runMutation({
      mutation: () => updateManagementOrganization(organization.id, request),
      refreshContext: { organizationId },
      successMessage: `Đã cập nhật ${organization.name}.`,
      getErrorMessage: getOrganizationsErrorMessage,
      onMutationSuccess: () => setOrganizationFormOpen(false),
    });
  };

  const submitStoreCreate = async (request: CreateStoreRequest) => {
    if (!organization) return false;
    return mutationState.runMutation({
      mutation: () => createManagementStore(organization.id, request),
      refreshContext: { organizationId },
      successMessage: `Đã tạo cửa hàng ${request.name}.`,
      getErrorMessage: getStoresErrorMessage,
      onMutationSuccess: () => setStoreFormOpen(false),
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

  const confirmOrganizationLifecycle = async (
    action: OrganizationLifecycleAction,
    request: OrganizationLifecycleTransitionRequest,
  ) => {
    if (!organization) return false;
    return mutationState.runMutation({
      mutation: () =>
        transitionManagementOrganizationLifecycle(
          organization.id,
          action,
          request,
        ),
      refreshContext: { organizationId },
      successMessage: `Đã ${getOrganizationLifecycleActionLabel(action)} ${organization.name}.`,
      getErrorMessage: getOrganizationsErrorMessage,
      tone:
        action === "resume" || action === "reactivate" ? "success" : "warning",
      onMutationSuccess: () => {
        setOrganizationLifecycleOpen(false);
        void statusHistory.refresh();
      },
    });
  };

  const confirmStoreLifecycle = async () => {
    if (!lifecycleTarget) return false;
    const target = lifecycleTarget;
    return mutationState.runMutation({
      mutation: () =>
        setManagementStoreActive(target.store.id, target.activate),
      refreshContext: { organizationId },
      successMessage: `Đã ${target.activate ? "kích hoạt" : "vô hiệu hóa"} ${
        target.store.name
      }.`,
      getErrorMessage: getStoresErrorMessage,
      tone: target.activate ? "success" : "warning",
      onMutationSuccess: () => setLifecycleTarget(null),
    });
  };

  if (isLoading)
    return <TenantLoadingState label="Đang tải thông tin tổ chức..." />;
  if (!organization) {
    return (
      <TenantErrorState
        message={errorMessage ?? "Không tìm thấy tổ chức."}
        onRetry={() => void loadData()}
      />
    );
  }

  const activeStoreCount = stores.filter(
    (store) => store.status === "Active",
  ).length;
  const pausedStoreCount = stores.filter((store) => store.isSalesPaused).length;

  return (
    <div className="space-y-7">
      <TenantRefreshWarning
        message={mutationState.refreshWarningMessage}
        isRetrying={mutationState.isRefreshRetrying}
        onRetry={() => void mutationState.retryRefresh()}
      />
      {errorMessage ? (
        <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          {errorMessage}
        </div>
      ) : null}

      <PageHeader
        title={organization.name}
        description="Quản lý vòng đời tổ chức, mạng lưới cửa hàng và các luồng vận hành liên quan."
        metadata={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/organizations"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Danh sách tổ chức
            </Link>
            <span className="font-mono text-xs text-muted-foreground">
              {organization.code}
            </span>
            <TenantStatusBadge status={organization.status} />
          </div>
        }
        actions={
          <>
            {canReadAuthoringImports ? (
              <Link
                href={`/production?organizationId=${encodeURIComponent(organization.id)}`}
                className={buttonVariants({ variant: "outline" })}
              >
                <Workflow className="size-4" />
                Cấu hình sản xuất
              </Link>
            ) : null}
            {canEditOrganization ? (
              <Button
                variant="outline"
                onClick={() => {
                  mutationState.clearError();
                  setOrganizationFormOpen(true);
                }}
              >
                <Pencil className="size-4" />
                Chỉnh sửa
              </Button>
            ) : null}
            {canManageOrganization &&
            getOrganizationLifecycleActions(organization.status).length > 0 ? (
              <Button
                variant="outline"
                onClick={() => {
                  mutationState.clearError();
                  setOrganizationLifecycleOpen(true);
                }}
              >
                <RefreshCw className="size-4" />
                Trạng thái tổ chức
              </Button>
            ) : null}
            <Button
              variant="outline"
              isLoading={isLoading}
              onClick={() => void loadData()}
            >
              <RefreshCw className="size-4" />
              Làm mới
            </Button>
          </>
        }
      />

      <MetricStrip>
        <MetricStripItem
          icon={StoreIcon}
          label="Tổng cửa hàng"
          value={stores.length}
          description="Cửa hàng trực thuộc"
        />
        <MetricStripItem
          icon={CircleCheck}
          label="Đang hoạt động"
          value={activeStoreCount}
          description="Sẵn sàng theo vòng đời"
          tone="success"
        />
        <MetricStripItem
          icon={CirclePause}
          label="Tạm dừng nhận đơn"
          value={pausedStoreCount}
          description="Cần theo dõi vận hành"
          tone={pausedStoreCount > 0 ? "warning" : "neutral"}
        />
        <MetricStripItem
          icon={RefreshCw}
          label="Phiên bản trạng thái"
          value={organization.statusRevision}
          description="Dùng để kiểm soát cập nhật đồng thời"
          tone="primary"
        />
      </MetricStrip>

      <Card className="rounded-xl border border-border/80 shadow-none">
        <CardHeader className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </span>
            <CardTitle className="text-base font-semibold">
              Thông tin tổ chức
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField
            label="Tên pháp lý"
            value={organization.legalName || "Chưa có"}
          />
          <DetailField
            label="Mã số thuế"
            value={organization.taxCode || "Chưa có"}
          />
          <DetailField label="Email" value={organization.email || "Chưa có"} />
          <DetailField
            label="Số điện thoại"
            value={organization.phoneNumber || "Chưa có"}
          />
          <DetailField
            label="Địa chỉ"
            value={organization.address || "Chưa có"}
          />
          <DetailField
            label="Cập nhật"
            value={formatTenantDate(
              organization.updatedAt ?? organization.createdAt,
            )}
          />
        </CardContent>
      </Card>

      {canManageOrganization ? (
        <OrganizationStatusHistory
          history={statusHistory.history}
          isLoading={statusHistory.isLoading}
          errorMessage={statusHistory.errorMessage}
          onRetry={() => void statusHistory.refresh()}
        />
      ) : null}

      <Card className="gap-0 rounded-xl border border-border/80 bg-card py-0 shadow-none">
        <CardHeader className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <StoreIcon className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base font-semibold">
                  Cửa hàng trực thuộc
                </CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {stores.length} cửa hàng
                </p>
              </div>
            </div>
            {canManageStores && organization.status === "Active" ? (
              <Button
                size="sm"
                onClick={() => {
                  mutationState.clearError();
                  setStoreFormOpen(true);
                }}
              >
                <Plus className="size-4" />
                Tạo cửa hàng
              </Button>
            ) : null}
          </div>
        </CardHeader>
        {stores.length === 0 ? (
          <TenantEmptyState
            title="Chưa có cửa hàng"
            description="Tổ chức này chưa có cửa hàng trực thuộc."
          />
        ) : (
          <>
            <div className="grid gap-3 p-4 md:hidden">
              {stores.map((store) => (
                <article
                  key={store.id}
                  className="space-y-3 rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {store.name}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {store.code}
                      </p>
                    </div>
                    <TenantStatusBadge status={store.status} />
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div className="col-span-2">
                      <dt className="text-xs text-muted-foreground">
                        Địa điểm
                      </dt>
                      <dd className="mt-1 break-words">
                        {store.address || "Chưa có địa chỉ"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Địa phương
                      </dt>
                      <dd className="mt-1">
                        {[store.city, store.province]
                          .filter(Boolean)
                          .join(", ") || "Chưa có"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Múi giờ</dt>
                      <dd className="mt-1 font-mono text-xs">
                        {store.timeZone}
                      </dd>
                    </div>
                  </dl>
                  <div className="flex justify-end gap-2 border-t border-border pt-3">
                    <Link
                      href={`/stores/${store.id}`}
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      <Eye className="size-4" />
                      Xem chi tiết
                    </Link>
                    {canManageStores ? (
                      <Button
                        variant={
                          store.status === "Active" ? "destructive" : "default"
                        }
                        size="sm"
                        onClick={() => {
                          mutationState.clearError();
                          setLifecycleTarget({
                            kind: "store",
                            store,
                            activate: store.status !== "Active",
                          });
                        }}
                      >
                        {store.status === "Active" ? (
                          <PowerOff className="size-4" />
                        ) : (
                          <Power className="size-4" />
                        )}
                        {store.status === "Active"
                          ? "Vô hiệu hóa"
                          : "Kích hoạt"}
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
            <Table className="hidden min-w-[850px] table-fixed md:table">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[28%] px-5 text-xs">
                    Cửa hàng
                  </TableHead>
                  <TableHead className="w-[24%] text-xs">Địa điểm</TableHead>
                  <TableHead className="w-[18%] text-center text-xs">
                    Trạng thái
                  </TableHead>
                  <TableHead className="w-[16%] text-center text-xs">
                    Múi giờ
                  </TableHead>
                  <TableHead className="w-[14%] px-5 text-center text-xs">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store) => (
                  <TableRow key={store.id} className="hover:bg-muted/40">
                    <TableCell className="px-5 py-3">
                      <p className="font-medium text-foreground">
                        {store.name}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {store.code}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="truncate text-sm">
                        {store.address || "Chưa có địa chỉ"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[store.city, store.province]
                          .filter(Boolean)
                          .join(", ") || "Chưa có địa phương"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <TenantStatusBadge status={store.status} />
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      {store.timeZone}
                    </TableCell>
                    <TableCell className="px-5">
                      <div className="flex justify-center gap-1.5">
                        <Link
                          href={`/stores/${store.id}`}
                          className={cn(
                            buttonVariants({
                              variant: "ghost",
                              size: "icon-sm",
                            }),
                            "rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                          title="Xem cửa hàng"
                          aria-label={`Xem cửa hàng ${store.name}`}
                        >
                          <Eye className="size-4" />
                        </Link>
                        {canManageStores ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className={cn(
                              "rounded-lg",
                              store.status === "Active"
                                ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
                                : "text-success hover:bg-success/10 hover:text-success",
                            )}
                            title={
                              store.status === "Active"
                                ? "Vô hiệu hóa"
                                : "Kích hoạt"
                            }
                            aria-label={`${store.status === "Active" ? "Vô hiệu hóa" : "Kích hoạt"} ${store.name}`}
                            onClick={() => {
                              mutationState.clearError();
                              setLifecycleTarget({
                                kind: "store",
                                store,
                                activate: store.status !== "Active",
                              });
                            }}
                          >
                            {store.status === "Active" ? (
                              <PowerOff className="size-4" />
                            ) : (
                              <Power className="size-4" />
                            )}
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </Card>

      <FranchiseOnboardingPanel
        organizationId={organization.id}
        canManage={canManageStores}
        canStart={canManageStores && organization.status === "Active"}
      />
      <NotificationDeliveriesPanel
        organizationId={organization.id}
        canView={canViewNotificationDeliveries}
        canManage={canManageNotifications}
      />

      {organizationFormOpen ? (
        <OrganizationFormDialog
          organization={organization}
          open
          isSubmitting={mutationState.isSubmitting}
          errorMessage={mutationState.errorMessage}
          onOpenChange={(open) => {
            if (!mutationState.mutationRef.current)
              setOrganizationFormOpen(open);
          }}
          onCreate={async () => false}
          onUpdate={submitOrganizationUpdate}
          onCheckIdentity={checkOrganizationIdentity}
        />
      ) : null}
      {storeFormOpen ? (
        <StoreFormDialog
          organizationName={organization.name}
          store={null}
          open
          isSubmitting={mutationState.isSubmitting}
          errorMessage={mutationState.errorMessage}
          onOpenChange={(open) => {
            if (!mutationState.mutationRef.current) setStoreFormOpen(open);
          }}
          onCreate={submitStoreCreate}
          onUpdate={async () => false}
          existingStores={stores}
        />
      ) : null}
      {organizationLifecycleOpen ? (
        <OrganizationLifecycleDialog
          key={`${organization.id}-${organization.statusRevision}`}
          organization={organization}
          open
          isSubmitting={mutationState.isSubmitting}
          errorMessage={mutationState.errorMessage}
          onOpenChange={(open) => {
            if (!mutationState.mutationRef.current)
              setOrganizationLifecycleOpen(open);
          }}
          onConfirm={confirmOrganizationLifecycle}
        />
      ) : null}
      {lifecycleTarget ? (
        <LifecycleConfirmDialog
          entityLabel="cửa hàng"
          entityName={lifecycleTarget.store.name}
          activate={lifecycleTarget.activate}
          open
          isSubmitting={mutationState.isSubmitting}
          errorMessage={mutationState.errorMessage}
          onOpenChange={(open) => {
            if (!open && !mutationState.mutationRef.current)
              setLifecycleTarget(null);
          }}
          onConfirm={confirmStoreLifecycle}
        />
      ) : null}
    </div>
  );
}
