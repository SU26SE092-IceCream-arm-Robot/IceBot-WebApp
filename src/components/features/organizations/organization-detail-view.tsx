"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Eye,
  Pencil,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Store as StoreIcon,
} from "lucide-react";

import {
  LifecycleConfirmDialog,
  OrganizationFormDialog,
  StoreFormDialog,
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
  getManagementOrganizationById,
  getOrganizationsErrorMessage,
  setManagementOrganizationActive,
  updateManagementOrganization,
} from "@/lib/services/organizations";
import {
  createManagementStore,
  getManagementStores,
  getStoresErrorMessage,
  setManagementStoreActive,
} from "@/lib/services/stores";
import { cn } from "@/lib/utils";
import type { StoreResult } from "@/types/kiosk-management";
import type {
  CreateStoreRequest,
  OrganizationResult,
  UpdateOrganizationRequest,
} from "@/types/tenant-management";

interface OrganizationDetailViewProps {
  organizationId: string;
}

type LifecycleTarget =
  | { kind: "organization"; activate: boolean }
  | { kind: "store"; store: StoreResult; activate: boolean };

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-lg border border-border bg-muted/15 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="break-words text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export function OrganizationDetailView({ organizationId }: OrganizationDetailViewProps) {
  const { currentUser } = useAuth();
  const mutationRef = useRef(false);
  const [organization, setOrganization] = useState<OrganizationResult | null>(null);
  const [stores, setStores] = useState<StoreResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [organizationFormOpen, setOrganizationFormOpen] = useState(false);
  const [storeFormOpen, setStoreFormOpen] = useState(false);
  const [lifecycleTarget, setLifecycleTarget] = useState<LifecycleTarget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const isSystemAdmin = currentUser?.role === "ADMIN";
  const canEditOrganization =
    currentUser?.role === "ADMIN" || currentUser?.role === "LOCATION_OWNER";
  const canManageStores = canEditOrganization;

  const loadData = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setErrorMessage(null);
    const [organizationResult, storesResult] = await Promise.allSettled([
      getManagementOrganizationById(organizationId, signal),
      getManagementStores({ organizationId }, signal),
    ]);
    if (signal?.aborted) return;

    if (organizationResult.status === "rejected") {
      setOrganization(null);
      setStores([]);
      setErrorMessage(getOrganizationsErrorMessage(organizationResult.reason));
    } else {
      setOrganization(organizationResult.value);
      if (storesResult.status === "fulfilled") {
        setStores(storesResult.value);
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
    setIsLoading(false);
  }, [organizationId]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => void loadData(controller.signal), 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadData]);

  const runMutation = async (
    mutation: () => Promise<unknown>,
    success: string,
  ) => {
    if (mutationRef.current) return false;
    mutationRef.current = true;
    setIsSubmitting(true);
    setMutationError(null);
    try {
      await mutation();
      await loadData();
      toast.success(success);
      return true;
    } catch (error) {
      setMutationError(
        lifecycleTarget?.kind === "store" || storeFormOpen
          ? getStoresErrorMessage(error)
          : getOrganizationsErrorMessage(error),
      );
      return false;
    } finally {
      mutationRef.current = false;
      setIsSubmitting(false);
    }
  };

  const submitOrganizationUpdate = async (request: UpdateOrganizationRequest) => {
    if (!organization) return false;
    const succeeded = await runMutation(
      () => updateManagementOrganization(organization.id, request),
      `Đã cập nhật ${organization.name}.`,
    );
    if (succeeded) setOrganizationFormOpen(false);
    return succeeded;
  };

  const submitStoreCreate = async (request: CreateStoreRequest) => {
    if (!organization) return false;
    const succeeded = await runMutation(
      () => createManagementStore(organization.id, request),
      `Đã tạo cửa hàng ${request.name}.`,
    );
    if (succeeded) setStoreFormOpen(false);
    return succeeded;
  };

  const confirmLifecycle = async () => {
    if (!organization || !lifecycleTarget) return false;
    const target = lifecycleTarget;
    const succeeded = await runMutation(
      () =>
        target.kind === "organization"
          ? setManagementOrganizationActive(organization.id, target.activate)
          : setManagementStoreActive(target.store.id, target.activate),
      `Đã ${target.activate ? "kích hoạt" : "vô hiệu hóa"} ${
        target.kind === "organization" ? organization.name : target.store.name
      }.`,
    );
    if (succeeded) setLifecycleTarget(null);
    return succeeded;
  };

  if (isLoading) return <TenantLoadingState label="Đang tải thông tin tổ chức..." />;
  if (!organization) {
    return <TenantErrorState message={errorMessage ?? "Không tìm thấy tổ chức."} onRetry={() => void loadData()} />;
  }

  return (
    <div className="space-y-7">
      {errorMessage ? <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">{errorMessage}</div> : null}

      <section className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3"><Link href="/organizations" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Tổ chức & cửa hàng</Link><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight">{organization.name}</h1><TenantStatusBadge status={organization.status} /></div><p className="font-mono text-sm text-muted-foreground">{organization.code}</p></div>
        <div className="flex flex-wrap gap-2">{canEditOrganization ? <Button variant="outline" onClick={() => { setMutationError(null); setOrganizationFormOpen(true); }}><Pencil className="size-4" />Chỉnh sửa</Button> : null}{isSystemAdmin ? <Button variant={organization.status === "Active" ? "destructive" : "default"} onClick={() => { setMutationError(null); setLifecycleTarget({ kind: "organization", activate: organization.status !== "Active" }); }}>{organization.status === "Active" ? <PowerOff className="size-4" /> : <Power className="size-4" />}{organization.status === "Active" ? "Vô hiệu hóa" : "Kích hoạt"}</Button> : null}<Button variant="outline" isLoading={isLoading} onClick={() => void loadData()}><RefreshCw className="size-4" />Làm mới</Button></div>
      </section>

      <Card className="rounded-xl border border-border/80 shadow-none"><CardHeader className="border-b border-border px-5 py-4"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Building2 className="size-5" /></span><CardTitle className="text-base font-semibold">Thông tin tổ chức</CardTitle></div></CardHeader><CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3"><DetailField label="Tên pháp lý" value={organization.legalName || "Chưa có"} /><DetailField label="Mã số thuế" value={organization.taxCode || "Chưa có"} /><DetailField label="Email" value={organization.email || "Chưa có"} /><DetailField label="Số điện thoại" value={organization.phoneNumber || "Chưa có"} /><DetailField label="Địa chỉ" value={organization.address || "Chưa có"} /><DetailField label="Cập nhật" value={formatTenantDate(organization.updatedAt ?? organization.createdAt)} /></CardContent></Card>

      <Card className="gap-0 rounded-xl border border-border/80 bg-card py-0 shadow-none"><CardHeader className="border-b border-border px-5 py-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><StoreIcon className="size-5" /></span><div><CardTitle className="text-base font-semibold">Cửa hàng trực thuộc</CardTitle><p className="mt-0.5 text-xs text-muted-foreground">{stores.length} cửa hàng</p></div></div>{canManageStores && organization.status === "Active" ? <Button size="sm" onClick={() => { setMutationError(null); setStoreFormOpen(true); }}><Plus className="size-4" />Tạo cửa hàng</Button> : null}</div></CardHeader>
        {stores.length === 0 ? <TenantEmptyState title="Chưa có cửa hàng" description="Tổ chức này chưa có cửa hàng trực thuộc." /> : <Table className="min-w-[850px] table-fixed"><TableHeader><TableRow className="hover:bg-transparent"><TableHead className="w-[28%] px-5 text-xs">Cửa hàng</TableHead><TableHead className="w-[24%] text-xs">Địa điểm</TableHead><TableHead className="w-[18%] text-center text-xs">Trạng thái</TableHead><TableHead className="w-[16%] text-center text-xs">Múi giờ</TableHead><TableHead className="w-[14%] px-5 text-center text-xs">Thao tác</TableHead></TableRow></TableHeader><TableBody>{stores.map((store) => <TableRow key={store.id} className="hover:bg-muted/40"><TableCell className="px-5 py-3"><p className="font-medium text-foreground">{store.name}</p><p className="font-mono text-xs text-muted-foreground">{store.code}</p></TableCell><TableCell><p className="truncate text-sm">{store.address || "Chưa có địa chỉ"}</p><p className="text-xs text-muted-foreground">{[store.city, store.province].filter(Boolean).join(", ") || "Chưa có địa phương"}</p></TableCell><TableCell><div className="flex justify-center"><TenantStatusBadge status={store.status} /></div></TableCell><TableCell className="text-center font-mono text-xs text-muted-foreground">{store.timeZone}</TableCell><TableCell className="px-5"><div className="flex justify-center gap-1.5"><Link href={`/stores/${store.id}`} className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground")} title="Xem cửa hàng" aria-label={`Xem cửa hàng ${store.name}`}><Eye className="size-4" /></Link>{canManageStores ? <Button variant="ghost" size="icon-sm" className={cn("rounded-lg", store.status === "Active" ? "text-destructive hover:bg-destructive/10 hover:text-destructive" : "text-success hover:bg-success/10 hover:text-success")} title={store.status === "Active" ? "Vô hiệu hóa" : "Kích hoạt"} aria-label={`${store.status === "Active" ? "Vô hiệu hóa" : "Kích hoạt"} ${store.name}`} onClick={() => { setMutationError(null); setLifecycleTarget({ kind: "store", store, activate: store.status !== "Active" }); }}>{store.status === "Active" ? <PowerOff className="size-4" /> : <Power className="size-4" />}</Button> : null}</div></TableCell></TableRow>)}</TableBody></Table>}
      </Card>

      {organizationFormOpen ? <OrganizationFormDialog organization={organization} open isSubmitting={isSubmitting} errorMessage={mutationError} onOpenChange={(open) => { if (!mutationRef.current) setOrganizationFormOpen(open); }} onCreate={async () => false} onUpdate={submitOrganizationUpdate} /> : null}
      {storeFormOpen ? <StoreFormDialog organizationName={organization.name} store={null} open isSubmitting={isSubmitting} errorMessage={mutationError} onOpenChange={(open) => { if (!mutationRef.current) setStoreFormOpen(open); }} onCreate={submitStoreCreate} onUpdate={async () => false} /> : null}
      {lifecycleTarget ? <LifecycleConfirmDialog entityLabel={lifecycleTarget.kind === "organization" ? "tổ chức" : "cửa hàng"} entityName={lifecycleTarget.kind === "organization" ? organization.name : lifecycleTarget.store.name} activate={lifecycleTarget.activate} open isSubmitting={isSubmitting} errorMessage={mutationError} onOpenChange={(open) => { if (!open && !mutationRef.current) setLifecycleTarget(null); }} onConfirm={confirmLifecycle} /> : null}
    </div>
  );
}
