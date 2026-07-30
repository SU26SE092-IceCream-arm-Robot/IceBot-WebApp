"use client";

import { Factory, RefreshCw } from "lucide-react";

import { RobotAuthoringImportsPanel } from "@/components/features/organizations/robot-authoring-imports-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useProductionOrganizationScope } from "@/hooks/use-production-organization-scope";
import { hasScopedPermission } from "@/lib/rbac";

function organizationLabel(name: string, code: string) {
  return name ? `${name} — ${code}` : code || "Không xác định";
}

export function ProductionWorkspaceView() {
  const { effectiveAccess } = useAuth();
  const scope = useProductionOrganizationScope();
  const selected = scope.organizations.find((organization) => organization.id === scope.selectedOrganizationId) ?? null;
  const organizationScope = selected ? { organizationId: selected.id, storeId: null, kioskId: null } : null;
  const canRead = organizationScope ? hasScopedPermission(effectiveAccess, "program.read", organizationScope) : false;
  const canUpload = organizationScope ? hasScopedPermission(effectiveAccess, "artifact.upload", organizationScope) : false;
  const canManagePrograms = organizationScope ? hasScopedPermission(effectiveAccess, "program.manage", organizationScope) : false;
  const canManageReleases = organizationScope ? hasScopedPermission(effectiveAccess, "release.publish", organizationScope) : false;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary"><Factory className="size-5" /></span><div><h1 className="text-3xl font-semibold tracking-tight">Cấu hình sản xuất</h1><p className="mt-1 text-sm text-muted-foreground">Theo dõi bundle cấu hình, chương trình robot và bản nháp phát hành trong phạm vi tổ chức.</p></div></div>
        <Button variant="outline" disabled={scope.isLoading} onClick={() => void scope.refresh()}><RefreshCw className="size-4" />Làm mới</Button>
      </section>

      <Card className="border-border/80 shadow-none">
        <CardHeader><CardTitle className="text-base">Phạm vi tổ chức</CardTitle><CardDescription>Chọn tổ chức để xem các gói cấu hình mà backend cho phép tài khoản hiện tại truy cập.</CardDescription></CardHeader>
        <CardContent className="space-y-3"><Label htmlFor="production-organization">Tổ chức</Label><Select value={scope.selectedOrganizationId ?? ""} onValueChange={(value) => scope.setSelectedOrganizationId(value ?? null)} disabled={scope.isLoading || scope.organizations.length === 0}><SelectTrigger id="production-organization" className="w-full sm:max-w-xl"><SelectValue>{selected ? organizationLabel(selected.name, selected.code) : scope.isLoading ? "Đang tải tổ chức..." : "Chọn tổ chức"}</SelectValue></SelectTrigger><SelectContent>{scope.organizations.map((organization) => <SelectItem key={organization.id} value={organization.id}>{organizationLabel(organization.name, organization.code)}</SelectItem>)}</SelectContent></Select>{scope.errorMessage ? <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{scope.errorMessage}</div> : null}{!scope.isLoading && !scope.errorMessage && scope.organizations.length === 0 ? <p className="text-sm text-muted-foreground">Tài khoản hiện tại chưa có tổ chức nào trong phạm vi cấu hình sản xuất.</p> : null}</CardContent>
      </Card>

      {selected && canRead ? <RobotAuthoringImportsPanel organizationId={selected.id} canRead={canRead} canUpload={canUpload} canManagePrograms={canManagePrograms} canManageReleases={canManageReleases} /> : null}
      {selected && !canRead ? <div className="rounded-lg border border-dashed px-5 py-10 text-center text-sm text-muted-foreground">Bạn không có quyền xem cấu hình sản xuất của tổ chức đã chọn.</div> : null}
    </div>
  );
}
