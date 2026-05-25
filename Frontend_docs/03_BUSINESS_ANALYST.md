# 03_BUSINESS_ANALYST.md (Actors, Flows, RBAC & System Rules)

## 1. Triết Lý Vận Hành (Operational Philosophy)
IceBot là hệ thống giao tiếp giữa Phần mềm (Web/App) và Máy móc vật lý (Robot/Freezer).
* **Single Source of Truth:** Phần cứng luôn là nguồn chân lý duy nhất. UI/UX Frontend chỉ có nhiệm vụ **phản ánh (reflect)** trạng thái của phần cứng.
* **No Assumption:** Tuyệt đối không tự "giả định" trạng thái (VD: Không tự động chuyển UI sang "Hoàn thành" chỉ vì đã hết thời gian đếm ngược, phải đợi tín hiệu `COMPLETED` từ tay máy).

## 2. Định Nghĩa Các Tác Nhân (System Actors — 5 Roles)
Hệ thống IceBot bao gồm **5 nhóm tác nhân** (3 human trên Dashboard, 1 human trên Customer Kiosk/TOMKO machine, 1 human Field Operation qua Staff Mobile App/Staff Portal, 2 system actors):

### A. Human Actors (5 roles)
1. **Customer (Khách hàng):**
   - **Platform:** Kiosk App (Flutter) — Tương tác vật lý với màn hình cảm ứng.
   - **Quyền hạn:** Chỉ xem Menu, đặt 1 đơn hàng/lần, quét QR thanh toán và nhận kem. Không có tài khoản (No Auth). Không truy cập Dashboard.

2. **Staff (Nhân viên kỹ thuật hiện trường):**
   - **Platform:** Staff Mobile App / Staff Portal (điện thoại hoặc tablet).
   - **KHÔNG truy cập Dashboard chính.**
   - **Quyền hạn (Field Operation Staff):** Nhận task refill/maintenance, kiểm tra kiosk tại hiện trường, cập nhật tồn kho sau refill, set trạng thái `MAINTENANCE`/`READY`, reset lỗi cơ bản và báo cáo sự cố.

3. **Manager (Quản lý vận hành):**
   - **Platform:** Web Dashboard.
   - **Quyền hạn:** Xem trạng thái tất cả Kiosk (Fleet Monitor). Quản lý menu, giá cả, topping. Xem báo cáo doanh thu, tồn kho. Điều phối và tạo phiếu yêu cầu Staff đi bảo trì. Xem lịch sử giao dịch và thực hiện đối soát/hoàn tiền thủ công.

4. **Admin (Quản trị viên hệ thống):**
   - **Platform:** Web Dashboard.
   - **Quyền hạn:** Full quyền hệ thống (Superuser). Bao gồm toàn bộ quyền của Manager, cộng thêm: CRUD users (tạo/sửa/xóa tài khoản Manager, Staff, Location Owner). Cấu hình hệ thống (settings). Giám sát log lỗi kỹ thuật sâu (system-level error logs).

5. **Location Owner (Chủ mặt bằng):**
   - **Platform:** Web Dashboard.
   - **Quyền hạn:** **Read-Only (Chỉ đọc).** Chỉ được phép xem trạng thái và báo cáo doanh thu/hoa hồng (commission) của các Kiosk đặt tại địa điểm của họ. Không xem được data của location khác. Cập nhật thông tin cơ bản về mặt bằng (giờ mở cửa, khả dụng).

### B. System Actors
6. **Hardware System (Tay Robot, Tủ Đông & Cảm Biến):**
   - Thiết bị IoT. Nhận lệnh từ Backend, thực thi việc múc kem vật lý. Gửi telemetry (nhiệt độ, mã lỗi cơ học) liên tục về Cloud.

7. **Backend Cloud:**
   - Bộ não trung tâm. Xử lý logic API, nhận Webhook từ cổng thanh toán, đồng bộ trạng thái giữa Kiosk - Hardware - Dashboard thông qua WebSockets.

8. **Payment Provider (External):**
   - Đối tác thanh toán bên ngoài. Trả kết quả giao dịch về Backend qua webhook/event để cập nhật trạng thái đơn hàng.

9. **Ingredient Supplier (External):**
   - Đơn vị cung ứng nguyên liệu. Là tác nhân ngữ cảnh chuỗi cung ứng, không phải tác nhân đăng nhập Dashboard.

## 3. RBAC Matrix (Ma Trận Phân Quyền)
Dashboard phục vụ 3 roles: **Manager**, **Admin**, **Location Owner**. Bảng dưới đây quy định quyền truy cập cho từng trang.

| Tính năng / Trang | Route | Admin | Manager | Location Owner |
| :--- | :--- | :---: | :---: | :---: |
| **Fleet Monitor** (Danh sách & Live Monitor) | `/kiosks` | ✅ Tất cả | ✅ Tất cả | 👁️ Chỉ Kiosk tại location của mình |
| **Kiosk Detail** (Chi tiết máy) | `/kiosks/[id]` | ✅ Tất cả | ✅ Tất cả | 👁️ Chỉ Kiosk tại location của mình |
| **Inventory** (Quản lý tồn kho) | `/inventory` | ✅ Full CRUD | ✅ Full CRUD | ❌ Không truy cập |
| **Transactions** (Lịch sử & Đối soát) | `/transactions` | ✅ Full + Hoàn tiền | ✅ Full + Hoàn tiền | 👁️ Chỉ xem giao dịch tại location mình |
| **Menu Management** (Quản lý thực đơn) | `/menu` | ✅ Full CRUD | ✅ Full CRUD | ❌ Không truy cập |
| **Reports** (Báo cáo doanh thu) | `/reports` | ✅ Toàn hệ thống | ✅ Toàn hệ thống | 👁️ Chỉ xem doanh thu/hoa hồng tại location mình |
| **User Management** (Quản lý tài khoản) | `/users` | ✅ Full CRUD | ❌ Không truy cập | ❌ Không truy cập |
| **Settings** (Cấu hình hệ thống) | `/settings` | ✅ Full | ❌ Không truy cập | ❌ Không truy cập |

**Ghi chú RBAC:**
- 👁️ = Read-Only, dữ liệu được lọc theo `locationId` của Location Owner.
- ❌ = Route bị ẩn hoàn toàn khỏi Sidebar. Truy cập trực tiếp URL sẽ redirect về `/kiosks`.
- Staff và Customer **không có tài khoản Dashboard**, không nằm trong RBAC matrix này.
- Staff có thể được Admin quản lý trong `/users` hoặc task assignment sau này, nhưng không truy cập dashboard chính.

## 3.1 Scope Boundary (TP1 Dashboard)
- TP1 dashboard hiện tại **không bao gồm** implementation chi tiết cho: Organization Management, Store Management, Device Type Management, Device Model Management, Kiosk Version Management, Workflow Management.
- Các module trên được phân loại **later phase/backlog** và chỉ đưa vào kế hoạch triển khai khi Product Owner xác nhận phạm vi.
- RBAC dashboard cho TP1 giữ nguyên 3 role canonical: `ADMIN`, `MANAGER`, `LOCATION_OWNER`.
- Staff và Customer tiếp tục nằm ngoài dashboard chính: Staff làm việc qua Staff Mobile App / Staff Portal, Customer dùng Customer Kiosk/TOMKO machine.

## 4. Các Luồng Nghiệp Vụ Cốt Lõi (Core Business Flows)

### A. Luồng Đặt Hàng Tiêu Chuẩn (Happy Path)
1. **[Kiosk]** Trạng thái `IDLE`. Customer chạm màn hình.
2. **[Kiosk]** Hiển thị Menu (chỉ hiện món còn nguyên liệu). Customer chọn món và tùy chỉnh.
3. **[Kiosk]** Chuyển sang `AWAITING_PAYMENT`, đếm ngược 120s, hiển thị QR Code.
4. **[Backend]** Lock (tạm giữ) nguyên liệu của đơn hàng.
5. **[Backend]** Nhận Webhook thanh toán thành công -> Bắn Socket lệnh "Làm Kem" xuống Hardware.
6. **[Hardware]** Robot phản hồi trạng thái `BUSY` / `SERVING`.
7. **[Kiosk]** Khóa toàn bộ màn hình, hiển thị Animation làm kem.
8. **[Hardware]** Robot làm xong, đẩy kem ra, phản hồi `COMPLETED`.
9. **[Backend]** Khấu trừ (Commit) tồn kho vĩnh viễn. Kiosk mời Customer lấy kem và reset về `IDLE`.

### B. Luồng Xử Lý Lỗi Cơ Học (Hardware Jam/Error Flow)
1. **[Hardware]** Đang làm kem thì kẹt động cơ, gửi mã lỗi `ROBOT_JAM` hoặc `HARDWARE_ERROR` về Cloud.
2. **[Backend]** Đánh dấu giao dịch bị lỗi (Wasted). Bắn cảnh báo đỏ lên Dashboard.
3. **[Dashboard]** Card của Kiosk nhấp nháy đỏ (`bg-destructive`), notification cho Manager/Admin.
4. **[Kiosk]** Khóa màn hình, chuyển sang UI báo lỗi (Mã Đơn Hàng & QR Zalo CSKH).
5. **[Manager/Admin]** Liên hệ Customer bồi hoàn thủ công, tạo phiếu bảo trì và điều phối **Staff** đến sửa.

### C. Luồng Cảnh Báo & Nạp Tồn Kho (Refill Flow)
1. **[Hardware]** Cảm biến báo lượng Syrup < 15% hoặc Cốc < 10 cái về Backend.
2. **[Dashboard]** Hiển thị cảnh báo vàng (`bg-warning`) cho Manager/Admin.
3. **[Manager]** Tạo phiếu yêu cầu và điều phối **Staff** ra hiện trường.
4. **[Staff]** Ra hiện trường, thao tác qua Staff Mobile App / Staff Portal để kiểm tra kiosk, set `MAINTENANCE`, nạp nguyên liệu và cập nhật số lượng tồn kho thực tế.
5. **[Backend]** Nhận tín hiệu từ Staff, Unlock món (nếu trước đó đã bị ẩn do hết), xóa cảnh báo trên Dashboard.

## 5. Ràng Buộc Đặt Hàng & Quản Lý Tồn Kho (Constraints)
* **Quy tắc Single Order:** Kiosk chỉ phục vụ **duy nhất 1 đơn hàng tại 1 thời điểm**.
* **Portion Control:** Tồn kho trừ theo định mức cấu hình (VD: Size L = 50ml Syrup, Size M = 30ml Syrup).
* **2-Phase Commit Inventory:**
  1. **Lock:** Khi hiện QR code.
  2. **Commit:** Khi thanh toán thành công VÀ Robot bắt đầu làm.
  3. **Release:** Khi giao dịch quá hạn 120s hoặc rớt mạng.

## 6. Thanh Toán & Xử Lý Sự Cố (Payment & Errors)
* **Vòng đời QR Code:** Tồn tại đúng `120 giây`. Hết giờ tự động hủy. Bắt buộc `tabular-nums` cho đồng hồ đếm ngược.
* **Idempotency:** Backend chặn Webhook trùng lặp. 2 lần thanh toán cùng mã đơn = Robot chỉ làm 1 ly.
* **No Auto-Refund:** Lỗi phần cứng sau khi trừ tiền → KHÔNG hoàn tiền tự động. Manager/Admin đối soát và hoàn tiền tay.
* **Network Loss:** Kiosk rớt mạng → Overlay khóa màn hình (`bg-muted/80`), chặn tạo QR mới.

## 7. Trạng Thái Phần Cứng & Telemetry (Hardware States)
* `CALIBRATING`: Đang khởi động và căn chỉnh tọa độ tay máy.
* `READY` / `IDLE`: Sẵn sàng phục vụ.
* `BUSY` / `SERVING`: Đang thực hiện một đơn hàng.
* `ERROR`: Lỗi phần cứng (kèm mã lỗi: `ROBOT_JAM`, `OVERHEAT`, `CUP_EMPTY`, `UNKNOWN_ERROR`).
* `MAINTENANCE`: Đang được bảo trì (Manager/Admin set từ Dashboard hoặc Staff set từ Staff Mobile App / Staff Portal).

## 8. Ghi Nhật Ký (Logging & Audit)
* Ghi nhận toàn bộ vòng đời giao dịch: `Tạo đơn` → `Tạo QR` → `Nhận Webhook` → `Các bước Robot` → `Kết thúc`.
* Mọi độ trễ/lỗi tại từng bước đều được lưu trữ để phục vụ Dispute Resolution.
