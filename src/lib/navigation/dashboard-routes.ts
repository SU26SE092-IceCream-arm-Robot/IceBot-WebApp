import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  ClipboardCheck,
  CreditCard,
  Factory,
  LayoutDashboard,
  Monitor,
  Package,
  ShieldAlert,
  ShoppingBag,
  ShoppingCart,
  Users,
  Wrench,
} from "lucide-react";

import type { DashboardPermission, DashboardRoutePath } from "@/types";

export interface DashboardRouteDefinition {
  path: DashboardRoutePath;
  permission: DashboardPermission;
  navigation?: {
    group: "operations" | "commerce" | "administration";
    label: string;
    icon: LucideIcon;
  };
}

export const DASHBOARD_ROUTE_REGISTRY: readonly DashboardRouteDefinition[] = [
  { path: "/dashboard", permission: "dashboard.view", navigation: { group: "operations", label: "Tổng quan", icon: LayoutDashboard } },
  { path: "/readiness", permission: "dashboard.view", navigation: { group: "operations", label: "Kiểm tra thiết lập", icon: ClipboardCheck } },
  { path: "/production", permission: "program.read", navigation: { group: "operations", label: "Cấu hình sản xuất", icon: Factory } },
  { path: "/kiosks", permission: "kiosks.view", navigation: { group: "operations", label: "Quản lý Kiosk", icon: Monitor } },
  { path: "/inventory", permission: "inventory.view", navigation: { group: "operations", label: "Tồn kho", icon: Package } },
  { path: "/alerts", permission: "alerts.view", navigation: { group: "operations", label: "Cảnh báo", icon: Bell } },
  { path: "/maintenance", permission: "maintenance.view", navigation: { group: "operations", label: "Bảo trì", icon: Wrench } },
  { path: "/transactions", permission: "orders.view", navigation: { group: "commerce", label: "Giao dịch", icon: ShoppingCart } },
  { path: "/products", permission: "products.manage", navigation: { group: "commerce", label: "Sản phẩm", icon: ShoppingBag } },
  { path: "/menus", permission: "menus.manage", navigation: { group: "commerce", label: "Thực đơn", icon: BookOpen } },
  { path: "/reports", permission: "reports.view", navigation: { group: "commerce", label: "Báo cáo", icon: BarChart3 } },
  { path: "/organizations", permission: "organizations.view", navigation: { group: "administration", label: "Tổ chức & cửa hàng", icon: Building2 } },
  { path: "/users", permission: "accounts.read", navigation: { group: "administration", label: "Tài khoản", icon: Users } },
  { path: "/settings/payment-methods", permission: "payments.manage", navigation: { group: "administration", label: "Cấu hình thanh toán", icon: CreditCard } },
  { path: "/platform/exceptions", permission: "sync-dead-letters.manage", navigation: { group: "administration", label: "Sự cố đồng bộ", icon: ShieldAlert } },
  { path: "/menu", permission: "menus.manage" },
  { path: "/roles", permission: "permission-matrix.view" },
] as const;

export const DASHBOARD_NAVIGATION_GROUPS = [
  { key: "operations", label: "Vận hành" },
  { key: "commerce", label: "Kinh doanh" },
  { key: "administration", label: "Quản trị" },
] as const;
