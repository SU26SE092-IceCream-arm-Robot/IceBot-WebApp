# 05_TASK_BREAKDOWN_TP1 - SPRINT PLAN & FRONTEND DELIVERABLES

## 1. Phạm Vi Công Việc (Scope of TP1)

Thành phần TP1 tập trung vào việc xây dựng giao diện người dùng và logic tương tác cho hai nền tảng:

* **Admin Dashboard (Next.js):** Giám sát hạm đội Kiosk, quản lý tồn kho, menu, giao dịch và phân quyền RBAC cho 3 roles (Admin, Manager, Location Owner).
* **Kiosk/Staff Mobile Apps (Flutter):** Customer dùng Customer Kiosk/TOMKO machine để đặt hàng. Staff dùng Staff Mobile App / Staff Portal trên điện thoại/tablet cho vận hành hiện trường (refill/maintenance).

> **Lưu ý:** File này là kế hoạch tổng thể (Task Breakdown) cho cả Phase TP1, bao gồm cả Web và Mobile tasks để team theo dõi tiến độ chung.
> **Phạm vi repo hiện tại:** Dashboard repo này chỉ phục vụ 3 roles web (Admin, Manager, Location Owner). Staff không truy cập dashboard chính.

### Scope Boundary Clarification (TP1)
- TP1 commit scope tập trung vào Admin Dashboard vận hành hiện tại và Customer/Staff apps theo scope đã định cho IceBot.
- Không kéo WBS hoặc mô tả coffee-oriented từ Report2 (Automatic Brewing Coffee legacy) vào TP1 IceBot.
- Các module quản trị chi tiết như Organization/Store/Device/Workflow Management được xếp vào backlog dài hạn (later phase), chỉ triển khai khi Product Owner xác nhận mở rộng phạm vi.

## 2. Nguyên Tắc Phát Triển (Development Principles)

* **Mock-First Approach:** Frontend không đợi API thật. Phải định nghĩa interface/contract trước và dùng Mock Data để phát triển song song.
* **Hardware-Driven UI:** Mọi trạng thái hiển thị trên giao diện phải dựa trên tín hiệu từ Hardware (thông qua Backend). Không tự ý giả lập trạng thái thành công.
* **Component Atomicity:** Chia nhỏ UI thành các Atomic Components để dễ bảo trì và tái sử dụng (đặc biệt là các chỉ số đo lường IoT).
* **RBAC-First:** Mọi route và component hành động (button, form) phải kiểm tra quyền của role hiện tại trước khi render.

## 3. Lộ Trình Phát Triển (Sprint Roadmap)

### Sprint 1: Foundation & Design System Mapping (Tuần 1-2)

**Mục tiêu:** Thiết lập cấu trúc dự án và áp dụng Design System chuẩn.

* **[Web] Task 1.1:** Khởi tạo Next.js App Router, cấu hình Tailwind CSS với hệ thống Semantic Variables (`primary`, `destructive`, `warning`).
* **[Web] Task 1.2:** Cài đặt `shadcn/ui` và xây dựng Layout Dashboard (Sidebar, Topbar). Sidebar phải ẩn/hiện route theo RBAC.
* **[Web] Task 1.3:** Thiết lập hệ thống Auth mock (Login page, `useAuthStore` với Zustand, RBAC middleware).
* **[Web] Task 1.4:** Định nghĩa TypeScript interfaces cho Kiosk, Order, HardwareState, User, Role.
* **[Mobile] Task 1.5:** Khởi tạo dự án Flutter, cấu hình `ThemeData` ánh xạ từ bảng màu Hex.
* **[Shared] Task 1.6:** Thống nhất bảng mã lỗi phần cứng (Error Codes) và trạng thái Telemetry với team IoT (TP3).

### Sprint 2: Fleet Monitor & Kiosk Management (Tuần 3-4)

**Mục tiêu:** Hiển thị dữ liệu realtime lên Dashboard và xây dựng trang quản lý Kiosk.

* **[Web] Task 2.1:** Xây dựng `KioskCard` hiển thị: Nhiệt độ tủ đông, trạng thái Robot (`READY`, `BUSY`, `ERROR`), mức tồn kho.
* **[Web] Task 2.2:** Tích hợp WebSocket mock để cập nhật Realtime Telemetry. Hiệu ứng `animate-pulse` khi `ROBOT_JAM`.
* **[Web] Task 2.3:** Trang `/kiosks/[id]` — Kiosk Detail: lịch sử lỗi, biểu đồ nhiệt độ, control panel (Lock/Unlock Kiosk).
* **[Web] Task 2.4:** RBAC filtering cho Location Owner — chỉ hiển thị Kiosk thuộc location của họ.
* **[Mobile] Task 2.5:** Xây dựng màn hình Menu Kiosk cho Customer. Logic ẩn món khi hết nguyên liệu.

### Sprint 3: Transactions, Menu & Reports (Tuần 5-6)

**Mục tiêu:** Hoàn thiện các trang quản lý nghiệp vụ trên Dashboard.

* **[Web] Task 3.1:** Trang `/transactions` — Bảng lịch sử giao dịch (DataTable) + tính năng hoàn tiền thủ công (Admin & Manager).
* **[Web] Task 3.2:** Trang `/menu` — CRUD thực đơn (thêm/sửa/xóa vị kem, topping, kích cỡ, giá cả).
* **[Web] Task 3.3:** Trang `/reports` — Biểu đồ doanh thu. Location Owner chỉ xem data theo `locationId`.
* **[Mobile] Task 3.4:** Implement luồng Customize (Chọn vị, Topping, Size) cho Customer. Touch Target tối thiểu 56px.
* **[Mobile] Task 3.5:** Hiển thị QR Code thanh toán với đồng hồ đếm ngược 120s (`tabular-nums`).

### Sprint 4: Users, Inventory & Resilience (Tuần 7-8)

**Mục tiêu:** Hoàn thiện quản lý user, tồn kho và xử lý các tình huống lỗi.

* **[Web] Task 4.1:** Trang `/users` — Admin CRUD tài khoản (Manager, Location Owner, và có thể quản lý Staff cho task assignment/field app). Gán role và location.
* **[Web] Task 4.2:** Trang `/inventory` — Quản lý tồn kho toàn hệ thống. Cảnh báo vàng (`bg-warning`) khi Syrup < 15%.
* **[Web] Task 4.3:** Notification center — Realtime alert toast cho lỗi phần cứng. Lịch sử thông báo.
* **[Mobile] Task 4.4:** Phát triển `NetworkLossOverlay` — khóa App khi mất mạng.
* **[Mobile] Task 4.5:** Animation/UI trạng thái "Serving" — phản chiếu hành động Robot theo tín hiệu.
* **[Mobile] Task 4.6:** Staff Mobile App / Staff Portal — nhận task refill/maintenance, kiểm tra kiosk tại hiện trường, cập nhật tồn kho sau refill, set `MAINTENANCE`/`READY`, reset lỗi cơ bản và báo cáo sự cố.

## 4. Danh Sách Sản Phẩm Bàn Giao (Deliverables)

1. **Mã nguồn (Source Code):** Repo GitHub/GitLab sạch sẽ, phân chia branch theo tính năng.
2. **Tài liệu API Contract:** TypeScript interfaces + JSON mẫu cho cấu trúc dữ liệu Kiosk ↔ Backend.
3. **Kiosk App Build:** File `.apk` để test trên máy cảm ứng thực tế.
4. **Admin Web URL:** Bản deploy (Vercel) với mock data để demo và bảo vệ đồ án.

## 5. Định Nghĩa Hoàn Thành (Definition of Done - DoD)

Một Task được coi là hoàn thành khi:

- [ ] Code không có lỗi TypeScript/Dart và vượt qua linter.
- [ ] UI khớp 95% so với thiết kế (màu sắc, typography, touch targets).
- [ ] Đã handle lỗi `timeout` và `network error`.
- [ ] RBAC hoạt động đúng — route bị ẩn, data bị filter, button bị disable đúng role.
- [ ] Được ít nhất 1 thành viên khác trong team Review code.

## 6. Rủi Ro & Giải Pháp Dự Phòng

| Rủi Ro                                             |  Mức Độ  | Giải Pháp                                                                                       |
| :-------------------------------------------------- | :---------: | :------------------------------------------------------------------------------------------------ |
| Trễ tín hiệu WebSocket khiến UI bị giật       |     Cao     | Sử dụng Optimistic Updates hoặc Loading Skeleton cho các chỉ số Hardware.                   |
| Robot gặp lỗi vật lý chưa có mã lỗi         | Trung bình | Luôn có mã fallback `UNKNOWN_ERROR` để Kiosk chuyển sang trạng thái bảo trì an toàn. |
| Màn hình Kiosk thực tế có độ phân giải lạ |    Thấp    | Sử dụng Layout linh hoạt (Flexbox/LayoutBuilder) trong Flutter.                                |
| RBAC bị bypass khi truy cập URL trực tiếp       |     Cao     | Middleware kiểm tra role ở cả server-side (Next.js middleware) và client-side.                |
