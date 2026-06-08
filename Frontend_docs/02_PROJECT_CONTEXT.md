# ICEBOT - PROJECT CONTEXT & AI CODING RULES

## 1. Tổng quan dự án (Project Overview)
- **Tên dự án:** IceBot – Thiết kế và triển khai hệ thống bán kem tự động đa địa điểm tích hợp tay robot.
- **Mục tiêu hệ thống:** Tự động hóa hoàn toàn quy trình phục vụ kem. Customer order trên **Customer Kiosk/TOMKO machine**, thanh toán không tiền mặt, và nhận kem do tay robot vật lý phục vụ.
- **Phạm vi tài liệu:** Tập trung vào Frontend cho **Kiosk Touch App** (màn hình tương tác tại máy) và **Admin Dashboard** (trang quản lý tập trung trên Web).

## 2. Hệ Thống 5 Vai Trò (System Roles)
Hệ thống bắt buộc có **5 roles** theo đăng ký đồ án Capstone:

| Role | Platform | Mô tả |
| :--- | :--- | :--- |
| **Customer** | Customer Kiosk/TOMKO machine (Flutter) | Mua hàng tại máy. Không truy cập Dashboard. Không có tài khoản (No Auth). |
| **Staff** | Staff Mobile App / Staff Portal (điện thoại/tablet) | KHÔNG truy cập Dashboard chính. Là Field Operation Staff: nhận task refill/maintenance, kiểm tra kiosk tại hiện trường, cập nhật tồn kho sau refill, set `MAINTENANCE`/`READY`, reset lỗi cơ bản và báo cáo sự cố. |
| **Manager** | Web Dashboard | Xem tất cả Kiosk. Quản lý menu, giá cả. Xem báo cáo doanh thu, tồn kho. Điều phối/tạo phiếu yêu cầu Staff đi bảo trì. |
| **Admin** | Web Dashboard | Full quyền hệ thống (Superuser). CRUD users (tạo tài khoản cho Manager, Staff, Location Owner). Cấu hình hệ thống. Giám sát log lỗi kỹ thuật sâu. |
| **Location Owner** | Web Dashboard | **Read-Only (Chỉ đọc).** Chỉ xem trạng thái và báo cáo doanh thu/hoa hồng của các Kiosk đặt tại địa điểm của họ. |

> **Lưu ý:** Dashboard phục vụ **3 roles**: Manager, Admin, Location Owner. Áp dụng RBAC trên cùng một codebase Next.js.
> Staff có thể được quản lý trong `/users` hoặc task assignment sau này, nhưng không truy cập dashboard chính.

### 2.1 Actor Mapping Từ Report 1 (Alignment Note)
- **Admin/Operator** trong Report 1 được ánh xạ vào dashboard roles hiện tại là **Admin** và **Manager**.
- **Maintenance Staff** trong Report 1 tương ứng với **Staff field operation** dùng Staff Mobile App / Staff Portal.
- **Payment Service Provider** và **Ingredient Supplier** là external actors trong system context, **không phải dashboard roles**.
- Core role model của IceBot **giữ nguyên**: `Customer`, `Staff`, `Manager`, `Admin`, `Location Owner`.

## 3. Tech Stack & Architecture
- **Admin Dashboard (Web):** Next.js (App Router), React, TypeScript, Tailwind CSS, `shadcn/ui`. Quản lý state bằng Zustand/SWR.
- **Kiosk & Staff App (Thiết bị hiện trường):** Dùng **Flutter (Dart)** để tối ưu hiệu năng trên thiết bị phần cứng, giao tiếp qua WebSocket và REST API. Bao gồm Customer Kiosk/TOMKO machine và Staff Mobile App / Staff Portal.
- **Backend Cloud:** Xử lý API trung tâm, giữ vai trò môi giới tín hiệu giữa Web Admin, Flutter Kiosk và Tay máy Robot.
- **Ngôn ngữ giao diện:** Tiếng Việt là ngôn ngữ chính trên UI. Code và tên biến dùng tiếng Anh. Không làm i18n.
- **Dark Mode:** KHÔNG cần. Tập trung Light Theme theo triết lý "Modern Minimalist".

### Edge-Cloud Architecture
- **Cloud layer** chịu trách nhiệm cho dữ liệu và quy trình trung tâm: order lifecycle, payment reconciliation, user/role data, reporting data và dashboard data aggregation.
- **Edge/local kiosk layer** chịu trách nhiệm cho tác vụ thời gian thực tại máy: robot orchestration, device coordination, safety interlock và xử lý tạm thời khi mất kết nối.
- Khi offline ngắn hạn, edge xử lý chế độ an toàn và đồng bộ lại với cloud khi kết nối phục hồi.

## 4. Core Business Flows (Luồng nghiệp vụ cốt lõi)

### A. Kiosk App Flow (Dành cho Customer)
1. **Trạng thái Idle:** Hiển thị màn hình chờ hoặc quảng cáo.
2. **Menu & Customize:** Customer chọn vị kem (flavor), topping và kích cỡ (size).
3. **Checkout & Payment:** Hiển thị mã QR thanh toán (ví điện tử, thẻ). Lắng nghe Webhook/Socket từ Backend.
4. **Serving State:** Hiển thị tiến trình phục vụ kem realtime theo tín hiệu robot.
5. **Reset:** Báo hiệu Customer lấy kem và đếm ngược tự động quay về màn hình chờ.

### B. Staff Mobile App / Staff Portal Flow (Dành cho Staff)
- **Task Assignment Access:** Nhận phiếu refill/maintenance từ hệ thống điều phối.
- **Field Operation:** Kiểm tra kiosk tại hiện trường, set trạng thái `MAINTENANCE` trước khi thao tác.
- **Refill & Recovery:** Cập nhật số lượng nguyên liệu sau refill, reset lỗi cơ bản và set lại `READY` khi đủ điều kiện.
- **Incident Reporting:** Gửi báo cáo sự cố kỹ thuật khi cần can thiệp sâu.

### C. Admin Dashboard Flow (Dành cho Manager / Admin / Location Owner)
- **Fleet Monitor:** Giám sát realtime nhiều Kiosk (nhiệt độ, kết nối, trạng thái tay máy).
- **Menu Management:** Quản lý thực đơn, giá cả, topping toàn hệ thống (Manager & Admin).
- **Inventory Management:** Quản lý kho nguyên liệu tại từng máy. Cảnh báo khi sắp hết (Manager & Admin).
- **Transaction & Reconciliation:** Lịch sử giao dịch và đối soát hoàn tiền thủ công (Manager & Admin).
- **Reports:** Báo cáo doanh thu theo location — Location Owner chỉ xem data của mình.
- **User Management:** CRUD tài khoản và phân quyền (Chỉ Admin).

## 5. Xử Lý Lỗi & Concurrency (CRITICAL)
- **Network Offline:** Kiosk khóa toàn bộ thao tác, render `Overlay Component` báo lỗi.
- **Hardware Jam/Error:** Hủy phiên giao dịch, hiển thị hướng dẫn hoàn tiền, trigger API báo lỗi.
- **Race Condition:** Kiosk chỉ phục vụ **1 đơn/lần**. Khi `SERVING`, UI block hoàn toàn.

## 6. API Design & Mock Data Guidelines
- Mock data phải bám sát nghiệp vụ máy bán kem và IoT. Cấm dùng ví dụ e-commerce thông thường.
- **Data Payload Example:**
  ```json
  {
    "kioskId": "ICE-K-001",
    "location": "FPT University Campus",
    "status": "ONLINE",
    "hardwareState": {
      "robotArmStatus": "IDLE",
      "freezerTemperature": -18,
      "inventory": {
        "cupsRemaining": 45,
        "vanillaSyrupLevel": 80,
        "chocolateToppingLevel": 20
      }
    }
  }
  ```
