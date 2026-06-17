"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, KeyRound, Link2Off, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { acceptInvitation, getInvitationErrorMessage } from "@/lib/services/accounts";

const MIN_PASSWORD_LENGTH = 8;

export function AcceptInvitationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  useEffect(() => {
    if (!isAccepted) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.replace("/login");
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [isAccepted, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage("Liên kết lời mời không có token hợp lệ.");
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(`Mật khẩu cần có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await acceptInvitation({ token, newPassword });
      if (!result.accepted) {
        setErrorMessage("Lời mời không được xác nhận. Liên kết có thể đã hết hạn hoặc bị thu hồi.");
        return;
      }

      setIsAccepted(true);
    } catch (error) {
      setErrorMessage(
        getInvitationErrorMessage(
          error,
          "Không thể chấp nhận lời mời. Liên kết có thể đã hết hạn hoặc bị thu hồi."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md rounded-xl border border-border shadow-sm">
        <CardHeader className="space-y-3 px-6 pt-6">
          <span className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <Link2Off className="size-5" />
          </span>
          <CardTitle className="text-2xl font-bold tracking-tight">Liên kết không hợp lệ</CardTitle>
          <CardDescription>
            URL không chứa token lời mời. Hãy dùng liên kết mới nhất do quản trị viên gửi.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <Button className="w-full" onClick={() => router.replace("/login")}>
            Về trang đăng nhập
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isAccepted) {
    return (
      <Card className="w-full max-w-md rounded-xl border border-success/30 shadow-sm">
        <CardHeader className="space-y-3 px-6 pt-6">
          <span className="flex size-11 items-center justify-center rounded-xl bg-success/10 text-success">
            <CheckCircle2 className="size-5" />
          </span>
          <CardTitle className="text-2xl font-bold tracking-tight">Tài khoản đã kích hoạt</CardTitle>
          <CardDescription>
            Mật khẩu đã được thiết lập. Bạn sẽ được chuyển về trang đăng nhập trong giây lát.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <Button className="w-full" onClick={() => router.replace("/login")}>
            Đăng nhập ngay
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md rounded-xl border border-border shadow-sm">
      <CardHeader className="space-y-3 px-6 pt-6">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ShieldCheck className="size-5" />
        </span>
        <CardTitle className="text-2xl font-bold tracking-tight">Hoàn tất tài khoản IceBot</CardTitle>
        <CardDescription>
          Tạo mật khẩu của riêng bạn để kích hoạt tài khoản được mời.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 pb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="newPassword" className="text-sm font-medium text-foreground">
              Mật khẩu mới
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                disabled={isSubmitting}
                minLength={MIN_PASSWORD_LENGTH}
                onChange={(event) => setNewPassword(event.target.value)}
                className="pl-9"
                placeholder={`Tối thiểu ${MIN_PASSWORD_LENGTH} ký tự`}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
              Xác nhận mật khẩu
            </label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              disabled={isSubmitting}
              minLength={MIN_PASSWORD_LENGTH}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Nhập lại mật khẩu"
              required
            />
          </div>

          {errorMessage ? (
            <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Kích hoạt tài khoản
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
