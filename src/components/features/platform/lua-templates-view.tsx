"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileCode2,
  GitBranch,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/identity/use-auth";
import { useLuaTemplates } from "@/hooks/platform/use-lua-templates";
import { hasPermission } from "@/lib/rbac";
import type {
  LuaTemplateResult,
  TechnicalContractResult,
  UploadLuaTemplateRequest,
} from "@/types/platform/lua-templates";

const STATUS_LABELS: Record<string, string> = {
  Draft: "Bản nháp",
  Published: "Đã phát hành",
  Retired: "Đã ngừng sử dụng",
};

const EMPTY_UPLOAD: Omit<UploadLuaTemplateRequest, "file"> = {
  templateCode: "",
  templateName: "",
  runtimeTargetCode: "",
  machineModelCode: "",
  description: "",
};

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusClass(status: string) {
  if (status === "Published") return "border-success/30 bg-success/10 text-success";
  if (status === "Retired") return "border-border bg-muted text-muted-foreground";
  return "border-warning/30 bg-warning/10 text-warning-foreground";
}

function UploadTemplateDialog({
  open,
  pending,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (request: UploadLuaTemplateRequest) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState(EMPTY_UPLOAD);
  const [error, setError] = useState<string | null>(null);

  const close = (nextOpen: boolean) => {
    if (!pending) {
      onOpenChange(nextOpen);
      if (!nextOpen) { setFile(null); setForm(EMPTY_UPLOAD); setError(null); }
    }
  };

  const submit = async () => {
    if (!file || !file.name.toLowerCase().endsWith(".lua")) {
      setError("Hãy chọn đúng một file có phần mở rộng .lua.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("File LUA không được vượt quá giới hạn 100 MB của backend.");
      return;
    }
    if (!form.templateCode.trim() || !form.templateName.trim() ||
        !form.runtimeTargetCode.trim() || !form.machineModelCode.trim()) {
      setError("Mã, tên mẫu, runtime target và model máy là bắt buộc.");
      return;
    }
    setError(null);
    try {
      await onSubmit({ ...form, file });
      onOpenChange(false);
      setFile(null);
      setForm(EMPTY_UPLOAD);
      setError(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể tải lên mẫu LUA.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thêm mẫu LUA hệ thống</DialogTitle>
          <DialogDescription>Tạo bản nháp toàn nền tảng. File chỉ được phát hành sau khi gán hợp đồng kỹ thuật phù hợp.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-2 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="lua-template-file">File LUA</Label>
            <Input id="lua-template-file" type="file" accept=".lua,text/plain" disabled={pending}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            {file ? <p className="text-xs text-muted-foreground">{file.name} · {formatBytes(file.size)}</p> : null}
          </div>
          {[
            ["templateCode", "Mã mẫu"], ["templateName", "Tên mẫu"],
            ["runtimeTargetCode", "Runtime target"], ["machineModelCode", "Model máy"],
          ].map(([field, label]) => (
            <div className="space-y-2" key={field}>
              <Label htmlFor={`lua-${field}`}>{label}</Label>
              <Input id={`lua-${field}`} value={form[field as keyof typeof form] ?? ""} disabled={pending}
                onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} />
            </div>
          ))}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="lua-description">Mô tả</Label>
            <Input id="lua-description" value={form.description} disabled={pending}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </div>
          {error ? <p role="alert" className="sm:col-span-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={pending}>Hủy</Button>
          <Button onClick={() => void submit()} isLoading={pending}><Upload className="size-4" />Tải lên bản nháp</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContractDialog({
  template,
  contracts,
  pending,
  onClose,
  onAssign,
}: {
  template: LuaTemplateResult | null;
  contracts: TechnicalContractResult[];
  pending: boolean;
  onClose: () => void;
  onAssign: (contractId: string) => Promise<void>;
}) {
  const compatible = useMemo(() => contracts.filter((contract) =>
    contract.runtimeTargetCode.localeCompare(template?.runtimeTargetCode ?? "", undefined, { sensitivity: "accent" }) === 0 &&
    contract.machineModelCode.localeCompare(template?.machineModelCode ?? "", undefined, { sensitivity: "accent" }) === 0),
  [contracts, template]);
  const [contractId, setContractId] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog open={Boolean(template)} onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gán hợp đồng kỹ thuật</DialogTitle>
          <DialogDescription>Chỉ hiển thị hợp đồng đã phát hành khớp runtime target và model máy của mẫu.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label>Hợp đồng kỹ thuật</Label>
          <Select value={contractId} onValueChange={(value) => setContractId(value ?? "")} disabled={pending || compatible.length === 0}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Chọn hợp đồng đã phát hành" /></SelectTrigger>
            <SelectContent>{compatible.map((contract) => (
              <SelectItem key={contract.id} value={contract.id}>{contract.contractCode} · v{contract.contractVersion}</SelectItem>
            ))}</SelectContent>
          </Select>
          {compatible.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có hợp đồng kỹ thuật phù hợp. Hãy nhờ nhóm kỹ thuật phát hành contract đúng runtime và model trước.</p> : null}
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>Hủy</Button>
          <Button disabled={!contractId || pending} isLoading={pending} onClick={() => void onAssign(contractId).catch((assignError) => setError(assignError instanceof Error ? assignError.message : "Không thể gán hợp đồng."))}>Gán hợp đồng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LuaTemplatesView() {
  const { effectiveAccess } = useAuth();
  const state = useLuaTemplates();
  const canManage = hasPermission(effectiveAccess, "artifact-template.manage");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [contractTarget, setContractTarget] = useState<LuaTemplateResult | null>(null);
  const [lifecycleTarget, setLifecycleTarget] = useState<{ template: LuaTemplateResult; action: "publish" | "retire" | "discard" } | null>(null);

  const upload = async (request: UploadLuaTemplateRequest) => {
    const result = await state.upload(request);
    toast.success(result.failedCount === 0 ? "Đã tạo bản nháp mẫu LUA." : "Đã xử lý file LUA.");
  };
  const assign = async (contractId: string) => {
    if (!contractTarget) return;
    await state.assignContract(contractTarget.id, contractId);
    toast.success("Đã gán hợp đồng kỹ thuật.");
    setContractTarget(null);
  };
  const changeLifecycle = async () => {
    if (!lifecycleTarget) return;
    await state.changeLifecycle(lifecycleTarget.template.id, lifecycleTarget.action);
    toast.success(lifecycleTarget.action === "publish" ? "Đã phát hành mẫu LUA." : lifecycleTarget.action === "retire" ? "Đã ngừng sử dụng mẫu LUA." : "Đã xóa bản nháp mẫu LUA.");
    setLifecycleTarget(null);
  };
  const openReview = async (template: LuaTemplateResult) => {
    const popup = window.open("about:blank", "_blank");
    if (popup) popup.opener = null;
    try {
      const review = await state.openReview(template.id);
      if (popup) popup.location.href = review.url;
      else window.open(review.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      popup?.close();
      toast.error(error instanceof Error ? error.message : "Không thể mở nội dung mẫu LUA.");
    }
  };

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary"><FileCode2 className="size-5" /></span>
          <div className="space-y-1"><h1 className="text-3xl font-semibold tracking-tight">Mẫu LUA hệ thống</h1><p className="text-muted-foreground">Quản lý chương trình LUA chuẩn dùng làm nguồn kỹ thuật cho các tổ chức.</p></div>
        </div>
        <div className="flex gap-2"><Button variant="outline" onClick={state.refresh} disabled={state.isLoading}><RefreshCw className="size-4" />Làm mới</Button>{canManage ? <Button onClick={() => setUploadOpen(true)}><Plus className="size-4" />Thêm mẫu LUA</Button> : null}</div>
      </section>

      {state.refreshWarning ? <div className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm"><span>{state.refreshWarning}</span><Button size="sm" variant="outline" onClick={state.refresh}>Thử tải lại</Button></div> : null}
      {state.error ? <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"><span>{state.error}</span><Button size="sm" variant="outline" onClick={state.refresh}>Thử lại</Button></div> : null}

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div><CardTitle>Kho mẫu toàn nền tảng</CardTitle><p className="mt-1 text-sm text-muted-foreground">{state.pagination.totalCount} mẫu LUA</p></div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative"><Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="w-full pl-9 sm:w-72" value={state.search} onChange={(event) => state.setSearch(event.target.value)} placeholder="Tìm theo mã hoặc tên mẫu..." /></div>
              <Select value={state.status} onValueChange={(value) => state.setStatus(value ?? "ALL")}><SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả trạng thái</SelectItem><SelectItem value="Draft">Bản nháp</SelectItem><SelectItem value="Published">Đã phát hành</SelectItem><SelectItem value="Retired">Đã ngừng sử dụng</SelectItem></SelectContent></Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Mẫu LUA</TableHead><TableHead>Runtime / Model</TableHead><TableHead>Hợp đồng kỹ thuật</TableHead><TableHead className="text-center">Trạng thái</TableHead><TableHead className="text-center">Xuất lúc</TableHead><TableHead className="text-center">Thao tác</TableHead></TableRow></TableHeader>
              <TableBody>
                {state.isLoading ? <TableRow><TableCell colSpan={6} className="h-40 text-center text-muted-foreground">Đang tải kho mẫu LUA...</TableCell></TableRow> : state.items.length === 0 ? <TableRow><TableCell colSpan={6} className="h-40 text-center text-muted-foreground">Chưa có mẫu LUA phù hợp.</TableCell></TableRow> : state.items.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell><p className="font-medium">{template.templateName}</p><p className="font-mono text-xs text-muted-foreground">{template.templateCode} · {template.fileName} · {formatBytes(template.contentLengthBytes)}</p></TableCell>
                    <TableCell><p>{template.runtimeTargetCode}</p><p className="text-xs text-muted-foreground">{template.machineModelCode}</p></TableCell>
                    <TableCell>{template.hasTechnicalContract ? <span className="inline-flex items-center gap-1 text-sm text-success"><GitBranch className="size-4" />Đã gán</span> : <span className="text-sm text-muted-foreground">Chưa gán</span>}</TableCell>
                    <TableCell className="text-center"><span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusClass(template.status)}`}>{STATUS_LABELS[template.status] ?? template.status}</span></TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">{formatDate(template.exportedAt)}</TableCell>
                    <TableCell><div className="flex justify-center gap-1"><Button variant="ghost" size="icon-sm" title="Xem nội dung LUA" aria-label={`Xem nội dung ${template.templateName}`} onClick={() => void openReview(template)}><ExternalLink className="size-4" /></Button>{canManage && template.status === "Draft" ? <><Button variant="ghost" size="icon-sm" title="Gán hợp đồng kỹ thuật" aria-label={`Gán hợp đồng cho ${template.templateName}`} onClick={() => setContractTarget(template)}><GitBranch className="size-4" /></Button><Button variant="outline" size="sm" disabled={!template.hasTechnicalContract || state.isMutating} onClick={() => setLifecycleTarget({ template, action: "publish" })}>Phát hành</Button><Button variant="ghost" size="icon-sm" className="text-destructive" title="Xóa bản nháp" aria-label={`Xóa bản nháp ${template.templateName}`} onClick={() => setLifecycleTarget({ template, action: "discard" })}><Trash2 className="size-4" /></Button></> : null}{canManage && template.status === "Published" ? <Button variant="outline" size="sm" onClick={() => setLifecycleTarget({ template, action: "retire" })}>Ngừng dùng</Button> : null}</div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <footer className="flex items-center justify-between border-t border-border px-6 py-4"><span className="text-sm text-muted-foreground">Trang {Math.max(1, state.pagination.page)} / {Math.max(1, state.pagination.totalPages)}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={!state.pagination.hasPrevious || state.isLoading} onClick={state.previousPage}><ChevronLeft className="size-4" />Trước</Button><Button size="sm" variant="outline" disabled={!state.pagination.hasNext || state.isLoading} onClick={state.nextPage}>Sau<ChevronRight className="size-4" /></Button></div></footer>
        </CardContent>
      </Card>

      <UploadTemplateDialog open={uploadOpen} pending={state.isMutating} onOpenChange={setUploadOpen} onSubmit={upload} />
      <ContractDialog template={contractTarget} contracts={state.contracts} pending={state.isMutating} onClose={() => setContractTarget(null)} onAssign={assign} />
      <Dialog open={Boolean(lifecycleTarget)} onOpenChange={(open) => { if (!open && !state.isMutating) setLifecycleTarget(null); }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{lifecycleTarget?.action === "discard" ? "Xóa bản nháp mẫu LUA?" : lifecycleTarget?.action === "retire" ? "Ngừng sử dụng mẫu LUA?" : "Phát hành mẫu LUA?"}</DialogTitle><DialogDescription>{lifecycleTarget?.action === "publish" ? "Mẫu đã phát hành có thể được các tổ chức sử dụng làm nguồn kỹ thuật." : "Hãy xác nhận thao tác vòng đời cho mẫu đã chọn."}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setLifecycleTarget(null)} disabled={state.isMutating}>Hủy</Button><Button variant={lifecycleTarget?.action === "discard" ? "destructive" : "default"} isLoading={state.isMutating} onClick={() => void changeLifecycle().catch((error) => toast.error(error instanceof Error ? error.message : "Không thể cập nhật mẫu LUA."))}>Xác nhận</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
