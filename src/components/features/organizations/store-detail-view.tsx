"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Eye,
  MapPin,
  Monitor,
  Pencil,
  Power,
  PowerOff,
  RefreshCw,
  Store as StoreIcon,
} from "lucide-react";

import {
  LifecycleConfirmDialog,
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
import { Badge } from "@/components/ui/badge";
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
  getKioskManagementErrorMessage,
  getManagementKiosks,
} from "@/lib/services/kiosk-management";
import {
  getManagementOrganizationById,
  getOrganizationsErrorMessage,
} from "@/lib/services/organizations";
import {
  getManagementStoreById,
  getStoresErrorMessage,
  setManagementStoreActive,
  updateManagementStore,
} from "@/lib/services/stores";
import { cn } from "@/lib/utils";
import type { KioskResult, StoreResult } from "@/types/kiosk-management";
import type {
  OrganizationResult,
  StoreDayOfWeek,
  UpdateStoreRequest,
} from "@/types/tenant-management";

interface StoreDetailViewProps {
  storeId: string;
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-lg border border-border bg-muted/15 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="break-words text-sm font-medium">{value}</p>
    </div>
  );
}

const KIOSK_STATUS_LABELS: Record<KioskResult["status"], string> = {
  Provisioning: "Đang cấu hình",
  Active: "Đang hoạt động",
  Disabled: "Đã vô hiệu hóa",
  Retired: "Ngừng sử dụng",
};

const KIOSK_OPERATIONAL_STATE_LABELS: Record<
  KioskResult["operationalState"],
  string
> = {
  Operational: "Đang vận hành",
  PausedByOperator: "Tạm dừng bởi nhân viên",
  Maintenance: "Đang bảo trì",
  Cleaning: "Đang vệ sinh",
  Restocking: "Đang bổ sung hàng",
  EmergencyStopRequested: "Đã yêu cầu dừng khẩn cấp",
  OutOfService: "Ngừng phục vụ",
};

const STORE_DAY_LABELS: Record<StoreDayOfWeek, string> = {
  Monday: "Thứ 2",
  Tuesday: "Thứ 3",
  Wednesday: "Thứ 4",
  Thursday: "Thứ 5",
  Friday: "Thứ 6",
  Saturday: "Thứ 7",
  Sunday: "Chủ nhật",
};

function formatOpeningHours(store: StoreResult): string {
  if (store.openingHours.length === 0) return "Không giới hạn theo lịch";
  return store.openingHours
    .map((day) =>
      day.isClosed
        ? `${STORE_DAY_LABELS[day.dayOfWeek]}: Đóng cửa`
        : `${STORE_DAY_LABELS[day.dayOfWeek]}: ${day.opensAt?.slice(0, 5)}–${day.closesAt?.slice(0, 5)}`,
    )
    .join("; ");
}

function formatTimeZoneDisplay(timeZone: string): string {
  if (timeZone === "Asia/Bangkok") {
    return "Asia/Bangkok · UTC+7";
  }

  return timeZone;
}

function KioskStatusBadge({ status }: { status: KioskResult["status"] }) {
  const className =
    status === "Active"
      ? "border-success/20 bg-success/10 text-success"
      : status === "Provisioning"
        ? "border-warning/20 bg-warning/10 text-warning"
        : "border-border bg-muted/30 text-muted-foreground";
  return (
    <Badge variant="outline" className={`h-6 rounded-full px-2.5 ${className}`}>
      {KIOSK_STATUS_LABELS[status]}
    </Badge>
  );
}

function KioskOperationalStateBadge({
  state,
}: {
  state: KioskResult["operationalState"];
}) {
  const className =
    state === "Operational"
      ? "border-success/20 bg-success/10 text-success"
      : state === "OutOfService" || state === "EmergencyStopRequested"
        ? "border-destructive/20 bg-destructive/10 text-destructive"
        : "border-warning/20 bg-warning/10 text-warning";

  return (
    <Badge variant="outline" className={`h-6 rounded-full px-2.5 ${className}`}>
      {KIOSK_OPERATIONAL_STATE_LABELS[state]}
    </Badge>
  );
}

export function StoreDetailView({ storeId }: StoreDetailViewProps) {
  const { currentUser } = useAuth();
  const mutationRef = useRef(false);
  const [store, setStore] = useState<StoreResult | null>(null);
  const [organization, setOrganization] = useState<OrganizationResult | null>(null);
  const [kiosks, setKiosks] = useState<KioskResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [lifecycleOpen, setLifecycleOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const canManage =
    currentUser?.role === "ADMIN" || currentUser?.role === "LOCATION_OWNER";

  const loadData = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setErrorMessage(null);
    setWarningMessage(null);
    try {
      const storeResult = await getManagementStoreById(storeId, signal);
      if (signal?.aborted) return;
      setStore(storeResult);
      const [organizationResult, kioskResult] = await Promise.allSettled([
        getManagementOrganizationById(storeResult.organizationId, signal),
        getManagementKiosks({ storeId: storeResult.id }, signal),
      ]);
      if (signal?.aborted) return;
      const warnings: string[] = [];
      if (organizationResult.status === "fulfilled") {
        setOrganization(organizationResult.value);
      } else {
        setOrganization(null);
        warnings.push(
          getOrganizationsErrorMessage(
            organizationResult.reason,
            "Không thể tải thông tin tổ chức cha.",
          ),
        );
      }
      if (kioskResult.status === "fulfilled") {
        setKiosks(kioskResult.value);
      } else {
        setKiosks([]);
        warnings.push(
          getKioskManagementErrorMessage(
            kioskResult.reason,
            "Không thể tải danh sách kiosk của cửa hàng.",
          ),
        );
      }
      setWarningMessage(warnings.length > 0 ? warnings.join(" ") : null);
    } catch (error) {
      if (!signal?.aborted) {
        setStore(null);
        setErrorMessage(getStoresErrorMessage(error));
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [storeId]);

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
    tone: "success" | "warning" = "success",
  ) => {
    if (mutationRef.current) return false;
    mutationRef.current = true;
    setIsSubmitting(true);
    setMutationError(null);
    try {
      await mutation();
      await loadData();
      if (tone === "warning") toast.warning(success);
      else toast.success(success);
      return true;
    } catch (error) {
      setMutationError(getStoresErrorMessage(error));
      return false;
    } finally {
      mutationRef.current = false;
      setIsSubmitting(false);
    }
  };

  const submitUpdate = async (request: UpdateStoreRequest) => {
    if (!store) return false;
    const succeeded = await runMutation(
      () => updateManagementStore(store.id, request),
      `Đã cập nhật ${store.name}.`,
    );
    if (succeeded) setFormOpen(false);
    return succeeded;
  };

  const confirmLifecycle = async () => {
    if (!store) return false;
    const activate = store.status !== "Active";
    const succeeded = await runMutation(
      () => setManagementStoreActive(store.id, activate),
      `Đã ${activate ? "kích hoạt" : "vô hiệu hóa"} ${store.name}.`,
      activate ? "success" : "warning",
    );
    if (succeeded) setLifecycleOpen(false);
    return succeeded;
  };

  if (isLoading) return <TenantLoadingState label="Đang tải thông tin cửa hàng..." />;
  if (!store) {
    return <TenantErrorState message={errorMessage ?? "Không tìm thấy cửa hàng."} onRetry={() => void loadData()} />;
  }

  const location = [store.address, store.city, store.province, store.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-7">
      {warningMessage ? <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">{warningMessage}</div> : null}

      <section className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3"><Link href={`/organizations/${store.organizationId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />{organization?.name ?? "Tổ chức"}</Link><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight">{store.name}</h1><TenantStatusBadge status={store.status} /></div><p className="font-mono text-sm text-muted-foreground">{store.code}</p></div>
        <div className="flex flex-wrap gap-2">{canManage ? <Button variant="outline" onClick={() => { setMutationError(null); setFormOpen(true); }}><Pencil className="size-4" />Chỉnh sửa</Button> : null}{canManage ? <Button variant={store.status === "Active" ? "destructive" : "default"} onClick={() => { setMutationError(null); setLifecycleOpen(true); }}>{store.status === "Active" ? <PowerOff className="size-4" /> : <Power className="size-4" />}{store.status === "Active" ? "Vô hiệu hóa" : "Kích hoạt"}</Button> : null}<Button variant="outline" onClick={() => void loadData()}><RefreshCw className="size-4" />Làm mới</Button></div>
      </section>

      <Card className="border border-border/80 shadow-none"><CardHeader className="border-b border-border"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><StoreIcon className="size-5" /></span><CardTitle>Thông tin cửa hàng</CardTitle></div></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><DetailField label="Tổ chức" value={organization?.name ?? "Không xác định"} /><DetailField label="Loại cửa hàng" value={store.storeType} /><DetailField label="Múi giờ" value={formatTimeZoneDisplay(store.timeZone)} /><DetailField label="Email" value={store.email || "Chưa có"} /><DetailField label="Số điện thoại" value={store.phoneNumber || "Chưa có"} /><DetailField label="Địa chỉ" value={location || "Chưa có"} /><DetailField label="Vĩ độ" value={store.latitude?.toString() ?? "Chưa có"} /><DetailField label="Kinh độ" value={store.longitude?.toString() ?? "Chưa có"} /><DetailField label="Cập nhật" value={formatTenantDate(store.updatedAt ?? store.createdAt)} /><DetailField label="Lịch mở cửa" value={formatOpeningHours(store)} /></CardContent></Card>

      <Card className="gap-0 border border-border/80 py-0 shadow-none"><CardHeader className="border-b border-border py-4"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Monitor className="size-5" /></span><div><CardTitle>Kiosk tại cửa hàng</CardTitle><p className="text-sm text-muted-foreground">{kiosks.length} kiosk</p></div></div></CardHeader>{kiosks.length === 0 ? <TenantEmptyState title="Chưa có kiosk" description="Cửa hàng này chưa có kiosk liên quan." /> : <Table className="min-w-[760px] table-fixed"><TableHeader><TableRow><TableHead className="w-[32%] px-4">Kiosk</TableHead><TableHead className="w-[22%] text-center">Trạng thái</TableHead><TableHead className="w-[28%]">Địa chỉ</TableHead><TableHead className="w-[18%] px-4 text-center">Thao tác</TableHead></TableRow></TableHeader><TableBody>{kiosks.map((kiosk) => <TableRow key={kiosk.id}><TableCell className="px-4 py-3"><p className="font-medium">{kiosk.name}</p><p className="font-mono text-xs text-muted-foreground">{kiosk.code}</p></TableCell><TableCell className="text-center"><div className="flex flex-col items-center gap-1"><KioskStatusBadge status={kiosk.status} /><KioskOperationalStateBadge state={kiosk.operationalState} /></div></TableCell><TableCell><span className="inline-flex items-center gap-2 text-muted-foreground"><MapPin className="size-4" />{kiosk.address || "Chưa có địa chỉ"}</span></TableCell><TableCell className="px-4 text-center"><Link href={`/kiosks/${kiosk.id}`} className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground")} title={`Xem kiosk ${kiosk.name}`} aria-label={`Xem kiosk ${kiosk.name}`}><Eye className="size-4" /></Link></TableCell></TableRow>)}</TableBody></Table>}</Card>

      {formOpen ? <StoreFormDialog organizationName={organization?.name ?? "Tổ chức"} store={store} open isSubmitting={isSubmitting} errorMessage={mutationError} onOpenChange={(open) => { if (!mutationRef.current) setFormOpen(open); }} onCreate={async () => false} onUpdate={submitUpdate} /> : null}
      {lifecycleOpen ? <LifecycleConfirmDialog entityLabel="cửa hàng" entityName={store.name} activate={store.status !== "Active"} open isSubmitting={isSubmitting} errorMessage={mutationError} onOpenChange={(open) => { if (!mutationRef.current) setLifecycleOpen(open); }} onConfirm={confirmLifecycle} /> : null}
    </div>
  );
}
