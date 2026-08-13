"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  History,
} from "lucide-react";

import { TenantEmptyState, TenantStatusBadge, formatTenantDate } from "@/components/features/tenants/shared/tenant-ui";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  OrganizationLifecycleAction,
  OrganizationLifecycleTransitionRequest,
  OrganizationResult,
  OrganizationStatusTransitionResult,
  TenantEntityStatus,
} from "@/types/tenants/management";

interface LifecycleActionOption {
  value: OrganizationLifecycleAction;
  label: string;
  description: string;
  tone: "warning" | "destructive" | "success";
}

const ACTIONS: Record<OrganizationLifecycleAction, LifecycleActionOption> = {
  suspend: {
    value: "suspend",
    label: "Tạm đình chỉ",
    description: "Tạm khóa quyền truy cập theo tổ chức cho đến khi được khôi phục.",
    tone: "warning",
  },
  resume: {
    value: "resume",
    label: "Khôi phục hoạt động",
    description: "Cho phép tổ chức đang tạm đình chỉ hoạt động trở lại.",
    tone: "success",
  },
  deactivate: {
    value: "deactivate",
    label: "Ngừng hoạt động",
    description: "Kết thúc hoạt động của tổ chức nhưng không xóa dữ liệu hiện có.",
    tone: "destructive",
  },
  reactivate: {
    value: "reactivate",
    label: "Kích hoạt lại",
    description: "Đưa tổ chức đã ngừng hoạt động trở lại sau khi xác nhận readiness.",
    tone: "success",
  },
};

export function getOrganizationLifecycleActions(
  status: TenantEntityStatus,
): LifecycleActionOption[] {
  if (status === "Active") return [ACTIONS.suspend, ACTIONS.deactivate];
  if (status === "Suspended") return [ACTIONS.resume, ACTIONS.deactivate];
  if (status === "Inactive") return [ACTIONS.reactivate];
  return [];
}

export function getOrganizationLifecycleActionLabel(
  action: OrganizationLifecycleAction,
): string {
  return ACTIONS[action].label.toLocaleLowerCase("vi-VN");
}

function requestId(): string {
  return globalThis.crypto?.randomUUID?.() ??
    `organization-lifecycle-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

interface OrganizationLifecycleDialogProps {
  organization: OrganizationResult;
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (
    action: OrganizationLifecycleAction,
    request: OrganizationLifecycleTransitionRequest,
  ) => Promise<boolean>;
}

export function OrganizationLifecycleDialog({
  organization,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onConfirm,
}: OrganizationLifecycleDialogProps) {
  const availableActions = getOrganizationLifecycleActions(organization.status);
  const [action, setAction] = useState<OrganizationLifecycleAction | "">(
    availableActions.length === 1 ? availableActions[0].value : "",
  );
  const [reasonCode, setReasonCode] = useState("");
  const [reason, setReason] = useState("");
  const [readinessConfirmed, setReadinessConfirmed] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const idempotencyKeyRef = useRef(requestId());
  const selectedAction = action ? ACTIONS[action] : null;

  const submit = async () => {
    if (isSubmitting || !action) return;
    if (action === "suspend" && !reasonCode.trim()) {
      setValidationMessage("Mã lý do tạm đình chỉ là bắt buộc.");
      return;
    }
    if (!reason.trim()) {
      setValidationMessage("Vui lòng nhập lý do thay đổi trạng thái.");
      return;
    }
    if (action === "reactivate" && !readinessConfirmed) {
      setValidationMessage("Cần xác nhận tổ chức đã sẵn sàng vận hành.");
      return;
    }

    setValidationMessage(null);
    await onConfirm(action, {
      reasonCode: action === "suspend" ? reasonCode.trim() : null,
      reason: reason.trim(),
      expectedRevision: organization.statusRevision,
      idempotencyKey: idempotencyKeyRef.current,
      readinessConfirmed: action === "reactivate" && readinessConfirmed,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <div className="flex items-start gap-3 pr-8">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-warning/20 bg-warning/10 text-warning">
              <AlertTriangle className="size-5" />
            </span>
            <div className="space-y-1">
              <DialogTitle>Thay đổi trạng thái tổ chức</DialogTitle>
              <DialogDescription>{organization.name} · revision {organization.statusRevision}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {availableActions.length === 0 ? (
          <p className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            Trạng thái hiện tại không có chuyển đổi lifecycle được backend hỗ trợ.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="organization-lifecycle-action" className="text-sm font-medium">Thao tác</label>
              <Select
                value={action}
                disabled={isSubmitting}
                onValueChange={(value) => {
                  setAction(value as OrganizationLifecycleAction);
                  setValidationMessage(null);
                }}
              >
                <SelectTrigger id="organization-lifecycle-action" className="w-full">
                  <SelectValue placeholder="Chọn trạng thái tiếp theo" />
                </SelectTrigger>
                <SelectContent>
                  {availableActions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAction ? <p className="text-xs leading-5 text-muted-foreground">{selectedAction.description}</p> : null}
            </div>

            {action === "suspend" ? (
              <div className="space-y-2">
                <label htmlFor="organization-lifecycle-reason-code" className="text-sm font-medium">Mã lý do <span className="text-destructive">*</span></label>
                <Input
                  id="organization-lifecycle-reason-code"
                  value={reasonCode}
                  maxLength={100}
                  disabled={isSubmitting}
                  placeholder="Ví dụ: POLICY_REVIEW"
                  onChange={(event) => setReasonCode(event.target.value)}
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <label htmlFor="organization-lifecycle-reason" className="text-sm font-medium">Lý do <span className="text-destructive">*</span></label>
              <textarea
                id="organization-lifecycle-reason"
                value={reason}
                maxLength={1000}
                disabled={isSubmitting}
                rows={4}
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Ghi rõ căn cứ và phạm vi ảnh hưởng của thao tác."
                onChange={(event) => setReason(event.target.value)}
              />
            </div>

            {action === "reactivate" ? (
              <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/15 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={readinessConfirmed}
                  disabled={isSubmitting}
                  className="mt-0.5 size-4 accent-primary"
                  onChange={(event) => setReadinessConfirmed(event.target.checked)}
                />
                <span>
                  <span className="block font-medium">Đã xác nhận sẵn sàng vận hành</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">Các điều kiện cần thiết đã được kiểm tra trước khi kích hoạt lại.</span>
                </span>
              </label>
            ) : null}

            {validationMessage || errorMessage ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {validationMessage || errorMessage}
              </p>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button
            variant={selectedAction?.tone === "destructive" ? "destructive" : "default"}
            disabled={!action || availableActions.length === 0}
            isLoading={isSubmitting}
            onClick={() => void submit()}
          >
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface OrganizationStatusHistoryProps {
  history: OrganizationStatusTransitionResult[];
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
}

export function OrganizationStatusHistory({
  history,
  isLoading,
  errorMessage,
  onRetry,
}: OrganizationStatusHistoryProps) {
  return (
    <Card className="gap-0 rounded-xl border border-border/80 py-0 shadow-none">
      <CardHeader className="border-b border-border px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><History className="size-5" /></span>
            <div><CardTitle className="text-base">Lịch sử trạng thái</CardTitle><p className="mt-0.5 text-xs text-muted-foreground">Các thay đổi lifecycle do System Admin thực hiện.</p></div>
          </div>
          <Button variant="outline" size="sm" disabled={isLoading} onClick={onRetry}>Làm mới</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? <p className="px-5 py-8 text-center text-sm text-muted-foreground">Đang tải lịch sử...</p> : errorMessage ? <div className="flex items-center justify-between gap-3 px-5 py-4 text-sm text-destructive"><span>{errorMessage}</span><Button variant="outline" size="sm" onClick={onRetry}>Thử lại</Button></div> : history.length === 0 ? <TenantEmptyState title="Chưa có thay đổi trạng thái" description="Tổ chức chưa phát sinh lịch sử lifecycle." /> : (
          <div className="divide-y divide-border">
            {history.map((item) => (
              <div key={item.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(220px,0.8fr)_minmax(260px,1.5fr)_auto] md:items-center">
                <div className="flex items-center gap-2"><TenantStatusBadge status={item.fromStatus} /><span className="text-muted-foreground">→</span><TenantStatusBadge status={item.toStatus} /></div>
                <div><p className="text-sm text-foreground">{item.reason}</p>{item.reasonCode ? <p className="mt-1 font-mono text-xs text-muted-foreground">{item.reasonCode}</p> : null}</div>
                <div className="text-left text-xs tabular-nums text-muted-foreground md:text-right"><p>{formatTenantDate(item.changedAt)}</p><p className="mt-1">Revision {item.organizationStatusRevision}</p></div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
