"use client";

import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  PackageCheck,
  RefreshCw,
  Rocket,
  RotateCcw,
  Settings2,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { ConfigurationReleaseRoutesDialog } from "@/components/features/kiosks/configuration-release-routes-dialog";
import { EdgeDeploymentArtifactsPanel } from "@/components/features/kiosks/edge-deployment-artifacts-panel";
import {
  createConfigurationReleaseRouteDrafts,
  validateConfigurationReleaseRouteDrafts,
} from "@/components/features/kiosks/configuration-release-routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useProductionOperations } from "@/hooks/use-production-operations";
import type {
  PackageInstallRequest,
  ConfigurationReleaseResult,
  ProductionPackageResult,
  RobotProgramResult,
} from "@/types/production-operations";

interface ProductionOperationsPanelProps {
  organizationId: string;
  storeId: string;
  kioskId: string;
  canManagePrograms: boolean;
  canManageReleases: boolean;
  canForkPackages: boolean;
  canInstallPackages: boolean;
  canDeploy: boolean;
  canRollback: boolean;
}

const statusLabels: Record<string, string> = {
  Draft: "Bản nháp",
  Published: "Đã phát hành",
  Retired: "Đã ngừng sử dụng",
  Pending: "Đang chờ",
  Materializing: "Đang chuẩn bị dữ liệu",
  Installed: "Đã cài đặt",
  Failed: "Thất bại",
  Superseded: "Đã được thay thế",
  Abandoned: "Đã hủy",
  ReadyForReview: "Chờ duyệt chuyển đổi",
  Completed: "Đã hoàn tất",
  RollbackPending: "Đang khôi phục phiên bản trước",
  RolledBack: "Đã khôi phục phiên bản trước",
  Active: "Đã kích hoạt",
};

const profileLabels: Record<string, string> = {
  FullEdge: "Bộ điều khiển đầy đủ",
  LowCostController: "Bộ điều khiển giới hạn",
};

const readinessLabels: Record<string, string> = {
  Ready: "Sẵn sàng",
  Low: "Sắp hết",
  Empty: "Đã hết",
  Unknown: "Chưa xác định",
  NotReady: "Chưa sẵn sàng",
};

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "Failed"
      ? "destructive"
      : status === "Active" ||
          status === "Installed" ||
          status === "Published" ||
          status === "Completed"
        ? "default"
        : "outline";
  return <Badge variant={variant}>{statusLabels[status] ?? status}</Badge>;
}

function EmptyState({ children }: { children: string }) {
  return (
    <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function ProgramDialog({
  open,
  program,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  program?: RobotProgramResult | null;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (request: {
    code: string;
    name: string;
    description?: string | null;
  }) => Promise<unknown>;
}) {
  const [code, setCode] = useState(program?.code ?? "");
  const [name, setName] = useState(program?.name ?? "");
  const [description, setDescription] = useState(program?.description ?? "");
  const [validation, setValidation] = useState<string | null>(null);

  const submit = async () => {
    if (
      code.trim().length === 0 ||
      code.trim().length > 100 ||
      name.trim().length === 0 ||
      name.trim().length > 200
    ) {
      setValidation(
        "Mã và tên là bắt buộc; mã tối đa 100 ký tự, tên tối đa 200 ký tự.",
      );
      return;
    }
    if (description.trim().length > 500) {
      setValidation("Mô tả không được vượt quá 500 ký tự.");
      return;
    }
    const result = await onSubmit({
      code: code.trim(),
      name: name.trim(),
      description: description.trim() || null,
    });
    if (result) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {program
              ? "Chỉnh sửa chương trình robot"
              : "Tạo chương trình robot"}
          </DialogTitle>
          <DialogDescription>
            Chỉ quản lý thông tin mô tả và vòng đời trong phạm vi kiosk. Tệp
            chương trình kỹ thuật được quản lý ở quy trình riêng.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="program-code">Mã chương trình</Label>
            <Input
              id="program-code"
              value={code}
              maxLength={100}
              disabled={isSubmitting}
              onChange={(event) => setCode(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="program-name">Tên chương trình</Label>
            <Input
              id="program-name"
              value={name}
              maxLength={200}
              disabled={isSubmitting}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="program-description">Mô tả</Label>
            <Input
              id="program-description"
              value={description}
              maxLength={500}
              disabled={isSubmitting}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          {validation || errorMessage ? (
            <p className="text-sm text-destructive" role="alert">
              {validation || errorMessage}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button onClick={() => void submit()} disabled={isSubmitting}>
            {isSubmitting
              ? "Đang lưu..."
              : program
                ? "Lưu thay đổi"
                : "Tạo bản nháp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InstallDialog({
  open,
  packages,
  isSubmitting,
  preview,
  errorMessage,
  storeId,
  kioskId,
  onOpenChange,
  onPreview,
  onInstall,
}: {
  open: boolean;
  packages: ProductionPackageResult[];
  isSubmitting: boolean;
  preview: ReturnType<typeof useProductionOperations>["installationPreview"];
  errorMessage?: string | null;
  storeId: string;
  kioskId: string;
  onOpenChange: (open: boolean) => void;
  onPreview: (request: PackageInstallRequest) => Promise<unknown>;
  onInstall: (request: PackageInstallRequest) => Promise<unknown>;
}) {
  const choices = useMemo(
    () =>
      packages.flatMap((item) =>
        item.versions
          .filter((version) => version.status === "Published")
          .map((version) => ({ package: item, version })),
      ),
    [packages],
  );
  const [selected, setSelected] = useState(
    choices[0] ? `${choices[0].package.id}:${choices[0].version.id}` : "",
  );
  const current = choices.find(
    (item) => `${item.package.id}:${item.version.id}` === selected,
  );
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    current?.version.products.map((item) => item.sourceKey) ?? [],
  );
  const request = current
    ? {
        packageId: current.package.id,
        packageVersionId: current.version.id,
        storeId,
        kioskId,
        productSourceKeys: selectedProducts,
      }
    : null;
  const previewMatchesRequest = Boolean(
    request &&
    preview?.packageVersionId === request.packageVersionId &&
    [...preview.productSourceKeys].sort().join("|") ===
      [...request.productSourceKeys].sort().join("|"),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cài gói sản xuất</DialogTitle>
          <DialogDescription>
            Xem trước tài nguyên sẽ được tạo trước khi cài đặt. Yêu cầu trùng
            lặp được hệ thống kiểm soát và không gửi lệnh trực tiếp tới robot.
          </DialogDescription>
        </DialogHeader>
        {choices.length === 0 ? (
          <EmptyState>
            Chưa có phiên bản gói đã phát hành trong phạm vi này.
          </EmptyState>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Gói và phiên bản</Label>
              <Select
                value={selected}
                onValueChange={(value) => {
                  setSelected(value ?? "");
                  const next = choices.find(
                    (item) => `${item.package.id}:${item.version.id}` === value,
                  );
                  setSelectedProducts(
                    next?.version.products.map((item) => item.sourceKey) ?? [],
                  );
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {current
                      ? `${current.package.name} — phiên bản ${current.version.version}`
                      : "Chọn gói"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {choices.map((item) => (
                    <SelectItem
                      key={item.version.id}
                      value={`${item.package.id}:${item.version.id}`}
                    >
                      {item.package.name} — phiên bản {item.version.version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sản phẩm sẽ cài</Label>
              {current?.version.products.map((product) => (
                <label
                  key={product.sourceKey}
                  className="flex items-start gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selectedProducts.includes(product.sourceKey)}
                    onChange={(event) =>
                      setSelectedProducts((items) =>
                        event.target.checked
                          ? [...items, product.sourceKey]
                          : items.filter((key) => key !== product.sourceKey),
                      )
                    }
                  />
                  <span>
                    <span className="font-medium">{product.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {product.code}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            {preview ? (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="font-medium">Bản xem trước hợp lệ</p>
                <p className="mt-1 text-muted-foreground">
                  {preview.productSourceKeys.length} sản phẩm,{" "}
                  {preview.programBlueprintCodes.length} chương trình,{" "}
                  {preview.routeCodes.length} tuyến thực thi.
                </p>
                {preview.warnings.map((warning) => (
                  <p key={warning} className="mt-2 text-warning">
                    {warning}
                  </p>
                ))}
              </div>
            ) : null}
            {errorMessage ? (
              <p className="text-sm text-destructive" role="alert">
                {errorMessage}
              </p>
            ) : null}
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            variant="outline"
            disabled={!request || selectedProducts.length === 0 || isSubmitting}
            onClick={() => request && void onPreview(request)}
          >
            Xem trước
          </Button>
          <Button
            disabled={!request || !previewMatchesRequest || isSubmitting}
            onClick={async () => {
              if (request && (await onInstall(request))) onOpenChange(false);
            }}
          >
            {isSubmitting ? "Đang cài..." : "Xác nhận cài"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProductionOperationsPanel(
  props: ProductionOperationsPanelProps,
) {
  const state = useProductionOperations({
    organizationId: props.organizationId,
    storeId: props.storeId,
    kioskId: props.kioskId,
  });
  const [programDialog, setProgramDialog] = useState<{
    open: boolean;
    program?: RobotProgramResult | null;
  }>({ open: false });
  const [releaseRoutesDialog, setReleaseRoutesDialog] =
    useState<ConfigurationReleaseResult | null>(null);
  const [releasePublishDialog, setReleasePublishDialog] =
    useState<ConfigurationReleaseResult | null>(null);
  const releaseEditorRequestRef = useRef(0);
  const [installOpen, setInstallOpen] = useState(false);
  const [selectedInstallationId, setSelectedInstallationId] = useState<
    string | null
  >(null);
  const [selectedReleaseId, setSelectedReleaseId] = useState<string>("");
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>("");
  const [acknowledgeRisk, setAcknowledgeRisk] = useState(false);
  const [deploymentReason, setDeploymentReason] = useState("");
  const [reason, setReason] = useState("");
  const [upgradeTarget, setUpgradeTarget] = useState<string>("");

  const selectedInstallation = state.installations.find(
    (item) => item.id === selectedInstallationId,
  );
  const workspace = selectedInstallationId
    ? state.workspaces[selectedInstallationId]
    : undefined;
  const installationUpgrades = selectedInstallationId
    ? (state.upgrades[selectedInstallationId] ?? [])
    : [];
  const selectedRelease = state.releases.find(
    (item) => item.id === selectedReleaseId,
  );
  const eligibleEndpoint = state.deploymentPreview?.endpoints.find(
    (item) => item.kioskExecutionEndpointId === selectedEndpointId,
  );
  const upgradeChoices = useMemo(
    () =>
      state.packages.flatMap((item) =>
        item.versions
          .filter(
            (version) =>
              version.status === "Published" &&
              version.id !== selectedInstallation?.packageVersionId,
          )
          .map((version) => ({ packageName: item.name, version })),
      ),
    [selectedInstallation?.packageVersionId, state.packages],
  );

  const openReleaseRoutesEditor = async (releaseId: string) => {
    const requestId = ++releaseEditorRequestRef.current;
    const [detail] = await Promise.all([
      state.loadReleaseForAuthoring(releaseId),
      state.loadReleaseAuthoringOptions(),
    ]);
    if (requestId === releaseEditorRequestRef.current && detail) {
      setReleaseRoutesDialog(detail);
    }
  };

  const openReleasePublishReview = async (releaseId: string) => {
    const requestId = ++releaseEditorRequestRef.current;
    const detail = await state.loadReleaseForAuthoring(releaseId);
    if (requestId === releaseEditorRequestRef.current && detail) {
      setReleasePublishDialog(detail);
    }
  };

  if (state.isLoading)
    return (
      <div className="rounded-lg border p-5 text-sm text-muted-foreground">
        Đang tải vận hành cấu hình sản xuất...
      </div>
    );

  return (
    <section className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-semibold">
            <Settings2 className="size-4" />
            Cấu hình sản xuất
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi chương trình, gói sản xuất và các lần triển khai của kiosk.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void state.refresh()}
          disabled={state.isLoading || state.isMutating}
        >
          <RefreshCw className="size-4" />
          Làm mới
        </Button>
      </div>

      {state.warnings.map((warning) => (
        <div
          key={warning}
          className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {warning}
        </div>
      ))}
      {state.mutationError ? (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {state.mutationError}
        </p>
      ) : null}

      <Tabs defaultValue="programs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto">
          <TabsTrigger value="programs">Chương trình</TabsTrigger>
          <TabsTrigger value="packages">Gói sản xuất</TabsTrigger>
          <TabsTrigger value="deployments">Triển khai</TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="font-medium">Chương trình robot</h4>
              <p className="text-xs text-muted-foreground">
                Quản lý thông tin mô tả và vòng đời; tệp chương trình kỹ thuật
                thuộc quy trình riêng.
              </p>
            </div>
            {props.canManagePrograms ? (
              <Button
                size="sm"
                onClick={() => setProgramDialog({ open: true })}
              >
                <Bot className="size-4" />
                Tạo chương trình
              </Button>
            ) : null}
          </div>
          {state.programs.length === 0 ? (
            <EmptyState>Chưa có chương trình robot trong tổ chức.</EmptyState>
          ) : (
            <div className="divide-y rounded-lg border">
              {state.programs.map((program) => (
                <div
                  key={program.id}
                  className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{program.name}</p>
                      <StatusBadge status={program.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {program.code} · {program.artifacts.length} tệp chương
                      trình
                    </p>
                  </div>
                  {props.canManagePrograms ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={state.isMutating}
                        onClick={() =>
                          setProgramDialog({ open: true, program })
                        }
                      >
                        Chỉnh sửa
                      </Button>
                      {program.status === "Draft" ? (
                        <>
                          <Button
                            size="sm"
                            disabled={state.isMutating}
                            onClick={() =>
                              void state.changeProgramLifecycle(
                                program.id,
                                "publish",
                              )
                            }
                          >
                            Phát hành
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={state.isMutating}
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Xóa vĩnh viễn bản nháp chương trình này?",
                                )
                              )
                                void state.changeProgramLifecycle(
                                  program.id,
                                  "discard",
                                );
                            }}
                          >
                            Xóa bản nháp
                          </Button>
                        </>
                      ) : null}
                      {program.status === "Published" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={state.isMutating}
                          onClick={() => {
                            if (
                              window.confirm(
                                "Ngừng sử dụng chương trình robot này?",
                              )
                            )
                              void state.changeProgramLifecycle(
                                program.id,
                                "retire",
                              );
                          }}
                        >
                          Ngừng sử dụng
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="font-medium">Gói sản xuất tại kiosk</h4>
              <p className="text-xs text-muted-foreground">
                Cài đặt có bước xem trước; quản lý danh mục gói và tạo nhánh mới
                thuộc vai trò quản trị cao hơn.
              </p>
            </div>
            {props.canInstallPackages ? (
              <Button
                size="sm"
                disabled={state.isMutating}
                onClick={() => {
                  state.clearPreviews();
                  setInstallOpen(true);
                }}
              >
                <PackageCheck className="size-4" />
                Cài gói
              </Button>
            ) : null}
          </div>
          {state.installations.length === 0 ? (
            <EmptyState>
              Chưa có gói sản xuất được cài cho kiosk này.
            </EmptyState>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {state.installations.map((installation) => (
                <button
                  key={installation.id}
                  type="button"
                  className={`rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedInstallationId === installation.id ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}
                  onClick={() => {
                    setSelectedInstallationId(installation.id);
                    setUpgradeTarget("");
                    state.clearPreviews();
                    void state.loadWorkspace(installation.id);
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">Gói đã cài</span>
                    <StatusBadge status={installation.status} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {installation.materializations.length} tài nguyên đã
                    materialize
                  </p>
                  {installation.failureMessage ? (
                    <p className="mt-2 text-xs text-destructive">
                      {installation.failureMessage}
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
          )}

          {selectedInstallation ? (
            <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h5 className="font-medium">
                    {workspace?.packageName ?? "Chi tiết gói"}
                  </h5>
                  <p className="text-xs text-muted-foreground">
                    {workspace
                      ? `Phiên bản ${workspace.packageVersion} · ${workspace.packageCode}`
                      : "Đang tải chi tiết gói..."}
                  </p>
                </div>
                <div className="flex gap-2">
                  {props.canInstallPackages &&
                  selectedInstallation.status === "Failed" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={state.isMutating}
                        onClick={() =>
                          void state.recoverInstallation(
                            selectedInstallation.id,
                            "retry",
                          )
                        }
                      >
                        Thử lại
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={state.isMutating}
                        onClick={() =>
                          void state.recoverInstallation(
                            selectedInstallation.id,
                            "repair",
                          )
                        }
                      >
                        Sửa dữ liệu
                      </Button>
                    </>
                  ) : null}
                  {props.canForkPackages &&
                  selectedInstallation.status === "Installed" &&
                  selectedInstallation.ownershipMode === "PackageManaged" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={state.isMutating}
                      onClick={() => {
                        if (
                          window.confirm(
                            "Tách cấu hình package-managed thành bản sao kỹ thuật của tổ chức? Sau khi tách, package sẽ không còn quản lý các tài nguyên kỹ thuật này.",
                          )
                        )
                          void state.forkInstallation(selectedInstallation.id);
                      }}
                    >
                      Tách nhánh cấu hình
                    </Button>
                  ) : null}
                </div>
              </div>
              {workspace ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div
                    className={`rounded-lg border p-3 ${workspace.technicalReadiness.isReady ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"}`}
                  >
                    <p className="font-medium">Sẵn sàng kỹ thuật</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {workspace.technicalReadiness.isReady
                        ? "Đã đáp ứng các điều kiện kỹ thuật."
                        : `${workspace.technicalReadiness.blockers.length} điều kiện chưa đạt.`}
                    </p>
                  </div>
                  <div
                    className={`rounded-lg border p-3 ${workspace.commercialReadiness.isReady ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"}`}
                  >
                    <p className="font-medium">Sẵn sàng kinh doanh</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {workspace.commercialReadiness.isReady
                        ? "Sản phẩm và thực đơn đã sẵn sàng."
                        : `${workspace.commercialReadiness.blockers.length} điều kiện chưa đạt.`}
                    </p>
                  </div>
                </div>
              ) : null}
              {workspace &&
              [
                ...workspace.technicalReadiness.blockers,
                ...workspace.commercialReadiness.blockers,
              ].length > 0 ? (
                <div className="space-y-2">
                  {[
                    ...workspace.technicalReadiness.blockers,
                    ...workspace.commercialReadiness.blockers,
                  ].map((blocker, index) => (
                    <div
                      key={`${blocker.code}-${index}`}
                      className="flex gap-2 text-sm text-warning"
                    >
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                      <span>{blocker.message}</span>
                    </div>
                  ))}
                </div>
              ) : null}
              {props.canInstallPackages && upgradeChoices.length > 0 ? (
                <div className="space-y-3 border-t pt-4">
                  <h5 className="font-medium">Nâng cấp gói</h5>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Select
                      value={upgradeTarget}
                      onValueChange={(value) => {
                        setUpgradeTarget(value ?? "");
                        state.clearPreviews();
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {upgradeChoices.find(
                            (item) => item.version.id === upgradeTarget,
                          )
                            ? `${upgradeChoices.find((item) => item.version.id === upgradeTarget)?.packageName} — phiên bản ${upgradeChoices.find((item) => item.version.id === upgradeTarget)?.version.version}`
                            : "Chọn phiên bản đích"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {upgradeChoices.map((item) => (
                          <SelectItem
                            key={item.version.id}
                            value={item.version.id}
                          >
                            {item.packageName} — phiên bản{" "}
                            {item.version.version}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      disabled={!upgradeTarget || state.isMutating}
                      onClick={() => {
                        const version = upgradeChoices.find(
                          (item) => item.version.id === upgradeTarget,
                        )?.version;
                        if (version)
                          void state.previewUpgrade(
                            selectedInstallation.id,
                            version.id,
                            version.products.map((item) => item.sourceKey),
                          );
                      }}
                    >
                      Xem trước
                    </Button>
                    <Button
                      disabled={
                        !state.upgradePreview ||
                        state.upgradePreview.blockers.length > 0 ||
                        state.isMutating
                      }
                      onClick={() =>
                        state.upgradePreview &&
                        void state.startUpgrade(
                          selectedInstallation.id,
                          state.upgradePreview,
                        )
                      }
                    >
                      Bắt đầu nâng cấp
                    </Button>
                  </div>
                  {state.upgradePreview ? (
                    <div className="rounded-lg border p-3 text-sm">
                      <p>
                        {state.upgradePreview.changedProductSourceKeys.length}{" "}
                        sản phẩm thay đổi ·{" "}
                        {state.upgradePreview.affectedMenuItemCount} món bị ảnh
                        hưởng · {state.upgradePreview.requiredEndpointCount}{" "}
                        điểm thực thi
                      </p>
                      {state.upgradePreview.blockers.map((item) => (
                        <p key={item} className="mt-1 text-destructive">
                          {item}
                        </p>
                      ))}
                      {state.upgradePreview.warnings.map((item) => (
                        <p key={item} className="mt-1 text-warning">
                          {item}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {installationUpgrades.length > 0 ? (
                <div className="space-y-2 border-t pt-4">
                  <h5 className="font-medium">Lịch sử nâng cấp</h5>
                  {installationUpgrades.map((upgrade) => (
                    <div
                      key={upgrade.id}
                      className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <StatusBadge status={upgrade.status} />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {upgrade.menuChangeCount} thay đổi thực đơn ·{" "}
                          {upgrade.endpointTargetCount} điểm thực thi
                        </p>
                        {upgrade.failureMessage ? (
                          <p className="mt-1 text-xs text-destructive">
                            {upgrade.failureMessage}
                          </p>
                        ) : null}
                      </div>
                      {props.canInstallPackages ? (
                        <div className="flex flex-wrap gap-2">
                          {upgrade.status === "ReadyForReview" ? (
                            <Button
                              size="sm"
                              disabled={state.isMutating}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Xác nhận chuyển sang phiên bản gói mới?",
                                  )
                                )
                                  void state.changeUpgradeLifecycle(
                                    selectedInstallation.id,
                                    upgrade.id,
                                    "cutover",
                                  );
                              }}
                            >
                              Chuyển đổi
                            </Button>
                          ) : null}
                          {upgrade.status === "ReadyForReview" ||
                          upgrade.status === "Failed" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={
                                state.isMutating || reason.trim().length < 3
                              }
                              onClick={() =>
                                void state.changeUpgradeLifecycle(
                                  selectedInstallation.id,
                                  upgrade.id,
                                  "abandon",
                                  reason,
                                )
                              }
                            >
                              Hủy tiến trình
                            </Button>
                          ) : null}
                          {props.canRollback &&
                          (upgrade.status === "Completed" ||
                            upgrade.status === "RollbackPending") ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={
                                state.isMutating || reason.trim().length < 3
                              }
                              onClick={() =>
                                void state.changeUpgradeLifecycle(
                                  selectedInstallation.id,
                                  upgrade.id,
                                  "rollback",
                                  reason,
                                )
                              }
                            >
                              Rollback
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))}
                  <div className="space-y-1.5">
                    <Label htmlFor="upgrade-reason">Lý do hủy/rollback</Label>
                    <Input
                      id="upgrade-reason"
                      value={reason}
                      maxLength={500}
                      disabled={state.isMutating}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Nhập ít nhất 3 ký tự trước thao tác hủy hoặc rollback"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="deployments" className="space-y-4">
          <div>
            <h4 className="font-medium">Phát hành và triển khai</h4>
            <p className="text-xs text-muted-foreground">
              Bản phát hành đóng gói recipe, chương trình robot và capability
              trước khi triển khai tới kiosk.
            </p>
          </div>
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h5 className="font-medium">Bản phát hành cấu hình</h5>
                <p className="text-xs text-muted-foreground">
                  Chỉ bản đã phát hành mới có thể được kiểm tra và triển khai.
                </p>
              </div>
              {props.canManageReleases ? (
                <Button
                  size="sm"
                  disabled={state.isMutating}
                  onClick={() => void state.createRelease()}
                >
                  Tạo bản nháp
                </Button>
              ) : null}
            </div>
            {state.releases.length === 0 ? (
              <EmptyState>
                Chưa có bản phát hành cấu hình trong tổ chức.
              </EmptyState>
            ) : (
              <div className="divide-y rounded-lg border">
                {state.releases.map((release) => (
                  <div
                    key={release.id}
                    className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          Bản phát hành #{release.releaseNumber}
                        </span>
                        <StatusBadge status={release.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {release.routeCount} tuyến ·{" "}
                        {release.releaseChecksum
                          ? "Đã có checksum"
                          : "Chưa đóng gói"}
                      </p>
                    </div>
                    {props.canManageReleases ? (
                      <div className="flex flex-wrap gap-2">
                        {release.status === "Draft" ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={state.isMutating}
                              onClick={() =>
                                void openReleaseRoutesEditor(release.id)
                              }
                            >
                              Soạn tuyến
                            </Button>
                            <Button
                              size="sm"
                              disabled={
                                state.isMutating || release.routeCount === 0
                              }
                              onClick={() =>
                                void openReleasePublishReview(release.id)
                              }
                            >
                              Phát hành
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={state.isMutating}
                              onClick={() => {
                                if (
                                  window.confirm("Xóa bản nháp cấu hình này?")
                                )
                                  void state.changeReleaseLifecycle(
                                    release.id,
                                    "discard",
                                  );
                              }}
                            >
                              Xóa nháp
                            </Button>
                          </>
                        ) : null}
                        {release.status === "Published" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={state.isMutating}
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Ngừng sử dụng bản phát hành này cho các lần triển khai mới?",
                                )
                              )
                                void state.changeReleaseLifecycle(
                                  release.id,
                                  "retire",
                                );
                            }}
                          >
                            Ngừng sử dụng
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
          {props.canDeploy ? (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                  value={selectedReleaseId}
                  onValueChange={(value) => {
                    setSelectedReleaseId(value ?? "");
                    setSelectedEndpointId("");
                    setAcknowledgeRisk(false);
                    state.clearPreviews();
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {selectedRelease
                        ? `Bản phát hành #${selectedRelease.releaseNumber} · ${statusLabels[selectedRelease.status] ?? selectedRelease.status}`
                        : "Chọn bản phát hành"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {state.releases
                      .filter((release) => release.status === "Published")
                      .map((release) => (
                        <SelectItem key={release.id} value={release.id}>
                          Bản phát hành #{release.releaseNumber} ·{" "}
                          {release.routeCount} tuyến
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  disabled={!selectedReleaseId || state.isMutating}
                  onClick={() =>
                    void state.previewDeployment(selectedReleaseId)
                  }
                >
                  Kiểm tra triển khai
                </Button>
              </div>
              {state.deploymentPreview ? (
                <div className="space-y-3">
                  <div
                    className={`rounded-lg border p-3 ${state.inventoryReadiness?.isReady ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"}`}
                  >
                    <p className="font-medium">
                      Tồn kho:{" "}
                      {state.inventoryReadiness?.isReady
                        ? "Sẵn sàng"
                        : "Chưa sẵn sàng"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {readinessLabels[
                        state.inventoryReadiness?.overallStatus ?? ""
                      ] ?? "Không thể xác định"}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Điểm thực thi</Label>
                    <Select
                      value={selectedEndpointId}
                      onValueChange={(value) =>
                        setSelectedEndpointId(value ?? "")
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {eligibleEndpoint
                            ? `${eligibleEndpoint.endpointCode} — ${profileLabels[eligibleEndpoint.executionProfile] ?? eligibleEndpoint.executionProfile}`
                            : "Chọn điểm thực thi từ bản xem trước"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {state.deploymentPreview.endpoints.map((endpoint) => (
                          <SelectItem
                            key={endpoint.kioskExecutionEndpointId}
                            value={endpoint.kioskExecutionEndpointId}
                          >
                            {endpoint.endpointCode} —{" "}
                            {profileLabels[endpoint.executionProfile] ??
                              endpoint.executionProfile}{" "}
                            —{" "}
                            {endpoint.isEligible
                              ? "Đủ điều kiện"
                              : `${endpoint.blockers.length} điều kiện chưa đạt`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {eligibleEndpoint ? (
                    <div className="rounded-lg border p-3 text-sm">
                      <p>
                        {eligibleEndpoint.artifactCount} tệp thực thi ·{" "}
                        {(eligibleEndpoint.artifactStorageBytes / 1024).toFixed(
                          1,
                        )}{" "}
                        KB
                      </p>
                      {eligibleEndpoint.blockers.map((blocker) => (
                        <p
                          key={`${blocker.code}-${blocker.message}`}
                          className="mt-1 text-destructive"
                        >
                          {blocker.message}
                        </p>
                      ))}
                    </div>
                  ) : null}
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={acknowledgeRisk}
                      onChange={(event) =>
                        setAcknowledgeRisk(event.target.checked)
                      }
                    />
                    <span>
                      Tôi đã xem bản kiểm tra và xác nhận các rủi ro còn lại.
                    </span>
                  </label>
                  <Button
                    disabled={
                      !eligibleEndpoint?.isEligible ||
                      !acknowledgeRisk ||
                      deploymentReason.trim().length < 3 ||
                      state.isMutating
                    }
                    onClick={() => {
                      if (
                        state.deploymentPreview &&
                        eligibleEndpoint &&
                        window.confirm(
                          "Triển khai cấu hình đã chọn tới điểm thực thi này?",
                        )
                      )
                        void state.deploy(
                          state.deploymentPreview,
                          eligibleEndpoint.kioskExecutionEndpointId,
                          true,
                          deploymentReason,
                        );
                    }}
                  >
                    <Rocket className="size-4" />
                    Triển khai
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
          {props.canDeploy || props.canRollback ? (
            <div className="space-y-1.5">
              <Label htmlFor="deployment-reason">
                Lý do triển khai hoặc rollback
              </Label>
              <Input
                id="deployment-reason"
                value={deploymentReason}
                minLength={3}
                maxLength={500}
                disabled={state.isMutating}
                onChange={(event) => setDeploymentReason(event.target.value)}
                placeholder="Nhập từ 3 đến 500 ký tự để lưu nhật ký vận hành"
              />
            </div>
          ) : null}
          {state.deployments.length === 0 ? (
            <EmptyState>Chưa có lịch sử triển khai cho kiosk này.</EmptyState>
          ) : (
            <div className="divide-y rounded-lg border">
              {state.deployments.map((deployment) => {
                const isCurrentActive =
                  deployment.observedActiveDeploymentId === deployment.id;
                const canRollbackTarget = Boolean(
                  props.canRollback &&
                  deployment.status === "Active" &&
                  deployment.observedActiveDeploymentId &&
                  !isCurrentActive,
                );
                return (
                  <div
                    key={deployment.id}
                    className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          Bản phát hành #{deployment.releaseNumber}
                        </span>
                        <StatusBadge status={deployment.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {deployment.endpointCode} ·{" "}
                        {profileLabels[deployment.profile] ??
                          deployment.profile}{" "}
                        ·{" "}
                        {new Intl.DateTimeFormat("vi-VN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(deployment.requestedAt))}
                      </p>
                      {deployment.failureReason ? (
                        <p className="mt-1 text-xs text-destructive">
                          {deployment.failureReason}
                        </p>
                      ) : null}
                    </div>
                    {canRollbackTarget ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={
                          state.isMutating || deploymentReason.trim().length < 3
                        }
                        onClick={() => {
                          if (
                            deployment.observedActiveDeploymentId &&
                            window.confirm(
                              "Rollback về cấu hình của lần triển khai này?",
                            )
                          )
                            void state.rollbackDeployment(
                              deployment.id,
                              deployment.observedActiveDeploymentId,
                              deploymentReason,
                            );
                        }}
                      >
                        <RotateCcw className="size-4" />
                        Rollback
                      </Button>
                    ) : isCurrentActive ? (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle2 className="size-4" />
                        Đang kích hoạt
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
          <EdgeDeploymentArtifactsPanel
            kioskId={props.kioskId}
            deployments={state.deployments}
          />
        </TabsContent>
      </Tabs>

      {programDialog.open ? (
        <ProgramDialog
          open
          program={programDialog.program}
          isSubmitting={state.isMutating}
          errorMessage={state.mutationError}
          onOpenChange={(open) => setProgramDialog({ open })}
          onSubmit={(request) =>
            programDialog.program
              ? state.updateProgram(programDialog.program.id, request)
              : state.createProgram(request)
          }
        />
      ) : null}
      {installOpen ? (
        <InstallDialog
          open
          packages={state.packages}
          isSubmitting={state.isMutating}
          preview={state.installationPreview}
          errorMessage={state.mutationError}
          storeId={props.storeId}
          kioskId={props.kioskId}
          onOpenChange={setInstallOpen}
          onPreview={state.previewInstall}
          onInstall={state.installPackage}
        />
      ) : null}
      {releaseRoutesDialog ? (
        <ConfigurationReleaseRoutesDialog
          release={releaseRoutesDialog}
          options={state.releaseAuthoringOptions}
          isSubmitting={state.isMutating}
          errorMessage={state.mutationError}
          onOpenChange={(open) => {
            if (!open) {
              releaseEditorRequestRef.current += 1;
              setReleaseRoutesDialog(null);
            }
          }}
          onLoadOptions={state.loadReleaseAuthoringOptions}
          onSubmit={(routes) =>
            state.replaceReleaseRoutes(
              releaseRoutesDialog.id,
              releaseRoutesDialog.revision,
              routes,
            )
          }
        />
      ) : null}
      {releasePublishDialog ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open && !state.isMutating) setReleasePublishDialog(null);
          }}
        >
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Phát hành bản cấu hình #{releasePublishDialog.releaseNumber}
              </DialogTitle>
              <DialogDescription>
                Sau khi phát hành, danh sách tuyến trở thành bất biến. Kiểm tra
                phạm vi trước khi xác nhận.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Tuyến sản xuất</p>
                <p className="mt-1 text-xl font-semibold">
                  {releasePublishDialog.routes.length}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">
                  Liên kết thực thi
                </p>
                <p className="mt-1 text-xl font-semibold">
                  {releasePublishDialog.routes.reduce(
                    (total, route) => total + route.robotBindings.length,
                    0,
                  )}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">
                  Tùy chọn được hỗ trợ
                </p>
                <p className="mt-1 text-xl font-semibold">
                  {releasePublishDialog.routes.reduce(
                    (total, route) => total + route.supportedOptionCodes.length,
                    0,
                  )}
                </p>
              </div>
            </div>
            <div className="max-h-56 divide-y overflow-y-auto rounded-md border">
              {releasePublishDialog.routes.map((route) => (
                <div key={route.id} className="p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{route.routeCode}</span>
                    <Badge variant="outline">Ưu tiên {route.priority}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {route.productVariantCode ?? "Phiên bản chưa xác định"} ·{" "}
                    {route.recipeCode ?? "Recipe chưa xác định"} ·{" "}
                    {route.robotBindings.length} liên kết
                  </p>
                </div>
              ))}
            </div>
            {validateConfigurationReleaseRouteDrafts(
              createConfigurationReleaseRouteDrafts(releasePublishDialog),
            ) ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {validateConfigurationReleaseRouteDrafts(
                  createConfigurationReleaseRouteDrafts(releasePublishDialog),
                )}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                variant="outline"
                disabled={state.isMutating}
                onClick={() => setReleasePublishDialog(null)}
              >
                Hủy
              </Button>
              <Button
                disabled={
                  state.isMutating ||
                  Boolean(
                    validateConfigurationReleaseRouteDrafts(
                      createConfigurationReleaseRouteDrafts(
                        releasePublishDialog,
                      ),
                    ),
                  )
                }
                onClick={async () => {
                  const result = await state.changeReleaseLifecycle(
                    releasePublishDialog.id,
                    "publish",
                  );
                  if (result) setReleasePublishDialog(null);
                }}
              >
                {state.isMutating ? "Đang phát hành..." : "Xác nhận phát hành"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </section>
  );
}
