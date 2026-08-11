"use client";

import {
  ChevronLeft,
  ChevronRight,
  Factory,
  RefreshCw,
  Search,
} from "lucide-react";
import { useState } from "react";

import { RobotAuthoringImportsPanel } from "@/components/features/production/authoring-imports/robot-authoring-imports-panel";
import { ProductionProgramBindingsPanel } from "@/components/features/production/bindings/production-program-bindings-panel";
import { ConfigurationReleasesPanel } from "@/components/features/production/releases/configuration-releases-panel";
import { ProductionWorkflowStepper } from "@/components/features/production/production-workflow-stepper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/identity/use-auth";
import { useProductionOrganizationScope } from "@/hooks/production/use-production-organization-scope";
import { hasScopedPermission } from "@/lib/rbac";

function organizationLabel(name: string, code: string) {
  return name ? `${name} — ${code}` : code || "Không xác định";
}

function ProductionOrganizationSelector({
  scope,
}: {
  scope: ReturnType<typeof useProductionOrganizationScope>;
}) {
  const selected = scope.selectedOrganization;
  const options =
    selected &&
    !scope.organizations.some((organization) => organization.id === selected.id)
      ? [selected, ...scope.organizations]
      : scope.organizations;
  const selectedLabel = selected
    ? organizationLabel(selected.name, selected.code)
    : "";

  if (!scope.isLoading && scope.pagination.totalCount === 1 && selected) {
    return (
      <div className="space-y-1.5">
        <Label>Tổ chức đang cấu hình</Label>
        <p className="max-w-xl rounded-md border bg-muted/30 px-3 py-2 text-sm">
          {selectedLabel}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid max-w-xl gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="production-organization-search">Tìm tổ chức</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="production-organization-search"
              value={scope.search}
              className="h-10 pl-9"
              placeholder="Tên hoặc mã tổ chức"
              disabled={scope.isLoading}
              onChange={(event) => scope.setSearch(event.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="production-organization-select">
            Tổ chức đang cấu hình
          </Label>
          <Select
            value={selected?.id ?? ""}
            disabled={scope.isLoading || options.length === 0}
            onValueChange={(value) => {
              const organization = options.find((item) => item.id === value);
              if (!organization) return;
              scope.selectOrganization(organization);
              scope.setSearch("");
            }}
          >
            <SelectTrigger
              id="production-organization-select"
              className="h-10 w-full"
            >
              <SelectValue placeholder="Chọn tổ chức">
                {selected ? selectedLabel : "Chọn tổ chức"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
              {options.map((organization) => (
                <SelectItem key={organization.id} value={organization.id}>
                  {organizationLabel(organization.name, organization.code)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground sm:max-w-xl">
        <span>
          Trang {scope.pagination.page} /{" "}
          {Math.max(scope.pagination.totalPages, 1)} ·{" "}
          {scope.pagination.totalCount} tổ chức
        </span>
        <div className="flex gap-2">
          <Button
            size="xs"
            variant="outline"
            disabled={scope.isLoading || !scope.pagination.hasPrevious}
            onClick={() => scope.setPageNumber(scope.pagination.page - 1)}
          >
            <ChevronLeft className="size-3.5" /> Trước
          </Button>
          <Button
            size="xs"
            variant="outline"
            disabled={scope.isLoading || !scope.pagination.hasNext}
            onClick={() => scope.setPageNumber(scope.pagination.page + 1)}
          >
            Sau <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProductionWorkspaceView() {
  const { effectiveAccess } = useAuth();
  const scope = useProductionOrganizationScope();
  const [activeStage, setActiveStage] = useState("programs");
  const selected = scope.selectedOrganization;
  const organizationScope = selected
    ? { organizationId: selected.id, storeId: null, kioskId: null }
    : null;
  const canRead = organizationScope
    ? hasScopedPermission(effectiveAccess, "program.read", organizationScope)
    : false;
  const canUpload = organizationScope
    ? hasScopedPermission(effectiveAccess, "artifact.upload", organizationScope)
    : false;
  const canManagePrograms = organizationScope
    ? hasScopedPermission(effectiveAccess, "program.manage", organizationScope)
    : false;
  const canManageReleases = organizationScope
    ? hasScopedPermission(effectiveAccess, "release.publish", organizationScope)
    : false;
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <Factory className="size-5" />
          </span>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Cấu hình sản xuất
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Nhập chương trình Fairino, xác nhận liên kết Recipe và phát hành
              tài nguyên robot.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          disabled={scope.isLoading}
          onClick={() => void scope.refresh()}
        >
          <RefreshCw className="size-4" /> Làm mới
        </Button>
      </section>

      {!selected ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <ProductionWorkflowStepper
              currentStep={1}
              completedSteps={[]}
              organizationName={null}
            />
          </div>
          <Card className="border-border/80 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Chọn tổ chức</CardTitle>
              <CardDescription>
                Tìm trong phạm vi backend đã ủy quyền. Danh sách được phân
                trang, không giới hạn ở 100 tổ chức đầu tiên.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ProductionOrganizationSelector scope={scope} />
              {scope.errorMessage ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {scope.errorMessage}
                </div>
              ) : null}
              {!scope.isLoading &&
              !scope.errorMessage &&
              scope.organizations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Tài khoản hiện tại chưa có tổ chức nào trong phạm vi cấu hình
                  sản xuất.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {selected ? (
        <div className="space-y-5">
          <Card className="border-border/80 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Tổ chức đang cấu hình</CardTitle>
              <CardDescription>
                Đổi tổ chức sẽ tải workspace theo đúng scope được cấp quyền.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductionOrganizationSelector scope={scope} />
            </CardContent>
          </Card>
          {canRead ? (
            <Tabs
              value={activeStage}
              onValueChange={(value) => setActiveStage(value ?? "programs")}
            >
              <TabsList
                variant="line"
                aria-label="Các giai đoạn cấu hình sản xuất"
              >
                <TabsTrigger value="programs">1. Robot Programs</TabsTrigger>
                <TabsTrigger value="bindings">
                  2. Bind Configuration
                </TabsTrigger>
                <TabsTrigger value="releases">
                  3. Phát hành cấu hình
                </TabsTrigger>
              </TabsList>
              <TabsContent value="programs" className="pt-4">
                <RobotAuthoringImportsPanel
                  key={selected.id}
                  organizationId={selected.id}
                  organizationName={organizationLabel(
                    selected.name,
                    selected.code,
                  )}
                  canRead={canRead}
                  canUpload={canUpload}
                  canManagePrograms={canManagePrograms}
                  onOpenBindings={() => setActiveStage("bindings")}
                  mode="programs"
                />
              </TabsContent>
              <TabsContent value="bindings" className="space-y-6 pt-4">
                <ProductionProgramBindingsPanel
                  organizationId={selected.id}
                  canManage={canManageReleases}
                />
              </TabsContent>
              <TabsContent value="releases" className="pt-4">
                <ConfigurationReleasesPanel
                  organizationId={selected.id}
                  canManage={canManageReleases}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="rounded-lg border border-dashed px-5 py-10 text-center text-sm text-muted-foreground">
              Bạn không có quyền xem cấu hình sản xuất của tổ chức đã chọn.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
