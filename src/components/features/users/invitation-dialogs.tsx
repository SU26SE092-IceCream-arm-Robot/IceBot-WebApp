"use client";

import { useState, type FormEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  Mail,
  RefreshCw,
  Send,
  UserPlus,
} from "lucide-react";

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
import type {
  AccountInvitationResult,
  CreateInternalAccountRequest,
  InternalAccountResult,
} from "@/types/accounts";

interface CreateAccountDialogProps {
  errorMessage: string | null;
  isSubmitting: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (request: CreateInternalAccountRequest) => Promise<boolean>;
}

interface RegenerateInvitationDialogProps {
  account: InternalAccountResult | null;
  errorMessage: string | null;
  isSubmitting: boolean;
  open: boolean;
  sendEmail: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  onSendEmailChange: (sendEmail: boolean) => void;
}

interface InvitationResultDialogProps {
  account: InternalAccountResult | null;
  mode: "created" | "regenerated" | null;
  open: boolean;
  result: AccountInvitationResult | null;
  onOpenChange: (open: boolean) => void;
}

const ROLE_OPTIONS = [
  { value: "SystemAdmin", label: "Admin hệ thống" },
  { value: "Manager", label: "Quản lý" },
  { value: "OrgAdmin", label: "Quản trị tổ chức" },
  { value: "LocationOwner", label: "Chủ địa điểm" },
  { value: "Staff", label: "Nhân viên" },
  { value: "Technician", label: "Kỹ thuật viên" },
] as const;

function FormField({
  children,
  htmlFor,
  label,
}: {
  children: React.ReactNode;
  htmlFor: string;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function CheckboxField({
  checked,
  description,
  disabled,
  id,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  disabled?: boolean;
  id: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/20 p-3"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 accent-primary"
      />
      <span className="space-y-0.5">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

export function CreateAccountDialog({
  errorMessage,
  isSubmitting,
  open,
  onOpenChange,
  onSubmit,
}: CreateAccountDialogProps) {
  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [roleCode, setRoleCode] = useState("Manager");
  const [localLoginEnabled, setLocalLoginEnabled] = useState(true);
  const [googleLoginEnabled, setGoogleLoginEnabled] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [sendInvitationEmail, setSendInvitationEmail] = useState(true);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  function resetForm() {
    setFullName("");
    setUserName("");
    setEmail("");
    setRoleCode("Manager");
    setLocalLoginEnabled(true);
    setGoogleLoginEnabled(false);
    setGoogleEmail("");
    setSendInvitationEmail(true);
    setValidationMessage(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isSubmitting) {
      resetForm();
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationMessage(null);

    if (!fullName.trim() || !userName.trim() || !email.trim()) {
      setValidationMessage("Vui lòng nhập họ tên, username và email.");
      return;
    }

    if (!localLoginEnabled && !googleLoginEnabled) {
      setValidationMessage("Cần bật ít nhất một phương thức đăng nhập.");
      return;
    }

    if (googleLoginEnabled && !googleEmail.trim()) {
      setValidationMessage("Vui lòng nhập email Google được phép đăng nhập.");
      return;
    }

    const succeeded = await onSubmit({
      userName: userName.trim(),
      email: email.trim(),
      fullName: fullName.trim(),
      gender: "Other",
      localLoginEnabled,
      initialPassword: null,
      googleLoginEnabled,
      googleEmail: googleLoginEnabled ? googleEmail.trim() : null,
      createInvitation: true,
      sendInvitationEmail,
      roles: [
        {
          roleCode,
          organizationId: null,
          storeId: null,
          kioskId: null,
        },
      ],
    });

    if (succeeded) {
      resetForm();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserPlus className="size-5" />
          </span>
          <DialogTitle>Tạo tài khoản bằng lời mời</DialogTitle>
          <DialogDescription>
            Tài khoản sẽ ở trạng thái Đã mời. Người dùng tự đặt mật khẩu qua liên kết lời mời.
          </DialogDescription>
        </DialogHeader>

        <form id="create-account-form" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <FormField htmlFor="fullName" label="Họ tên">
            <Input
              id="fullName"
              value={fullName}
              disabled={isSubmitting}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Nguyễn Văn A"
              required
            />
          </FormField>
          <FormField htmlFor="userName" label="Username">
            <Input
              id="userName"
              value={userName}
              disabled={isSubmitting}
              onChange={(event) => setUserName(event.target.value)}
              placeholder="nguyenvana"
              autoComplete="off"
              required
            />
          </FormField>
          <div className="sm:col-span-2">
            <FormField htmlFor="email" label="Email">
              <Input
                id="email"
                type="email"
                value={email}
                disabled={isSubmitting}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="user@icebot.vn"
                autoComplete="off"
                required
              />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField htmlFor="roleCode" label="Vai trò">
              <Select value={roleCode} onValueChange={(value) => setRoleCode(value ?? "Manager")}>
                <SelectTrigger id="roleCode" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="space-y-3 sm:col-span-2">
            <CheckboxField
              id="localLoginEnabled"
              checked={localLoginEnabled}
              disabled={isSubmitting}
              label="Đăng nhập bằng mật khẩu"
              description="Mặc định bật. Người dùng sẽ tự đặt mật khẩu khi chấp nhận lời mời."
              onChange={setLocalLoginEnabled}
            />
            <CheckboxField
              id="googleLoginEnabled"
              checked={googleLoginEnabled}
              disabled={isSubmitting}
              label="Đăng nhập bằng Google"
              description="Tùy chọn. Batch này chỉ cấu hình quyền đăng nhập, không thêm Google vào trang chấp nhận lời mời."
              onChange={setGoogleLoginEnabled}
            />
            {googleLoginEnabled ? (
              <FormField htmlFor="googleEmail" label="Email Google">
                <Input
                  id="googleEmail"
                  type="email"
                  value={googleEmail}
                  disabled={isSubmitting}
                  onChange={(event) => setGoogleEmail(event.target.value)}
                  placeholder="user@gmail.com"
                  required
                />
              </FormField>
            ) : null}
            <CheckboxField
              id="sendInvitationEmail"
              checked={sendInvitationEmail}
              disabled={isSubmitting}
              label="Gửi lời mời qua email"
              description="Nếu SMTP lỗi, backend vẫn trả token/link để gửi thủ công."
              onChange={setSendInvitationEmail}
            />
          </div>

          {validationMessage || errorMessage ? (
            <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 sm:col-span-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{validationMessage || errorMessage}</p>
            </div>
          ) : null}
        </form>

        <DialogFooter>
          <Button variant="outline" disabled={isSubmitting} onClick={() => handleOpenChange(false)}>
            Hủy
          </Button>
          <Button type="submit" form="create-account-form" isLoading={isSubmitting}>
            <Send className="size-4" />
            Tạo và gửi lời mời
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RegenerateInvitationDialog({
  account,
  errorMessage,
  isSubmitting,
  open,
  sendEmail,
  onConfirm,
  onOpenChange,
  onSendEmailChange,
}: RegenerateInvitationDialogProps) {
  const accountName = account?.fullName?.trim() || account?.userName || "tài khoản này";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isSubmitting}>
        <DialogHeader>
          <span className="flex size-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
            <RefreshCw className="size-5" />
          </span>
          <DialogTitle>Tạo lại lời mời?</DialogTitle>
          <DialogDescription>
            Backend sẽ tạo token mới cho <span className="font-medium text-foreground">{accountName}</span>.
            Các lời mời cũ đang hoạt động sẽ bị thu hồi.
          </DialogDescription>
        </DialogHeader>

        <CheckboxField
          id="regenerateSendEmail"
          checked={sendEmail}
          disabled={isSubmitting}
          label="Gửi lời mời mới qua email"
          description="Bỏ chọn nếu bạn chỉ muốn sao chép liên kết và gửi thủ công."
          onChange={onSendEmailChange}
        />

        {errorMessage ? (
          <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{errorMessage}</p>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button isLoading={isSubmitting} onClick={onConfirm}>
            Tạo lại lời mời
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

export function InvitationResultDialog({
  account,
  mode,
  open,
  result,
  onOpenChange,
}: InvitationResultDialogProps) {
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const invitationLink =
    result?.invitationUrl ||
    (result && typeof window !== "undefined"
      ? `${window.location.origin}/accept-invitation?token=${encodeURIComponent(result.invitationToken)}`
      : "");

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setCopyMessage(null);
    }
    onOpenChange(nextOpen);
  }

  async function copyValue(value: string, successMessage: string) {
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(value);
      setCopyMessage(successMessage);
    } catch {
      setCopyMessage("Không thể tự động sao chép. Hãy chọn nội dung bên dưới để sao chép thủ công.");
    }
  }

  const title = mode === "regenerated" ? "Đã tạo lại lời mời" : "Tài khoản đã được tạo";
  const accountName = account?.fullName?.trim() || account?.userName || "tài khoản";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <span className="flex size-10 items-center justify-center rounded-lg bg-success/10 text-success">
            <CheckCircle2 className="size-5" />
          </span>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Lưu liên kết mới cho {accountName}. Backend không cho đọc lại raw token sau khi đóng màn hình này.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div
              className={`flex gap-3 rounded-lg border p-3 ${
                result.emailSent
                  ? "border-success/30 bg-success/5 text-success"
                  : "border-warning/30 bg-warning/5 text-warning"
              }`}
            >
              <Mail className="mt-0.5 size-4 shrink-0" />
              <p className="text-sm">
                {result.emailSent
                  ? "Backend đã gửi email lời mời."
                  : "Email chưa được gửi. Hãy sao chép liên kết hoặc token và gửi thủ công."}
              </p>
            </div>

            {mode === "regenerated" ? (
              <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                Lời mời cũ đã bị thu hồi. Chỉ sử dụng liên kết mới bên dưới.
              </p>
            ) : null}

            <div className="space-y-2">
              <label htmlFor="invitationLink" className="text-sm font-medium text-foreground">
                Liên kết lời mời
              </label>
              <div className="flex gap-2">
                <Input id="invitationLink" value={invitationLink} readOnly className="font-mono text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Sao chép liên kết lời mời"
                  disabled={!invitationLink}
                  onClick={() => void copyValue(invitationLink, "Đã sao chép liên kết lời mời.")}
                >
                  <Clipboard className="size-4" />
                </Button>
              </div>
              {!result.invitationUrl ? (
                <p className="text-xs text-muted-foreground">
                  Backend chưa cấu hình InvitationBaseUrl; liên kết trên được frontend tạo từ origin hiện tại.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="invitationToken" className="text-sm font-medium text-foreground">
                Token dự phòng
              </label>
              <div className="flex gap-2">
                <Input
                  id="invitationToken"
                  value={result.invitationToken}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Sao chép token lời mời"
                  onClick={() => void copyValue(result.invitationToken, "Đã sao chép token lời mời.")}
                >
                  <Clipboard className="size-4" />
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Hết hạn: <span className="tabular-nums text-foreground">{formatDateTime(result.expiresAt)}</span>
            </p>

            {copyMessage ? (
              <p
                role="status"
                className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground"
              >
                {copyMessage}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3 text-warning">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p className="text-sm">Backend không trả thông tin lời mời trong response.</p>
          </div>
        )}

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
