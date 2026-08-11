# Admin Web E2E

Bộ test này đăng nhập bằng tài khoản thật và kiểm tra read-only toàn bộ module
đang có trong sidebar. Không lưu thông tin đăng nhập trong repository và không
chạy mutation tạo, sửa hoặc xóa dữ liệu.

## Chuẩn bị

Backend phải hoạt động và frontend proxy phải trỏ đúng backend cần kiểm thử.
Đặt thông tin SystemAdmin trong terminal hiện tại. Cặp biến cũ vẫn được hỗ trợ,
nhưng tên theo role được ưu tiên:

```powershell
$env:ICEBOT_E2E_SYSTEM_ADMIN_USERNAME = "<tai-khoan-system-admin>"
$env:ICEBOT_E2E_SYSTEM_ADMIN_PASSWORD = "<mat-khau-system-admin>"
```

Để chạy thêm matrix read-only cho OrgAdmin và Manager, đặt đủ từng cặp sau.
Không đặt một nửa cặp vì global setup sẽ dừng để tránh dùng nhầm phiên:

```powershell
$env:ICEBOT_E2E_ORG_ADMIN_USERNAME = "<tai-khoan-org-admin>"
$env:ICEBOT_E2E_ORG_ADMIN_PASSWORD = "<mat-khau-org-admin>"
$env:ICEBOT_E2E_MANAGER_USERNAME = "<tai-khoan-manager>"
$env:ICEBOT_E2E_MANAGER_PASSWORD = "<mat-khau-manager>"
```

Lần đầu trên một máy, cài Chromium dành cho Playwright:

```powershell
npx playwright install chromium
```

## Chạy

Chạy toàn bộ unit, lint, build và browser smoke:

```powershell
npm run test:all
```

Chỉ chạy browser smoke:

```powershell
npm run test:e2e
```

Nếu frontend đã được chạy thủ công:

```powershell
$env:ICEBOT_E2E_EXTERNAL_WEB = "1"
$env:ICEBOT_E2E_BASE_URL = "http://localhost:3000"
npm run test:e2e
```

Artifact của test lỗi nằm trong `test-results/`; báo cáo HTML nằm trong
`playwright-report/`. Hai thư mục này và phiên đăng nhập E2E đều bị Git bỏ qua.

## Phạm vi

- System Admin: đăng nhập và smoke toàn bộ module sidebar.
- OrgAdmin/Manager: kiểm tra module được phép hoặc phải ẩn theo
  `permissionCodes` và `permissionScopes` mà backend trả về. Tên role chỉ xác
  định bộ tài khoản E2E đang chạy, không được dùng để suy luận quyền.
- Desktop `1440x900` và tablet `1024x768`.
- Phát hiện page error, console error và management API trả `401`, `403` hoặc
  `5xx`.
- Kiểm tra Dashboard ở light/dark mode và horizontal overflow.

Mutation success/failure chưa chạy trong suite mặc định. Các case đó cần bộ dữ
liệu QA có thể hoàn tác, tài khoản có permission/scope phù hợp và cờ cho phép
riêng để tránh làm thay đổi dữ liệu ngoài ý muốn.
