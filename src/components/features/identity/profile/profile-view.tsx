"use client";

import { useState, type FormEvent } from "react";
import {
  BadgeCheck,
  BellRing,
  CalendarClock,
  KeyRound,
  Laptop,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useAuth } from "@/hooks/identity/use-auth";
import { useProfile } from "@/hooks/identity/use-profile";
import { getRoleLabel, isBackendRoleCode } from "@/lib/role-labels";
import type {
  CurrentAccountNotificationDevice,
  CurrentAccountProfile,
  CurrentAccountSession,
} from "@/types/identity/profile";

const GENDER_OPTIONS = [
  { value: "Male", label: "Nam" },
  { value: "Female", label: "Nữ" },
  { value: "Other", label: "Khác" },
] as const;

function formatDateTime(value?: string | null): string {
  if (!value) return "Chưa có dữ liệu";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusLabel(status: string): string {
  if (status.toLocaleLowerCase() === "active") return "Đang hoạt động";
  if (status.toLocaleLowerCase() === "disabled") return "Đã vô hiệu hóa";
  return status || "Chưa xác định";
}

function getGenderLabel(gender: string): string {
  return GENDER_OPTIONS.find((option) => option.value === gender)?.label ?? gender;
}

function getPlatformLabel(platform: string): string {
  const normalized = platform.trim().toLocaleLowerCase();
  if (normalized === "android") return "Android";
  if (normalized === "ios") return "iPhone / iPad";
  if (normalized === "web") return "Trình duyệt web";
  return platform || "Thiết bị chưa xác định";
}

function getScopeSummary(
  isSystemAdmin: boolean,
  organizationCount: number,
  storeCount: number,
  kioskCount: number,
): string {
  if (isSystemAdmin) return "Toàn bộ hệ thống";
  const scopes = [
    organizationCount ? `${organizationCount} tổ chức` : null,
    storeCount ? `${storeCount} cửa hàng` : null,
    kioskCount ? `${kioskCount} kiosk` : null,
  ].filter(Boolean);
  return scopes.join(" · ") || "Chưa có phạm vi được giao";
}

function ProfileForm({
  profile,
  isSaving,
  onSave,
}: {
  profile: CurrentAccountProfile;
  isSaving: boolean;
  onSave: (values: {
    fullName: string;
    phoneNumber: string;
    address: string;
    gender: string;
  }) => Promise<void>;
}) {
  const [fullName, setFullName] = useState(profile.fullName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber ?? "");
  const [address, setAddress] = useState(profile.address ?? "");
  const [gender, setGender] = useState(profile.gender || "Other");

  const genderOptions = GENDER_OPTIONS.some((option) => option.value === gender)
    ? GENDER_OPTIONS
    : [{ value: gender, label: getGenderLabel(gender) }, ...GENDER_OPTIONS];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSave({ fullName, phoneNumber, address, gender });
  }

  return (
    <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-full-name">Họ và tên</Label>
          <Input
            id="profile-full-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            disabled={isSaving}
            autoComplete="name"
            placeholder="Nhập họ và tên"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-phone">Số điện thoại</Label>
          <Input
            id="profile-phone"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            disabled={isSaving}
            autoComplete="tel"
            placeholder="Nhập số điện thoại"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="profile-address">Địa chỉ</Label>
          <Input
            id="profile-address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            disabled={isSaving}
            autoComplete="street-address"
            placeholder="Nhập địa chỉ"
          />
        </div>
        <div className="space-y-2">
          <Label>Giới tính</Label>
          <Select
            value={gender}
            disabled={isSaving}
            onValueChange={(value) => value && setGender(value)}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue>{getGenderLabel(gender)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {genderOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" isLoading={isSaving}>
          Lưu thay đổi
        </Button>
      </div>
    </form>
  );
}

function PasswordForm({
  disabled,
  isChangingPassword,
  onChangePassword,
}: {
  disabled: boolean;
  isChangingPassword: boolean;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentPassword || !newPassword) {
      setValidationMessage("Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setValidationMessage("Mật khẩu xác nhận chưa khớp.");
      return;
    }
    if (newPassword === currentPassword) {
      setValidationMessage("Mật khẩu mới phải khác mật khẩu hiện tại.");
      return;
    }
    setValidationMessage(null);
    await onChangePassword(currentPassword, newPassword);
  }

  return (
    <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
      <div className="grid max-w-xl gap-5">
        <div className="space-y-2">
          <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            disabled={disabled || isChangingPassword}
            autoComplete="current-password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">Mật khẩu mới</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            disabled={disabled || isChangingPassword}
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={disabled || isChangingPassword}
            autoComplete="new-password"
          />
        </div>
      </div>
      {disabled ? (
        <p className="text-sm text-muted-foreground">
          Tài khoản này không bật đăng nhập bằng mật khẩu cục bộ.
        </p>
      ) : null}
      {validationMessage ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {validationMessage}
        </p>
      ) : null}
      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" isLoading={isChangingPassword} disabled={disabled}>
          <KeyRound className="size-4" />
          Đổi mật khẩu
        </Button>
      </div>
    </form>
  );
}

function NotificationDevicesCard({
  devices,
  isLoading,
  errorMessage,
  unregisteringInstallationId,
  onRetry,
  onUnregister,
}: {
  devices: CurrentAccountNotificationDevice[];
  isLoading: boolean;
  errorMessage: string | null;
  unregisteringInstallationId: string | null;
  onRetry: () => Promise<void>;
  onUnregister: (device: CurrentAccountNotificationDevice) => void;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <BellRing className="size-5 text-primary" />
          Thiết bị nhận thông báo
        </CardTitle>
        <CardDescription>
          Quản lý các ứng dụng đang đăng ký nhận thông báo cho tài khoản này. Đây không phải danh sách phiên đăng nhập.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-3" aria-label="Đang tải thiết bị nhận thông báo">
            <div className="h-16 animate-pulse rounded-lg bg-muted" />
            <div className="h-16 animate-pulse rounded-lg bg-muted" />
          </div>
        ) : errorMessage ? (
          <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">
            <span>{errorMessage}</span>
            <Button variant="outline" size="sm" className="w-fit" onClick={() => void onRetry()}>
              <RefreshCw className="size-4" />
              Thử lại
            </Button>
          </div>
        ) : devices.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
            <Smartphone className="mx-auto mb-3 size-5 text-muted-foreground" />
            <p className="font-medium">Chưa có thiết bị nhận thông báo</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Thiết bị sẽ xuất hiện sau khi một ứng dụng hỗ trợ thông báo đăng ký với tài khoản này.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border">
            {devices.map((device) => (
              <div key={device.installationId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Smartphone className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{device.deviceName?.trim() || getPlatformLabel(device.platform)}</p>
                    <p className="text-sm text-muted-foreground">
                      {getPlatformLabel(device.platform)}
                      {device.appVersion ? ` · ${device.appVersion}` : ""}
                      {device.lastSeenAt ? ` · Hoạt động gần nhất ${formatDateTime(device.lastSeenAt)}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={device.isActive ? "secondary" : "outline"}>
                    {device.isActive ? "Đang nhận thông báo" : "Đã ngừng nhận"}
                  </Badge>
                  {device.isActive ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={unregisteringInstallationId !== null}
                      isLoading={unregisteringInstallationId === device.installationId}
                      onClick={() => onUnregister(device)}
                    >
                      Ngừng nhận
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ActiveSessionsCard({
  sessions,
  currentSessionId,
  isLoading,
  errorMessage,
  revokingSessionId,
  isRevokingAllSessions,
  onRetry,
  onRevoke,
  onRevokeAll,
}: {
  sessions: CurrentAccountSession[];
  currentSessionId: string | null;
  isLoading: boolean;
  errorMessage: string | null;
  revokingSessionId: string | null;
  isRevokingAllSessions: boolean;
  onRetry: () => Promise<void>;
  onRevoke: (session: CurrentAccountSession) => void;
  onRevokeAll: () => void;
}) {
  return (
    <Card>
      <CardHeader className="border-b sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <Laptop className="size-5 text-primary" />
            Phiên đăng nhập đang hoạt động
          </CardTitle>
          <CardDescription>
            Danh sách các phiên còn có thể làm mới đăng nhập. Hệ thống không hiển thị token.
          </CardDescription>
        </div>
        <Button
          variant="destructive"
          size="sm"
          disabled={
            isLoading ||
            sessions.length === 0 ||
            isRevokingAllSessions ||
            revokingSessionId !== null
          }
          onClick={onRevokeAll}
        >
          Đăng xuất mọi thiết bị
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-3" aria-label="Đang tải phiên đăng nhập">
            <div className="h-16 animate-pulse rounded-lg bg-muted" />
            <div className="h-16 animate-pulse rounded-lg bg-muted" />
          </div>
        ) : errorMessage ? (
          <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">
            <span>{errorMessage}</span>
            <Button variant="outline" size="sm" className="w-fit" onClick={() => void onRetry()}>
              <RefreshCw className="size-4" />
              Thử lại
            </Button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
            <Laptop className="mx-auto mb-3 size-5 text-muted-foreground" />
            <p className="font-medium">Không có phiên đăng nhập đang hoạt động</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Phiên mới sẽ xuất hiện sau khi tài khoản đăng nhập và nhận refresh token.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border">
            {sessions.map((session) => {
              const isCurrentSession =
                session.isCurrentSession ||
                session.sessionId === currentSessionId;

              return (
                <div
                  key={session.sessionId}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Laptop className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">
                          {session.deviceName?.trim() || "Thiết bị chưa xác định"}
                        </p>
                        {isCurrentSession ? (
                          <Badge variant="secondary">Phiên hiện tại</Badge>
                        ) : null}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {session.userAgent?.trim() || "Không có thông tin trình duyệt"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.ipAddress?.trim() || "Không có địa chỉ IP"}
                        {` · Đăng nhập ${formatDateTime(session.createdAt)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      Hết hạn {formatDateTime(session.expiresAt)}
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        isRevokingAllSessions || revokingSessionId !== null
                      }
                      isLoading={revokingSessionId === session.sessionId}
                      onClick={() => onRevoke(session)}
                    >
                      <LogOut className="size-4" />
                      Đăng xuất
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ProfileView() {
  const router = useRouter();
  const [notificationDeviceToUnregister, setNotificationDeviceToUnregister] =
    useState<CurrentAccountNotificationDevice | null>(null);
  const [isRevokeAllSessionsDialogOpen, setIsRevokeAllSessionsDialogOpen] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] =
    useState<CurrentAccountSession | null>(null);
  const { effectiveAccess } = useAuth();
  const {
    profile,
    isLoading,
    isSaving,
    isChangingPassword,
    errorMessage,
    loadProfile,
    saveProfile,
    changePassword,
    notificationDevices,
    isNotificationDevicesLoading,
    notificationDevicesErrorMessage,
    unregisteringInstallationId,
    sessions,
    currentSessionId,
    isSessionsLoading,
    sessionsErrorMessage,
    revokingSessionId,
    isRevokingAllSessions,
    loadNotificationDevices,
    unregisterNotificationDevice,
    loadSessions,
    revokeSession,
    revokeAllSessions,
  } = useProfile();

  if (isLoading) {
    return (
      <div className="space-y-6" aria-label="Đang tải thông tin cá nhân">
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-72 animate-pulse rounded-xl bg-muted lg:col-span-2" />
          <div className="h-72 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Không thể tải thông tin cá nhân</CardTitle>
          <CardDescription>{errorMessage ?? "Vui lòng thử lại sau."}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => void loadProfile()}>
            <RefreshCw className="size-4" />
            Thử lại
          </Button>
        </CardContent>
      </Card>
    );
  }

  const roleLabels = Array.from(
    new Set(profile.roles.map((role) => role.roleCode)),
  ).map((role) => (isBackendRoleCode(role) ? getRoleLabel(role) : role));
  const scopeSummary = effectiveAccess
    ? getScopeSummary(
        effectiveAccess.isSystemAdmin,
        effectiveAccess.effectiveScope.organizationIds.length,
        effectiveAccess.effectiveScope.storeIds.length,
        effectiveAccess.effectiveScope.kioskIds.length,
      )
    : "Chưa tải được phạm vi quyền";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-primary">Tài khoản của tôi</p>
          <h1 className="text-3xl font-bold tracking-tight">Thông tin cá nhân</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Quản lý thông tin liên hệ và bảo mật cho tài khoản đang đăng nhập.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadProfile()}>
          <RefreshCw className="size-4" />
          Làm mới
        </Button>
      </header>

      {errorMessage ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-5 text-primary" />
              Hồ sơ cá nhân
            </CardTitle>
            <CardDescription>
              Email và tên đăng nhập do hệ thống quản lý; các thông tin còn lại có thể cập nhật.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              key={`${profile.fullName}-${profile.phoneNumber}-${profile.address}-${profile.gender}`}
              profile={profile}
              isSaving={isSaving}
              onSave={async (values) => {
                try {
                  await saveProfile({
                    fullName: values.fullName.trim(),
                    phoneNumber: values.phoneNumber.trim(),
                    address: values.address.trim(),
                    gender: values.gender,
                  });
                  toast.success("Đã cập nhật thông tin cá nhân.");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Không thể cập nhật hồ sơ.");
                }
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              Tài khoản và quyền
            </CardTitle>
            <CardDescription>Thông tin nhận diện và phạm vi hiện tại.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                {(profile.fullName || profile.userName).slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{profile.fullName || profile.userName}</p>
                <p className="truncate text-sm text-muted-foreground">@{profile.userName}</p>
              </div>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="break-all font-medium">{profile.email}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-muted-foreground">Số điện thoại</dt>
                  <dd className="font-medium">{profile.phoneNumber || "Chưa cập nhật"}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-muted-foreground">Phạm vi quyền</dt>
                  <dd className="font-medium">{scopeSummary}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-muted-foreground">Đăng nhập gần nhất</dt>
                  <dd className="font-medium">{formatDateTime(profile.lastLoginAt)}</dd>
                </div>
              </div>
            </dl>
            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Vai trò</p>
              <div className="flex flex-wrap gap-2">
                {roleLabels.map((role) => <Badge key={role} variant="secondary">{role}</Badge>)}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Badge variant="outline">
                <BadgeCheck className="size-3" />
                {getStatusLabel(profile.status)}
              </Badge>
              <Badge variant="outline">
                {profile.emailConfirmed ? "Email đã xác minh" : "Email chưa xác minh"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <LockKeyhole className="size-5 text-primary" />
            Bảo mật tài khoản
          </CardTitle>
          <CardDescription>
            Sau khi đổi mật khẩu, hệ thống sẽ đăng xuất tài khoản và yêu cầu đăng nhập lại.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm
            disabled={!profile.localLoginEnabled}
            isChangingPassword={isChangingPassword}
            onChangePassword={async (currentPassword, newPassword) => {
              try {
                await changePassword({ currentPassword, newPassword });
                toast.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
                router.replace("/login");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Không thể đổi mật khẩu.");
              }
            }}
          />
        </CardContent>
      </Card>

      <ActiveSessionsCard
        sessions={sessions}
        currentSessionId={currentSessionId}
        isLoading={isSessionsLoading}
        errorMessage={sessionsErrorMessage}
        revokingSessionId={revokingSessionId}
        isRevokingAllSessions={isRevokingAllSessions}
        onRetry={loadSessions}
        onRevoke={setSessionToRevoke}
        onRevokeAll={() => setIsRevokeAllSessionsDialogOpen(true)}
      />

      <NotificationDevicesCard
        devices={notificationDevices}
        isLoading={isNotificationDevicesLoading}
        errorMessage={notificationDevicesErrorMessage}
        unregisteringInstallationId={unregisteringInstallationId}
        onRetry={loadNotificationDevices}
        onUnregister={setNotificationDeviceToUnregister}
      />

      <Dialog
        open={isRevokeAllSessionsDialogOpen}
        onOpenChange={(open) => {
          if (!open && !isRevokingAllSessions) {
            setIsRevokeAllSessionsDialogOpen(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đăng xuất khỏi mọi thiết bị?</DialogTitle>
            <DialogDescription>
              Tất cả phiên đăng nhập đang hoạt động sẽ bị thu hồi, bao gồm phiên hiện tại. Bạn sẽ cần đăng nhập lại.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isRevokingAllSessions}
              onClick={() => setIsRevokeAllSessionsDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              isLoading={isRevokingAllSessions}
              onClick={() => {
                void revokeAllSessions()
                  .then((revokedCount) => {
                    toast.success(`Đã thu hồi ${revokedCount} phiên đăng nhập.`);
                    router.replace("/login");
                  })
                  .catch((error) => {
                    toast.error(error instanceof Error ? error.message : "Không thể đăng xuất khỏi các phiên.");
                  });
              }}
            >
              Đăng xuất mọi thiết bị
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={sessionToRevoke !== null}
        onOpenChange={(open) => {
          if (!open && revokingSessionId === null) {
            setSessionToRevoke(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đăng xuất thiết bị này?</DialogTitle>
            <DialogDescription>
              Phiên trên {sessionToRevoke?.deviceName?.trim() || "thiết bị chưa xác định"} sẽ bị thu hồi.
              {sessionToRevoke?.isCurrentSession ||
              sessionToRevoke?.sessionId === currentSessionId
                ? " Đây là phiên hiện tại nên bạn sẽ được chuyển về trang đăng nhập."
                : " Các thiết bị khác vẫn đăng nhập bình thường."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={revokingSessionId !== null}
              onClick={() => setSessionToRevoke(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              isLoading={revokingSessionId !== null}
              onClick={() => {
                if (!sessionToRevoke) return;
                void revokeSession(sessionToRevoke)
                  .then((revokedCurrentSession) => {
                    toast.success("Đã đăng xuất khỏi thiết bị.");
                    setSessionToRevoke(null);
                    if (revokedCurrentSession) {
                      router.replace("/login");
                    }
                  })
                  .catch((error) => {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Không thể đăng xuất khỏi thiết bị này.",
                    );
                  });
              }}
            >
              Đăng xuất thiết bị
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={notificationDeviceToUnregister !== null}
        onOpenChange={(open) => {
          if (!open && unregisteringInstallationId === null) {
            setNotificationDeviceToUnregister(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ngừng nhận thông báo?</DialogTitle>
            <DialogDescription>
              {notificationDeviceToUnregister?.deviceName?.trim() || getPlatformLabel(notificationDeviceToUnregister?.platform ?? "")} sẽ không còn nhận thông báo từ tài khoản này. Thao tác này không đăng xuất thiết bị.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={unregisteringInstallationId !== null}
              onClick={() => setNotificationDeviceToUnregister(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              isLoading={unregisteringInstallationId !== null}
              onClick={() => {
                if (!notificationDeviceToUnregister) return;
                void unregisterNotificationDevice(notificationDeviceToUnregister.installationId)
                  .then(() => {
                    toast.success("Đã ngừng nhận thông báo trên thiết bị.");
                    setNotificationDeviceToUnregister(null);
                  })
                  .catch((error) => {
                    toast.error(error instanceof Error ? error.message : "Không thể ngừng nhận thông báo.");
                  });
              }}
            >
              Ngừng nhận thông báo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
