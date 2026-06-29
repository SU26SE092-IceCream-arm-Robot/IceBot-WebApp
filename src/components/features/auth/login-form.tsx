"use client";

import { useEffect, useState, type FormEvent } from "react";
import { LockKeyhole, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="w-full max-w-md border border-border shadow-sm">
      <CardHeader className="space-y-2 px-6 pt-6">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <LockKeyhole className="size-5" />
        </div>
        <CardTitle className="pt-2 text-2xl font-bold tracking-tight">Đăng nhập Dashboard</CardTitle>
        <CardDescription>
          Truy cập hệ thống giám sát vận hành IceBot dành cho quản trị nội bộ.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 pb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="emailOrUsername" className="text-sm font-medium text-foreground">
              Email hoặc tên đăng nhập
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                id="emailOrUsername"
                name="emailOrUsername"
                autoComplete="username"
                value={emailOrUsername}
                onChange={(event) => setEmailOrUsername(event.target.value)}
                className="pl-9"
                placeholder="admin@icebot.vn"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Mật khẩu
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          {errorMessage && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          )}

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Đăng nhập
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
