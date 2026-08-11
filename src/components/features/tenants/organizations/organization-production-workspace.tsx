"use client";

import Link from "next/link";
import { ArrowLeft, Factory } from "lucide-react";

import { RobotAuthoringImportsPanel } from "@/components/features/production/authoring-imports/robot-authoring-imports-panel";
import { ConfigurationReleasesPanel } from "@/components/features/production/releases/configuration-releases-panel";
import { ProductionProgramBindingsPanel } from "@/components/features/production/bindings/production-program-bindings-panel";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/identity/use-auth";
import { hasScopedPermission } from "@/lib/rbac";

interface OrganizationProductionWorkspaceProps {
  organizationId: string;
}

export function OrganizationProductionWorkspace({
  organizationId,
}: OrganizationProductionWorkspaceProps) {
  const { effectiveAccess } = useAuth();
  const scope = { organizationId, storeId: null, kioskId: null };
  const canRead = hasScopedPermission(effectiveAccess, "program.read", scope);
  const canUpload = hasScopedPermission(
    effectiveAccess,
    "artifact.upload",
    scope,
  );
  const canManagePrograms = hasScopedPermission(
    effectiveAccess,
    "program.manage",
    scope,
  );
  const canManageReleases = hasScopedPermission(
    effectiveAccess,
    "release.publish",
    scope,
  );
  if (!canRead) {
    return (
      <div className="rounded-lg border border-dashed px-5 py-10 text-center text-sm text-muted-foreground">
        Bạn không có quyền xem không gian cấu hình sản xuất của tổ chức này.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Link
            href={`/organizations/${organizationId}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Chi tiết tổ chức
          </Link>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
              <Factory className="size-5" />
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Không gian cấu hình sản xuất
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Nhập bundle, xác nhận Recipe và phát hành RobotProgram. Tạo
                Release và triển khai Edge được thực hiện trong workspace Kiosk.
              </p>
            </div>
          </div>
        </div>
        <Link
          href={`/organizations/${organizationId}`}
          className={buttonVariants({ variant: "outline" })}
        >
          Quay lại tổ chức
        </Link>
      </section>

      <Tabs defaultValue="programs">
        <TabsList variant="line" aria-label="Các giai đoạn cấu hình sản xuất">
          <TabsTrigger value="programs">1. Robot Programs</TabsTrigger>
          <TabsTrigger value="bindings">2. Bind Configuration</TabsTrigger>
          <TabsTrigger value="releases">3. Release / Deployment</TabsTrigger>
        </TabsList>
        <TabsContent value="programs" className="pt-4">
          <RobotAuthoringImportsPanel
            organizationId={organizationId}
            canRead={canRead}
            canUpload={canUpload}
            canManagePrograms={canManagePrograms}
            mode="programs"
          />
        </TabsContent>
        <TabsContent value="bindings" className="pt-4">
          <div className="space-y-6">
            <ProductionProgramBindingsPanel
              organizationId={organizationId}
              canManage={canManageReleases}
            />
          </div>
        </TabsContent>
        <TabsContent value="releases" className="pt-4">
          <ConfigurationReleasesPanel
            organizationId={organizationId}
            canManage={canManageReleases}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
