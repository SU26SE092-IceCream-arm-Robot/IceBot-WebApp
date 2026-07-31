# Admin Web E2E

Bộ test này đăng nhập bằng tài khoản thật và kiểm tra read-only toàn bộ module
đang có trong sidebar. Không lưu thông tin đăng nhập trong repository và không
chạy mutation tạo, sửa hoặc xóa dữ liệu.

## Chuẩn bị

Backend phải hoạt động và frontend proxy phải trỏ đúng backend cần kiểm thử.
Đặt thông tin tài khoản test trong terminal hiện tại:

```powershell
$env:ICEBOT_E2E_USERNAME = "<tai-khoan-test>"
$env:ICEBOT_E2E_PASSWORD = "<mat-khau-test>"
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
- Desktop `1440x900` và tablet `1024x768`.
- Phát hiện page error, console error và management API trả `401`, `403` hoặc
  `5xx`.
- Kiểm tra Dashboard ở light/dark mode và horizontal overflow.

Mutation success/failure chưa chạy trong suite mặc định. Các case đó cần bộ dữ
liệu QA có thể hoàn tác, tài khoản theo role và cờ cho phép riêng để tránh làm
thay đổi dữ liệu ngoài ý muốn.
