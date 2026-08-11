"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CheckCircle2, Mail } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/lib/services/identity/auth";

export function ForgotPasswordForm() {
  const [emailOrUserName, setEmailOrUserName] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedIdentity = emailOrUserName.trim();
    setValidationMessage(null);
    setRequestError(null);

    if (!normalizedIdentity) {
      setValidationMessage("Nhập email hoặc tên đăng nhập.");
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPasswordReset(normalizedIdentity);
      setIsSubmitted(true);
    } catch {
      setRequestError("Không thể gửi yêu cầu lúc này. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md rounded-xl">
        <CardHeader className="space-y-3">
          <span className="flex size-11 items-center justify-center rounded-lg bg-success/10 text-success">
            <CheckCircle2 className="size-5" />
          </span>
          <CardTitle>Kiểm tra email của bạn</CardTitle>
          <CardDescription>
            Nếu tài khoản phù hợp tồn tại, hệ thống đã gửi liên kết đặt lại mật khẩu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className={buttonVariants({ className: "w-full" })}>
            Về trang đăng nhập
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md rounded-xl">
      <CardHeader>
        <CardTitle>Quên mật khẩu</CardTitle>
        <CardDescription>Nhập email hoặc tên đăng nhập để nhận liên kết đặt lại mật khẩu.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <label htmlFor="emailOrUserName" className="text-sm font-medium">Email hoặc tên đăng nhập</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="emailOrUserName"
                autoComplete="username"
                value={emailOrUserName}
                onChange={(event) => setEmailOrUserName(event.target.value)}
                className="pl-9"
                disabled={isSubmitting}
              />
            </div>
          </div>
          {validationMessage || requestError ? <p className="text-sm text-destructive">{validationMessage || requestError}</p> : null}
          <Button type="submit" className="w-full" isLoading={isSubmitting}>Gửi liên kết</Button>
          <Link href="/login" className={buttonVariants({ variant: "ghost", className: "w-full" })}>
            Quay lại đăng nhập
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
