"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Plus, RefreshCw, Search, Trash2, UserRoundCog, UsersRound } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/identity/use-auth";
import { useStaffWorkforce } from "@/hooks/identity/use-staff-workforce";
import { useMenuScopeOptions } from "@/hooks/catalog/use-menu-scope-options";
import { hasPermission, hasScopedPermission } from "@/lib/rbac";
import { listManagementOrganizations } from "@/lib/services/tenants/organizations";
import type { StaffWorkforceResult, StaffWorkforceScopeRequest, StaffWorkforceStatusFilter } from "@/types/identity/staff-workforce";

const STATUS_OPTIONS: Array<{ value: StaffWorkforceStatusFilter; label: string }> = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "Invited", label: "Đã mời" },
  { value: "PendingVerification", label: "Chờ xác minh" },
  { value: "Active", label: "Đang hoạt động" },
  { value: "Suspended", label: "Tạm khóa" },
  { value: "Disabled", label: "Đã vô hiệu hóa" },
];

function statusLabel(value: string): string {
  return STATUS_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function ScopeEditor({
  scopes,
  onChange,
  stores,
  kiosks,
  disabled,
}: {
  scopes: StaffWorkforceScopeRequest[];
  onChange: (scopes: StaffWorkforceScopeRequest[]) => void;
  stores: Array<{ id: string; name: string; code: string }>;
  kiosks: Array<{ id: string; storeId: string; name: string; code: string }>;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label>Phạm vi làm việc</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => onChange([...scopes, { storeId: null, kioskId: null }])}
        >
          <Plus className="size-4" /> Thêm phạm vi
        </Button>
      </div>
      {scopes.map((scope, index) => {
        const matchingKiosks = kiosks.filter((kiosk) => kiosk.storeId === scope.storeId);
        return (
          <div key={index} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_auto]">
            <Select
              value={scope.storeId ?? ""}
              disabled={disabled}
              onValueChange={(storeId) => onChange(scopes.map((entry, entryIndex) => entryIndex === index ? { storeId, kioskId: null } : entry))}
            >
              <SelectTrigger><SelectValue placeholder="Chọn cửa hàng" /></SelectTrigger>
              <SelectContent>
                {stores.map((store) => <SelectItem key={store.id} value={store.id}>{store.name} — {store.code}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select
              value={scope.kioskId ?? "__store__"}
              disabled={disabled || !scope.storeId}
              onValueChange={(kioskId) => onChange(scopes.map((entry, entryIndex) => entryIndex === index ? { ...entry, kioskId: kioskId === "__store__" ? null : kioskId } : entry))}
            >
              <SelectTrigger><SelectValue placeholder="Toàn cửa hàng" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__store__">Toàn cửa hàng</SelectItem>
                {matchingKiosks.map((kiosk) => <SelectItem key={kiosk.id} value={kiosk.id}>{kiosk.name} — {kiosk.code}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Xóa phạm vi"
              aria-label="Xóa phạm vi"
              disabled={disabled || scopes.length === 1}
              onClick={() => onChange(scopes.filter((_, entryIndex) => entryIndex !== index))}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

export function StaffWorkforceView() {
  const { effectiveAccess } = useAuth();
  const organizationIds = useMemo(() => Array.from(new Set(
    effectiveAccess?.roleScopes
      .filter((scope) => ["OrgAdmin", "Manager"].includes(scope.roleCode) && scope.organizationId)
      .map((scope) => scope.organizationId as string) ?? [],
  )), [effectiveAccess?.roleScopes]);
  const [organizationLabels, setOrganizationLabels] = useState<Record<string, string>>({});
  const [organizationId, setOrganizationId] = useState<string | null>(organizationIds[0] ?? null);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [googleLoginEnabled, setGoogleLoginEnabled] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [sendInvitationEmail, setSendInvitationEmail] = useState(true);
  const [scopes, setScopes] = useState<StaffWorkforceScopeRequest[]>([{ storeId: null, kioskId: null }]);
  const [lifecycleReason, setLifecycleReason] = useState("");
  const workforce = useStaffWorkforce(organizationId);
  const scopeOptions = useMenuScopeOptions(organizationId);
  const canManage = organizationId
    ? hasScopedPermission(effectiveAccess, "workforce.staff.manage", { organizationId })
    : false;

  useEffect(() => {
    if (organizationId && organizationIds.includes(organizationId)) return;
    const timeoutId = window.setTimeout(() => setOrganizationId(organizationIds[0] ?? null), 0);
    return () => window.clearTimeout(timeoutId);
  }, [organizationId, organizationIds]);

  useEffect(() => {
    if (!hasPermission(effectiveAccess, "organizations.view")) return;
    const controller = new AbortController();
    void listManagementOrganizations({ pageNumber: 1, pageSize: 100 }, controller.signal)
      .then((result) => setOrganizationLabels(Object.fromEntries(
        (result.data ?? []).filter((organization) => organizationIds.includes(organization.id))
          .map((organization) => [organization.id, `${organization.name} — ${organization.code}`]),
      )))
      .catch(() => undefined);
    return () => controller.abort();
  }, [effectiveAccess, organizationIds]);

  function resetCreateForm() {
    setUserName(""); setEmail(""); setFullName(""); setPhoneNumber("");
    setGoogleLoginEnabled(false); setGoogleEmail(""); setSendInvitationEmail(true);
    setScopes([{ storeId: null, kioskId: null }]);
    workforce.clearMutationError();
  }

  function validScopes() {
    return scopes.length > 0 && scopes.every((scope) => scope.storeId && (!scope.kioskId || scopeOptions.kiosks.some((kiosk) => kiosk.id === scope.kioskId && kiosk.storeId === scope.storeId)));
  }

  async function submitCreate() {
    if (!userName.trim() || !email.trim() || !validScopes()) return;
    const result = await workforce.create({
      userName: userName.trim(), email: email.trim(), fullName: fullName.trim() || null,
      phoneNumber: phoneNumber.trim() || null, localLoginEnabled: true,
      googleLoginEnabled, googleEmail: googleLoginEnabled ? googleEmail.trim() : null,
      sendInvitationEmail, staffScopes: scopes,
    });
    if (result) {
      toast.success("Đã tạo tài khoản nhân viên và phạm vi làm việc.");
      setCreateOpen(false);
      resetCreateForm();
    }
  }

  function openDetail(accountId: string) {
    workforce.clearMutationError();
    setLifecycleReason("");
    setDetailOpen(true);
    void workforce.openDetail(accountId);
  }

  const selected = workforce.selected;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Nhân viên vận hành</h1>
          <p className="text-sm text-muted-foreground">Quản lý tài khoản Staff và giới hạn cửa hàng hoặc kiosk được phép làm việc.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={workforce.refresh} isLoading={workforce.isLoading}><RefreshCw className="size-4" />Làm mới</Button>
          {canManage ? <Button onClick={() => { resetCreateForm(); setCreateOpen(true); }}><Plus className="size-4" />Tạo nhân viên</Button> : null}
        </div>
      </section>

      <Card className="rounded-xl border-border shadow-none">
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div><p className="font-medium">Phạm vi tổ chức</p><p className="text-sm text-muted-foreground">Chỉ hiển thị Staff thuộc phạm vi OrgAdmin hoặc Manager hiện tại.</p></div>
          <Select value={organizationId ?? ""} onValueChange={setOrganizationId} disabled={organizationIds.length === 0}>
            <SelectTrigger className="w-full lg:w-96"><SelectValue placeholder="Chọn tổ chức" /></SelectTrigger>
            <SelectContent>
              {organizationIds.map((id, index) => <SelectItem key={id} value={id}>{organizationLabels[id] ?? `Tổ chức được phân quyền ${index + 1}`}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border shadow-none">
        <CardHeader className="border-b border-border"><CardTitle className="flex items-center gap-2 text-base"><UsersRound className="size-5 text-primary" />Danh sách nhân viên</CardTitle></CardHeader>
        <CardContent className="border-b border-border p-4">
          <div className="grid gap-2 md:grid-cols-[1fr_220px]">
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={workforce.search} onChange={(event) => workforce.setSearch(event.target.value)} placeholder="Tìm tên, username hoặc email..." /></div>
            <Select value={workforce.status} onValueChange={(value) => workforce.setStatus(value as StaffWorkforceStatusFilter)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>
          </div>
        </CardContent>
        {workforce.errorMessage ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center"><AlertTriangle className="size-7 text-destructive" /><p className="text-sm text-destructive">{workforce.errorMessage}</p><Button variant="outline" onClick={workforce.refresh}>Thử lại</Button></div>
        ) : workforce.isLoading ? (
          <div className="space-y-3 p-5">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded-lg bg-muted/40" />)}</div>
        ) : workforce.items.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Chưa có nhân viên Staff trong phạm vi này.</div>
        ) : (
          <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="pl-5">Nhân viên</TableHead><TableHead>Trạng thái</TableHead><TableHead>Phạm vi</TableHead><TableHead>Đăng nhập</TableHead><TableHead className="pr-5 text-right">Thao tác</TableHead></TableRow></TableHeader><TableBody>
            {workforce.items.map((item) => <TableRow key={item.accountId}><TableCell className="pl-5"><p className="font-medium">{item.fullName || item.userName}</p><p className="text-xs text-muted-foreground">{item.email}</p></TableCell><TableCell><Badge variant={item.status === "Disabled" ? "destructive" : "secondary"} className={item.status === "Active" ? "border-success/20 bg-success/10 text-success" : undefined}>{statusLabel(item.status)}</Badge></TableCell><TableCell>{item.staffScopes.map((scope) => scope.kioskCode || scope.storeCode || "Phạm vi đã cấp").join(", ")}</TableCell><TableCell className="text-sm text-muted-foreground">{[item.localLoginEnabled ? "Mật khẩu" : null, item.googleLoginEnabled ? "Google" : null].filter(Boolean).join(" + ")}</TableCell><TableCell className="pr-5 text-right"><Button variant="ghost" size="sm" onClick={() => openDetail(item.accountId)}><UserRoundCog className="size-4" />Chi tiết</Button></TableCell></TableRow>)}
          </TableBody></Table></div>
        )}
        <div className="flex items-center justify-between border-t border-border p-4"><p className="text-sm text-muted-foreground">{workforce.totalCount} nhân viên</p><div className="flex items-center gap-2"><Button size="icon" variant="outline" aria-label="Trang trước" disabled={workforce.pageNumber <= 1} onClick={workforce.previousPage}><ChevronLeft className="size-4" /></Button><span className="text-sm tabular-nums">{workforce.pageNumber}/{workforce.totalPages}</span><Button size="icon" variant="outline" aria-label="Trang sau" disabled={workforce.pageNumber >= workforce.totalPages} onClick={workforce.nextPage}><ChevronRight className="size-4" /></Button></div></div>
      </Card>

      <Dialog open={createOpen} onOpenChange={(open) => !workforce.isSubmitting && setCreateOpen(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>Tạo nhân viên Staff</DialogTitle><DialogDescription>Tài khoản chỉ được cấp vai trò Staff trong phạm vi đã chọn.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="staff-username">Tên đăng nhập *</Label><Input id="staff-username" value={userName} onChange={(event) => setUserName(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="staff-email">Email *</Label><Input id="staff-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="staff-name">Họ tên</Label><Input id="staff-name" value={fullName} onChange={(event) => setFullName(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="staff-phone">Số điện thoại</Label><Input id="staff-phone" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} /></div>
          </div>
          <ScopeEditor scopes={scopes} onChange={setScopes} stores={scopeOptions.stores} kiosks={scopeOptions.kiosks} disabled={scopeOptions.isLoading || workforce.isSubmitting} />
          <div className="space-y-3 rounded-lg border border-border p-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={googleLoginEnabled} onChange={(event) => setGoogleLoginEnabled(event.target.checked)} />Cho phép đăng nhập Google</label>
            {googleLoginEnabled ? <div className="space-y-2"><Label htmlFor="staff-google-email">Email Google *</Label><Input id="staff-google-email" type="email" value={googleEmail} onChange={(event) => setGoogleEmail(event.target.value)} /></div> : null}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sendInvitationEmail} onChange={(event) => setSendInvitationEmail(event.target.checked)} />Gửi email lời mời</label>
          </div>
          {scopeOptions.errorMessage || workforce.mutationError ? <p className="text-sm text-destructive">{scopeOptions.errorMessage || workforce.mutationError}</p> : null}
          <DialogFooter><Button variant="outline" disabled={workforce.isSubmitting} onClick={() => setCreateOpen(false)}>Hủy</Button><Button disabled={!userName.trim() || !email.trim() || !validScopes() || (googleLoginEnabled && !googleEmail.trim())} isLoading={workforce.isSubmitting} onClick={() => void submitCreate()}>Tạo nhân viên</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={(open) => { if (!workforce.isSubmitting) { setDetailOpen(open); if (!open) workforce.closeDetail(); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>Chi tiết nhân viên</DialogTitle><DialogDescription>Cập nhật hồ sơ, phạm vi và trạng thái tài khoản Staff.</DialogDescription></DialogHeader>
          {workforce.isDetailLoading ? <div className="h-48 animate-pulse rounded-lg bg-muted/40" /> : workforce.detailError ? <p className="text-sm text-destructive">{workforce.detailError}</p> : selected ? (
            <StaffDetailForm
              key={`${selected.accountId}-${selected.revision}`}
              staff={selected}
              stores={scopeOptions.stores}
              kiosks={scopeOptions.kiosks}
              canManage={canManage}
              isSubmitting={workforce.isSubmitting}
              mutationError={workforce.mutationError}
              lifecycleReason={lifecycleReason}
              onLifecycleReasonChange={setLifecycleReason}
              onUpdateProfile={async (profile) => { const result = await workforce.updateProfile(profile); if (result) toast.success("Đã cập nhật hồ sơ nhân viên."); }}
              onUpdateScopes={async (nextScopes) => { const result = await workforce.updateScopes(nextScopes); if (result) toast.success("Đã cập nhật phạm vi nhân viên."); }}
              onLifecycle={async (action) => { const result = await workforce.changeLifecycle(action, lifecycleReason.trim()); if (result) { toast.success(action === "deactivate" ? "Đã vô hiệu hóa nhân viên." : "Đã kích hoạt lại nhân viên."); setLifecycleReason(""); } }}
              onInvite={async () => { const result = await workforce.resendInvitation(true); if (result) toast.success(result.invitation?.emailSentAt ? "Đã gửi lại email lời mời." : "Đã tạo lại lời mời; email chưa được xác nhận là đã gửi."); }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StaffDetailForm({ staff, stores, kiosks, canManage, isSubmitting, mutationError, lifecycleReason, onLifecycleReasonChange, onUpdateProfile, onUpdateScopes, onLifecycle, onInvite }: {
  staff: StaffWorkforceResult;
  stores: Array<{ id: string; name: string; code: string }>;
  kiosks: Array<{ id: string; storeId: string; name: string; code: string }>;
  canManage: boolean;
  isSubmitting: boolean;
  mutationError: string | null;
  lifecycleReason: string;
  onLifecycleReasonChange: (value: string) => void;
  onUpdateProfile: (profile: { fullName?: string | null; phoneNumber?: string | null }) => Promise<void>;
  onUpdateScopes: (scopes: StaffWorkforceScopeRequest[]) => Promise<void>;
  onLifecycle: (action: "deactivate" | "reactivate") => Promise<void>;
  onInvite: () => Promise<void>;
}) {
  const [name, setName] = useState(staff?.fullName ?? "");
  const [phone, setPhone] = useState(staff?.phoneNumber ?? "");
  const [detailScopes, setDetailScopes] = useState<StaffWorkforceScopeRequest[]>(staff?.staffScopes.map((scope) => ({ storeId: scope.storeId, kioskId: scope.kioskId })) ?? []);
  if (!staff) return null;
  return <div className="space-y-5 py-2">
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Họ tên</Label><Input value={name} disabled={!canManage || isSubmitting} onChange={(event) => setName(event.target.value)} /></div><div className="space-y-2"><Label>Số điện thoại</Label><Input value={phone} disabled={!canManage || isSubmitting} onChange={(event) => setPhone(event.target.value)} /></div></div>
    <div className="rounded-lg border border-border p-3 text-sm"><p className="font-medium">{staff.userName}</p><p className="text-muted-foreground">{staff.email}</p><p className="mt-2">Trạng thái: {statusLabel(staff.status)}</p></div>
    <ScopeEditor scopes={detailScopes} onChange={setDetailScopes} stores={stores} kiosks={kiosks} disabled={!canManage || isSubmitting} />
    {mutationError ? <p className="text-sm text-destructive">{mutationError}</p> : null}
    {canManage ? <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={isSubmitting} onClick={() => void onUpdateProfile({ fullName: name.trim() || null, phoneNumber: phone.trim() || null })}>Lưu hồ sơ</Button><Button variant="outline" disabled={isSubmitting || detailScopes.some((scope) => !scope.storeId)} onClick={() => void onUpdateScopes(detailScopes)}>Lưu phạm vi</Button><Button variant="outline" disabled={isSubmitting} onClick={() => void onInvite()}>Gửi lại lời mời</Button></div> : null}
    {canManage ? <div className="space-y-2 border-t border-border pt-4"><Label htmlFor="staff-lifecycle-reason">Lý do thay đổi trạng thái</Label><Input id="staff-lifecycle-reason" value={lifecycleReason} onChange={(event) => onLifecycleReasonChange(event.target.value)} placeholder="Nhập lý do để lưu bằng chứng vận hành" /><Button variant={staff.status === "Disabled" ? "default" : "destructive"} disabled={isSubmitting || !lifecycleReason.trim()} onClick={() => void onLifecycle(staff.status === "Disabled" ? "reactivate" : "deactivate")}>{staff.status === "Disabled" ? "Kích hoạt lại" : "Vô hiệu hóa"}</Button></div> : null}
  </div>;
}
