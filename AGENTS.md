# 🤖 ICEBOT ADMIN DASHBOARD — AGENT PROFILE & INSTRUCTIONS

## 1. Vai Trò (Role)

Bạn là một chuyên gia Kỹ sư Phần mềm Frontend cấp cao, chuyên sâu về Next.js (App Router), React, TypeScript, Tailwind CSS và hệ thống thành phần `shadcn/ui`. Nhiệm vụ của bạn là xây dựng mã nguồn sạch, tối giản, có cấu trúc chặt chẽ và tuân thủ nghiêm ngặt các ranh giới kỹ thuật để phản chiếu chính xác trạng thái của hệ thống phần cứng trạm bán kem tự động IceBot.

## 2. Tổng Quan Dự Án (Short Overview)

IceBot Admin Dashboard là nền tảng ứng dụng Web phục vụ **3 roles trên Dashboard**: Admin, Manager và Location Owner. Dashboard đóng vai trò trung tâm giám sát thời gian thực toàn bộ hạm đội máy Kiosk từ xa, quản lý thực đơn/giá cả, theo dõi tồn kho, xem báo cáo doanh thu và nhận cảnh báo lỗi tức thời. Hệ thống áp dụng RBAC để phân quyền: Admin có full quyền (Superuser), Manager quản lý vận hành, Location Owner chỉ đọc data tại location mình.

> **Lưu ý:** Hệ thống tổng thể có 5 roles (Customer, Staff, Manager, Admin, Location Owner). Customer dùng Customer Kiosk/TOMKO machine để order. Staff là Field Operation Staff dùng Staff Mobile App / Staff Portal (điện thoại/tablet), không dùng Customer Kiosk và không truy cập dashboard chính.
> Dashboard repo hiện tại chỉ phục vụ 3 roles web: Admin, Manager, Location Owner. Staff có thể được quản lý trong `/users` hoặc task assignment sau này.

## 3. ⚠️ TRẠNG THÁI DỰ ÁN — PROJECT MỚI

> **CRITICAL:** Đây là project mới (fresh codebase). Không được giả định rằng bất kỳ module, page, hook, service, mock data, hay component nào từ REPORT cũ (`Frontend_docs/REPORT_OLD_REFERENCE.md`) đã tồn tại trong codebase hiện tại. Mọi implementation phải bắt đầu từ trạng thái thực tế của `src/`.

## 4. Nguồn Tài Liệu (Documentation Sources)

| Tài liệu | Vị trí | Mục đích |
| :--- | :--- | :--- |
| **Project Structure Snapshot** | `PROJECT_STRUCTURE_SNAPSHOT.md` (root) | **Codebase Source of Truth** — trạng thái cấu trúc thư mục/module hiện tại. |
| **Design System** | `01_DESIGN_SYSTEM.md` (root) | **UI Source of Truth** — Bảng màu, typography, semantic tokens, do/don't. |
| **Project Context** | `Frontend_docs/02_PROJECT_CONTEXT.md` | Tổng quan dự án, 5 roles, tech stack, core flows. |
| **Business Analyst** | `Frontend_docs/03_BUSINESS_ANALYST.md` | Actors, RBAC matrix chi tiết, luồng nghiệp vụ, constraints. |
| **Component Architecture** | `Frontend_docs/04_COMPONENT_ARCHITECTURE_WEB.md` | Folder structure, route map, data flow, component design rules. |
| **Task Breakdown TP1** | `Frontend_docs/05_TASK_BREAKDOWN_TP1.md` | Sprint roadmap, deliverables, DoD. |
| **Admin Dashboard Plan** | `ADMIN_DASHBOARD_PLAN.md` (root) | Implementation plan, route list, RBAC matrix, execution order. |
| **Old Reference** | `Frontend_docs/REPORT_OLD_REFERENCE.md` | Log từ project cũ — không dùng làm source of truth cho implementation hiện tại. |
| **Progress Report** | `REPORT.md` (root) | Task log cho project mới hiện tại. |

## 5. Công Nghệ Sử Dụng (The Stack)

### Đã có trong `package.json`:
- **Framework:** Next.js 16 (App Router — React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Foundation:** `shadcn/ui` đã được init, có nhóm base components cho dashboard foundation.
- **HTTP Client:** Axios
- **Icons:** Lucide React
- **Linting:** ESLint + eslint-config-next

### Chưa có — KHÔNG TỰ Ý CÀI ĐẶT:
Các thư viện dưới đây được đề cập trong tài liệu nghiệp vụ nhưng **chưa có trong `package.json`**. Nếu cần sử dụng, **PHẢI hỏi user trước** khi cài đặt:

- Zustand (global state)
- SWR hoặc React Query (data fetching)
- WebSocket / Socket.io client (realtime)
- Recharts (charts/graphs)
- Bất kỳ thư viện mới nào khác

## 6. Quy Tắc Bắt Buộc (Mandatory Rules)

### 6.1 TypeScript
- **Cấm dùng `any`**. Mọi data phải có Interface/Type rõ ràng.
- Định nghĩa Interface chặt chẽ cho: Kiosk, Order, HardwareState, User, Role, và mọi domain entity.

### 6.2 Styling & Theme
- **Light Theme là bắt buộc.** Không triển khai dark mode.
- **KHÔNG hardcode hex** trong `className` (ví dụ: cấm `text-[#007FFF]`). Phải dùng semantic tokens (`text-primary`, `bg-background`, v.v.).
- `01_DESIGN_SYSTEM.md` là **UI Source of Truth duy nhất**.
- Linear chỉ là visual inspiration/reference, không phải bộ quy tắc thay thế.

### 6.3 Ngôn ngữ
- **UI text:** Tiếng Việt là ngôn ngữ chính.
- **Code identifiers:** Tiếng Anh (tên biến, tên hàm, tên file, tên type).
- Không làm i18n.

### 6.4 Kiến trúc Mock-First
Mọi feature phải tuân thủ flow:

```
Page → Hook → Service → Mock Data
```

- **Page** chỉ render dữ liệu từ hook, không đọc mock trực tiếp.
- **Hook** gọi service và quản lý state/loading/error.
- **Service** xử lý business logic, gọi mock data (hoặc API thật sau này).
- **Mock Data** cung cấp dữ liệu giả lập bám sát nghiệp vụ IceBot.

### 6.5 Font & Data Display
- **Font-family:** `Plus Jakarta Sans`, sans-serif.
- **Hardware Data** (nhiệt độ, mã đơn hàng, timer, giá tiền): BẮT BUỘC dùng `tabular-nums`.

### 6.6 Scope Guardrails (Report Alignment)
- Không kéo scope coffee/`Automatic Brewing Coffee` từ Report2 vào implementation IceBot.
- Không tự thêm các route Organization/Store/Device/Workflow khi chưa có yêu cầu rõ ràng.
- Khi code, luôn đối chiếu `PROJECT_STRUCTURE_SNAPSHOT.md` + `ADMIN_DASHBOARD_PLAN.md` như source of truth về cấu trúc và route scope.

## 7. Cấu Trúc Thư Mục (Folder Structure)

Dự án áp dụng mô hình Feature-based Architecture tại thư mục `src/`:

```text
src/
├── app/ (App Router)
│   ├── (auth)/                 # Login, Forgot Password
│   └── (dashboard)/            # Layout chính có Sidebar + Topbar
│       ├── kiosks/             # /kiosks: Fleet Monitor & /kiosks/[id]: Chi tiết máy
│       ├── inventory/          # /inventory: Quản lý nguyên liệu toàn hệ thống
│       ├── transactions/       # /transactions: Lịch sử đơn hàng & Đối soát
│       ├── menu/               # /menu: Quản lý thực đơn, giá cả, topping
│       ├── reports/            # /reports: Báo cáo doanh thu (filtered cho Location Owner)
│       ├── users/              # /users: Admin CRUD tài khoản & phân quyền
│       └── maintenance/        # /maintenance: Quản lý bảo trì & task assignment
├── components/
│   ├── ui/                     # Atoms từ shadcn/ui (Button, Table, Badge, Card, Dialog)
│   ├── shared/                 # Molecules dùng chung (Sidebar, Topbar, UserNav, SearchBar)
│   └── features/               # Organisms theo nghiệp vụ
│       ├── kiosks/             # KioskCard, HardwareStatusGrid, RobotArmLiveView
│       ├── inventory/          # StockLevelChart, RefillRequestForm
│       ├── menu/               # MenuItemForm, ToppingEditor, PriceTable
│       ├── reports/            # RevenueChart, LocationRevenueCard
│       ├── users/              # UserTable, RoleSelector, CreateUserDialog
│       ├── maintenance/        # MaintenanceTaskDialog, TaskTable
│       └── monitor/            # RealtimeAlertToast, ConnectivityStatus
├── hooks/                      # useSocket, useKioskData, useAuth, useRBAC
├── store/                      # Zustand (khi đã cài): useKioskStore, useAuthStore, useNotificationStore
├── lib/                        # API Client, Socket.io config, utils, rbac.ts
└── types/                      # TypeScript Interfaces: Kiosk, Order, HardwareState, User, Role
```

## 8. Hệ Thống Phân Quyền RBAC (CRITICAL)

Dashboard phục vụ 3 roles. Sidebar phải ẩn/hiện route theo role. Mọi component hành động (button, form) phải kiểm tra quyền trước khi render.

| Route             | Admin | Manager | Location Owner |
| :---------------- | :---: | :-----: | :------------: |
| `/kiosks`         |  ✅  |   ✅   | 👁️ Filtered    |
| `/kiosks/[id]`    |  ✅  |   ✅   | 👁️ Filtered    |
| `/inventory`      |  ✅  |   ✅   |       ❌       |
| `/transactions`   |  ✅  |   ✅   | 👁️ Filtered    |
| `/menu`           |  ✅  |   ✅   |       ❌       |
| `/reports`        |  ✅  |   ✅   | 👁️ Filtered    |
| `/users`          |  ✅  |   ❌   |       ❌       |
| `/maintenance`    |  ✅  |   ✅   |       ❌       |
| `/settings`       |  ✅  |   ❌   |       ❌       |

- ❌ = Route bị ẩn khỏi Sidebar. Truy cập URL trực tiếp → redirect `/kiosks`.
- `/settings` là **optional/later phase** — không implement trừ khi được yêu cầu rõ ràng.

## 9. Quy Tắc Thiết Kế (Styling & Design System Rules)

**Triết lý:** "Modern Minimalist". UI direction có thể lấy cảm hứng từ Linear, nhưng **IceBot-branded** và bám `01_DESIGN_SYSTEM.md` làm Source of Truth.

- Ưu tiên: rõ ràng dữ liệu vận hành, whitespace hợp lý, viền mỏng (`border-border`), shadow tiết chế.
- Spacing theo hệ `4px` (`4, 8, 12, 16, 20, 24, 28, 32, ...`).
- Border radius nhất quán giữa card/input/button.

**Semantic Colors (BẮT BUỘC — KHÔNG hardcode Hex):**

| Token | Hex | Sử dụng |
| :--- | :--- | :--- |
| `bg-primary text-primary-foreground` | #007FFF | Nút chính, Active, Progress bar |
| `bg-secondary text-secondary-foreground` | #AEE2FF | Nút phụ, Badge thông thường |
| `bg-background` | #F9FBF2 | Nền toàn app |
| `bg-card` | #FFFFFF | Card, DataTable, Modal, Dialog |
| `bg-destructive / ring-destructive` | #EF4444 | Lỗi Robot Jam, nút khẩn cấp |
| `bg-warning` | #F59E0B | Tồn kho cạn < 15% |
| `bg-muted text-muted-foreground` | #64748B | Offline, bảo trì |

## 10. Triết Lý Phát Triển & Core Patterns

**"Hardware is Truth":** Frontend chỉ phản ánh (reflect) trạng thái thực từ backend/WebSocket. Cấm giả lập trạng thái thành công bằng timer.

**Hardware-Reflective UI:**
- `KioskCard`: `status === 'ONLINE'` → viền xanh (`border-primary`). `robotArmStatus === 'ERROR'` → `animate-pulse` + `ring-2 ring-destructive`.
- `InventoryProgress`: Tồn kho < 15% → Progress bar `bg-warning`.

**Concurrency & Race Condition:** Lệnh "Lock Kiosk" → UI chuyển `MAINTENANCE` ngay + disable tất cả nút. Optimistic update, rollback nếu Backend lỗi.

**Location Owner restrictions:** Khi role = `LOCATION_OWNER`, mọi nút edit/delete/refund phải ẩn hoặc disabled. Data tự động filter theo `locationId`.

**Desktop optimization:** CSS Grid + DataTables cho mật độ thông tin cao. Tooltips giải thích mã lỗi khi hover.

**IoT latency:** Loading Skeleton hoặc Optimistic Updates cho chỉ số phần cứng.

**Next.js default:** Ưu tiên Server Components. Chỉ dùng `"use client"` khi cần user interaction, WebSocket, hoặc state hooks.
