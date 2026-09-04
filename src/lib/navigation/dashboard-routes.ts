import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  ClipboardCheck,
  CreditCard,
  Factory,
  FileCode2,
  FileText,
  LayoutDashboard,
  Monitor,
  Package,
  ReceiptText,
  RefreshCcw,
  ShieldAlert,
  SlidersHorizontal,
  ShoppingBag,
  Users,
  Wrench,
} from "lucide-react";

import type { DashboardPermission, DashboardRoutePath } from "@/types";

export interface DashboardRouteDefinition {
  path: DashboardRoutePath;
  permission: DashboardPermission;
  label: string;
}

export type DashboardNavigationGroup =
  | "overview"
  | "operations"
  | "commerce"
  | "catalog"
  | "production"
  | "organization"
  | "platform";

export interface DashboardNavigationItem {
  routePath: DashboardRoutePath;
  requiredPermission?: DashboardPermission;
  href?: string;
  query?: Readonly<Record<string, string>>;
  group: DashboardNavigationGroup;
  label: string;
  icon: LucideIcon;
}

// This registry owns route-level permission checks only. Navigation may expose
// focused views of a route through query parameters without changing its guard.
export const DASHBOARD_ROUTE_REGISTRY: readonly DashboardRouteDefinition[] = [
  { path: "/dashboard", permission: "dashboard.view", label: "Tổng quan" },
  { path: "/readiness", permission: "dashboard.view", label: "Kiểm tra thiết lập" },
  { path: "/production", permission: "program.read", label: "Chương trình robot" },
  { path: "/organizations", permission: "organizations.view", label: "Tổ chức" },
  { path: "/stores", permission: "stores.view", label: "Cửa hàng" },
  { path: "/kiosks", permission: "kiosks.view", label: "Kiosk" },
  { path: "/menu-availability", permission: "menu-items.availability.manage", label: "Trạng thái bán món" },
  { path: "/inventory", permission: "inventory.view", label: "Tồn kho" },
  { path: "/transactions", permission: "orders.view", label: "Đơn hàng và giao dịch" },
  { path: "/products", permission: "products.manage", label: "Sản phẩm" },
  { path: "/menus", permission: "menus.manage", label: "Thực đơn" },
  { path: "/reports", permission: "reports.view", label: "Báo cáo" },
  { path: "/users", permission: "accounts.read", label: "Tài khoản" },
  { path: "/staff", permission: "workforce.staff.read", label: "Nhân viên" },
  { path: "/roles", permission: "permission-matrix.view", label: "Vai trò và quyền" },
  { path: "/maintenance", permission: "maintenance.view", label: "Bảo trì" },
  { path: "/alerts", permission: "alerts.view", label: "Cảnh báo" },
  { path: "/platform/exceptions", permission: "sync-dead-letters.manage", label: "Sự cố đồng bộ" },
  { path: "/platform/lua-templates", permission: "artifact-template.read", label: "Mẫu LUA hệ thống" },
  { path: "/platform/organization-sales", permission: "platform.organization-sales.view", label: "Doanh thu tổ chức" },
  { path: "/platform/service-registrations", permission: "service-registrations.read", label: "Đơn đăng ký dịch vụ" },
  { path: "/platform/content-pages", permission: "content-pages.read", label: "Trang nội dung" },
  { path: "/settings/payment-methods", permission: "payment-methods.manage", label: "Phương thức thanh toán" },
  { path: "/menu", permission: "menus.manage", label: "Thực đơn" },
] as const;

export const DASHBOARD_NAVIGATION_GROUPS: ReadonlyArray<{
  key: DashboardNavigationGroup;
  label: string;
}> = [
  { key: "overview", label: "Tổng quan" },
  { key: "operations", label: "Vận hành" },
  { key: "commerce", label: "Bán hàng" },
  { key: "catalog", label: "Danh mục" },
  { key: "production", label: "Robot" },
  { key: "organization", label: "Tổ chức và nhân sự" },
  { key: "platform", label: "Nền tảng" },
];

export const DASHBOARD_NAVIGATION_ITEMS: readonly DashboardNavigationItem[] = [
  { routePath: "/dashboard", group: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { routePath: "/kiosks", group: "operations", label: "Quản lý Kiosk", icon: Monitor },
  { routePath: "/menu-availability", group: "operations", label: "Trạng thái bán món", icon: SlidersHorizontal },
  { routePath: "/inventory", group: "operations", label: "Tồn kho", icon: Package },
  { routePath: "/maintenance", group: "operations", label: "Bảo trì", icon: Wrench },
  { routePath: "/alerts", group: "operations", label: "Cảnh báo", icon: Bell },
  { routePath: "/readiness", group: "operations", label: "Kiểm tra thiết lập", icon: ClipboardCheck },
  { routePath: "/transactions", query: { tab: "orders" }, group: "commerce", label: "Đơn hàng và giao dịch", icon: ReceiptText },
  { routePath: "/transactions", requiredPermission: "refunds.manage", query: { tab: "refunds" }, group: "commerce", label: "Hoàn tiền", icon: RefreshCcw },
  { routePath: "/reports", group: "commerce", label: "Báo cáo", icon: BarChart3 },
  { routePath: "/products", group: "catalog", label: "Sản phẩm", icon: ShoppingBag },
  { routePath: "/menus", group: "catalog", label: "Thực đơn", icon: BookOpen },
  { routePath: "/production", query: { stage: "programs" }, group: "production", label: "Chương trình robot", icon: Factory },
  // { routePath: "/production", query: { stage: "packages" }, group: "production", label: "Gói sản xuất", icon: Boxes },
  // { routePath: "/production", query: { stage: "releases" }, group: "production", label: "Bản phát hành", icon: Package },
  // { routePath: "/production", query: { stage: "bindings" }, group: "production", label: "Liên kết cấu hình", icon: GitBranch },
  { routePath: "/organizations", group: "organization", label: "Tổ chức", icon: Building2 },
  { routePath: "/stores", group: "organization", label: "Cửa hàng", icon: Building2 },
  { routePath: "/users", group: "organization", label: "Tài khoản", icon: Users },
  { routePath: "/staff", group: "organization", label: "Nhân viên", icon: Users },
  { routePath: "/roles", group: "organization", label: "Vai trò & quyền", icon: ShieldAlert },
  { routePath: "/platform/service-registrations", group: "platform", label: "Đơn đăng ký dịch vụ", icon: ClipboardCheck },
  { routePath: "/platform/exceptions", group: "platform", label: "Sự cố đồng bộ", icon: ShieldAlert },
  { routePath: "/platform/lua-templates", group: "platform", label: "Mẫu LUA hệ thống", icon: FileCode2 },
  { routePath: "/platform/organization-sales", group: "platform", label: "Doanh thu tổ chức", icon: BarChart3 },
  { routePath: "/platform/content-pages", group: "platform", label: "Trang nội dung tĩnh", icon: FileText },
  { routePath: "/settings/payment-methods", group: "platform", label: "Phương thức thanh toán", icon: CreditCard },
] as const;

export function getDashboardRouteDefinition(pathname: string) {
  return DASHBOARD_ROUTE_REGISTRY.find(
    (route) => pathname === route.path || pathname.startsWith(`${route.path}/`),
  );
}
