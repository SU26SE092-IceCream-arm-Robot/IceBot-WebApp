# 🎨 ICEBOT - DESIGN SYSTEM & KEY VISUAL GUIDELINES

## 1. Mục Đích Của File Này
File này định nghĩa Ngôn ngữ Thiết kế (Visual Language) cốt lõi cho toàn bộ dự án IceBot.
Do dự án sử dụng 2 nền tảng công nghệ khác nhau, **QUY TẮC BẮT BUỘC CHO AI VÀ DEV** khi generate hoặc viết code:
* **Với Admin Dashboard (Web):** Sử dụng Next.js. BẮT BUỘC tuân thủ nghiêm ngặt hệ thống Semantic Variables của `shadcn/ui` và Tailwind CSS. Tuyệt đối KHÔNG hardcode mã Hex trực tiếp vào className (ví dụ: cấm dùng `text-[#007FFF]`, phải dùng `text-primary`).
* **Với Kiosk App (Mobile/Touch):** Sử dụng **Flutter**. Các class Tailwind trong tài liệu này chỉ mang tính chất tham chiếu. Đội Mobile phải mapping các mã Hex này vào `ThemeData` của Flutter (VD: `Color(0xFF007FFF)`).

## 2. Triết Lý Thiết Kế: "Modern Minimalist" (Vercel/Linear Style)
- **Cảm giác mang lại:** Lạnh, sạch sẽ, tối giản (maximize whitespace), công nghệ cao và đáng tin cậy.
- **Reference:** Giao diện phẳng (Flat Design) kết hợp không gian rộng rãi.
- **Quy tắc hình học:** Viền mỏng (subtle borders `border-border`), không lạm dụng bóng đổ (shadows) làm giao diện bị nặng nề. Phân cấp thông tin chủ yếu bằng Typography (Độ đậm nhạt và Kích cỡ chữ).

## 3. Bảng Màu Tiêu Chuẩn (Color Palette & Semantic Variables)
Toàn bộ mã Hex dưới đây là Single Source of Truth cho cả Web và Flutter.

**A. Brand Colors (Màu thương hiệu & Nền)**
- **Primary (Xanh dương đậm): `#007FFF`** - *Web (Tailwind):* `bg-primary text-primary-foreground`
  - *Flutter:* `Color(0xFF007FFF)`
  - *Sử dụng:* Nút bấm chính, trạng thái Active, thanh Progress bar (Syrup level).
- **Secondary (Xanh dương nhạt): `#AEE2FF`**
  - *Web (Tailwind):* `bg-secondary text-secondary-foreground`
  - *Flutter:* `Color(0xFFAEE2FF)`
  - *Sử dụng:* Nút bấm phụ, nền thẻ Kiosk đang chọn, Badge trạng thái bình thường.
- **Background (Trắng kem/Lạnh): `#F9FBF2`**
  - *Web (Tailwind):* `bg-background`
  - *Flutter:* `Color(0xFFF9FBF2)`
  - *Sử dụng:* Màu nền tảng bao phủ toàn bộ App.
- **Surface/Card (Trắng tinh): `#FFFFFF`**
  - *Web (Tailwind):* `bg-card`
  - *Flutter:* `Color(0xFFFFFFFF)`
  - *Sử dụng:* Nền của Kiosk Item, Data Table, Modal, Dialog.

**B. IoT & Hardware State Colors (Màu trạng thái phần cứng - RẤT QUAN TRỌNG)**
- **Destructive / Error: `#EF4444`**
  - *Web (Tailwind):* `bg-destructive` / `ring-destructive`
  - *Flutter:* `Color(0xFFEF4444)`
  - *Sử dụng:* Nút [Emergency Stop], cảnh báo kẹt cơ học (Robot Jam), giao dịch thanh toán thất bại.
- **Warning: `#F59E0B`**
  - *Web (Tailwind):* `bg-warning` (Cần tự define thêm vào tailwind config).
  - *Flutter:* `Color(0xFFF59E0B)`
  - *Sử dụng:* Mức tồn kho thấp (Syrup < 15%), ly/cốc sắp hết.
- **Muted / Offline: `#64748B`**
  - *Web (Tailwind):* `bg-muted text-muted-foreground`
  - *Flutter:* `Color(0xFF64748B)`
  - *Sử dụng:* Kiosk mất kết nối mạng (Network Loss), thiết bị đang bảo trì.

## 4. Typography (Nghệ thuật chữ)
- **Font-family:** `Plus Jakarta Sans`, sans-serif.
- **Quy tắc chung:**
  - Headings (H1, H2, H3): `font-semibold` hoặc `font-bold`, khoảng cách chữ hẹp lại (`tracking-tight`) để tạo cảm giác hiện đại.
  - Body: Rõ ràng, dễ đọc (`font-medium`).
- **Hardware Data (Nhiệt độ, Mã đơn hàng, Timer, Giá tiền):** BẮT BUỘC dùng cơ chế số khoảng cách đều (Monospaced numbers) để giao diện không bị giật (layout shift) khi số thay đổi realtime.
  - *Web:* Dùng class `tabular-nums`.
  - *Flutter:* Dùng `FontFeature.tabularFigures()`.

## 5. Ranh Giới Tương Tác & Giao Diện (Platform Context)

**A. Kiosk App (Flutter - Màn hình cảm ứng vật lý):**
- **Touch Targets:** Nút bấm PHẢI LỚN để dễ chạm (chiều cao tối thiểu `56px` hoặc `64px`).
- **Tương tác:** KHÔNG sử dụng trạng thái Hover (chuột). Focus vào trạng thái Tap/Active (ví dụ: Nút lún xuống hoặc `scale` nhỏ lại khi chạm).
- **Lỗi Mất Mạng (Network Loss):** Khi Kiosk rớt mạng, lập tức hiển thị Modal/Overlay phủ toàn màn hình kèm thông báo "Hệ thống đang bảo trì", khóa (disable) toàn bộ luồng tạo đơn.

**B. Admin Dashboard (Next.js - Web App cho PC):**
- **Information Density:** Dùng layout dạng lưới (CSS Grid) hoặc Data Tables để hiển thị nhiều Kiosk cùng lúc. Kích cỡ nút chuẩn desktop (`h-10`).
- **Tương tác:** Tận dụng tối đa `hover:bg-accent` và Tooltips để giải thích mã lỗi phần cứng khi user di chuột vào.
- **Hardware Error UI:** Khi một Kiosk báo lỗi (VD: `status === 'ROBOT_JAM'`), Card chứa Kiosk đó phải có viền đỏ `ring-2 ring-destructive` và nhấp nháy nhẹ (`animate-pulse`) để thu hút sự chú ý tức thời của người vận hành.

## 6. Linear-inspired UI Direction (Inspiration Only)
`linear.app-DESIGN.md` chỉ là tài liệu tham chiếu phong cách thị giác. **IceBot Design System trong file này vẫn là Source of Truth duy nhất** cho Dashboard.

**Các principle được kế thừa từ Linear (đã tương thích IceBot):**
- Minimalist dashboard layout, ưu tiên khả năng quét thông tin nhanh.
- Generous whitespace để giảm nhiễu thị giác và tăng tập trung.
- Subtle borders (`border-border`) để tách lớp thông tin thay vì dùng màu đậm.
- Restrained shadows, chỉ dùng rất nhẹ khi cần phân cấp tương tác.
- Typography hierarchy rõ ràng, chính xác, dễ scan.
- Spacing theo hệ `4px` (`4, 8, 12, 16, 20, 24, 28, 32, ...`).
- Border radius được kiểm soát, nhất quán giữa card/input/button.
- High information clarity cho dashboard vận hành IoT.
- Cảm giác SaaS/productivity dashboard: calm, focused, không phô trương.

**Quy tắc mapping từ Linear sang IceBot:**
- Không copy trực tiếp mã màu hex từ Linear vào component className.
- Mọi triển khai Web phải map qua semantic tokens của IceBot/shadcn:
  - `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`
  - `bg-primary`, `bg-secondary`, `bg-warning`, `bg-destructive`, `bg-muted`
  - `border-border`, `ring-destructive`
- Các dark surfaces trong Linear chỉ dùng để tham khảo tinh thần "tương phản và phân lớp", **không áp dụng dark mode** vào IceBot Dashboard.
- Primary xanh thương hiệu IceBot và nhóm màu IoT state (warning/destructive/muted) phải giữ nguyên vai trò nghiệp vụ.

## 7. Do / Don't For AI Coding Agents
**Do**
- Dùng semantic tokens của shadcn/Tailwind cho toàn bộ màu nền/chữ/viền/ring.
- Giữ card phẳng, viền mỏng tinh tế, hạn chế hiệu ứng nặng.
- Ưu tiên whitespace và phân cấp thông tin rõ ràng bằng typography/layout.
- Dùng `tabular-nums` cho dữ liệu phần cứng, order ID, timer, giá tiền.
- Giữ Light Theme cho Dashboard.

**Don't**
- Không hardcode hex trực tiếp trong `className`.
- Không introduce dark mode hoặc dark-mode-first workflow.
- Không thay thế bộ màu thương hiệu IceBot (`primary`, `warning`, `destructive`, `muted`) bằng palette Linear.
- Không lạm dụng shadows, gradients, hoặc hiệu ứng trang trí gây giảm độ rõ thông tin.
