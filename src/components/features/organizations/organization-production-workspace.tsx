"use client";

import Link from "next/link";
import { ArrowLeft, Factory } from "lucide-react";

import { RobotAuthoringImportsPanel } from "@/components/features/organizations/robot-authoring-imports-panel";
import { OrganizationConfigurationReleasesPanel } from "@/components/features/organizations/organization-configuration-releases-panel";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { hasScopedPermission } from "@/lib/rbac";

interface OrganizationProductionWorkspaceProps {
  organizationId: string;
}

export function OrganizationProductionWorkspace({ organizationId }: OrganizationProductionWorkspaceProps) {
  const { effectiveAccess } = useAuth();
  const scope = { organizationId, storeId: null, kioskId: null };
  const canRead = hasScopedPermission(effectiveAccess, "program.read", scope);
  const canUpload = hasScopedPermission(effectiveAccess, "artifact.upload", scope);
  const canManagePrograms = hasScopedPermission(effectiveAccess, "program.manage", scope);
  const canManageReleases = hasScopedPermission(effectiveAccess, "release.publish", scope);

  if (!canRead) {
    return <div className="rounded-lg border border-dashed px-5 py-10 text-center text-sm text-muted-foreground">Bạn không có quyền xem không gian cấu hình sản xuất của tổ chức này.</div>;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Link href={`/organizations/${organizationId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Chi tiết tổ chức</Link>
          <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary"><Factory className="size-5" /></span><div><h1 className="text-3xl font-semibold tracking-tight">Không gian cấu hình sản xuất</h1><p className="mt-1 text-sm text-muted-foreground">Quản lý bundle nhập vào và chuyển các cấu hình đã được backend xác nhận sang bản nháp phát hành.</p></div></div>
        </div>
        <Link href={`/organizations/${organizationId}`} className={buttonVariants({ variant: "outline" })}>Quay lại tổ chức</Link>
      </section>

      <RobotAuthoringImportsPanel
        organizationId={organizationId}
        canRead={canRead}
        canUpload={canUpload}
        canManagePrograms={canManagePrograms}
        canManageReleases={canManageReleases}
      />
      <OrganizationConfigurationReleasesPanel
        organizationId={organizationId}
        canManage={canManageReleases}
      />
    </div>
  );
}
