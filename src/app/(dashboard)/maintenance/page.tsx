"use client";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Filter,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Wrench,
} from "lucide-react";

import {
  MaintenanceDetailDialog,
  MaintenanceEditorDialog,
  MaintenanceWorkflowDialog,
} from "@/components/features/operations/maintenance/maintenance-dialogs";
import {
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_STATUS_LABELS,
  MaintenanceTable,
} from "@/components/features/operations/maintenance/maintenance-table";
import { MetricStrip, MetricStripItem } from "@/components/shared/metric-strip";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMaintenance } from "@/hooks/operations/use-maintenance";
import { useAuth } from "@/hooks/identity/use-auth";
import { hasPermission, hasScopedRole } from "@/lib/rbac";
import type {
  MaintenancePriority,
  MaintenancePriorityFilter,
  MaintenanceStatusFilter,
  MaintenanceTicketStatus,
} from "@/types/operations/maintenance";

const STATUS_OPTIONS: { value: MaintenanceStatusFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  ...(
    Object.entries(MAINTENANCE_STATUS_LABELS) as [
      MaintenanceTicketStatus,
      string,
    ][]
  ).map(([value, label]) => ({ value, label })),
];

const PRIORITY_OPTIONS: { value: MaintenancePriorityFilter; label: string }[] =
  [
    { value: "ALL", label: "Tất cả mức độ" },
    ...(
      Object.entries(MAINTENANCE_PRIORITY_LABELS) as [
        MaintenancePriority,
        string,
      ][]
    ).map(([value, label]) => ({ value, label })),
  ];

function isStatusFilter(
  value: string | null,
): value is MaintenanceStatusFilter {
  return STATUS_OPTIONS.some((option) => option.value === value);
}

function isPriorityFilter(
  value: string | null,
): value is MaintenancePriorityFilter {
  return PRIORITY_OPTIONS.some((option) => option.value === value);
}

function MaintenanceLoadingTable() {
  return (
    <div className="space-y-1 px-5 py-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`maintenance-skeleton-${index}`}
          className="grid grid-cols-7 items-center gap-4 border-b border-border py-4 last:border-0"
        >
          <div className="space-y-2">
            <div className="h-4 w-36 animate-pulse rounded bg-muted/50" />
            <div className="h-3 w-48 animate-pulse rounded bg-muted/30" />
          </div>
          <div className="h-5 w-24 animate-pulse rounded-full bg-muted/40" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-muted/40" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted/30" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted/30" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted/30" />
          <div className="h-8 w-8 animate-pulse rounded-lg bg-muted/40" />
        </div>
      ))}
    </div>
  );
}

export default function MaintenancePage() {
  const { effectiveAccess } = useAuth();
  const {
    tickets,
    visibleTickets,
    filters,
    summary,
    kiosks,
    assignees,
    isAssigneesLoading,
    lookupWarning,
    selectedTicket,
    isDetailOpen,
    isDetailLoading,
    detailErrorMessage,
    editorMode,
    editorTicket,
    isEditorOpen,
    workflowAction,
    workflowTicket,
    isWorkflowOpen,
    isMutationSubmitting,
    mutationErrorMessage,
    successMessage,
    refreshWarningMessage,
    isRefreshRetrying,
    setSearchTerm,
    setStatusFilter,
    setPriorityFilter,
    clearFilters,
    previousPage,
    nextPage,
    openTicketDetail,
    setDetailOpen,
    openCreateEditor,
    openEditEditor,
    setEditorOpen,
    submitCreate,
    submitUpdate,
    requestWorkflow,
    setWorkflowOpen,
    submitWorkflow,
    clearSuccessMessage,
    retryRefresh,
    refresh,
  } = useMaintenance();
  const canCreate = hasPermission(effectiveAccess, "maintenance.create");
  const canManage = hasPermission(effectiveAccess, "maintenance.manage");
  const selectedScope = selectedTicket
    ? {
        organizationId: selectedTicket.organizationId,
        storeId: selectedTicket.storeId,
        kioskId: selectedTicket.kioskId,
      }
    : null;
  const canCoordinateSelected = selectedScope
    ? hasScopedRole(
        effectiveAccess,
        ["SystemAdmin", "OrgAdmin", "Manager"],
        selectedScope,
      )
    : false;
  const canWorkSelected = selectedScope
    ? hasScopedRole(
        effectiveAccess,
        ["SystemAdmin", "OrgAdmin", "Manager", "Technician"],
        selectedScope,
      )
    : false;

  return (
    <div className="space-y-5">
      {successMessage ? (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success"
        >
          <span>{successMessage}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-success"
            onClick={clearSuccessMessage}
          >
            Đóng
          </Button>
        </div>
      ) : null}

      {refreshWarningMessage ? (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{refreshWarningMessage}</span>
          <Button
            variant="outline"
            size="sm"
            isLoading={isRefreshRetrying}
            onClick={() => void retryRefresh()}
          >
            Tải lại dữ liệu
          </Button>
        </div>
      ) : null}

      <PageHeader
        title="Bảo trì"
        description="Theo dõi và điều phối các yêu cầu bảo trì máy tại hiện trường."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refresh()}
              isLoading={tickets.isLoading}
            >
              <RefreshCw className="size-4" />
              Làm mới
            </Button>
            {canCreate ? (
              <Button size="sm" onClick={openCreateEditor}>
                <Plus className="size-4" />
                Tạo yêu cầu
              </Button>
            ) : null}
          </>
        }
      />

      {lookupWarning ? (
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>{lookupWarning}</p>
        </div>
      ) : null}

      <MetricStrip>
        <MetricStripItem
          icon={ClipboardList}
          label="Tổng yêu cầu"
          value={summary.total.toLocaleString("vi-VN")}
          description="Trong phạm vi hiện tại"
          tone="primary"
        />
        <MetricStripItem
          icon={Wrench}
          label="Đang mở trên trang"
          value={summary.openOnPage.toLocaleString("vi-VN")}
          description="Chưa bắt đầu xử lý"
          tone="warning"
        />
        <MetricStripItem
          icon={Filter}
          label="Đang xử lý trên trang"
          value={summary.inProgressOnPage.toLocaleString("vi-VN")}
          description="Đã được tiếp nhận"
          tone="success"
        />
        <MetricStripItem
          icon={ShieldAlert}
          label="Khẩn cấp trên trang"
          value={summary.criticalOnPage.toLocaleString("vi-VN")}
          description="Cần ưu tiên kiểm tra"
          tone="destructive"
        />
      </MetricStrip>

      <section
        className="rounded-lg border border-border bg-card p-3"
        aria-label="Bộ lọc yêu cầu bảo trì"
      >
        <div className="grid gap-2 lg:grid-cols-[minmax(260px,1fr)_210px_210px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Tìm kiếm yêu cầu bảo trì"
              type="search"
              value={filters.searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm trong trang hiện tại theo ticket, tiêu đề, mã lỗi hoặc kiosk..."
              className="h-9 bg-card pl-9 text-sm"
            />
          </div>
          <Select
            value={filters.status}
            onValueChange={(value) => {
              if (isStatusFilter(value)) {
                setStatusFilter(value);
              }
            }}
          >
            <SelectTrigger
              aria-label="Lọc trạng thái yêu cầu bảo trì"
              className="h-9 w-full bg-card"
            >
              <SelectValue>
                {STATUS_OPTIONS.find(
                  (option) => option.value === filters.status,
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
          <Select
            value={filters.priority}
            onValueChange={(value) => {
              if (isPriorityFilter(value)) {
                setPriorityFilter(value);
              }
            }}
          >
            <SelectTrigger
              aria-label="Lọc mức độ ưu tiên bảo trì"
              className="h-9 w-full bg-card"
            >
              <SelectValue>
                {PRIORITY_OPTIONS.find(
                  (option) => option.value === filters.priority,
                )?.label ?? "Tất cả mức độ"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Xóa lọc
          </Button>
        </div>
      </section>

      <Card className="gap-0 rounded-lg border border-border bg-card py-0 shadow-none">
        <CardHeader className="border-b border-border px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm font-semibold">
              Yêu cầu bảo trì
            </CardTitle>
            <span className="text-xs font-medium text-muted-foreground">
              {visibleTickets.length} dòng đang hiển thị
            </span>
          </div>
        </CardHeader>

        <div>
          {tickets.isLoading ? (
            <MaintenanceLoadingTable />
          ) : tickets.errorMessage ? (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <span className="flex size-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                <AlertTriangle className="size-5" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">
                  Không thể tải yêu cầu bảo trì
                </p>
                <p className="text-sm text-muted-foreground">
                  {tickets.errorMessage}
                </p>
              </div>
              <Button variant="destructive" onClick={() => void refresh()}>
                Thử lại
              </Button>
            </div>
          ) : visibleTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
              <span className="mb-3 flex size-10 items-center justify-center rounded-md border border-border bg-muted/20 text-muted-foreground">
                <Wrench className="size-5 opacity-70" />
              </span>
              <div className="max-w-md space-y-1.5">
                <p className="text-base font-semibold tracking-tight text-foreground">
                  Không tìm thấy yêu cầu bảo trì
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Không có yêu cầu bảo trì phù hợp. Thử thay đổi từ khóa, trạng
                  thái hoặc mức độ ưu tiên.
                </p>
              </div>
            </div>
          ) : (
            <MaintenanceTable
              tickets={visibleTickets}
              onViewDetail={(ticketId) => void openTicketDetail(ticketId)}
            />
          )}
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-border px-5 py-4 text-sm sm:flex-row sm:items-center">
          <p className="text-muted-foreground">
            Trang{" "}
            <span className="tabular-nums font-medium text-foreground">
              {tickets.pagination.page}
            </span>{" "}
            /{" "}
            <span className="tabular-nums font-medium text-foreground">
              {Math.max(tickets.pagination.totalPages, 1)}
            </span>
            {" - "}
            <span className="tabular-nums font-medium text-foreground">
              {tickets.pagination.totalCount}
            </span>{" "}
            yêu cầu
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!tickets.pagination.hasPrevious || tickets.isLoading}
              onClick={previousPage}
            >
              <ChevronLeft className="size-4" />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!tickets.pagination.hasNext || tickets.isLoading}
              onClick={nextPage}
            >
              Sau
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </Card>

      <MaintenanceDetailDialog
        errorMessage={detailErrorMessage}
        isLoading={isDetailLoading}
        open={isDetailOpen}
        ticket={selectedTicket}
        canManage={canManage && canWorkSelected}
        canCoordinate={canCoordinateSelected}
        canWork={canWorkSelected}
        onOpenChange={setDetailOpen}
        onEdit={openEditEditor}
        onWorkflow={requestWorkflow}
      />

      {editorMode ? (
        <MaintenanceEditorDialog
          key={`${editorMode}-${editorTicket?.id ?? "new"}`}
          mode={editorMode}
          ticket={editorTicket}
          kiosks={kiosks}
          open={isEditorOpen}
          isSubmitting={isMutationSubmitting}
          errorMessage={mutationErrorMessage}
          onOpenChange={setEditorOpen}
          onCreate={submitCreate}
          onUpdate={submitUpdate}
        />
      ) : null}

      {workflowAction && workflowTicket ? (
        <MaintenanceWorkflowDialog
          key={`${workflowAction}-${workflowTicket.id}`}
          action={workflowAction}
          ticket={workflowTicket}
          assignees={assignees}
          isAssigneesLoading={isAssigneesLoading}
          open={isWorkflowOpen}
          isSubmitting={isMutationSubmitting}
          errorMessage={mutationErrorMessage}
          onOpenChange={setWorkflowOpen}
          onSubmit={submitWorkflow}
        />
      ) : null}
    </div>
  );
}
