"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CheckCircle2, KeyRound, Link2Off } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAuthErrorMessage, resetPassword } from "@/lib/services/identity/auth";

const MIN_PASSWORD_LENGTH = 8;

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setMessage(`Mật khẩu cần có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({ token, newPassword });
      setIsCompleted(true);
    } catch (error) {
      setMessage(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md rounded-xl">
        <CardHeader className="space-y-3">
          <Link2Off className="size-6 text-destructive" />
          <CardTitle>Liên kết không hợp lệ</CardTitle>
          <CardDescription>Liên kết đặt lại mật khẩu không có token.</CardDescription>
        </CardHeader>
        <CardContent><Link href="/forgot-password" className={buttonVariants({ className: "w-full" })}>Yêu cầu liên kết mới</Link></CardContent>
      </Card>
    );
  }

  if (isCompleted) {
    return (
      <Card className="w-full max-w-md rounded-xl">
        <CardHeader className="space-y-3">
          <CheckCircle2 className="size-6 text-success" />
          <CardTitle>Đã đổi mật khẩu</CardTitle>
          <CardDescription>Bạn có thể đăng nhập bằng mật khẩu mới.</CardDescription>
        </CardHeader>
        <CardContent><Link href="/login" className={buttonVariants({ className: "w-full" })}>Đăng nhập</Link></CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md rounded-xl">
      <CardHeader>
        <CardTitle>Đặt lại mật khẩu</CardTitle>
        <CardDescription>Chọn mật khẩu mới cho tài khoản của bạn.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <label htmlFor="newPassword" className="text-sm font-medium">Mật khẩu mới</label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="newPassword" type="password" autoComplete="new-password" className="pl-9" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} disabled={isSubmitting} />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">Xác nhận mật khẩu</label>
            <Input id="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={isSubmitting} />
          </div>
          {message ? <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p> : null}
          <Button type="submit" className="w-full" isLoading={isSubmitting}>Đặt lại mật khẩu</Button>
        </form>
      </CardContent>
    </Card>
  );
}
