"use client";

import { useState, type FormEvent } from "react";
import { AlertTriangle, Play, Plus, RefreshCw, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFranchiseOnboarding } from "@/hooks/tenants/use-franchise-onboarding";
import { TenantRefreshWarning } from "@/components/features/tenants/shared/tenant-refresh-warning";
import type { FranchiseOnboardingResult } from "@/types/tenants/franchise-onboarding";

const DEFAULT_TIME_ZONE = "Asia/Ho_Chi_Minh";

function statusLabel(status: FranchiseOnboardingResult["status"]) {
  return { Pending: "Đang chờ", Running: "Đang thực hiện", Failed: "Cần xử lý", ReadyForActivation: "Sẵn sàng để xem xét kích hoạt", Cancelled: "Đã hủy" }[status];
}

function formatOnboardingDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Chưa xác định thời điểm"
    : `Khởi tạo ${new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date)}`;
}

export function FranchiseOnboardingPanel({
  organizationId,
  canManage,
  canStart,
}: {
  organizationId: string;
  canManage: boolean;
  canStart: boolean;
}) {
  const workflow = useFranchiseOnboarding(organizationId, canManage);
  const [startOpen, setStartOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<FranchiseOnboardingResult | null>(null);
  const [storeCode, setStoreCode] = useState("");
  const [storeName, setStoreName] = useState("");
  const [kioskCode, setKioskCode] = useState("");
  const [kioskName, setKioskName] = useState("");
  const [timeZone, setTimeZone] = useState(DEFAULT_TIME_ZONE);
  const [reason, setReason] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  if (!canManage) return null;

  const start = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (storeCode.trim().length < 2 || storeName.trim().length === 0 || kioskCode.trim().length < 2 || kioskName.trim().length === 0 || timeZone.trim().length === 0) {
      setValidationMessage("Mã và tên cửa hàng, mã và tên kiosk, cùng múi giờ là bắt buộc.");
      return;
    }
    setValidationMessage(null);
    const result = await workflow.start({
      store: { code: storeCode.trim().toUpperCase(), name: storeName.trim(), storeType: "Retail", timeZone: timeZone.trim(), openingHours: [] },
      kiosk: { code: kioskCode.trim().toUpperCase(), name: kioskName.trim(), kioskType: "RoboticVending", timeZone: timeZone.trim() },
    });
    if (result) {
      setStartOpen(false);
      setStoreCode(""); setStoreName(""); setKioskCode(""); setKioskName(""); setTimeZone(DEFAULT_TIME_ZONE);
    }
  };

  const cancel = async () => {
    if (!cancelTarget) return;
    const normalizedReason = reason.trim();
    if (!normalizedReason || normalizedReason.length > 500) {
      setValidationMessage("Vui lòng nhập lý do hủy, tối đa 500 ký tự.");
      return;
    }
    if (await workflow.cancel(cancelTarget.id, normalizedReason)) {
      setCancelTarget(null); setReason(""); setValidationMessage(null);
    }
  };

  return (
    <Card className="gap-0 rounded-xl border border-border/80 py-0 shadow-none">
      <CardHeader className="border-b border-border px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><CardTitle className="text-base font-semibold">Thiết lập điểm bán</CardTitle><p className="mt-1 text-xs text-muted-foreground">Tạo cửa hàng và kiosk trong một quy trình có thể tiếp tục khi gián đoạn. Quy trình này không mở bán hoặc cài đặt gói sản xuất.</p></div>
          <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => void workflow.refresh()} disabled={workflow.isLoading || workflow.isMutating}><RefreshCw className={workflow.isLoading ? "size-4 animate-spin" : "size-4"} />Làm mới</Button>{canStart ? <Button size="sm" onClick={() => { workflow.clearError(); setStartOpen(true); }} disabled={workflow.isMutating}><Plus className="size-4" />Bắt đầu thiết lập</Button> : null}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        <TenantRefreshWarning message={workflow.refreshWarningMessage} isRetrying={workflow.isRefreshRetrying} onRetry={() => void workflow.retryRefresh()} />
        {workflow.errorMessage ? <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{workflow.errorMessage}</p> : null}
        {workflow.isLoading ? <p className="text-sm text-muted-foreground">Đang tải lịch sử thiết lập...</p> : null}
        {!workflow.isLoading && workflow.items.length === 0 ? <p className="text-sm text-muted-foreground">Tổ chức này chưa bắt đầu quy trình thiết lập điểm bán.</p> : null}
        {workflow.items.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0 space-y-1"><p className="font-medium">{statusLabel(item.status)}</p><p className="text-xs text-muted-foreground">{formatOnboardingDate(item.createdAt)}</p>{item.failureMessage ? <p className="text-sm text-destructive">{item.failureCode ? `${item.failureCode}: ` : ""}{item.failureMessage}</p> : null}</div><div className="flex shrink-0 flex-wrap gap-2">{item.status === "Failed" ? <Button size="sm" variant="outline" disabled={workflow.isMutating} onClick={() => void workflow.resume(item.id)}><Play className="size-4" />Tiếp tục</Button> : null}{item.status !== "ReadyForActivation" && item.status !== "Cancelled" ? <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={workflow.isMutating} onClick={() => { workflow.clearError(); setValidationMessage(null); setCancelTarget(item); }}><XCircle className="size-4" />Hủy</Button> : null}</div></div>)}
      </CardContent>

      <Dialog open={startOpen} onOpenChange={(open) => { if (!workflow.isMutating) setStartOpen(open); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><form onSubmit={(event) => void start(event)} className="space-y-5"><DialogHeader><DialogTitle>Bắt đầu thiết lập điểm bán</DialogTitle><DialogDescription>Thao tác này tạo một cửa hàng và một kiosk ở trạng thái đang cấu hình. Mở bán, thiết lập thiết bị, cài gói và triển khai vẫn là các bước xét duyệt riêng.</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5"><Label htmlFor="onboarding-store-code">Mã cửa hàng</Label><Input id="onboarding-store-code" value={storeCode} maxLength={50} disabled={workflow.isMutating} onChange={(event) => setStoreCode(event.target.value)} /></label><label className="space-y-1.5"><Label htmlFor="onboarding-store-name">Tên cửa hàng</Label><Input id="onboarding-store-name" value={storeName} maxLength={200} disabled={workflow.isMutating} onChange={(event) => setStoreName(event.target.value)} /></label><label className="space-y-1.5"><Label htmlFor="onboarding-kiosk-code">Mã kiosk</Label><Input id="onboarding-kiosk-code" value={kioskCode} maxLength={50} disabled={workflow.isMutating} onChange={(event) => setKioskCode(event.target.value)} /></label><label className="space-y-1.5"><Label htmlFor="onboarding-kiosk-name">Tên kiosk</Label><Input id="onboarding-kiosk-name" value={kioskName} maxLength={200} disabled={workflow.isMutating} onChange={(event) => setKioskName(event.target.value)} /></label><label className="space-y-1.5 sm:col-span-2"><Label htmlFor="onboarding-time-zone">Múi giờ</Label><Input id="onboarding-time-zone" value={timeZone} disabled={workflow.isMutating} onChange={(event) => setTimeZone(event.target.value)} /></label></div><p className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning">Quy trình nhanh chưa cấu hình giờ mở cửa. Hãy hoàn tất lịch bán hàng trước khi cho phép cửa hàng nhận đơn.</p>{validationMessage || workflow.errorMessage ? <p className="text-sm text-destructive" role="alert">{validationMessage || workflow.errorMessage}</p> : null}<DialogFooter><Button type="button" variant="outline" disabled={workflow.isMutating} onClick={() => setStartOpen(false)}>Đóng</Button><Button type="submit" disabled={workflow.isMutating}>Bắt đầu</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={cancelTarget !== null} onOpenChange={(open) => { if (!open && !workflow.isMutating) setCancelTarget(null); }}><DialogContent><DialogHeader><DialogTitle>Hủy quy trình thiết lập</DialogTitle><DialogDescription>Việc hủy vẫn giữ lại bằng chứng lịch sử. Quy trình đã sẵn sàng kích hoạt không thể bị hủy.</DialogDescription></DialogHeader><label className="space-y-1.5"><Label htmlFor="onboarding-cancel-reason">Lý do</Label><Input id="onboarding-cancel-reason" value={reason} maxLength={500} disabled={workflow.isMutating} onChange={(event) => setReason(event.target.value)} /></label>{validationMessage || workflow.errorMessage ? <p className="text-sm text-destructive" role="alert">{validationMessage || workflow.errorMessage}</p> : null}<DialogFooter><Button variant="outline" disabled={workflow.isMutating} onClick={() => setCancelTarget(null)}>Quay lại</Button><Button variant="destructive" disabled={workflow.isMutating} onClick={() => void cancel()}><AlertTriangle className="size-4" />Xác nhận hủy</Button></DialogFooter></DialogContent></Dialog>
    </Card>
  );
}
