# 🏛️ 04_COMPONENT_ARCHITECTURE_WEB (Admin Dashboard)

## 1. Tổng Quan Kiến Trúc (Architecture Overview)
Dựa trên yêu cầu sử dụng Next.js (App Router) và `shadcn/ui`, Dashboard được thiết kế theo hướng **Feature-based Architecture** để dễ dàng mở rộng khi số lượng Kiosk tăng lên. Dashboard phục vụ **3 roles**: Admin, Manager, Location Owner — áp dụng RBAC để ẩn/hiện route và tính năng theo role.

## 2. Cấu Trúc Thư Mục Chuẩn (Project Structure)
```text
src/
├── app/ (App Router)
│   ├── (auth)/                 # Login, Forgot Password
│   └── (dashboard)/            # Layout chính có Sidebar + Topbar
│       ├── kiosks/             # /kiosks: Danh sách máy & Live Monitor
│       │   └── [id]/           # /kiosks/[id]: Chi tiết từng máy
│       ├── inventory/          # /inventory: Quản lý nguyên liệu toàn hệ thống
│       ├── transactions/       # /transactions: Lịch sử đơn hàng & Đối soát
│       ├── menu/               # /menu: Quản lý thực đơn, giá cả, topping
│       ├── reports/            # /reports: Báo cáo doanh thu (Location Owner xem data mình)
│       ├── users/              # /users: Admin CRUD tài khoản & phân quyền
│       ├── maintenance/        # /maintenance: Quản lý bảo trì & task assignment (Admin/Manager)
│       └── settings/           # /settings: Cấu hình hệ thống (chỉ Admin) — OPTIONAL/LATER PHASE
├── components/
│   ├── ui/                     # Atoms từ shadcn/ui: Button, Table, Badge, Card, Dialog
│   ├── shared/                 # Molecules dùng chung: Sidebar, Topbar, UserNav, SearchBar
│   └── features/               # Organisms theo nghiệp vụ
│       ├── kiosks/             # KioskCard, HardwareStatusGrid, RobotArmLiveView
│       ├── inventory/          # StockLevelChart, RefillRequestForm
│       ├── menu/               # MenuItemForm, ToppingEditor, PriceTable
│       ├── reports/            # RevenueChart, LocationRevenueCard
│       ├── users/              # UserTable, RoleSelector, CreateUserDialog
│       ├── maintenance/        # MaintenanceTaskDialog, TaskTable
│       └── monitor/            # RealtimeAlertToast, ConnectivityStatus
├── hooks/                      # useSocket, useKioskData, useAuth, useRBAC
├── store/                      # Zustand: useKioskStore, useAuthStore, useNotificationStore
├── lib/                        # API Client, Socket.io config, utils, rbac.ts
└── types/                      # TypeScript Interfaces: Kiosk, Order, HardwareState, User, Role
```

## 3. Dashboard Route Map & RBAC

| Route | Trang | Admin | Manager | Location Owner |
| :--- | :--- | :---: | :---: | :---: |
| `/kiosks` | Fleet Monitor | ✅ | ✅ | 👁️ Filtered |
| `/kiosks/[id]` | Kiosk Detail | ✅ | ✅ | 👁️ Filtered |
| `/inventory` | Quản lý tồn kho | ✅ | ✅ | ❌ |
| `/transactions` | Lịch sử giao dịch | ✅ | ✅ | 👁️ Filtered |
| `/menu` | Quản lý thực đơn | ✅ | ✅ | ❌ |
| `/reports` | Báo cáo doanh thu | ✅ | ✅ | 👁️ Filtered |
| `/users` | Quản lý tài khoản | ✅ | ❌ | ❌ |
| `/maintenance` | Quản lý bảo trì | ✅ | ✅ | ❌ |
| `/settings` | Cấu hình hệ thống (Later phase) | ✅ | ❌ | ❌ |

**Ghi chú:**
- 👁️ Filtered = Read-Only, data lọc theo `locationId`. ❌ = Route bị ẩn khỏi Sidebar, truy cập trực tiếp URL → redirect `/kiosks`.
- `/settings` là **optional/later phase** — không implement trừ khi được yêu cầu rõ ràng hoặc có Figma design.

## 3.1 Non-goals For Current TP1
- Không thêm các route mới ngoài route plan hiện tại cho Dashboard TP1.
- Không triển khai route/module chi tiết cho Organization Management, Store Management, Device Type Management, Device Model Management, Kiosk Version Management, Workflow Management trong giai đoạn này.
- Nếu chưa có yêu cầu xác nhận từ Product Owner, không tự mở rộng scope bằng các module quản trị cấp nền tảng ở trên.

## 3.2 Future Modules (Later Phase)
- Organization Management.
- Store Management.
- Device Management (Device Type/Device Model/Kiosk Version).
- Workflow Management.

## 4. Luồng Dữ Liệu & Quản Lý Trạng Thái (Data Flow)

**REST API (SWR/React Query):** Sử dụng cho dữ liệu tĩnh hoặc ít thay đổi:
- Danh sách Kiosk, lịch sử giao dịch, thông tin người dùng, menu items.

**WebSockets (Real-time):** BẮT BUỘC dùng để cập nhật trạng thái "Sống" của phần cứng:
- Nhiệt độ tủ đông (Freezer Temperature).
- Trạng thái tay máy (Robot Arm Telemetry).
- Cảnh báo lỗi kẹt cơ học (`ROBOT_JAM`).

**Global State (Zustand):** Lưu trữ:
- Bộ lọc (filter) và trạng thái Sidebar.
- Thông báo (notifications) và danh sách cảnh báo.
- Thông tin user đang đăng nhập và role (cho RBAC).

## 5. Quy Tắc Thiết Kế Component "Phản Chiếu Phần Cứng"
Để tuân thủ triết lý "Hardware is Truth":

**KioskCard Component:**
- Nếu `status === 'ONLINE'`: Hiển thị viền xanh dương (`border-primary`).
- Nếu `status === 'OFFLINE'`: Viền xám (`border-muted`).
- Nếu `hardwareState.robotArmStatus === 'ERROR'`: Card có hiệu ứng `animate-pulse` và viền đỏ (`ring-2 ring-destructive`).
- Nếu `status === 'MAINTENANCE'`: Viền xám + Badge "Bảo trì" (`bg-muted`).

**InventoryProgress:**
- Sử dụng Progress bar màu cam (`bg-warning`) khi mức tồn kho dưới 15%.
- Màu xanh (`bg-primary`) khi tồn kho bình thường.

**Tabular Numbers:**
- Mọi con số về giá tiền, mã đơn hàng, nhiệt độ phải dùng class `tabular-nums`.

## 6. Xử Lý Concurrency & Race Condition (Dashboard Side)
- Khi Admin/Manager thực hiện lệnh "Lock Kiosk" để bảo trì, UI phải ngay lập tức chuyển trạng thái sang `MAINTENANCE` và disable các nút điều khiển khác.
- Optimistic update cho hành động Lock/Unlock nhưng phải rollback nếu Backend trả lỗi.
- Khi Location Owner truy cập, mọi nút thao tác (edit, delete, refund) phải bị ẩn/disabled.

## 7. RBAC Implementation Guide
```typescript
// src/lib/rbac.ts
export type Role = 'ADMIN' | 'MANAGER' | 'LOCATION_OWNER';

export const PERMISSIONS = {
  'kiosks.view':        ['ADMIN', 'MANAGER', 'LOCATION_OWNER'],
  'kiosks.control':     ['ADMIN', 'MANAGER'],
  'inventory.view':     ['ADMIN', 'MANAGER'],
  'inventory.edit':     ['ADMIN', 'MANAGER'],
  'transactions.view':  ['ADMIN', 'MANAGER', 'LOCATION_OWNER'],
  'transactions.refund':['ADMIN', 'MANAGER'],
  'menu.view':          ['ADMIN', 'MANAGER'],
  'menu.edit':          ['ADMIN', 'MANAGER'],
  'reports.view':       ['ADMIN', 'MANAGER', 'LOCATION_OWNER'],
  'users.view':         ['ADMIN'],
  'users.edit':         ['ADMIN'],
  'maintenance.view':   ['ADMIN', 'MANAGER'],
  'maintenance.edit':   ['ADMIN', 'MANAGER'],
  'settings.view':      ['ADMIN'],
  'settings.edit':      ['ADMIN'],
} as const;

export function hasPermission(role: Role, permission: keyof typeof PERMISSIONS): boolean {
  return PERMISSIONS[permission].includes(role);
}
```
