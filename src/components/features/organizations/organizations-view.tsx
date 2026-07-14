"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  LifecycleConfirmDialog,
  OrganizationFormDialog,
} from "@/components/features/organizations/tenant-management-dialogs";
import {
  TenantEmptyState,
  TenantErrorState,
  TenantLoadingState,
  TenantStatusBadge,
  formatTenantDate,
} from "@/components/features/organizations/tenant-ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAuth } from "@/hooks/use-auth";
import {
  createManagementOrganization,
  getOrganizationsErrorMessage,
  listManagementOrganizations,
  setManagementOrganizationActive,
  updateManagementOrganization,
} from "@/lib/services/organizations";
import { cn } from "@/lib/utils";
import type {
  CreateOrganizationRequest,
  OrganizationResult,
  TenantEntityStatus,
  TenantStatusFilter,
  UpdateOrganizationRequest,
} from "@/types/tenant-management";

const PAGE_SIZE = 12;
const STATUS_OPTIONS: { value: TenantStatusFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "Active", label: "Đang hoạt động" },
  { value: "Inactive", label: "Ngừng hoạt động" },
  { value: "Suspended", label: "Tạm ngưng" },
  { value: "Disabled", label: "Đã vô hiệu hóa" },
  { value: "Archived", label: "Đã lưu trữ" },
];

export function OrganizationsView() {
  const { currentUser } = useAuth();
  const mutationRef = useRef(false);
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
    activate: boolean;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const isSystemAdmin = currentUser?.role === "ADMIN";
  const canEdit = currentUser?.role === "ADMIN" || currentUser?.role === "LOCATION_OWNER";

  const fetchOrganizations = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await listManagementOrganizations(
        {
          search: search || undefined,
          status: status === "ALL" ? undefined : (status as TenantEntityStatus),
          pageNumber: page,
          pageSize: PAGE_SIZE,
        },
        signal,
      );
      if (!signal?.aborted) {
        setOrganizations(result.data ?? []);
        setTotalCount(result.pagination.totalCount);
        setTotalPages(result.pagination.totalPages);
      }
    } catch (error) {
      if (!signal?.aborted) {
        setOrganizations([]);
        setErrorMessage(getOrganizationsErrorMessage(error));
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => void fetchOrganizations(controller.signal), 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [fetchOrganizations]);

  const activeOnPage = useMemo(
    () => organizations.filter((organization) => organization.status === "Active").length,
    [organizations],
  );

  const runMutation = async (
    mutation: () => Promise<OrganizationResult>,
    success: (result: OrganizationResult) => string,
    tone: "success" | "warning" = "success",
  ) => {
    if (mutationRef.current) return false;
    mutationRef.current = true;
    setIsSubmitting(true);
    setMutationError(null);
    try {
      const result = await mutation();
      if (tone === "warning") toast.warning(success(result));
      else toast.success(success(result));
      await fetchOrganizations();
      return true;
    } catch (error) {
      setMutationError(getOrganizationsErrorMessage(error));
      return false;
    } finally {
      mutationRef.current = false;
      setIsSubmitting(false);
    }
  };

  const submitCreate = async (request: CreateOrganizationRequest) => {
    const succeeded = await runMutation(
      () => createManagementOrganization(request),
      (organization) => `Đã tạo tổ chức ${organization.name}.`,
    );
    if (succeeded) setFormOpen(false);
    return succeeded;
  };

  const submitUpdate = async (request: UpdateOrganizationRequest) => {
    if (!editingOrganization) return false;
    const succeeded = await runMutation(
      () => updateManagementOrganization(editingOrganization.id, request),
      (organization) => `Đã cập nhật ${organization.name}.`,
    );
    if (succeeded) {
      setFormOpen(false);
      setEditingOrganization(null);
    }
    return succeeded;
  };

  const confirmLifecycle = async () => {
    if (!lifecycleTarget) return false;
    const succeeded = await runMutation(
      () =>
        setManagementOrganizationActive(
          lifecycleTarget.organization.id,
          lifecycleTarget.activate,
        ),
      (organization) =>
        `Đã ${lifecycleTarget.activate ? "kích hoạt" : "vô hiệu hóa"} ${organization.name}.`,
      lifecycleTarget.activate ? "success" : "warning",
    );
    if (succeeded) setLifecycleTarget(null);
    return succeeded;
  };

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-2"><h1 className="text-3xl font-semibold tracking-tight text-foreground">Tổ chức & cửa hàng</h1><p className="text-sm leading-6 text-muted-foreground">Quản lý cấu trúc tổ chức, cửa hàng và phạm vi vận hành của IceBot.</p></div>
        <div className="flex gap-2">{isSystemAdmin ? <Button onClick={() => { setEditingOrganization(null); setMutationError(null); setFormOpen(true); }}><Plus className="size-4" />Tạo tổ chức</Button> : null}<Button variant="outline" isLoading={isLoading} onClick={() => void fetchOrganizations()}><RefreshCw className="size-4" />Làm mới</Button></div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card className="border border-border/80 shadow-none"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Tổng tổ chức</p><p className="mt-2 text-3xl font-semibold tabular-nums">{totalCount}</p></CardContent></Card>
        <Card className="border border-border/80 shadow-none"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Đang hoạt động trên trang</p><p className="mt-2 text-3xl font-semibold tabular-nums text-success">{activeOnPage}</p></CardContent></Card>
      </section>

      <Card className="gap-0 rounded-xl border border-border/80 bg-card py-0 shadow-none">
        <CardHeader className="border-b border-border px-4 py-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Building2 className="size-5" /></span><CardTitle className="text-base font-semibold">Danh sách tổ chức</CardTitle></div>
          <div className="flex flex-1 items-center gap-2 sm:max-w-md sm:justify-end">
            <form className="relative flex-1 sm:max-w-[240px]" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchDraft.trim()); }}><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={searchDraft} placeholder="Tìm tổ chức..." className="h-9 bg-card pl-9 text-sm" onChange={(event) => setSearchDraft(event.target.value)} /></form>
            <Select value={status} onValueChange={(value) => { if (STATUS_OPTIONS.some((option) => option.value === value)) { setStatus(value as TenantStatusFilter); setPage(1); } }}><SelectTrigger className="h-9 w-[180px] bg-card text-sm"><SelectValue>{STATUS_OPTIONS.find((option) => option.value === status)?.label}</SelectValue></SelectTrigger><SelectContent>{STATUS_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>
          </div>
        </div></CardHeader>
        {isLoading ? <TenantLoadingState label="Đang tải tổ chức..." /> : errorMessage ? <TenantErrorState message={errorMessage} onRetry={() => void fetchOrganizations()} /> : organizations.length === 0 ? <TenantEmptyState title="Chưa có tổ chức phù hợp" description="Thử thay đổi bộ lọc hoặc tạo tổ chức mới." /> : (
          <Table className="min-w-[900px] table-fixed"><TableHeader><TableRow className="hover:bg-transparent"><TableHead className="w-[28%] px-4 text-xs">Tổ chức</TableHead><TableHead className="w-[24%] text-xs">Liên hệ</TableHead><TableHead className="w-[16%] text-center text-xs">Trạng thái</TableHead><TableHead className="w-[18%] text-center text-xs">Cập nhật</TableHead><TableHead className="w-[14%] px-4 text-center text-xs">Thao tác</TableHead></TableRow></TableHeader><TableBody>{organizations.map((organization) => <TableRow key={organization.id} className="hover:bg-muted/40"><TableCell className="px-4 py-3"><p className="font-medium text-foreground">{organization.name}</p><p className="font-mono text-xs text-muted-foreground">{organization.code}</p></TableCell><TableCell><p className="truncate text-sm">{organization.email || "Chưa có email"}</p><p className="text-xs text-muted-foreground">{organization.phoneNumber || "Chưa có số điện thoại"}</p></TableCell><TableCell className="text-center"><div className="flex justify-center"><TenantStatusBadge status={organization.status} /></div></TableCell><TableCell className="text-center text-xs tabular-nums text-muted-foreground">{formatTenantDate(organization.updatedAt ?? organization.createdAt)}</TableCell><TableCell className="px-4"><div className="flex justify-center gap-1.5"><Link href={`/organizations/${organization.id}`} className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground")} title="Xem chi tiết" aria-label={`Xem chi tiết ${organization.name}`}><Eye className="size-4" /></Link>{canEdit ? <Button variant="ghost" size="icon-sm" className="rounded-lg text-primary hover:bg-primary/10 hover:text-primary" title="Chỉnh sửa" aria-label={`Chỉnh sửa ${organization.name}`} onClick={() => { setEditingOrganization(organization); setMutationError(null); setFormOpen(true); }}><Pencil className="size-4" /></Button> : null}{isSystemAdmin ? <Button variant="ghost" size="icon-sm" className={cn("rounded-lg", organization.status === "Active" ? "text-destructive hover:bg-destructive/10 hover:text-destructive" : "text-success hover:bg-success/10 hover:text-success")} title={organization.status === "Active" ? "Vô hiệu hóa" : "Kích hoạt"} aria-label={`${organization.status === "Active" ? "Vô hiệu hóa" : "Kích hoạt"} ${organization.name}`} onClick={() => { setMutationError(null); setLifecycleTarget({ organization, activate: organization.status !== "Active" }); }}>{organization.status === "Active" ? <PowerOff className="size-4" /> : <Power className="size-4" />}</Button> : null}</div></TableCell></TableRow>)}</TableBody></Table>
        )}
        <div className="flex items-center justify-between border-t border-border px-5 py-4 text-sm"><p className="text-muted-foreground">Trang <span className="font-medium tabular-nums text-foreground">{page}</span> / <span className="font-medium tabular-nums text-foreground">{Math.max(totalPages, 1)}</span> · <span className="font-medium tabular-nums text-foreground">{totalCount}</span> tổ chức</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1 || isLoading} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft className="size-4" />Trước</Button><Button variant="outline" size="sm" disabled={page >= totalPages || isLoading} onClick={() => setPage((value) => value + 1)}>Sau<ChevronRight className="size-4" /></Button></div></div>
      </Card>

      {formOpen ? <OrganizationFormDialog key={editingOrganization?.id ?? "create"} organization={editingOrganization} open={formOpen} isSubmitting={isSubmitting} errorMessage={mutationError} onOpenChange={(open) => { if (mutationRef.current) return; setFormOpen(open); if (!open) setEditingOrganization(null); }} onCreate={submitCreate} onUpdate={submitUpdate} /> : null}
      {lifecycleTarget ? <LifecycleConfirmDialog entityLabel="tổ chức" entityName={lifecycleTarget.organization.name} activate={lifecycleTarget.activate} open isSubmitting={isSubmitting} errorMessage={mutationError} onOpenChange={(open) => { if (!open && !mutationRef.current) setLifecycleTarget(null); }} onConfirm={confirmLifecycle} /> : null}
    </div>
  );
}
