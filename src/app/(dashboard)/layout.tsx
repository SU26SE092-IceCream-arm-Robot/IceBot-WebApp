"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, RefreshCw, ShieldAlert, WifiOff } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { AppSidebar } from "@/components/shared/app-sidebar";
import { AuthenticatedAppProviders } from "@/components/shared/authenticated-app-providers";
import { Topbar } from "@/components/shared/topbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/identity/use-auth";
import {
  canAccessRoute,
  getDashboardRoutePath,
  getVisibleRoutes,
} from "@/lib/rbac";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthenticatedAppProviders>
      <DashboardShell>{children}</DashboardShell>
    </AuthenticatedAppProviders>
  );
}

function DashboardShell({ children }: Readonly<{ children: React.ReactNode }>) {
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
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const mobileNavigationPanelRef = useRef<HTMLDivElement>(null);
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
  }, [
    currentUser,
    effectiveAccess,
    fallbackRoute,
    pathname,
    routeDenied,
    router,
    status,
  ]);

  useEffect(() => {
    if (!mobileNavigationOpen) return;

    const previouslyFocusedElement =
      document.activeElement as HTMLElement | null;
    const panel = mobileNavigationPanelRef.current;
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusableElements = panel
      ? Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector))
      : [];
    const closeButton = panel?.querySelector<HTMLElement>(
      'button[aria-label="Đóng menu điều hướng"]',
    );
    const animationFrame = window.requestAnimationFrame(() => {
      (closeButton ?? focusableElements[0])?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNavigationOpen(false);
        return;
      }

      if (event.key !== "Tab" || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      } else if (!panel?.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedElement?.focus();
    };
  }, [mobileNavigationOpen]);

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
    const assignedRoles = session?.account.roles
      .map((roleScope) => roleScope.roleCode)
      .join(", ");

    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border border-border">
          <CardHeader>
            <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <ShieldAlert className="size-5" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">
              Không có quyền truy cập
            </CardTitle>
            <CardDescription>
              Tài khoản đã đăng nhập nhưng chưa được cấp quyền vào Trung tâm vận
              hành.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignedRoles && (
              <p className="rounded-md bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                Vai trò hiện tại:{" "}
                <span className="font-medium text-foreground">
                  {assignedRoles}
                </span>
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
              Phiên đăng nhập vẫn được giữ nhưng thông tin vai trò và phạm vi
              chưa tải được.
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
              Bạn đang được chuyển tới khu vực phù hợp với vai trò và phạm vi
              hiện tại.
            </CardDescription>
          </CardHeader>
          {fallbackRoute ? (
            <CardContent>
              <Button
                className="w-full"
                onClick={() => router.replace(fallbackRoute)}
              >
                Đi tới khu vực được phép
              </Button>
            </CardContent>
          ) : null}
        </Card>
      </main>
    );
  }

  const visibleRoutes = new Set(getVisibleRoutes(effectiveAccess));

  return (
    <div className="dashboard-shell flex h-dvh min-h-screen overflow-hidden bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground"
      >
        Bỏ qua điều hướng, tới nội dung chính
      </a>
      <AppSidebar
        effectiveAccess={effectiveAccess}
        collapsed={sidebarCollapsed}
        className="hidden lg:flex"
        onToggleCollapsed={() => setSidebarCollapsed((previous) => !previous)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          currentUser={currentUser}
          showAlerts={visibleRoutes.has("/alerts")}
          onOpenNavigation={() => setMobileNavigationOpen(true)}
          onLogout={async () => {
            await logout();
            router.replace("/login");
          }}
        />
        <main id="main-content" className="flex-1 overflow-y-auto">
          <div className="workspace-page mx-auto w-full max-w-[1600px] p-4 md:p-5 xl:p-6">
            {children}
          </div>
        </main>
      </div>

      {mobileNavigationOpen ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu điều hướng"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-slate-950/45"
            onClick={() => setMobileNavigationOpen(false)}
            aria-label="Đóng menu điều hướng"
          />
          <div
            ref={mobileNavigationPanelRef}
            className="relative h-full w-fit animate-in slide-in-from-left-4 duration-200"
          >
            <AppSidebar
              effectiveAccess={effectiveAccess}
              collapsed={false}
              mobile
              onToggleCollapsed={() => undefined}
              onNavigate={() => setMobileNavigationOpen(false)}
              onClose={() => setMobileNavigationOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
