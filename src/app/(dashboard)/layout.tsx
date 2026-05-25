"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AppSidebar } from "@/components/shared/app-sidebar";
import { Topbar } from "@/components/shared/topbar";
import { getMockCurrentUser, getMockRole, setMockRole } from "@/lib/mock-current-user";
import { canAccessRoute, isDashboardRoutePath } from "@/lib/rbac";
import type { Role } from "@/types";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [role, setRole] = useState<Role>(() => getMockRole());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMockRole(role);
  }, [role]);

  useEffect(() => {
    if (isDashboardRoutePath(pathname) && !canAccessRoute(role, pathname)) {
      router.replace("/kiosks");
    }
  }, [pathname, role, router]);

  const currentUser = useMemo(() => getMockCurrentUser(role), [role]);

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        role={currentUser.role}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((prev) => !prev)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar currentUser={currentUser} onRoleChange={setRole} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
