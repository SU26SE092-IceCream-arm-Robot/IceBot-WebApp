# 📋 ADMIN DASHBOARD PLAN — IceBot Web App

## 1. Goal

Xây dựng Admin Dashboard cho hệ thống IceBot — nền tảng giám sát và quản lý tập trung toàn bộ hạm đội máy bán kem tự động (Kiosk). Dashboard cho phép:

- Giám sát realtime trạng thái phần cứng, kết nối, nhiệt độ của từng Kiosk.
- Quản lý thực đơn, giá cả, topping toàn hệ thống.
- Theo dõi tồn kho nguyên liệu và cảnh báo refill.
- Xem lịch sử giao dịch, đối soát, hoàn tiền thủ công.
- Báo cáo doanh thu theo location và thời gian.
- Quản lý tài khoản người dùng và phân quyền RBAC.
- Quản lý phiếu bảo trì và điều phối Staff hiện trường.

## 2. Roles Sử Dụng Dashboard

| Role | Mô tả | Quyền tổng quan |
| :--- | :--- | :--- |
| **Admin** | Quản trị viên hệ thống (Superuser) | Full quyền toàn bộ tính năng |
| **Manager** | Quản lý vận hành | Giám sát kiosk, quản lý menu/tồn kho/giao dịch/bảo trì, xem báo cáo |
| **Location Owner** | Chủ mặt bằng | Read-only, chỉ xem data tại location của mình |

> **Không truy cập Dashboard chính:**
> - **Customer** → Dùng Customer Kiosk/TOMKO machine (Flutter) để đặt hàng.
> - **Staff** → Dùng Staff Mobile App / Staff Portal (điện thoại/tablet) cho vận hành hiện trường (refill/maintenance). Staff có thể được quản lý trong `/users` nhưng không đăng nhập dashboard.

## 3. Route List

| # | Route | Tên trang | Mô tả |
| :---: | :--- | :--- | :--- |
| 1 | `/kiosks` | Fleet Monitor | Danh sách tất cả Kiosk, live status grid |
| 2 | `/kiosks/[id]` | Kiosk Detail | Chi tiết từng máy: telemetry, lịch sử lỗi, control panel |
| 3 | `/inventory` | Quản lý tồn kho | Nguyên liệu toàn hệ thống, cảnh báo refill |
| 4 | `/transactions` | Lịch sử giao dịch | Đơn hàng, đối soát, hoàn tiền thủ công |
| 5 | `/menu` | Quản lý thực đơn | CRUD món, giá cả, topping, kích cỡ |
| 6 | `/reports` | Báo cáo doanh thu | Biểu đồ doanh thu theo location/thời gian |
| 7 | `/users` | Quản lý tài khoản | Admin CRUD users, gán role/location |
| 8 | `/maintenance` | Quản lý bảo trì | Phiếu bảo trì, task assignment cho Staff |

> **`/settings`** — Optional/Later Phase. Không implement trừ khi được yêu cầu rõ ràng. Nếu Figma/requirement chưa có design cho Settings, bỏ qua.

## 3.1 Out of Current Phase

Các hạng mục dưới đây nằm ngoài phạm vi triển khai hiện tại:
- Organization Management
- Store Management
- Device Type / Device Model Management
- Kiosk Version Management
- Detailed Workflow Management

**Nguyên tắc scope:** Không mở rộng route plan TP1 hiện tại. Route list chính thức vẫn giữ nguyên:
- `/kiosks`
- `/kiosks/[id]`
- `/inventory`
- `/transactions`
- `/menu`
- `/reports`
- `/users`
- `/maintenance`

`/settings` tiếp tục là later phase.

## 4. Sidebar Mapping

Mapping từ sidebar UI hiện tại (nếu có) sang route list:

| Sidebar Label | Route | Ghi chú |
| :--- | :--- | :--- |
| Dashboard | — | Optional overview page, không bắt buộc |
| Kiosks Management | `/kiosks` | Fleet Monitor + drill-down `/kiosks/[id]` |
| Orders & Sales | `/transactions` | Lịch sử giao dịch & đối soát |
| Product Catalog | `/menu` | Quản lý thực đơn |
| Analytics | `/reports` | Báo cáo doanh thu |
| System Settings | `/settings` | **Later phase** — không implement ngay |

## 5. Implementation Order

Thứ tự triển khai theo priority và dependency:

| Phase | Route / Feature | Mô tả | Dependency |
| :---: | :--- | :--- | :--- |
| **1** | UI Foundation / Layout | Sidebar, Topbar, Dashboard layout, RBAC foundation, TypeScript types | Không |
| **2** | `/kiosks` | Fleet Monitor — danh sách kiosk, KioskCard, status grid | Phase 1 |
| **3** | `/kiosks/[id]` | Kiosk Detail — telemetry, lịch sử lỗi, control panel | Phase 2 |
| **4** | `/inventory` | Quản lý tồn kho — levels, cảnh báo, refill action | Phase 1 |
| **5** | `/transactions` | Lịch sử giao dịch — DataTable, refund/reconcile | Phase 1 |
| **6** | `/menu` | Quản lý thực đơn — CRUD, size/topping/price | Phase 1 |
| **7** | `/reports` | Báo cáo doanh thu — charts, location filter | Phase 5 (cùng data source) |
| **8** | `/users` | Quản lý tài khoản — CRUD, role/location assignment | Phase 1 |
| **9** | `/maintenance` | Quản lý bảo trì — task CRUD, alert→task, Staff assignment | Phase 2 + Phase 8 |

## 6. Mock-First Architecture

Mọi feature phải tuân thủ flow:

```
Page → Hook → Service → Mock Data
```

### Quy tắc:
- **Page** chỉ render dữ liệu đã xử lý từ hook. Không import mock trực tiếp.
- **Hook** gọi service, quản lý state/loading/error, cung cấp API cho page.
- **Service** chứa business logic, gọi mock data store (sẽ thay bằng API thật sau này).
- **Mock Data** phải bám sát nghiệp vụ máy bán kem IoT. Cấm dùng ví dụ e-commerce thông thường.

### Ví dụ structure:
```text
src/
├── hooks/use-kiosks.ts          # Hook cho /kiosks page
├── lib/services/kiosks.ts       # Service layer
├── lib/mocks/kiosks.ts          # Mock data
└── types/index.ts               # Kiosk, HardwareState, etc.
```

### Lưu ý dependency:
- Nếu hook cần Zustand/SWR → **hỏi user trước** khi cài thư viện.
- Nếu chưa có SWR, dùng React state (`useState` + `useEffect`) làm placeholder.
- Khi backend sẵn sàng, chỉ cần thay service layer mà không đổi page/hook.

## 7. RBAC Matrix

| Route | Admin | Manager | Location Owner | Ghi chú |
| :--- | :---: | :---: | :---: | :--- |
| `/kiosks` | ✅ Full | ✅ Full | 👁️ Filtered | Location Owner chỉ xem kiosk tại location mình |
| `/kiosks/[id]` | ✅ Full + Control | ✅ Full + Control | 👁️ Read-only (scope) | Location Owner không có control panel |
| `/inventory` | ✅ Full CRUD | ✅ Full CRUD | ❌ | — |
| `/transactions` | ✅ Full + Refund | ✅ Full + Refund | 👁️ Filtered | Location Owner không thấy action column |
| `/menu` | ✅ Full CRUD | ✅ Full CRUD | ❌ | — |
| `/reports` | ✅ Toàn hệ thống | ✅ Toàn hệ thống | 👁️ Filtered | Location Owner chỉ xem doanh thu location mình |
| `/users` | ✅ Full CRUD | ❌ | ❌ | Chỉ Admin |
| `/maintenance` | ✅ Full CRUD | ✅ Full CRUD | ❌ | Admin/Manager tạo/gán/sửa task bảo trì |
| `/settings` | ✅ Full | ❌ | ❌ | **Later phase** — chưa implement |

**Ký hiệu:**
- ✅ = Truy cập đầy đủ
- 👁️ Filtered = Read-only, data lọc theo `locationId`
- ❌ = Route ẩn khỏi Sidebar; truy cập URL trực tiếp → redirect `/kiosks`

## 8. Definition of Done (DoD)

Một task/feature được coi là hoàn thành khi đáp ứng **tất cả** tiêu chí:

- [ ] Code không có lỗi TypeScript — không dùng `any`.
- [ ] Vượt qua linter (`npm run lint`).
- [ ] Build thành công (`npm run build`).
- [ ] UI khớp design system (`01_DESIGN_SYSTEM.md`): đúng semantic tokens, typography, spacing.
- [ ] Light Theme — không có dark mode artifacts.
- [ ] UI text tiếng Việt, code identifiers tiếng Anh.
- [ ] Không hardcode hex trong `className`.
- [ ] Tuân thủ mock-first architecture: `Page → Hook → Service → Mock Data`.
- [ ] RBAC hoạt động đúng: route ẩn/hiện, data filtered, button disabled/ẩn theo role.
- [ ] Handle lỗi `timeout` và `network error` (loading/error states).
- [ ] Hardware data dùng `tabular-nums`.
- [ ] Entry được ghi vào `REPORT.md` với đủ 6 mục.
