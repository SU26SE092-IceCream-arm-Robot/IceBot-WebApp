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
} from "@/components/features/maintenance/maintenance-dialogs";
import {
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_STATUS_LABELS,
  MaintenanceEmptyIcon,
  MaintenanceTable,
} from "@/components/features/maintenance/maintenance-table";
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
import { useMaintenance } from "@/hooks/use-maintenance";
import { useAuth } from "@/hooks/use-auth";
import { hasPermission } from "@/lib/rbac";
import type {
  MaintenancePriority,
  MaintenancePriorityFilter,
  MaintenanceStatusFilter,
  MaintenanceTicketStatus,
} from "@/types/maintenance";

const STATUS_OPTIONS: { value: MaintenanceStatusFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  ...(Object.entries(MAINTENANCE_STATUS_LABELS) as [MaintenanceTicketStatus, string][]).map(
    ([value, label]) => ({ value, label }),
  ),
];

const PRIORITY_OPTIONS: { value: MaintenancePriorityFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả mức độ" },
  ...(Object.entries(MAINTENANCE_PRIORITY_LABELS) as [MaintenancePriority, string][]).map(
    ([value, label]) => ({ value, label }),
  ),
];

function isStatusFilter(value: string | null): value is MaintenanceStatusFilter {
  return STATUS_OPTIONS.some((option) => option.value === value);
}

function isPriorityFilter(value: string | null): value is MaintenancePriorityFilter {
  return PRIORITY_OPTIONS.some((option) => option.value === value);
}

type StatTone = "primary" | "success" | "warning" | "destructive";

const STAT_TONES: Record<StatTone, { iconClassName: string; valueClassName: string }> = {
  primary: {
    iconClassName: "border-primary/20 bg-primary/10 text-primary",
    valueClassName: "text-foreground",
  },
  success: {
    iconClassName: "border-success/20 bg-success/10 text-success",
    valueClassName: "text-success",
  },
  warning: {
    iconClassName: "border-warning/20 bg-warning/10 text-warning",
    valueClassName: "text-warning",
  },
  destructive: {
    iconClassName: "border-destructive/20 bg-destructive/10 text-destructive",
    valueClassName: "text-destructive",
  },
};

function StatCard({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: typeof Wrench;
  label: string;
  tone: StatTone;
  value: number;
}) {
  const toneClasses = STAT_TONES[tone];

  return (
    <Card className="rounded-xl border border-border/80 bg-card shadow-none">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${toneClasses.iconClassName}`}
          >
            <Icon className="size-5" />
          </span>
        </div>
        <p className={`tabular-nums text-3xl font-semibold tracking-tight ${toneClasses.valueClassName}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
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
  const { currentUser } = useAuth();
  const {
    tickets,
    visibleTickets,
    filters,
    summary,
    kiosks,
    technicians,
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
    refresh,
  } = useMaintenance();
  const canManage = currentUser
    ? hasPermission(currentUser.role, "maintenance.edit")
    : false;

  return (
    <div className="space-y-7">
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

      <section className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Bảo trì
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Theo dõi và điều phối các yêu cầu bảo trì máy tại hiện trường.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManage ? (
            <Button onClick={openCreateEditor}>
              <Plus className="size-4" />
              Tạo yêu cầu
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={() => void refresh()}
            isLoading={tickets.isLoading}
          >
            <RefreshCw className="size-4" />
            Làm mới
          </Button>
        </div>
      </section>

      {lookupWarning ? (
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>{lookupWarning}</p>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ClipboardList}
          label="Tổng yêu cầu"
          value={summary.total}
          tone="primary"
        />
        <StatCard
          icon={Wrench}
          label="Đang mở"
          value={summary.openOnPage}
          tone="warning"
        />
        <StatCard
          icon={Filter}
          label="Đang xử lý"
          value={summary.inProgressOnPage}
          tone="success"
        />
        <StatCard
          icon={ShieldAlert}
          label="Khẩn cấp"
          value={summary.criticalOnPage}
          tone="destructive"
        />
      </section>

      <Card className="rounded-xl border border-border bg-card shadow-none">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Filter className="size-5" />
            </span>
            <div>
              <CardTitle className="text-base">Bộ lọc bảo trì</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid gap-2 xl:grid-cols-[minmax(260px,1fr)_220px_220px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm ticket, tiêu đề, mã lỗi hoặc kiosk..."
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
              <SelectTrigger className="h-9 w-full bg-card">
                <SelectValue>
                  {STATUS_OPTIONS.find((option) => option.value === filters.status)?.label ??
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
            <Select
              value={filters.priority}
              onValueChange={(value) => {
                if (isPriorityFilter(value)) {
                  setPriorityFilter(value);
                }
              }}
            >
              <SelectTrigger className="h-9 w-full bg-card">
                <SelectValue>
                  {PRIORITY_OPTIONS.find((option) => option.value === filters.priority)?.label ??
                    "Tất cả mức độ"}
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
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-border bg-card shadow-none">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-10 items-center justify-center rounded-xl border border-warning/20 bg-warning/10 text-warning">
                <Wrench className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base">Yêu cầu bảo trì</CardTitle>
              </div>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {visibleTickets.length} dòng đang hiển thị
            </span>
          </div>
        </CardHeader>

        <div>
          {tickets.isLoading ? (
            <MaintenanceLoadingTable />
          ) : tickets.errorMessage ? (
            <div className="flex flex-col items-center gap-4 p-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="size-5" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">
                  Không thể tải yêu cầu bảo trì
                </p>
                <p className="text-sm text-muted-foreground">{tickets.errorMessage}</p>
              </div>
              <Button variant="destructive" onClick={() => void refresh()}>
                Thử lại
              </Button>
            </div>
          ) : visibleTickets.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <MaintenanceEmptyIcon />
              <p className="text-sm font-medium text-foreground">
                Không có yêu cầu bảo trì phù hợp
              </p>
              <p className="text-sm text-muted-foreground">
                Thử thay đổi từ khóa, trạng thái hoặc mức độ ưu tiên.
              </p>
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
        canManage={canManage}
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
          technicians={technicians}
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
