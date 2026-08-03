"use client";

import {
  ChevronLeft,
  ChevronRight,
  FileArchive,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  Rocket,
  Search,
  Upload,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { useRobotAuthoringImports } from "@/hooks/use-robot-authoring-imports";
import type { RobotAuthoringImportStatus } from "@/types/production-operations";

interface RobotAuthoringImportsPanelProps {
  organizationId: string;
  canRead: boolean;
  canUpload: boolean;
  canManagePrograms: boolean;
  canManageReleases: boolean;
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
  PublishResources: "Phát hành tài nguyên",
  DiscardImport: "Hủy import",
  CreateConfigurationReleaseDraft: "Tạo bản nháp cấu hình",
  ReviewConfigurationReleaseDraft: "Xem bản nháp cấu hình",
  PublishConfigurationRelease: "Phát hành bản cấu hình",
  SelectDeploymentKiosk: "Chọn Kiosk triển khai",
  SelectExecutionEndpoint: "Chọn điểm thực thi",
  ConfirmDeployment: "Xác nhận triển khai",
  ResolveDeploymentBlockers: "Xử lý điều kiện chưa đạt",
  ResolveArtifactRevisionConflict: "Xử lý xung đột phiên bản artifact",
};

function ImportStatusBadge({ status }: { status: RobotAuthoringImportStatus }) {
  const variant = status === "Failed" ? "destructive" : status === "ResourcesPublished" ? "default" : "outline";
  return <Badge variant={variant}>{STATUS_LABELS[status]}</Badge>;
}

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function CompositionPreviewDetails({ preview }: { preview: import("@/types/production-operations").RobotAuthoringCompositionPreview }) {
  return (
    <div className="space-y-3 rounded-lg border p-3 text-sm">
      <div>
        <p className="font-medium">Liên kết được đề xuất</p>
        <p className="mt-1 text-xs text-muted-foreground">Backend quyết định artifact nào đáp ứng từng nguyên liệu hoặc tùy chọn. Danh sách này chỉ để review trước khi xác nhận.</p>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[560px] text-left text-xs">
          <thead className="bg-muted/50 text-muted-foreground"><tr><th className="px-3 py-2 font-medium">Yêu cầu</th><th className="px-3 py-2 font-medium">Trạng thái</th><th className="px-3 py-2 font-medium">Artifact có thể đáp ứng</th></tr></thead>
          <tbody className="divide-y">{preview.requirements.map((requirement) => <tr key={`${requirement.kind}-${requirement.code}`}><td className="px-3 py-2"><p className="font-medium text-foreground">{requirement.ingredientCode ?? requirement.optionCode ?? requirement.code}</p><p className="text-muted-foreground">{requirement.kind}{requirement.quantity != null ? ` · ${requirement.quantity} ${requirement.unit ?? ""}` : ""}</p></td><td className="px-3 py-2">{requirement.status}</td><td className="px-3 py-2 font-mono text-muted-foreground">{requirement.candidateArtifactCodes.join(", ") || "Chưa có"}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[560px] text-left text-xs">
          <thead className="bg-muted/50 text-muted-foreground"><tr><th className="px-3 py-2 font-medium">Thứ tự chạy</th><th className="px-3 py-2 font-medium">Artifact</th><th className="px-3 py-2 font-medium">Chỉ khi có option</th><th className="px-3 py-2 font-medium">Effect khai báo</th></tr></thead>
          <tbody className="divide-y">{preview.proposedArtifacts.map((artifact) => <tr key={artifact.robotArtifactId}><td className="px-3 py-2 font-mono">{artifact.runOrder}</td><td className="px-3 py-2 font-mono">{artifact.artifactCode}</td><td className="px-3 py-2">{artifact.requiredOptionCode ?? "Luôn chạy"}</td><td className="px-3 py-2 font-mono text-muted-foreground">{artifact.effectCodes.join(", ") || "Chưa khai báo"}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

export function RobotAuthoringImportsPanel(props: RobotAuthoringImportsPanelProps) {
  const state = useRobotAuthoringImports(props.organizationId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [recipeId, setRecipeId] = useState("");
  const [capabilityCode, setCapabilityCode] = useState("");

  const selected = state.selectedImport;
  const availableActions = useMemo(
    () => new Set([...(selected?.nextActions ?? []), ...(state.workspace?.actions.map((action) => action.code) ?? [])]),
    [selected?.nextActions, state.workspace?.actions],
  );
  const recipes = state.authoringOptions?.recipes ?? [];
  const currentRecipe = recipes.find((recipe) => recipe.id === recipeId);
  const preview = state.compositionPreview;
  const suggestedCapabilities = preview?.suggestedCapabilityCodes ?? [];
  const canAuthorImport = props.canUpload && props.canManagePrograms;

  if (!props.canRead) return null;

  const openWorkspace = async (importId: string) => {
    const detail = await state.selectImport(importId);
    if (!detail) return;
    setRecipeId(detail.composedRecipeId ?? "");
    setCapabilityCode("");
    setWorkspaceOpen(true);
    void state.loadAuthoringOptions();
    if (detail.composedRecipeId) {
      void state.previewComposition(
        detail.composedRecipeId,
        detail.composedOptionCodes ?? [],
      );
    }
  };

  const upload = async () => {
    if (!selectedFile) return;
    const result = await state.upload({ bundle: selectedFile });
    if (result) {
      setSelectedFile(null);
      await openWorkspace(result.id);
    }
  };

  const selectedOptionCodes = selected?.composedOptionCodes ?? [];
  const hasAction = (action: string) => availableActions.has(action);
  const canCreateRelease = props.canManageReleases && hasAction("CreateConfigurationReleaseDraft");

  return (
    <section className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-semibold"><FileArchive className="size-4 text-primary" />Gói cấu hình nhập vào</h2>
          <p className="mt-1 text-sm text-muted-foreground">Theo dõi bundle Fairino theo vòng đời có thể tiếp tục sau reload. Thông tin credential và payload kỹ thuật thô không được hiển thị.</p>
        </div>
        <Button size="sm" variant="outline" disabled={state.isLoading || state.isMutating} onClick={() => void state.refresh()}><RefreshCw className="size-4" />Làm mới</Button>
      </div>

      {props.canUpload ? (
        <div className="flex flex-col gap-3 rounded-lg border border-dashed p-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-1.5"><Label htmlFor="robot-authoring-bundle">Bundle Fairino (.zip)</Label><Input id="robot-authoring-bundle" type="file" accept=".zip,application/zip" disabled={state.isMutating} onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} /><p className="text-xs text-muted-foreground">Bundle được tạo ở cấp tổ chức. Chỉ upload bundle đã được phê duyệt cho môi trường hiện tại.</p></div>
          <Button size="sm" disabled={!selectedFile || state.isMutating} onClick={() => void upload()}>{state.isMutating ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}Tải bundle lên</Button>
        </div>
      ) : <p className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">Bạn có thể xem bundle trong tổ chức, nhưng không có quyền tải bundle mới lên.</p>}

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={state.query.search ?? ""} className="pl-9" placeholder="Tìm theo chương trình, target hoặc machine model" onChange={(event) => state.setSearch(event.target.value)} /></div>
        <Select value={state.query.status ?? "ALL"} onValueChange={(value) => state.setStatus((value ?? "ALL") as RobotAuthoringImportStatus | "ALL")}><SelectTrigger className="w-full"><SelectValue>{state.query.status === "ALL" || !state.query.status ? "Tất cả trạng thái" : STATUS_LABELS[state.query.status]}</SelectValue></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả trạng thái</SelectItem>{Object.entries(STATUS_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
      </div>

      {state.errorMessage ? <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><XCircle className="mt-0.5 size-4 shrink-0" /><div><p>{state.errorMessage}</p><Button className="mt-2" size="sm" variant="outline" onClick={() => void state.refresh()}>Thử lại</Button></div></div> : null}

      {state.isLoading ? <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">Đang tải gói cấu hình...</div> : state.items.length === 0 ? <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">Chưa có gói cấu hình nào khớp bộ lọc hiện tại.</div> : <div className="divide-y rounded-lg border">{state.items.map((item) => <div key={item.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{item.proposedProgramName}</p><ImportStatusBadge status={item.status} /></div><p className="mt-1 text-xs text-muted-foreground">{item.proposedProgramCode} · {item.runtimeTargetCode} · {item.machineModelCode} · {item.itemCount} mục</p><p className="mt-1 text-xs text-muted-foreground">Tạo lúc {formatDate(item.createdAt)}{item.createdByDisplayName ? ` · bởi ${item.createdByDisplayName}` : ""}{item.failureMessage ? ` · ${item.failureMessage}` : ""}</p></div><Button size="sm" variant="outline" onClick={() => void openWorkspace(item.id)}>Mở workspace</Button></div>)}</div>}

      <div className="flex items-center justify-between gap-3 text-sm"><p className="text-muted-foreground">Trang <span className="font-medium text-foreground">{state.pagination.page}</span> / {Math.max(state.pagination.totalPages, 1)} · {state.pagination.totalCount} gói</p><div className="flex gap-2"><Button size="sm" variant="outline" disabled={!state.pagination.hasPrevious || state.isLoading} onClick={state.previousPage}><ChevronLeft className="size-4" />Trước</Button><Button size="sm" variant="outline" disabled={!state.pagination.hasNext || state.isLoading} onClick={state.nextPage}>Sau<ChevronRight className="size-4" /></Button></div></div>

      <Dialog open={workspaceOpen} onOpenChange={(open) => { setWorkspaceOpen(open); if (!open) state.clearSelection(); }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>Không gian cấu hình sản xuất</DialogTitle><DialogDescription>Tiếp tục bundle theo trạng thái do backend quản lý. Các action bị ẩn khi không thuộc lifecycle hoặc effective access hiện tại.</DialogDescription></DialogHeader>
          {state.isLoadingSelection ? <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Đang tải workspace...</div> : selected ? <div className="space-y-5">
            <div className="rounded-lg border bg-muted/20 p-3"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{selected.proposedProgramName}</p><ImportStatusBadge status={selected.status} /></div><p className="mt-1 text-xs text-muted-foreground">{selected.proposedProgramCode} · {selected.runtimeTargetCode} · {selected.machineModelCode}</p><p className="mt-2 text-sm">{selected.linkedConfigurationReleaseId ? "Đã liên kết với một Bản phát hành cấu hình." : "Chưa liên kết Bản phát hành cấu hình."}</p></div>

            {state.selectionWarning ? <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning"><p>{state.selectionWarning}</p><Button className="mt-2" size="sm" variant="outline" onClick={() => void state.selectImport(selected.id)}>Tải lại workspace</Button></div> : null}
            {selected.failureMessage ? <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><p className="font-medium">{selected.failureCode ?? "Import cần xử lý"}</p><p className="mt-1">{selected.failureMessage}</p></div> : null}
            {selected.validation ? <div className="rounded-lg border p-3 text-sm"><p className="font-medium">Kết quả kiểm tra</p><p className="mt-1 text-muted-foreground">{selected.validation.errors.length} lỗi · {selected.validation.warnings.length} cảnh báo · {selected.validation.canMaterialize ? "Có thể tạo tài nguyên" : "Chưa thể tạo tài nguyên"}</p>{selected.validation.errors.map((issue) => <p key={`${issue.code}-${issue.message}`} className="mt-2 text-destructive">{issue.message}</p>)}{selected.validation.warnings.map((issue) => <p key={`${issue.code}-${issue.message}`} className="mt-2 text-warning">{issue.message}</p>)}</div> : null}
            {state.workspace?.blockers.length ? <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning"><p className="font-medium">Điều kiện cần xử lý</p>{state.workspace.blockers.map((blocker) => <p key={`${blocker.code}-${blocker.message}`} className="mt-1">{blocker.message}</p>)}</div> : null}

            <div className="flex flex-wrap gap-2">
              {canAuthorImport && hasAction("ValidateImport") ? <Button size="sm" disabled={state.isMutating} onClick={() => void state.validate()}>Kiểm tra bundle</Button> : null}
              {canAuthorImport && hasAction("MaterializeImport") ? <Button size="sm" disabled={state.isMutating} onClick={() => void state.materialize()}>Tạo tài nguyên</Button> : null}
              {canAuthorImport && hasAction("PublishResources") ? <Button size="sm" disabled={state.isMutating} onClick={() => void state.publishResources()}>Phát hành tài nguyên</Button> : null}
              {canAuthorImport && hasAction("DiscardImport") ? <Button size="sm" variant="destructive" disabled={state.isMutating} onClick={() => { if (window.confirm("Hủy gói cấu hình này? Tài nguyên đã phát hành sẽ không bị xóa bởi thao tác này.")) void state.discard(); }}>Hủy import</Button> : null}
            </div>

            {(hasAction("CreateConfigurationReleaseDraft") || selected.composedRecipeId || selected.status === "Materialized" || selected.status === "ResourcesPublished") ? <div className="space-y-3 rounded-lg border p-3"><div><p className="font-medium">Liên kết sang bản nháp cấu hình</p><p className="mt-1 text-xs text-muted-foreground">Chọn Recipe đã phát hành. Tùy chọn hiện dùng các mã đã được backend xác nhận trong import; giao diện chưa có danh mục option authoritative để tự thêm mã mới.</p></div><div className="space-y-1.5"><Label>Recipe</Label><Select value={recipeId} onValueChange={(value) => { setRecipeId(value ?? ""); }} disabled={state.isMutating}><SelectTrigger className="w-full"><SelectValue>{currentRecipe ? `${currentRecipe.productVariantName} — ${currentRecipe.name} v${currentRecipe.version}` : "Chọn Recipe"}</SelectValue></SelectTrigger><SelectContent>{recipes.map((recipe) => <SelectItem key={recipe.id} value={recipe.id}>{recipe.productVariantName} — {recipe.name} v{recipe.version}</SelectItem>)}</SelectContent></Select></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={!recipeId || state.isMutating || !canAuthorImport} onClick={() => void state.previewComposition(recipeId, selectedOptionCodes)}>Kiểm tra cấu thành</Button>{preview ? <Button size="sm" disabled={!preview.canConfirm || !recipeId || state.isMutating || !canAuthorImport} onClick={() => void state.confirmComposition(recipeId, selectedOptionCodes, preview.previewChecksum)}>Xác nhận cấu thành</Button> : null}</div>{preview ? <div className={`rounded-lg border p-3 text-sm ${preview.canConfirm ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"}`}><p className="font-medium">{preview.canConfirm ? "Cấu thành hợp lệ" : "Cấu thành chưa hợp lệ"}</p><p className="mt-1 text-muted-foreground">{preview.proposedArtifacts.length} artifact đề xuất · {preview.suggestedCapabilityCodes.length} năng lực được backend gợi ý.</p>{preview.blockers.map((item) => <p key={`${item.code}-${item.message}`} className="mt-1 text-destructive">{item.message}</p>)}{preview.warnings.map((item) => <p key={`${item.code}-${item.message}`} className="mt-1 text-warning">{item.message}</p>)}</div> : null}{preview ? <CompositionPreviewDetails preview={preview} /> : null}<div className="space-y-1.5"><Label>Năng lực trạm làm việc</Label>{suggestedCapabilities.length > 0 ? <Select value={capabilityCode} onValueChange={(value) => setCapabilityCode(value ?? "")} disabled={state.isMutating}><SelectTrigger className="w-full"><SelectValue>{capabilityCode || "Dùng giá trị backend tự suy ra"}</SelectValue></SelectTrigger><SelectContent>{suggestedCapabilities.map((code) => <SelectItem key={code} value={code}>{code}</SelectItem>)}</SelectContent></Select> : <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">Backend chưa gợi ý mã năng lực. Để trống để backend suy ra từ bundle; không nhập mã thủ công.</p>}</div>{canCreateRelease ? <Button size="sm" disabled={!recipeId || state.isMutating} onClick={() => void state.createReleaseDraft({ recipeId, requiredWorkcellCapabilityCode: capabilityCode || null, supportedOptionCodes: selectedOptionCodes })}><PackageCheck className="size-4" />Tạo bản nháp cấu hình</Button> : null}</div> : null}

            {selected.linkedConfigurationReleaseId ? <div className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"><div><p className="font-medium">Bản nháp đã liên kết</p><p className="text-muted-foreground">Mở Kiosk để review route, phát hành và kiểm tra điều kiện triển khai.</p></div>{selected.kioskId ? <Link className={buttonVariants({ size: "sm" })} href={`/kiosks/${selected.kioskId}`}><Rocket className="size-4" />Mở Kiosk</Link> : <span className="text-muted-foreground">Import này chưa gắn Kiosk.</span>}</div> : null}

            <div className="rounded-lg border p-3 text-sm"><p className="font-medium">Việc backend đề xuất tiếp theo</p>{[...availableActions].length ? <ul className="mt-2 space-y-1 text-muted-foreground">{[...availableActions].map((action) => <li key={action}>• {ACTION_LABELS[action] ?? action}</li>)}</ul> : <p className="mt-1 text-muted-foreground">Chưa có thao tác tiếp theo.</p>}</div>
          </div> : <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">Không thể tải gói cấu hình đã chọn.</div>}
          <DialogFooter><Button variant="outline" onClick={() => setWorkspaceOpen(false)} disabled={state.isMutating}>Đóng</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
