"use client";

import { useEffect, useState, type FormEvent } from "react";
import { LockKeyhole, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { getAuthErrorMessage } from "@/lib/services/auth";

export function LoginForm() {
  const router = useRouter();
  const { status, login } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated" || status === "forbidden") {
      router.replace("/dashboard");
    }
  }, [router, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login({ emailOrUsername, password });
      router.replace("/dashboard");
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
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

      <form onSubmit={handleSubmit} className="space-y-5">
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
              placeholder="admin@icebot.vn"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Mật khẩu
          </label>
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

        {errorMessage && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </p>
        )}

        <Button type="submit" className="h-11 w-full text-base bg-cyan-600 hover:bg-cyan-700 text-white" isLoading={isSubmitting}>
          Đăng nhập
        </Button>
      </form>
    </div>
  );
}
