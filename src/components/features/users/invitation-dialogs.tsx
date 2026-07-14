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
  ManagementRoleResult,
  ManagementScopeType,
  RoleScopeOptionsResult,
} from "@/types/accounts";

interface CreateAccountDialogProps {
  errorMessage: string | null;
  isSubmitting: boolean;
  managementRoles: ManagementRoleResult[];
  open: boolean;
  roleCode: string;
  roleCatalogErrorMessage: string | null;
  roleScopeErrorMessage: string | null;
  roleScopeOptions: RoleScopeOptionsResult | null;
  isRoleCatalogLoading: boolean;
  isRoleScopeLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleChange: (roleCode: string) => void;
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

type AssignableScopeType = Extract<
  ManagementScopeType,
  "Organization" | "Store" | "Kiosk"
>;

const SCOPE_TYPE_LABELS: Record<AssignableScopeType, string> = {
  Organization: "Tổ chức",
  Store: "Cửa hàng",
  Kiosk: "Kiosk",
};

function getRoleDisplayLabel(role: ManagementRoleResult): string {
  const labelByCode: Record<string, string> = {
    Admin: "Quản trị hệ thống",
    SystemAdmin: "Quản trị hệ thống",
    OrgAdmin: "Quản trị tổ chức",
    Manager: "Quản lý",
    Staff: "Nhân viên",
    Technician: "Kỹ thuật viên",
  };
  return labelByCode[role.code] ?? role.name ?? role.code;
}

function getRoleDescription(role: ManagementRoleResult): string | null {
  const descriptionByCode: Record<string, string> = {
    Admin: "Toàn quyền quản trị hệ thống.",
    SystemAdmin: "Toàn quyền quản trị hệ thống.",
    OrgAdmin: "Quản trị dữ liệu trong phạm vi tổ chức được phân quyền.",
    Manager: "Quản lý vận hành trong phạm vi được phân quyền.",
    Staff: "Nhân sự vận hành với quyền thao tác giới hạn.",
    Technician: "Kỹ thuật viên phụ trách bảo trì và xử lý sự cố.",
  };
  return descriptionByCode[role.code] ?? role.description ?? null;
}

function formatScopeOptionLabel(name?: string | null, code?: string | null): string {
  const safeName = name?.trim();
  const safeCode = code?.trim();
  if (safeName && safeCode) return `${safeName} — ${safeCode}`;
  if (safeName) return safeName;
  if (safeCode) return safeCode;
  return "Không xác định";
}

function isAssignableScopeType(
  value: string | null
): value is AssignableScopeType {
  return value === "Organization" || value === "Store" || value === "Kiosk";
}

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
  managementRoles,
  open,
  roleCode,
  roleCatalogErrorMessage,
  roleScopeErrorMessage,
  roleScopeOptions,
  isRoleCatalogLoading,
  isRoleScopeLoading,
  onOpenChange,
  onRoleChange,
  onSubmit,
}: CreateAccountDialogProps) {
  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [scopeType, setScopeType] = useState<AssignableScopeType | "">("");
  const [organizationId, setOrganizationId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [kioskId, setKioskId] = useState("");
  const [localLoginEnabled, setLocalLoginEnabled] = useState(true);
  const [googleLoginEnabled, setGoogleLoginEnabled] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [sendInvitationEmail, setSendInvitationEmail] = useState(true);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const selectedRole =
    managementRoles.find((role) => role.code === roleCode) ?? null;
  const selectableScopeTypes = (roleScopeOptions?.allowedScopeTypes ?? []).filter(
    (scope): scope is AssignableScopeType => isAssignableScopeType(scope)
  );
  const selectedOrganization =
    roleScopeOptions?.organizations.find(
      (organization) => organization.id === organizationId
    ) ?? null;
  const availableStores = selectedOrganization?.stores ?? [];
  const selectedStore =
    availableStores.find((store) => store.id === storeId) ?? null;
  const availableKiosks = selectedStore?.kiosks ?? [];
  const scopeOptionsReady =
    Boolean(roleCode) && roleScopeOptions?.roleCode === roleCode;
  const effectiveScopeType =
    selectableScopeTypes.length === 1 ? selectableScopeTypes[0] : scopeType;
  const hasValidScopeType =
    effectiveScopeType !== "" &&
    selectableScopeTypes.includes(effectiveScopeType);
  const scopeSelectionComplete =
    scopeOptionsReady &&
    (!roleScopeOptions?.requiresScope ||
      (hasValidScopeType &&
        Boolean(organizationId) &&
        (effectiveScopeType === "Organization" || Boolean(storeId)) &&
        (effectiveScopeType !== "Kiosk" || Boolean(kioskId))));
  const formBlocked =
    isSubmitting ||
    isRoleCatalogLoading ||
    isRoleScopeLoading ||
    Boolean(roleCatalogErrorMessage) ||
    Boolean(roleScopeErrorMessage) ||
    !selectedRole ||
    !scopeSelectionComplete;

  function resetScopeSelection() {
    setScopeType("");
    setOrganizationId("");
    setStoreId("");
    setKioskId("");
    setValidationMessage(null);
  }

  function resetForm() {
    setFullName("");
    setUserName("");
    setEmail("");
    setScopeType("");
    setOrganizationId("");
    setStoreId("");
    setKioskId("");
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
      setValidationMessage("Vui lòng nhập họ tên, tên đăng nhập và email.");
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

    if (
      !selectedRole ||
      !roleScopeOptions ||
      roleScopeOptions.roleCode !== roleCode
    ) {
      setValidationMessage("Vui lòng chọn một vai trò hợp lệ từ hệ thống.");
      return;
    }

    if (roleScopeOptions.requiresScope) {
      if (
        !effectiveScopeType ||
        !selectableScopeTypes.includes(effectiveScopeType)
      ) {
        setValidationMessage("Vui lòng chọn loại phạm vi cho vai trò.");
        return;
      }

      if (!organizationId) {
        setValidationMessage("Vui lòng chọn tổ chức.");
        return;
      }

      if (
        (effectiveScopeType === "Store" ||
          effectiveScopeType === "Kiosk") &&
        !storeId
      ) {
        setValidationMessage("Vui lòng chọn cửa hàng.");
        return;
      }

      if (effectiveScopeType === "Kiosk" && !kioskId) {
        setValidationMessage("Vui lòng chọn kiosk.");
        return;
      }
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
          organizationId:
            roleScopeOptions.requiresScope && effectiveScopeType
              ? organizationId
              : null,
          storeId:
            effectiveScopeType === "Store" ||
            effectiveScopeType === "Kiosk"
              ? storeId
              : null,
          kioskId: effectiveScopeType === "Kiosk" ? kioskId : null,
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
          <FormField htmlFor="userName" label="Tên đăng nhập">
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
              <Select
                value={roleCode || null}
                disabled={isSubmitting || isRoleCatalogLoading || managementRoles.length === 0}
                onValueChange={(value) => {
                  if (value) {
                    resetScopeSelection();
                    onRoleChange(value);
                  }
                }}
              >
                <SelectTrigger id="roleCode" className="w-full">
                  <SelectValue
                    placeholder={
                      isRoleCatalogLoading
                        ? "Đang tải vai trò..."
                        : "Chọn vai trò"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {managementRoles.map((role) => (
                    <SelectItem key={role.code} value={role.code}>
                      {getRoleDisplayLabel(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRole ? (
                <p className="text-xs leading-5 text-muted-foreground">
                  {getRoleDescription(selectedRole)}
                </p>
              ) : null}
            </FormField>
          </div>

          {isRoleScopeLoading ? (
            <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3 sm:col-span-2">
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
              <div className="h-8 w-full animate-pulse rounded bg-muted/60" />
            </div>
          ) : roleScopeOptions?.requiresScope ? (
            <div className="grid gap-4 rounded-lg border border-border bg-muted/20 p-3 sm:col-span-2 sm:grid-cols-2">
              {selectableScopeTypes.length > 1 ? (
                <FormField htmlFor="scopeType" label="Loại phạm vi">
                  <Select
                    value={scopeType || null}
                    disabled={isSubmitting}
                    onValueChange={(value) => {
                      if (isAssignableScopeType(value)) {
                        setScopeType(value);
                        setOrganizationId("");
                        setStoreId("");
                        setKioskId("");
                        setValidationMessage(null);
                      }
                    }}
                  >
                    <SelectTrigger id="scopeType" className="w-full">
                      <SelectValue placeholder="Chọn loại phạm vi" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectableScopeTypes.map((scope) => (
                        <SelectItem key={scope} value={scope}>
                          {SCOPE_TYPE_LABELS[scope]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              ) : (
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Phạm vi yêu cầu
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {effectiveScopeType
                      ? SCOPE_TYPE_LABELS[effectiveScopeType]
                      : "Không được hỗ trợ"}
                  </p>
                </div>
              )}

              {effectiveScopeType ? (
                <FormField htmlFor="organizationId" label="Tổ chức">
                  <Select
                    value={organizationId || null}
                    disabled={
                      isSubmitting || roleScopeOptions.organizations.length === 0
                    }
                    onValueChange={(value) => {
                      setOrganizationId(value ?? "");
                      setStoreId("");
                      setKioskId("");
                      setValidationMessage(null);
                    }}
                  >
                    <SelectTrigger id="organizationId" className="w-full">
                      <SelectValue placeholder="Chọn tổ chức" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleScopeOptions.organizations.map((organization) => (
                        <SelectItem key={organization.id} value={organization.id}>
                          {formatScopeOptionLabel(organization.name, organization.code)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              ) : null}

              {(effectiveScopeType === "Store" ||
                effectiveScopeType === "Kiosk") &&
              organizationId ? (
                <FormField htmlFor="storeId" label="Cửa hàng">
                  <Select
                    value={storeId || null}
                    disabled={isSubmitting || availableStores.length === 0}
                    onValueChange={(value) => {
                      setStoreId(value ?? "");
                      setKioskId("");
                      setValidationMessage(null);
                    }}
                  >
                    <SelectTrigger id="storeId" className="w-full">
                      <SelectValue placeholder="Chọn cửa hàng" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {formatScopeOptionLabel(store.name, store.code)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              ) : null}

              {effectiveScopeType === "Kiosk" && storeId ? (
                <div className="sm:col-span-2">
                  <FormField htmlFor="kioskId" label="Kiosk">
                    <Select
                      value={kioskId || null}
                      disabled={isSubmitting || availableKiosks.length === 0}
                      onValueChange={(value) => {
                        setKioskId(value ?? "");
                        setValidationMessage(null);
                      }}
                    >
                      <SelectTrigger id="kioskId" className="w-full">
                        <SelectValue placeholder="Chọn kiosk" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableKiosks.map((kiosk) => (
                          <SelectItem key={kiosk.id} value={kiosk.id}>
                            {formatScopeOptionLabel(kiosk.name, kiosk.code)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
              ) : null}
            </div>
          ) : scopeOptionsReady ? (
            <p className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground sm:col-span-2">
              Vai trò này áp dụng toàn hệ thống và không yêu cầu phạm vi tổ chức, cửa hàng hoặc kiosk.
            </p>
          ) : null}

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
              description="Nếu email không gửi được, hệ thống vẫn hiển thị liên kết để gửi thủ công."
              onChange={setSendInvitationEmail}
            />
          </div>

          {validationMessage ||
          roleCatalogErrorMessage ||
          roleScopeErrorMessage ||
          errorMessage ? (
            <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 sm:col-span-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">
                {validationMessage ||
                  roleCatalogErrorMessage ||
                  roleScopeErrorMessage ||
                  errorMessage}
              </p>
            </div>
          ) : null}
        </form>

        <DialogFooter>
          <Button variant="outline" disabled={isSubmitting} onClick={() => handleOpenChange(false)}>
            Hủy
          </Button>
          <Button
            type="submit"
            form="create-account-form"
            isLoading={isSubmitting}
            disabled={formBlocked}
          >
            <Send className="size-4" />
            Tạo lời mời
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
            Tạo token mới cho <span className="font-medium text-foreground">{accountName}</span>.
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
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
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
  const token = result?.invitationToken?.trim() ?? "";
  const invitationLink =
    result?.invitationUrl ||
    (token && typeof window !== "undefined"
      ? `${window.location.origin}/accept-invitation?token=${encodeURIComponent(token)}`
      : "");
  const emailSent = Boolean(result?.emailSentAt || result?.emailSent);

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
            Lưu liên kết lời mời cho {accountName}. Thông tin lời mời chỉ hiển thị một lần — đóng màn hình này sau khi đã sao chép.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div
              className={`flex gap-3 rounded-lg border p-3 ${
                emailSent
                  ? "border-success/30 bg-success/5 text-success"
                  : "border-warning/30 bg-warning/5 text-warning"
              }`}
            >
              <Mail className="mt-0.5 size-4 shrink-0" />
              <p className="text-sm">
                {emailSent
                  ? "Email lời mời đã được gửi."
                  : "Email chưa được gửi. Hãy sao chép liên kết lời mời và gửi thủ công."}
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
                  Liên kết được tạo từ địa chỉ web hiện tại. Liên hệ quản trị hệ thống nếu cần liên kết chính thức.
                </p>
              ) : null}
            </div>

            {token ? (
              <div className="space-y-2">
                <label htmlFor="invitationToken" className="text-sm font-medium text-foreground">
                  Token dự phòng
                </label>
                <div className="flex gap-2">
                  <Input
                    id="invitationToken"
                    value={token}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Sao chép token lời mời"
                    onClick={() => void copyValue(token, "Đã sao chép token lời mời.")}
                  >
                    <Clipboard className="size-4" />
                  </Button>
                </div>
              </div>
            ) : null}

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
            <p className="text-sm">Không nhận được thông tin lời mời. Thử lại hoặc liên hệ quản trị hệ thống.</p>
          </div>
        )}

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
