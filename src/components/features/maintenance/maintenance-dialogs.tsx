"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ClipboardList,
  LockKeyhole,
  Pencil,
  Play,
  Plus,
  UserRoundCheck,
  Wrench,
} from "lucide-react";

import {
  MaintenancePriorityBadge,
  MaintenanceStatusBadge,
  formatMaintenanceDate,
} from "@/components/features/maintenance/maintenance-table";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InternalAccountResult } from "@/types/accounts";
import type { KioskResult } from "@/types/kiosk-management";
import type {
  CreateMaintenanceTicketRequest,
  MaintenanceEditorMode,
  MaintenancePriority,
  MaintenanceTicketResult,
  MaintenanceWorkflowAction,
  MaintenanceWorkflowSubmission,
  UpdateMaintenanceTicketRequest,
} from "@/types/maintenance";

const PRIORITY_OPTIONS: { value: MaintenancePriority; label: string }[] = [
  { value: "Low", label: "Thấp" },
  { value: "Medium", label: "Trung bình" },
  { value: "High", label: "Cao" },
  { value: "Critical", label: "Khẩn cấp" },
];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function DetailTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 break-words text-sm font-medium text-foreground">
        {value}
      </div>
    </div>
  );
}

function IdValue({ value }: { value?: string | null }) {
  return value ? (
    <span className="font-mono text-xs tabular-nums">{value}</span>
  ) : (
    <span className="text-muted-foreground">Chưa có</span>
  );
}

function canEditTicket(ticket: MaintenanceTicketResult): boolean {
  return ["Open", "Assigned", "InProgress"].includes(ticket.status);
}

function getAvailableWorkflowActions(
  ticket: MaintenanceTicketResult,
): MaintenanceWorkflowAction[] {
  switch (ticket.status) {
    case "Open":
      return ["assign", "start", "cancel"];
    case "Assigned":
      return ["start", "cancel"];
    case "InProgress":
      return ["resolve", "cancel"];
    case "Resolved":
      return ["close"];
    case "Closed":
    case "Cancelled":
      return [];
  }
}

const WORKFLOW_BUTTONS: Record<
  MaintenanceWorkflowAction,
  { label: string; icon: typeof Play; variant: "default" | "outline" | "destructive" }
> = {
  assign: { label: "Phân công", icon: UserRoundCheck, variant: "outline" },
  start: { label: "Bắt đầu xử lý", icon: Play, variant: "default" },
  resolve: { label: "Đánh dấu đã xử lý", icon: CheckCircle2, variant: "default" },
  close: { label: "Đóng ticket", icon: LockKeyhole, variant: "default" },
  cancel: { label: "Hủy ticket", icon: Ban, variant: "destructive" },
};

interface MaintenanceDetailDialogProps {
  errorMessage: string | null;
  isLoading: boolean;
  open: boolean;
  ticket: MaintenanceTicketResult | null;
  canManage: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (ticket: MaintenanceTicketResult) => void;
  onWorkflow: (
    ticket: MaintenanceTicketResult,
    action: MaintenanceWorkflowAction,
  ) => void;
}

export function MaintenanceDetailDialog({
  errorMessage,
  isLoading,
  open,
  ticket,
  canManage,
  onOpenChange,
  onEdit,
  onWorkflow,
}: MaintenanceDetailDialogProps) {
  const actions = ticket && canManage ? getAvailableWorkflowActions(ticket) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-warning/20 bg-warning/10 text-warning">
              <Wrench className="size-5" />
            </span>
            <div className="min-w-0 space-y-1">
              <DialogTitle>Chi tiết yêu cầu bảo trì</DialogTitle>
              <DialogDescription>
                Thông tin yêu cầu bảo trì và tiến độ xử lý.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`maintenance-detail-skeleton-${index}`} className="space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-5 w-full animate-pulse rounded bg-muted/60" />
              </div>
            ))}
          </div>
        ) : errorMessage ? (
          <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{errorMessage}</p>
          </div>
        ) : ticket ? (
          <div className="space-y-4 py-1">
            <div className="rounded-xl border border-border bg-muted/15 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-base font-semibold text-foreground">
                    {ticket.title}
                  </p>
                  <p className="font-mono text-xs tabular-nums text-muted-foreground">
                    {ticket.ticketNumber} · {ticket.id}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <MaintenanceStatusBadge status={ticket.status} />
                  <MaintenancePriorityBadge priority={ticket.priority} />
                </div>
              </div>
              {ticket.description ? (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {ticket.description}
                </p>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <DetailTile label="Mã lỗi" value={ticket.issueCode} />
              <DetailTile label="Kiosk" value={<IdValue value={ticket.kioskId} />} />
              <DetailTile label="Store" value={<IdValue value={ticket.storeId} />} />
              <DetailTile
                label="Organization"
                value={<IdValue value={ticket.organizationId} />}
              />
              <DetailTile label="Thiết bị" value={<IdValue value={ticket.deviceId} />} />
              <DetailTile label="Đơn hàng" value={<IdValue value={ticket.orderId} />} />
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <ClipboardList className="size-4" />
                </span>
                <p className="text-sm font-semibold text-foreground">Mốc xử lý</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <DetailTile label="Báo lúc" value={formatMaintenanceDate(ticket.reportedAt)} />
                <DetailTile label="Hạn xử lý" value={formatMaintenanceDate(ticket.dueAt)} />
                <DetailTile label="Phân công lúc" value={formatMaintenanceDate(ticket.assignedAt)} />
                <DetailTile label="Bắt đầu lúc" value={formatMaintenanceDate(ticket.startedAt)} />
                <DetailTile label="Xử lý lúc" value={formatMaintenanceDate(ticket.resolvedAt)} />
                <DetailTile label="Đóng lúc" value={formatMaintenanceDate(ticket.closedAt)} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailTile
                label="Người phụ trách"
                value={<IdValue value={ticket.assignedToAccountId} />}
              />
              <DetailTile
                label="Người tạo"
                value={<IdValue value={ticket.createdByAccountId} />}
              />
              <DetailTile label="Cập nhật lần cuối" value={formatMaintenanceDate(ticket.updatedAt)} />
              <DetailTile label="Device event" value={<IdValue value={ticket.deviceEventId} />} />
            </div>

            {ticket.resolutionNotes || ticket.cancelReason ? (
              <div className="rounded-xl border border-border bg-card p-4">
                {ticket.resolutionNotes ? (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Ghi chú xử lý
                    </p>
                    <p className="mt-2 text-sm text-foreground">{ticket.resolutionNotes}</p>
                  </div>
                ) : null}
                {ticket.cancelReason ? (
                  <div className={ticket.resolutionNotes ? "mt-4" : undefined}>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Lý do hủy
                    </p>
                    <p className="mt-2 text-sm text-foreground">{ticket.cancelReason}</p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <DialogFooter className="bg-background sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {ticket && canManage && canEditTicket(ticket) ? (
              <Button variant="outline" onClick={() => onEdit(ticket)}>
                <Pencil className="size-4" />
                Chỉnh sửa
              </Button>
            ) : null}
            {ticket
              ? actions.map((action) => {
                  const config = WORKFLOW_BUTTONS[action];
                  const Icon = config.icon;
                  return (
                    <Button
                      key={action}
                      variant={config.variant}
                      onClick={() => onWorkflow(ticket, action)}
                    >
                      <Icon className="size-4" />
                      {config.label}
                    </Button>
                  );
                })
              : null}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface MaintenanceEditorDialogProps {
  mode: MaintenanceEditorMode;
  ticket: MaintenanceTicketResult | null;
  kiosks: KioskResult[];
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onCreate: (request: CreateMaintenanceTicketRequest) => Promise<boolean>;
  onUpdate: (request: UpdateMaintenanceTicketRequest) => Promise<boolean>;
}

export function MaintenanceEditorDialog({
  mode,
  ticket,
  kiosks,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onCreate,
  onUpdate,
}: MaintenanceEditorDialogProps) {
  const isCreate = mode === "create";
  const [kioskId, setKioskId] = useState(ticket?.kioskId ?? "");
  const [title, setTitle] = useState(ticket?.title ?? "");
  const [description, setDescription] = useState(ticket?.description ?? "");
  const [issueCode, setIssueCode] = useState(ticket?.issueCode ?? "GENERAL");
  const [priority, setPriority] = useState<MaintenancePriority>(
    ticket?.priority ?? "Medium",
  );
  const [deviceId, setDeviceId] = useState(ticket?.deviceId ?? "");
  const [orderId, setOrderId] = useState(ticket?.orderId ?? "");
  const [deviceEventId, setDeviceEventId] = useState(ticket?.deviceEventId ?? "");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const validateOptionalUuid = (value: string, label: string): string | null => {
    const normalized = value.trim();
    return normalized && !UUID_PATTERN.test(normalized)
      ? `${label} phải là UUID hợp lệ.`
      : null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!title.trim()) {
      setValidationMessage("Tiêu đề là bắt buộc.");
      return;
    }
    if (title.trim().length > 200) {
      setValidationMessage("Tiêu đề không được vượt quá 200 ký tự.");
      return;
    }
    if (description.trim().length > 1000) {
      setValidationMessage("Mô tả không được vượt quá 1000 ký tự.");
      return;
    }

    const uuidError =
      validateOptionalUuid(deviceId, "Device ID") ||
      validateOptionalUuid(orderId, "Order ID") ||
      validateOptionalUuid(deviceEventId, "Device event ID");
    if (uuidError) {
      setValidationMessage(uuidError);
      return;
    }

    const sharedRequest: UpdateMaintenanceTicketRequest = {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      deviceId: deviceId.trim() || null,
      orderId: orderId.trim() || null,
      deviceEventId: deviceEventId.trim() || null,
    };

    setValidationMessage(null);
    if (!isCreate) {
      await onUpdate(sharedRequest);
      return;
    }

    const kiosk = kiosks.find((item) => item.id === kioskId);
    if (!kiosk) {
      setValidationMessage("Vui lòng chọn một kiosk hợp lệ.");
      return;
    }
    if (issueCode.trim().length > 100) {
      setValidationMessage("Mã lỗi không được vượt quá 100 ký tự.");
      return;
    }

    await onCreate({
      ...sharedRequest,
      organizationId: kiosk.organizationId,
      storeId: kiosk.storeId,
      kioskId: kiosk.id,
      issueCode: issueCode.trim() || null,
    });
  };

  const visibleError = validationMessage || errorMessage;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <div className="flex items-start gap-3 pr-8">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              {isCreate ? <Plus className="size-5" /> : <Pencil className="size-5" />}
            </span>
            <div className="space-y-1">
              <DialogTitle>{isCreate ? "Tạo yêu cầu bảo trì" : "Chỉnh sửa yêu cầu"}</DialogTitle>
              <DialogDescription>
                {isCreate
                  ? "Ghi nhận sự cố cần theo dõi và xử lý."
                  : `${ticket?.ticketNumber ?? "Ticket"} · chỉ cập nhật thông tin được backend cho phép.`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {isCreate ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Kiosk <span className="text-destructive">*</span></label>
              <Select value={kioskId || null} disabled={isSubmitting} onValueChange={(value) => setKioskId(value ?? "")}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Chọn kiosk">
                    {kiosks.find((item) => item.id === kioskId)?.name ?? "Chọn kiosk"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {kiosks.map((kiosk) => (
                    <SelectItem key={kiosk.id} value={kiosk.id}>
                      {kiosk.name} ({kiosk.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {kiosks.length === 0 ? (
                <p className="text-xs text-warning">Chưa tải được kiosk để tạo ticket mới.</p>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="maintenance-title" className="text-sm font-medium">
                Tiêu đề <span className="text-destructive">*</span>
              </label>
              <Input id="maintenance-title" value={title} maxLength={200} disabled={isSubmitting} className="h-10" onChange={(event) => setTitle(event.target.value)} />
            </div>
            {isCreate ? (
              <div className="space-y-1.5">
                <label htmlFor="maintenance-issue" className="text-sm font-medium">Mã lỗi</label>
                <Input id="maintenance-issue" value={issueCode} maxLength={100} disabled={isSubmitting} className="h-10 font-mono" onChange={(event) => setIssueCode(event.target.value)} />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Mức độ ưu tiên</label>
              <Select value={priority} disabled={isSubmitting} onValueChange={(value) => {
                if (PRIORITY_OPTIONS.some((option) => option.value === value)) {
                  setPriority(value as MaintenancePriority);
                }
              }}>
                <SelectTrigger className="h-10 w-full"><SelectValue>{PRIORITY_OPTIONS.find((option) => option.value === priority)?.label}</SelectValue></SelectTrigger>
                <SelectContent>{PRIORITY_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="maintenance-description" className="text-sm font-medium">Mô tả</label>
              <textarea id="maintenance-description" value={description} maxLength={1000} disabled={isSubmitting} rows={4} className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50" onChange={(event) => setDescription(event.target.value)} />
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border border-border bg-muted/15 p-4 sm:grid-cols-3">
            {[
              ["Device ID", deviceId, setDeviceId],
              ["Order ID", orderId, setOrderId],
              ["Device event ID", deviceEventId, setDeviceEventId],
            ].map(([label, value, setter]) => (
              <div key={label as string} className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{label as string}</label>
                <Input value={value as string} disabled={isSubmitting} placeholder="Không bắt buộc" className="h-9 font-mono text-xs" onChange={(event) => (setter as (value: string) => void)(event.target.value)} />
              </div>
            ))}
          </div>

          {visibleError ? (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p>{visibleError}</p>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" isLoading={isSubmitting} disabled={isCreate && kiosks.length === 0}>
              {isCreate ? <Plus className="size-4" /> : <Pencil className="size-4" />}
              {isCreate ? "Tạo yêu cầu" : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface MaintenanceWorkflowDialogProps {
  action: MaintenanceWorkflowAction;
  ticket: MaintenanceTicketResult;
  technicians: InternalAccountResult[];
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (submission: MaintenanceWorkflowSubmission) => Promise<boolean>;
}

export function MaintenanceWorkflowDialog({
  action,
  ticket,
  technicians,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onSubmit,
}: MaintenanceWorkflowDialogProps) {
  const [accountId, setAccountId] = useState("");
  const [notes, setNotes] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const config = WORKFLOW_BUTTONS[action];
  const Icon = config.icon;
  const eligibleTechnicians = technicians.filter((account) =>
    account.roles.some(
      (role) =>
        role.roleCode === "Technician" &&
        (!role.organizationId || role.organizationId === ticket.organizationId) &&
        (!role.storeId || role.storeId === ticket.storeId) &&
        (!role.kioskId || role.kioskId === ticket.kioskId),
    ),
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (action === "assign" && !UUID_PATTERN.test(accountId.trim())) {
      setValidationMessage("Vui lòng chọn hoặc nhập Account ID hợp lệ.");
      return;
    }
    if (action === "resolve" && !notes.trim()) {
      setValidationMessage("Ghi chú xử lý là bắt buộc.");
      return;
    }
    if (action === "cancel" && !notes.trim()) {
      setValidationMessage("Lý do hủy là bắt buộc.");
      return;
    }

    setValidationMessage(null);
    await onSubmit({
      accountId: action === "assign" ? accountId.trim() : undefined,
      resolutionNotes: action === "resolve" ? notes.trim() : undefined,
      reason: action === "cancel" ? notes.trim() : undefined,
    });
  };

  const descriptions: Record<MaintenanceWorkflowAction, string> = {
    assign: "Chọn kỹ thuật viên chịu trách nhiệm xử lý ticket.",
    start: "Ticket sẽ chuyển sang trạng thái Đang xử lý.",
    resolve: "Ghi lại kết quả xử lý trước khi chờ đóng ticket.",
    close: "Ticket đã xử lý sẽ được đóng và kết thúc workflow.",
    cancel: "Ticket sẽ bị hủy và không thể tiếp tục workflow.",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <div className="flex items-start gap-3 pr-8">
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${action === "cancel" ? "border-destructive/20 bg-destructive/10 text-destructive" : "border-primary/20 bg-primary/10 text-primary"}`}>
              <Icon className="size-5" />
            </span>
            <div className="space-y-1">
              <DialogTitle>{config.label}</DialogTitle>
              <DialogDescription>{ticket.ticketNumber} · {descriptions[action]}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {action === "assign" ? (
            <div className="space-y-1.5">
              <label htmlFor="maintenance-account" className="text-sm font-medium">Kỹ thuật viên <span className="text-destructive">*</span></label>
              <Input id="maintenance-account" list="maintenance-technician-options" value={accountId} disabled={isSubmitting} placeholder="Chọn hoặc nhập Account ID" className="h-10 font-mono" onChange={(event) => setAccountId(event.target.value)} />
              <datalist id="maintenance-technician-options">
                {eligibleTechnicians.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.fullName?.trim() || account.userName} · {account.email}
                  </option>
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">
                {eligibleTechnicians.length > 0
                  ? `${eligibleTechnicians.length} tài khoản Technician phù hợp phạm vi.`
                  : "Không tải được danh sách Technician; có thể nhập Account ID hợp lệ."}
              </p>
            </div>
          ) : null}

          {action === "resolve" || action === "cancel" ? (
            <div className="space-y-1.5">
              <label htmlFor="maintenance-workflow-note" className="text-sm font-medium">
                {action === "resolve" ? "Ghi chú xử lý" : "Lý do hủy"} <span className="text-destructive">*</span>
              </label>
              <textarea id="maintenance-workflow-note" value={notes} disabled={isSubmitting} rows={4} className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50" onChange={(event) => setNotes(event.target.value)} />
            </div>
          ) : (
            action !== "assign" && (
              <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
                Xác nhận thao tác với <span className="font-medium text-foreground">{ticket.title}</span>.
              </div>
            )
          )}

          {validationMessage || errorMessage ? (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p>{validationMessage || errorMessage}</p>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Quay lại</Button>
            <Button type="submit" variant={config.variant} isLoading={isSubmitting}>
              <Icon className="size-4" />
              Xác nhận
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
