"use client";

import {
  ChevronLeft,
  ChevronRight,
  FileArchive,
  FileCode2,
  LoaderCircle,
  RefreshCw,
  Rocket,
  Search,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { RobotAuthoringBundleUpload } from "@/components/features/production/authoring-imports/robot-authoring-bundle-upload";
import { ProductionAwareProgramOrderPanel } from "@/components/features/production/programs/production-aware-program-order-panel";
import { RawLuaProgramImportPanel } from "@/components/features/production/programs/raw-lua-program-import-panel";
import {
  ProductionWorkflowStepper,
  type ProductionWorkflowStep,
} from "@/components/features/production/production-workflow-stepper";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRobotAuthoringImports } from "@/hooks/use-robot-authoring-imports";
import type {
  RobotAuthoringCompositionPreview,
  RobotAuthoringImportStatus,
} from "@/types/production-operations";

interface RobotAuthoringImportsPanelProps {
  organizationId: string;
  organizationName?: string;
  canRead: boolean;
  canUpload: boolean;
  canManagePrograms: boolean;
  mode?: "programs" | "bindings";
}

const STATUS_LABELS: Record<RobotAuthoringImportStatus, string> = {
  Uploaded: "Đã tải lên",
  Validated: "Đã kiểm tra",
  Materialized: "Đã tạo tài nguyên",
  ResourcesPublished: "Đã phát hành tài nguyên",
  Failed: "Cần xử lý",
  Discarded: "Đã hủy",
};

const ACTION_LABELS: Record<string, string> = {
  ValidateImport: "Kiểm tra bundle",
  MaterializeImport: "Tạo tài nguyên",
  PublishImportResources: "Phát hành tài nguyên",
  DiscardImport: "Hủy import",
  PreviewSemanticComposition: "Xem trước cấu thành",
  ReviewTechnicalContracts: "Rà soát hợp đồng kỹ thuật",
  CreateConfigurationReleaseDraft: "Tạo bản nháp cấu hình",
  ReviewConfigurationReleaseDraft: "Xem bản nháp cấu hình",
  PublishConfigurationRelease: "Phát hành bản cấu hình",
  SelectDeploymentKiosk: "Chọn kiosk triển khai",
  SelectExecutionEndpoint: "Chọn điểm thực thi",
  ConfirmDeployment: "Xác nhận triển khai",
  ResolveDeploymentBlockers: "Xử lý điều kiện chưa đạt",
  ResolveArtifactRevisionConflict: "Xử lý xung đột phiên bản artifact",
  ResolvePublishedCompositionGap:
    "Tạo import mới để xác nhận Recipe trước khi phát hành",
};

const NON_AUTHORING_ACTIONS = new Set([
  "CreateConfigurationReleaseDraft",
  "ReviewConfigurationReleaseDraft",
  "PublishConfigurationRelease",
  "SelectDeploymentKiosk",
  "SelectExecutionEndpoint",
  "ConfirmDeployment",
  "ResolveDeploymentBlockers",
  "ResolveArtifactRevisionConflict",
]);

function ImportStatusBadge({ status }: { status: RobotAuthoringImportStatus }) {
  const variant =
    status === "Failed"
      ? "destructive"
      : status === "ResourcesPublished"
        ? "default"
        : "outline";
  return <Badge variant={variant}>{STATUS_LABELS[status]}</Badge>;
}

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function CompositionPreviewDetails({
  preview,
}: {
  preview: RobotAuthoringCompositionPreview;
}) {
  return (
    <div className="space-y-3 rounded-lg border p-4 text-sm">
      <div>
        <p className="font-semibold">Kết quả cấu thành được đề xuất</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Backend xác định artifact nào đáp ứng từng yêu cầu Recipe. Hãy review
          trước khi xác nhận; không có Product hoặc Variant nào được tự gán trên
          giao diện.
        </p>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[560px] text-left text-xs">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Yêu cầu</th>
              <th className="px-3 py-2 font-medium">Trạng thái</th>
              <th className="px-3 py-2 font-medium">Artifact có thể đáp ứng</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {preview.requirements.map((requirement) => (
              <tr key={`${requirement.kind}-${requirement.code}`}>
                <td className="px-3 py-2">
                  <p className="font-medium text-foreground">
                    {requirement.ingredientCode ??
                      requirement.optionCode ??
                      requirement.code}
                  </p>
                  <p className="text-muted-foreground">
                    {requirement.kind}
                    {requirement.quantity != null
                      ? ` · ${requirement.quantity} ${requirement.unit ?? ""}`
                      : ""}
                  </p>
                </td>
                <td className="px-3 py-2">{requirement.status}</td>
                <td className="px-3 py-2 font-mono text-muted-foreground">
                  {requirement.candidateArtifactCodes.join(", ") || "Chưa có"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[560px] text-left text-xs">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Thứ tự chạy</th>
              <th className="px-3 py-2 font-medium">Artifact</th>
              <th className="px-3 py-2 font-medium">Điều kiện tùy chọn</th>
              <th className="px-3 py-2 font-medium">Effect khai báo</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {preview.proposedArtifacts.map((artifact) => (
              <tr key={artifact.robotArtifactId}>
                <td className="px-3 py-2 font-mono">{artifact.runOrder}</td>
                <td className="px-3 py-2 font-mono">{artifact.artifactCode}</td>
                <td className="px-3 py-2">
                  {artifact.requiredOptionCode ?? "Luôn chạy"}
                </td>
                <td className="px-3 py-2 font-mono text-muted-foreground">
                  {artifact.effectCodes.join(", ") || "Chưa khai báo"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RobotAuthoringImportsPanel(
  props: RobotAuthoringImportsPanelProps,
) {
  const state = useRobotAuthoringImports(props.organizationId);
  const [importMode, setImportMode] = useState<"production-aware" | "opaque">(
    "production-aware",
  );
  const [recipeId, setRecipeId] = useState("");
  const selected = state.selectedImport;
  const availableActions = useMemo(
    () =>
      new Set(
        [
          ...(selected?.nextActions ?? []),
          ...(state.workspace?.actions.map((action) => action.code) ?? []),
        ].filter((action) => !NON_AUTHORING_ACTIONS.has(action)),
      ),
    [selected?.nextActions, state.workspace?.actions],
  );
  const recipes = state.authoringOptions?.recipes ?? [];
  const currentRecipe = recipes.find((recipe) => recipe.id === recipeId);
  const preview = state.compositionPreview;
  const canAuthorImport = props.canUpload && props.canManagePrograms;
  const showPrograms = props.mode !== "bindings";
  const showBindings = props.mode !== "programs";
  const selectedOptionCodes = selected?.composedOptionCodes ?? [];
  const hasAction = (action: string) => availableActions.has(action);
  const hasMaterializedProgram = Boolean(selected?.materializedRobotProgramId);
  const hasConfirmedComposition = Boolean(selected?.composedRecipeId);
  const hasPublishedResources = Boolean(selected?.publishedAt);
  const publishedBeforeComposition =
    hasPublishedResources && !hasConfirmedComposition;
  const completedSteps: ProductionWorkflowStep[] = selected
    ? [
        ...(hasMaterializedProgram ? [1 as const] : []),
        ...(hasConfirmedComposition ? [2 as const] : []),
        ...(hasPublishedResources && hasConfirmedComposition
          ? [3 as const]
          : []),
      ]
    : [];
  const currentStep: ProductionWorkflowStep | null = !selected
    ? 1
    : !hasMaterializedProgram
      ? 1
      : !hasConfirmedComposition
        ? 2
        : !hasPublishedResources
          ? 3
          : null;

  useEffect(() => {
    const resolution = state.workspace?.recipeResolution;
    if (!(
      !selected?.composedRecipeId &&
      !recipeId &&
      resolution?.status === "SingleMatch"
    ))
      return;

    const timeoutId = window.setTimeout(() => {
      setRecipeId(resolution.candidates[0]?.recipeId ?? "");
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [recipeId, selected?.composedRecipeId, state.workspace?.recipeResolution]);

  if (!props.canRead) return null;

  const selectImport = async (importId: string) => {
    const detail = await state.selectImport(importId);
    if (!detail) return;
    setRecipeId(detail.composedRecipeId ?? "");
    void state.loadAuthoringOptions();
    if (detail.composedRecipeId)
      void state.previewComposition(
        detail.composedRecipeId,
        detail.composedOptionCodes ?? [],
      );
  };

  const upload = async (file: File) => {
    const result = await state.upload({ bundle: file });
    if (!result) return false;
    await selectImport(result.id);
    return true;
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <ProductionWorkflowStepper
          currentStep={currentStep}
          completedSteps={completedSteps}
          organizationName={props.organizationName ?? "Tổ chức hiện tại"}
          workflow="authoring"
        />
      </div>

      <section
        className="min-w-0 space-y-5"
        aria-label="Workspace cấu hình sản xuất"
      >
        {showPrograms ? <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold">
                {importMode === "production-aware" ? (
                  <FileArchive className="size-4 text-primary" />
                ) : (
                  <FileCode2 className="size-4 text-primary" />
                )}
                {importMode === "production-aware"
                  ? "Nhập Production-aware Lua"
                  : "Nhập Opaque technical Lua"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {importMode === "production-aware"
                  ? "Bundle chuẩn có manifest và sidecar contract để kiểm tra composition với Recipe."
                  : "Dùng cho Lua legacy hoặc file lẻ; artifact tạo ở Draft và technical contract được author sau."}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={state.isLoading || state.isMutating}
              onClick={() => void state.refresh()}
            >
              <RefreshCw className="size-4" />
              Làm mới
            </Button>
          </div>
          <div
            className="mt-4 inline-flex rounded-md border p-1"
            role="group"
            aria-label="Lua import mode"
          >
            <Button
              type="button"
              size="sm"
              variant={
                importMode === "production-aware" ? "secondary" : "ghost"
              }
              className="gap-2"
              title="Bundle có production semantics và sidecar contract"
              aria-pressed={importMode === "production-aware"}
              onClick={() => setImportMode("production-aware")}
            >
              <FileArchive className="size-4" />
              Production-aware
            </Button>
            <Button
              type="button"
              size="sm"
              variant={importMode === "opaque" ? "secondary" : "ghost"}
              className="gap-2"
              title="Lua raw tạo Draft artifact, chưa có production semantics"
              aria-pressed={importMode === "opaque"}
              onClick={() => setImportMode("opaque")}
            >
              <FileCode2 className="size-4" />
              Opaque technical
            </Button>
          </div>
          <div className="mt-4">
            {importMode === "production-aware" ? (
              <RobotAuthoringBundleUpload
                canUpload={props.canUpload}
                disabled={state.isMutating}
                isUploading={state.isMutating}
                onUpload={upload}
              />
            ) : (
              <RawLuaProgramImportPanel
                organizationId={props.organizationId}
                canManage={canAuthorImport}
                embedded
              />
            )}
          </div>
        </div> : null}

        {state.refreshWarning ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
            <span>{state.refreshWarning}</span>
            <Button
              size="sm"
              variant="outline"
              disabled={state.isLoading}
              onClick={() => void state.refresh()}
            >
              Tải lại danh sách
            </Button>
          </div>
        ) : null}
        {state.errorMessage ? (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <XCircle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p>{state.errorMessage}</p>
              <Button
                className="mt-2"
                size="sm"
                variant="outline"
                onClick={() => void state.refresh()}
              >
                Thử lại
              </Button>
            </div>
          </div>
        ) : null}

        <div className="rounded-lg border bg-card">
          <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold">Danh sách gói đã nhập</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {state.pagination.totalCount} gói khớp bộ lọc hiện tại.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_210px] lg:w-[560px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={state.query.search ?? ""}
                  className="pl-9"
                  placeholder="Tìm chương trình, target hoặc machine model"
                  onChange={(event) => state.setSearch(event.target.value)}
                />
              </div>
              <Select
                value={state.query.status ?? "ALL"}
                onValueChange={(value) =>
                  state.setStatus(
                    (value ?? "ALL") as RobotAuthoringImportStatus | "ALL",
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {state.query.status === "ALL" || !state.query.status
                      ? "Tất cả trạng thái"
                      : STATUS_LABELS[state.query.status]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {state.isLoading ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              Đang tải gói cấu hình...
            </div>
          ) : state.items.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <FileArchive className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">Chưa có gói cấu hình nào</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Nhập bundle Fairino đầu tiên để bắt đầu kiểm tra nội dung.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Chương trình</th>
                    <th className="px-4 py-3 font-medium">Target / model</th>
                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                    <th className="px-4 py-3 font-medium">Cập nhật</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {state.items.map((item) => (
                    <tr key={item.id} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-medium">
                          {item.proposedProgramName}
                        </p>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          {item.proposedProgramCode} · {item.itemCount} mục
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <p>{item.runtimeTargetCode}</p>
                        <p className="mt-1 font-mono text-xs">
                          {item.machineModelCode}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <ImportStatusBadge status={item.status} />
                        {item.failureMessage ? (
                          <p className="mt-2 max-w-64 text-xs text-destructive">
                            {item.failureMessage}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(
                          item.publishedAt ??
                            item.materializedAt ??
                            item.validatedAt ??
                            item.createdAt,
                        )}
                        {item.createdByDisplayName ? (
                          <p className="mt-1">{item.createdByDisplayName}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void selectImport(item.id)}
                        >
                          Xem trước
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-sm">
            <p className="text-muted-foreground">
              Trang{" "}
              <span className="font-medium text-foreground">
                {state.pagination.page}
              </span>{" "}
              / {Math.max(state.pagination.totalPages, 1)}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!state.pagination.hasPrevious || state.isLoading}
                onClick={state.previousPage}
              >
                <ChevronLeft className="size-4" />
                Trước
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!state.pagination.hasNext || state.isLoading}
                onClick={state.nextPage}
              >
                Sau
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {state.isLoadingSelection ? (
          <div className="flex items-center gap-2 rounded-lg border px-4 py-8 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Đang tải workspace...
          </div>
        ) : null}
        {selected ? (
          <section
            className="space-y-4 rounded-lg border bg-card p-4"
            aria-live="polite"
          >
            <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold">
                    Xem trước và liên kết
                  </h2>
                  <ImportStatusBadge status={selected.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selected.proposedProgramName} ·{" "}
                  {selected.proposedProgramCode}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={state.isMutating}
                onClick={state.clearSelection}
              >
                Đóng chi tiết
              </Button>
            </div>
            {state.selectionWarning ? (
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
                <p>{state.selectionWarning}</p>
                <Button
                  className="mt-2"
                  size="sm"
                  variant="outline"
                  onClick={() => void selectImport(selected.id)}
                >
                  Tải lại workspace
                </Button>
              </div>
            ) : null}
            {selected.failureMessage ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <p className="font-medium">
                  {selected.failureCode ?? "Import cần xử lý"}
                </p>
                <p className="mt-1">{selected.failureMessage}</p>
              </div>
            ) : null}
            <div className="space-y-3 rounded-lg border p-4">
              <div>
                <p className="font-semibold">
                  Bước 1: Nhập, kiểm tra và tạo tài nguyên
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Kiểm tra bundle trước, sau đó tạo artifact và RobotProgram ở
                  trạng thái Draft.
                </p>
              </div>
              {selected.validation ? (
                <div className="rounded-lg border p-4 text-sm">
                  <p className="font-semibold">Kết quả kiểm tra bundle</p>
                  <p className="mt-1 text-muted-foreground">
                    {selected.validation.errors.length} lỗi ·{" "}
                    {selected.validation.warnings.length} cảnh báo ·{" "}
                    {selected.validation.canMaterialize
                      ? "Có thể tạo tài nguyên"
                      : "Chưa thể tạo tài nguyên"}
                  </p>
                  {selected.validation.errors.map((issue) => (
                    <p
                      key={`${issue.code}-${issue.message}`}
                      className="mt-2 text-destructive"
                    >
                      {issue.message}
                    </p>
                  ))}
                  {selected.validation.warnings.map((issue) => (
                    <p
                      key={`${issue.code}-${issue.message}`}
                      className="mt-2 text-warning"
                    >
                      {issue.message}
                    </p>
                  ))}
                </div>
              ) : null}
              {state.workspace?.blockers.length ? (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm text-warning">
                  <p className="font-semibold">Điều kiện cần xử lý</p>
                  {state.workspace.blockers.map((blocker) => (
                    <p
                      key={`${blocker.code}-${blocker.message}`}
                      className="mt-1"
                    >
                      {blocker.message}
                    </p>
                  ))}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {canAuthorImport && hasAction("ValidateImport") ? (
                  <Button
                    size="sm"
                    disabled={state.isMutating}
                    onClick={() => void state.validate()}
                  >
                    Kiểm tra bundle
                  </Button>
                ) : null}
                {canAuthorImport && hasAction("MaterializeImport") ? (
                  <Button
                    size="sm"
                    disabled={state.isMutating}
                    onClick={() => void state.materialize()}
                  >
                    Tạo tài nguyên
                  </Button>
                ) : null}
                {canAuthorImport && hasAction("DiscardImport") ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={state.isMutating}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Hủy gói cấu hình này? Tài nguyên đã phát hành sẽ không bị xóa bởi thao tác này.",
                        )
                      )
                        void state.discard();
                    }}
                  >
                    Hủy import
                  </Button>
                ) : null}
              </div>
            </div>
            {showPrograms && selected.materializedRobotProgramId &&
            !selected.composedRecipeId &&
            !selected.publishedAt ? (
              <ProductionAwareProgramOrderPanel
                organizationId={props.organizationId}
                programId={selected.materializedRobotProgramId}
                canManage={canAuthorImport}
                onOrderSaved={() => {
                  state.clearCompositionPreview();
                  if (recipeId)
                    void state.previewComposition(
                      recipeId,
                      selectedOptionCodes,
                    );
                }}
              />
            ) : null}
            {showBindings && hasMaterializedProgram && !publishedBeforeComposition ? (
              <div className="space-y-4 rounded-lg border p-4">
                <div>
                  <p className="font-semibold">
                    Bước 2: Chọn và xác nhận Recipe
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Chọn Recipe, kiểm tra cấu thành artifact rồi xác nhận. Chỉ
                    sau bước này mới được phát hành tài nguyên.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Recipe</Label>
                  <Select
                    value={recipeId}
                    onValueChange={(value) => setRecipeId(value ?? "")}
                    disabled={state.isMutating || hasConfirmedComposition}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {currentRecipe
                          ? `${currentRecipe.productName} / ${currentRecipe.productVariantName} — ${currentRecipe.name} v${currentRecipe.version}`
                          : "Chọn Recipe"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {recipes.map((recipe) => (
                        <SelectItem key={recipe.id} value={recipe.id}>
                          {recipe.productName} / {recipe.productVariantName} —{" "}
                          {recipe.name} v{recipe.version}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {currentRecipe ? (
                  <dl className="grid gap-2 rounded-md border bg-muted/20 p-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Sản phẩm
                      </dt>
                      <dd className="font-medium">
                        {currentRecipe.productName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Biến thể
                      </dt>
                      <dd className="font-medium">
                        {currentRecipe.productVariantName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Công thức
                      </dt>
                      <dd className="font-medium">
                        {currentRecipe.name} v{currentRecipe.version}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Chương trình Draft
                      </dt>
                      <dd className="font-medium">
                        {selected.proposedProgramName}
                      </dd>
                    </div>
                  </dl>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      !recipeId ||
                      state.isMutating ||
                      !canAuthorImport ||
                      hasConfirmedComposition
                    }
                    onClick={() =>
                      void state.previewComposition(
                        recipeId,
                        selectedOptionCodes,
                      )
                    }
                  >
                    Kiểm tra cấu thành
                  </Button>
                  {preview && !hasConfirmedComposition ? (
                    <Button
                      size="sm"
                      disabled={
                        !preview.canConfirm ||
                        !recipeId ||
                        state.isMutating ||
                        !canAuthorImport
                      }
                      onClick={() =>
                        void state.confirmComposition(
                          recipeId,
                          selectedOptionCodes,
                          preview.previewChecksum,
                        )
                      }
                    >
                      Xác nhận cấu thành
                    </Button>
                  ) : null}
                </div>
                {preview ? (
                  <div
                    className={`rounded-lg border p-3 text-sm ${preview.canConfirm ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"}`}
                  >
                    <p className="font-medium">
                      {preview.canConfirm
                        ? "Cấu thành hợp lệ"
                        : "Cấu thành chưa hợp lệ"}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {preview.proposedArtifacts.length} artifact đề xuất ·{" "}
                      {preview.suggestedCapabilityCodes.length} năng lực do
                      backend gợi ý.
                    </p>
                    {preview.blockers.map((item) => (
                      <p
                        key={`${item.code}-${item.message}`}
                        className="mt-1 text-destructive"
                      >
                        {item.message}
                      </p>
                    ))}
                    {preview.warnings.map((item) => (
                      <p
                        key={`${item.code}-${item.message}`}
                        className="mt-1 text-warning"
                      >
                        {item.message}
                      </p>
                    ))}
                  </div>
                ) : null}
                {preview ? (
                  <CompositionPreviewDetails preview={preview} />
                ) : null}
              </div>
            ) : null}
            {showPrograms && hasMaterializedProgram && !hasPublishedResources ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                <div>
                  <p className="font-semibold">Bước 3: Phát hành tài nguyên</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Recipe và cấu thành đã được xác nhận. Phát hành
                    artifact/program. Tạo Release và triển khai được thực hiện
                    trong workspace Kiosk sau khi phát hành.
                  </p>
                </div>
                {!hasPublishedResources &&
                canAuthorImport &&
                hasAction("PublishImportResources") ? (
                  <Button
                    size="sm"
                    disabled={state.isMutating}
                    onClick={() => void state.publishResources()}
                  >
                    Phát hành tài nguyên
                  </Button>
                ) : null}
              </div>
            ) : null}
            {showBindings && publishedBeforeComposition ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                <p className="font-semibold">
                  Import này đã phát hành theo thứ tự cũ
                </p>
                <p className="mt-1">
                  Chưa có Recipe composition được xác nhận nên backend chặn tạo
                  Release draft. Tạo một import mới, xác nhận Recipe trước rồi
                  mới phát hành tài nguyên.
                </p>
              </div>
            ) : null}
            {showPrograms && selected.linkedConfigurationReleaseId ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 text-sm">
                <div>
                  <p className="font-semibold">Bản nháp đã liên kết</p>
                  <p className="mt-1 text-muted-foreground">
                    Bản nháp được tạo ở backend. Review route, phát hành và điều
                    kiện triển khai trong ngữ cảnh kiosk.
                  </p>
                </div>
                {selected.kioskId ? (
                  <Link
                    className={buttonVariants({ size: "sm" })}
                    href={`/kiosks/${selected.kioskId}`}
                  >
                    <Rocket className="size-4" />
                    Mở kiosk
                  </Link>
                ) : (
                  <span className="text-muted-foreground">
                    Import này chưa gắn kiosk.
                  </span>
                )}
              </div>
            ) : null}
            {showPrograms && hasPublishedResources &&
            hasConfirmedComposition &&
            !selected.linkedConfigurationReleaseId ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 text-sm">
                <div>
                  <p className="font-semibold">
                    Tài nguyên đã sẵn sàng cho triển khai
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Artifact và RobotProgram đã phát hành. Tạo/review Release,
                    chọn Edge và triển khai trong workspace Kiosk; import không
                    tự tạo cấu hình hoặc gửi lệnh xuống máy.
                  </p>
                </div>
                <Link
                  className={buttonVariants({ size: "sm" })}
                  href={
                    selected.kioskId ? `/kiosks/${selected.kioskId}` : "/kiosks"
                  }
                >
                  <Rocket className="size-4" />
                  {selected.kioskId
                    ? "Mở Kiosk để triển khai"
                    : "Chọn Kiosk để triển khai"}
                </Link>
              </div>
            ) : null}
            <div className="rounded-lg border bg-muted/20 p-4 text-sm">
              <p className="font-semibold">Việc backend đề xuất tiếp theo</p>
              {[...availableActions].length ? (
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  {[...availableActions].map((action) => (
                    <li key={action}>• {ACTION_LABELS[action] ?? action}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-muted-foreground">
                  Chưa có thao tác tiếp theo.
                </p>
              )}
            </div>
          </section>
        ) : null}
      </section>
    </div>
  );
}
