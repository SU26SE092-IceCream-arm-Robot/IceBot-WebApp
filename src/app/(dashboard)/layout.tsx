"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, RefreshCw, ShieldAlert, WifiOff } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { AppSidebar } from "@/components/shared/app-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/identity/use-auth";
import { canAccessRoute, getDashboardRoutePath, getVisibleRoutes } from "@/lib/rbac";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const {
    status,
    currentUser,
    effectiveAccess,
    session,
    errorMessage,
    retryRestore,
    logout,
  } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const guardedRoute = getDashboardRoutePath(pathname);
  const fallbackRoute = effectiveAccess
    ? getVisibleRoutes(effectiveAccess)[0]
    : undefined;
  const routeDenied = Boolean(
    effectiveAccess &&
      guardedRoute &&
      !canAccessRoute(effectiveAccess, guardedRoute),
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (
      status === "authenticated" &&
      currentUser &&
      effectiveAccess &&
      routeDenied &&
      fallbackRoute &&
      fallbackRoute !== pathname
    ) {
      router.replace(fallbackRoute);
    }
  }, [currentUser, effectiveAccess, fallbackRoute, pathname, routeDenied, router, status]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          Đang xác thực phiên đăng nhập...
        </div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border border-border">
          <CardHeader>
            <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-warning/10 text-warning">
              <WifiOff className="size-5" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">
              Chưa thể xác minh phiên đăng nhập
            </CardTitle>
            <CardDescription>
              {errorMessage ??
                "Kết nối tới máy chủ đang gián đoạn. Phiên đăng nhập của bạn vẫn được giữ lại."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => void retryRestore()}>
              <RefreshCw className="size-4" />
              Thử lại
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (status === "forbidden" || !currentUser) {
    const assignedRoles = session?.account.roles.map((roleScope) => roleScope.roleCode).join(", ");

    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border border-border">
          <CardHeader>
            <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <ShieldAlert className="size-5" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">Không có quyền truy cập</CardTitle>
            <CardDescription>
              Tài khoản đã đăng nhập nhưng chưa được cấp quyền vào Trung tâm vận hành.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignedRoles && (
              <p className="rounded-md bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                Vai trò hiện tại: <span className="font-medium text-foreground">{assignedRoles}</span>
              </p>
            )}
            <Button
              className="w-full"
              variant="outline"
              onClick={async () => {
                await logout();
                router.replace("/login");
              }}
            >
              Đăng xuất
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!effectiveAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border border-border">
          <CardHeader>
            <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-warning/10 text-warning">
              <ShieldAlert className="size-5" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">
              Chưa thể xác minh quyền truy cập
            </CardTitle>
            <CardDescription>
              Phiên đăng nhập vẫn được giữ nhưng thông tin vai trò và phạm vi chưa tải được.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => void retryRestore()}>
              <RefreshCw className="size-4" />
              Thử lại
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (routeDenied) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border border-border">
          <CardHeader>
            <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <ShieldAlert className="size-5" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">
              Không có quyền truy cập trang này
            </CardTitle>
            <CardDescription>
              Bạn đang được chuyển tới khu vực phù hợp với vai trò và phạm vi hiện tại.
            </CardDescription>
          </CardHeader>
          {fallbackRoute ? (
            <CardContent>
              <Button className="w-full" onClick={() => router.replace(fallbackRoute)}>
                Đi tới khu vực được phép
              </Button>
            </CardContent>
          ) : null}
        </Card>
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        currentUser={currentUser}
        effectiveAccess={effectiveAccess}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((previous) => !previous)}
        onLogout={async () => {
          await logout();
          router.replace("/login");
        }}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
