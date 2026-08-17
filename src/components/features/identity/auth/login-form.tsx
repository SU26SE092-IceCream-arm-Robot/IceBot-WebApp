"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FirebaseError } from "firebase/app";
import { LockKeyhole, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/identity/use-auth";
import {
  getFirebaseGoogleLoginErrorMessage,
  isFirebaseGoogleLoginConfigured,
  signInWithFirebaseGoogle,
} from "@/lib/firebase-auth";
import { getAuthErrorMessage } from "@/lib/services/identity/auth";

export function LoginForm() {
  const router = useRouter();
  const { status, login, googleLogin } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated" || status === "forbidden") {
      router.replace("/dashboard");
    }
  }, [router, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationMessage(null);
    setErrorMessage(null);

    if (!emailOrUsername.trim() || !password) {
      setValidationMessage("Vui lòng nhập email hoặc tên đăng nhập và mật khẩu.");
      return;
    }
    setIsSubmitting(true);

    try {
      await login({ emailOrUsername, password });
      toast.success("Đăng nhập thành công.");
      router.replace("/dashboard");
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const idToken = await signInWithFirebaseGoogle();
      await googleLogin(idToken);
      toast.success("Đăng nhập thành công.");
      router.replace("/dashboard");
    } catch (error) {
      setErrorMessage(
        error instanceof FirebaseError
          ? getFirebaseGoogleLoginErrorMessage(error)
          : getAuthErrorMessage(error),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-8 space-y-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Đăng nhập</h2>
        <p className="text-sm text-muted-foreground">
          Truy cập hệ thống quản trị dành cho nhân sự được cấp quyền.
        </p>
      </div>

      <form
        noValidate
        onSubmit={handleSubmit}
        onChangeCapture={() => setValidationMessage(null)}
        className="space-y-5"
      >
        <div className="space-y-2">
          <label htmlFor="emailOrUsername" className="text-sm font-medium text-foreground">
            Email hoặc tên đăng nhập
          </label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="emailOrUsername"
              name="emailOrUsername"
              autoComplete="username"
              value={emailOrUsername}
              onChange={(event) => setEmailOrUsername(event.target.value)}
              className="h-11 pl-10"
              placeholder="Nhập email hoặc tên đăng nhập"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Mật khẩu
            </label>
            <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 pl-10"
              placeholder="Nhập mật khẩu"
              required
            />
          </div>
        </div>

        {validationMessage || errorMessage ? (
          <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {validationMessage || errorMessage}
          </p>
        ) : null}

        <Button type="submit" className="h-11 w-full text-base" isLoading={isSubmitting}>
          Đăng nhập
        </Button>

        {isFirebaseGoogleLoginConfigured() ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              hoặc
              <span className="h-px flex-1 bg-border" />
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full"
              disabled={isSubmitting}
              onClick={() => void handleGoogleLogin()}
            >
              Đăng nhập bằng Google
            </Button>
          </div>
        ) : null}
      </form>
    </div>
  );
}
