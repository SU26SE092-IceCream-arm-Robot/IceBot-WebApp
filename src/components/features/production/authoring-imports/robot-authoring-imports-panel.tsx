"use client";

import {
  ChevronLeft,
  ChevronRight,
  FileArchive,
  LoaderCircle,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { useMemo } from "react";

import { RobotAuthoringBundleUpload } from "@/components/features/production/authoring-imports/robot-authoring-bundle-upload";
import { ProductionAwareProgramOrderPanel } from "@/components/features/production/programs/production-aware-program-order-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRobotAuthoringImports } from "@/hooks/production/use-robot-authoring-imports";
import type { RobotAuthoringImportStatus } from "@/types/production/operations";

interface RobotAuthoringImportsPanelProps {
  organizationId: string;
  organizationName?: string;
  canRead: boolean;
  canUpload: boolean;
  canManagePrograms: boolean;
  onOpenBindings?: () => void;
}

const STATUS_LABELS: Record<RobotAuthoringImportStatus, string> = {
  Uploaded: "Đang xử lý",
  Validated: "Sẵn sàng tạo bản nháp",
  Materialized: "Bản nháp sẵn sàng",
  ResourcesPublished: "Robot Program đã phát hành",
  Failed: "Cần sửa bundle",
  Discarded: "Đã hủy",
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

function groupIssues<T extends { code: string; message: string }>(issues: T[]) {
  const grouped = new Map<string, T & { count: number }>();
  for (const issue of issues) {
    const key = `${issue.code}\u0000${issue.message}`;
    const existing = grouped.get(key);
    if (existing) existing.count += 1;
    else grouped.set(key, { ...issue, count: 1 });
  }
  return [...grouped.values()];
}

export function RobotAuthoringImportsPanel(
  props: RobotAuthoringImportsPanelProps,
) {
  const state = useRobotAuthoringImports(props.organizationId);
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
  const canAuthorImport = props.canUpload && props.canManagePrograms;
  const hasAction = (action: string) => availableActions.has(action);
  const hasMaterializedProgram = Boolean(selected?.materializedRobotProgramId);
  const hasPublishedResources = Boolean(selected?.publishedAt);
  const canResumeImport =
    canAuthorImport &&
    !hasMaterializedProgram &&
    (selected?.status === "Uploaded" ||
      selected?.status === "Validated" ||
      selected?.status === "Failed");
  if (!props.canRead) return null;

  const selectImport = async (importId: string) => {
    await state.selectImport(importId);
  };

  const upload = async (file: File) => {
    const result = await state.upload({ bundle: file });
    if (!result) return false;
    await selectImport(result.id);
    return true;
  };

  return (
    <div className="space-y-5">
      <section
        className="min-w-0 space-y-5"
        aria-label="Workspace cấu hình sản xuất"
      >
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <FileArchive className="size-4 text-primary" />
                Nhập chương trình Lua
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Chọn bundle Fairino một lần. Backend tự kiểm tra cấu trúc và tạo
                Robot Program Draft; Lua được xem là black box.
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
          <div className="mt-4">
            <RobotAuthoringBundleUpload
              canUpload={props.canUpload}
              disabled={state.isMutating}
              isUploading={state.isMutating}
              onUpload={upload}
            />
          </div>
        </div>

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
                  placeholder="Tìm theo tên hoặc mã chương trình"
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
                Nhập bundle Fairino đầu tiên để tạo Robot Program Draft.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Chương trình</th>
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
            className="space-y-4 rounded-lg border bg-card p-4 [overflow-anchor:none]"
            aria-live="polite"
          >
            <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold">
                    Chi tiết chương trình
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
                  Kết quả nhập chương trình
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Backend tự kiểm tra cấu trúc bundle và tạo artifact cùng
                  Robot Program ở trạng thái Draft. Đây không phải kiểm tra hành vi Lua.
                </p>
              </div>
              {selected.validation?.errors.length ? (
                <div className="rounded-lg border p-4 text-sm">
                  <p className="font-semibold">Bundle cần sửa</p>
                  {groupIssues(selected.validation.errors).map((issue) => (
                    <p
                      key={`${issue.code}-${issue.message}`}
                      className="mt-2 text-destructive"
                    >
                      {issue.message}{issue.count > 1 ? ` (${issue.count} artifact)` : ""}
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
                {canResumeImport ? (
                  <Button
                    size="sm"
                    disabled={state.isMutating}
                    onClick={() => void state.resume()}
                  >
                    Thử lại nhập chương trình
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
            {selected.materializedRobotProgramId && !selected.publishedAt ? (
              <ProductionAwareProgramOrderPanel
                organizationId={props.organizationId}
                programId={selected.materializedRobotProgramId}
                canManage={canAuthorImport}
              />
            ) : null}
            {hasMaterializedProgram && !hasPublishedResources ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                <div>
                  <p className="font-semibold">Phát hành Robot Program</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Khóa phiên bản artifact và thứ tự chương trình để có thể
                    chọn chương trình này trong tab Bind Configuration. Bước
                    này không xác nhận Lua khớp Recipe.
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
            {hasPublishedResources ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 text-sm">
                <div>
                  <p className="font-semibold">
                    Robot Program đã sẵn sàng để liên kết
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Chuyển sang Bind Configuration để chọn Recipe và xác nhận
                    quan hệ với chương trình này.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={props.onOpenBindings}
                  disabled={!props.onOpenBindings}
                >
                  Mở Bind Configuration
                </Button>
              </div>
            ) : null}
          </section>
        ) : null}
      </section>
    </div>
  );
}
