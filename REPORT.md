# REPORT.md - IceBot WebApp Progress Log

## Mục đích
File này dùng để ghi tiến độ triển khai trong codebase IceBot-WebApp mới.

## Quy ước cập nhật
- Định dạng thời gian: `YYYY-MM-DD HH:mm` theo `Asia/Saigon`.
- Mỗi task hoàn tất tương ứng 1 entry.
- Entry mới luôn thêm lên đầu danh sách log.
- Không ghi đè lịch sử cũ.
- Mỗi entry bắt buộc có đủ 6 mục.

## Mẫu entry
### Task: <task-name>
Time: <YYYY-MM-DD HH:mm>
Status: <done|partial>

1. What was implemented
2. Files created/modified
3. Important design/architecture decisions
4. How to test it
5. Known issues or assumptions
6. Recommended next task

---

## Task Log (Mới nhất -> cũ hơn)

### Task: `/users` Management Accounts list API integration
Time: 2026-05-27 22:38
Status: done

1. What was implemented
- Thay placeholder `/users` bằng màn danh sách tài khoản nội bộ sử dụng API thật `GET /api/v1/management/accounts`.
- Dựng flow `Page -> Hook -> Service -> API` cho accounts, hỗ trợ tìm kiếm, lọc trạng thái, phân trang và refresh dữ liệu.
- Hiển thị account identity, trạng thái, role scope và phương thức đăng nhập với loading/error/empty states tối thiểu.

2. Files created/modified
- Created: `src/types/accounts.ts`, `src/lib/services/accounts.ts`, `src/hooks/use-accounts.ts`
- Created: `src/components/features/users/accounts-table.tsx`
- Modified: `src/app/(dashboard)/users/page.tsx`, `API_INTEGRATION_MATRIX.md`, `REPORT.md`

3. Important design/architecture decisions
- Chỉ tích hợp list/read endpoint trong task này; không tự mở rộng thành CRUD, disable, password hoặc role-assignment actions.
- Service dùng lại `axiosClient` hiện hữu để kế thừa authenticated bearer/refresh handling; auth/session/interceptor/RBAC core không thay đổi.
- Quyền được giữ nhất quán ở hai lớp: frontend route `/users` chỉ dành cho `ADMIN`, backend endpoint được bảo vệ bằng policy `accounts.manage` dành cho `SystemAdmin`.
- UI dùng semantic tokens và light theme theo design system; không dùng hardcoded color trong `className`.

4. How to test it
- Chạy backend API và cấu hình `NEXT_PUBLIC_API_URL`, sau đó chạy `npm run dev`.
- Đăng nhập tài khoản backend có role `SystemAdmin`, truy cập `/users` và xác nhận danh sách account tải từ API.
- Kiểm tra tìm kiếm theo username/email/tên, bộ lọc trạng thái, nút làm mới và phân trang.
- Kiểm tra loading/error/empty state bằng dữ liệu hoặc tình huống API tương ứng.
- Đăng nhập role không phải Admin và xác nhận route `/users` vẫn bị dashboard RBAC chặn theo foundation hiện hữu.
- Quality gates đã chạy thành công: `npm run lint` và `npm run build`.

5. Known issues or assumptions
- Endpoint detail và các write endpoint accounts đã có contract nhưng chưa được nối UI trong scope read-only hiện tại.
- Backend `accounts.manage` chỉ cấp cho `SystemAdmin`; UI không cố mô phỏng quyền ghi cho các dashboard role khác.
- Việc xác nhận response runtime yêu cầu backend đang chạy với tài khoản seed có quyền phù hợp.

6. Recommended next task
- Khi được yêu cầu, bổ sung account management actions trên `/users` theo endpoint đã audit, hoặc chuyển sang tích hợp `/menu` sau khi chốt composition Product/Menu.

### Task: Authentication/Authorization foundation - direct browser API integration
Time: 2026-05-27 21:41
Status: done

1. What was implemented
- Implement local password authentication foundation theo backend contract thực tế: login, session restore qua `/me`, refresh token rotation, logout bằng revoke refresh token.
- Tạo route `/login` và login form theo IceBot Design System; thay dashboard mock-role guard bằng authenticated session guard.
- Hiển thị màn hình từ chối truy cập cho account có session hợp lệ nhưng không thuộc dashboard roles (`Staff`/`Technician`).
- Cập nhật topbar hiển thị user thật và action đăng xuất; bỏ role selector giả lập khỏi luồng runtime.
- Nối Fleet Monitor mock data vào authenticated `DashboardUser`; `LocationOwner.storeId` tạm được map thành location scope để lọc UI.
- Bật middleware CORS backend cho direct browser API calls trong phase demo.

2. Files created/modified
- Created: `src/app/(auth)/login/page.tsx`
- Created: `src/components/features/auth/login-form.tsx`
- Created: `src/hooks/use-auth.tsx`
- Created: `src/lib/auth-session.ts`
- Created: `src/lib/services/auth.ts`
- Modified: `src/types/index.ts`, `src/lib/axios-client.ts`, `src/app/layout.tsx`
- Modified: `src/app/(dashboard)/layout.tsx`, `src/components/shared/app-sidebar.tsx`, `src/components/shared/topbar.tsx`
- Modified: `src/hooks/use-kiosks.ts`, `src/lib/rbac.ts`, `src/lib/services/kiosks.ts`, `REPORT.md`
- Modified backend: `Projects_Backend/IceBot-Backend/IceBot/WebAPI/Program.cs`

3. Important design/architecture decisions
- Phase demo dùng direct browser API integration: access token và refresh token được lưu trong browser `localStorage` để phục vụ luồng restore/refresh.
- Browser token storage là chiến lược demo/dev, không phải thiết kế production; production cần chuyển refresh token sang `HttpOnly` cookie qua BFF/session boundary.
- Role mapping duy nhất cho dashboard: `SystemAdmin -> ADMIN`, `Manager -> MANAGER`, `LocationOwner -> LOCATION_OWNER`; `Staff` và `Technician` giữ session nhưng không được vào dashboard.
- LOCATION_OWNER filtering hiện là UI-only mapping từ backend `storeId` sang frontend location scope; backend authorization vẫn phải enforce resource scope về sau.
- `/kiosks` tiếp tục dùng mock data; task này không mở rộng module hoặc route nghiệp vụ.

4. How to test it
- Set `NEXT_PUBLIC_API_URL` trỏ tới WebAPI đang chạy, ví dụ `http://localhost:5188`, rồi chạy backend và `npm run dev`.
- Mở `/kiosks` khi chưa đăng nhập và xác nhận được chuyển về `/login`.
- Đăng nhập bằng account backend có role `SystemAdmin`, `Manager` hoặc `LocationOwner`; xác nhận vào dashboard, sidebar theo quyền và topbar hiển thị tài khoản thật.
- Reload browser sau đăng nhập và xác nhận session được restore qua `/api/v1/me`.
- Đợi access token hết hạn hoặc giả lập request nhận `401`; xác nhận frontend gọi `/authentication/refresh` một lần và retry request.
- Bấm đăng xuất; xác nhận gọi revoke, xóa session browser và quay về `/login`.
- Đăng nhập account chỉ có `Staff`/`Technician`; xác nhận thấy màn hình `Không có quyền truy cập`.
- Quality gates: `npm run lint` pass, `npm run build` pass, `dotnet build IceBot\IceBot.slnx` pass.

5. Known issues or assumptions
- Refresh token đang nằm trong browser storage và có rủi ro XSS trong môi trường production.
- CORS backend hiện dùng policy `AllowAnyOrigin` sẵn có để hỗ trợ demo; production cần giới hạn frontend origins.
- Backend hiện mới kiểm tra role presence, chưa enforce scoped resource authorization theo `StoreId`/`KioskId`.
- Dữ liệu `/kiosks` vẫn là mock; backend `storeId` phải khớp mock `locationId` thì Location Owner mới thấy card trong demo.
- Backend build pass với 2 warning có sẵn về API `GoogleCredential` obsolete trong Firebase integration, ngoài scope local password auth.

6. Recommended next task
- Hoàn thiện backend scoped management API contract cho Fleet Monitor hoặc thống nhất mapping seed store/kiosk để kiểm thử quyền `LOCATION_OWNER` bằng dữ liệu thực.

### Task: Documentation alignment theo Report 1 + lọc scope Report 2
Time: 2026-05-25 20:52
Status: done

1. What was implemented
- Cập nhật bộ tài liệu Markdown nghiệp vụ để đồng bộ với audit mới: bổ sung Edge-Cloud Architecture, actor mapping từ Report 1, external actors và scope boundary TP1.
- Thêm non-goals/later-phase notes để khóa phạm vi TP1, tránh mở rộng route plan Dashboard ngoài danh sách đã chốt.
- Bổ sung guardrails trong `AGENTS.md` để ngăn kéo scope coffee-oriented từ Report2 vào IceBot và bắt buộc bám source-of-truth khi code.
- Cập nhật `ADMIN_DASHBOARD_PLAN.md` với section `Out of Current Phase` nhưng giữ nguyên route list TP1 hiện tại.

2. Files created/modified
- Modified: `Frontend_docs/02_PROJECT_CONTEXT.md`
- Modified: `Frontend_docs/03_BUSINESS_ANALYST.md`
- Modified: `Frontend_docs/04_COMPONENT_ARCHITECTURE_WEB.md`
- Modified: `Frontend_docs/05_TASK_BREAKDOWN_TP1.md`
- Modified: `ADMIN_DASHBOARD_PLAN.md`
- Modified: `AGENTS.md`
- Modified: `REPORT.md`

3. Important design/architecture decisions
- Giữ nguyên core role model 5 vai trò của IceBot; RBAC Dashboard vẫn chỉ gồm `ADMIN`, `MANAGER`, `LOCATION_OWNER`.
- Edge-Cloud split được làm rõ: cloud cho order/payment/user/report/dashboard data; edge cho realtime orchestration, device coordination, safety và xử lý offline tạm thời.
- Organization/Store/Device/Workflow management được đánh dấu later phase/backlog, không tự mở rộng thành route TP1.
- Không copy nội dung coffee-oriented từ Report2 vào tài liệu triển khai IceBot.

4. How to test it
- Mở từng file đã cập nhật và xác nhận có các section mới:
  - `02_PROJECT_CONTEXT.md`: `Edge-Cloud Architecture` + actor mapping note.
  - `03_BUSINESS_ANALYST.md`: external actors + `Scope Boundary (TP1 Dashboard)`.
  - `04_COMPONENT_ARCHITECTURE_WEB.md`: `Non-goals For Current TP1` + `Future Modules (Later Phase)`.
  - `05_TASK_BREAKDOWN_TP1.md`: scope boundary clarification về Report2 và backlog dài hạn.
  - `ADMIN_DASHBOARD_PLAN.md`: `Out of Current Phase` và route list giữ nguyên.
  - `AGENTS.md`: scope guardrails + source-of-truth reminders + dependency status refresh.
- Kiểm tra `REPORT.md` có entry mới nằm đầu Task Log với đủ 6 mục.

5. Known issues or assumptions
- Tài liệu được chỉnh ở mức định hướng nghiệp vụ/scope; không thay đổi code app hoặc hành vi runtime.
- Timeline/sprint chi tiết có thể tiếp tục tinh chỉnh sau nếu Product Owner thay đổi ưu tiên module later phase.
- Time log dùng múi giờ +07 theo quy ước team (`Asia/Saigon` / tương đương `Asia/Bangkok`).

6. Recommended next task
- Thực hiện một vòng “docs-to-code conformance check” cho module `/kiosks/[id]` trước khi implement: chốt fields telemetry, quyền control actions theo RBAC, và ranh giới read-only cho `LOCATION_OWNER`.

### Task: /kiosks Fleet Monitor — mock-first implementation
Time: 2026-05-25 17:05
Status: done

1. What was implemented
- Implement trang `/kiosks` theo kiến trúc `Page -> Hook -> Service -> Mock Data`, thay placeholder cũ bằng Fleet Monitor thực tế.
- Bổ sung mock kiosk dataset bám domain IceBot gồm: `kioskId`, `location`, `status`, `hardwareState`, `currentOrderId`, `errorCode`.
- Tạo service layer để xử lý role-scope, search, status filter, location filter và summary metrics.
- Tạo hook `useKiosks` quản lý loading/error/data/filter state, refresh và đồng bộ role mock từ localStorage event.
- Tạo `KioskCard` hiển thị đầy đủ telemetry, inventory levels, heartbeat, error badge; áp dụng visual state theo Design System (online/error/offline/maintenance).
- Cập nhật type foundation cho domain kiosks và mở rộng `DashboardUser` hỗ trợ `locationIds` để RBAC filtered data cho `LOCATION_OWNER`.

2. Files created/modified
- Created: `src/lib/mocks/kiosks.ts`
- Created: `src/lib/services/kiosks.ts`
- Created: `src/hooks/use-kiosks.ts`
- Created: `src/components/features/kiosks/kiosk-card.tsx`
- Modified: `src/app/(dashboard)/kiosks/page.tsx`
- Modified: `src/types/index.ts`
- Modified: `src/lib/mock-current-user.ts`
- Modified: `REPORT.md`

3. Important design/architecture decisions
- Page không import mock trực tiếp; mọi dữ liệu đi qua `useKiosks` -> `getFleetKiosks` -> `MOCK_KIOSKS`.
- RBAC data scope cho `LOCATION_OWNER` được xử lý tại service bằng `locationIds`, không hardcode trong UI layer.
- Summary cards tính trên toàn bộ dữ liệu trong phạm vi role (scoped fleet), còn grid phản ánh dữ liệu sau khi áp dụng bộ lọc.
- Card trạng thái lỗi dùng `ring-2 ring-destructive animate-pulse` khi kiosk `ERROR` hoặc `robotArmStatus === ERROR`.
- Hardware numeric fields (`kioskId`, nhiệt độ, tồn kho, heartbeat, orderId, errorCode) dùng `tabular-nums`.

4. How to test it
- Chạy `npm run dev` và mở `http://localhost:3000/kiosks`.
- Kiểm tra header + 4 summary cards: tổng số kiosk, trực tuyến, lỗi, bảo trì.
- Kiểm tra search theo `kioskId`, tên kiosk, location.
- Kiểm tra filter theo status và location; bấm `Xoa bo loc` để reset.
- Kiểm tra visual states:
  - `ONLINE` dùng tone primary
  - `ERROR` có ring đỏ + pulse + error code
  - `OFFLINE`/`MAINTENANCE` dùng muted semantics
  - inventory < 15% đổi warning color
- Đổi role trên topbar sang `LOCATION_OWNER` và xác nhận chỉ còn kiosk thuộc scope location mock.
- Quality gates: `npm run lint` pass, `npm run build` pass.

5. Known issues or assumptions
- Dữ liệu realtime/WebSocket chưa được triển khai trong phase này; heartbeat đang là mock timestamp.
- Role sync dùng localStorage + custom event cho cùng tab; auth provider thật chưa có.
- Fleet monitor hiện là read-only list page, không có control actions (lock/unlock) theo đúng scope task.

6. Recommended next task
- Implement `/kiosks/[id]` Kiosk Detail page (telemetry timeline, error history, control panel, role-based controls).

### Task: Phase 1 foundation — shadcn init + route-based dashboard + RBAC base
Time: 2026-05-25 16:30
Status: done

1. What was implemented
- Khởi tạo `shadcn/ui` bằng CLI và add bộ component foundation: `Button`, `Card`, `Badge`, `Table`, `Dialog`, `Input`, `Select`, `Separator`.
- Chuyển app sang route-based App Router cho dashboard: root `/` redirect sang `/kiosks`, tạo route group `(dashboard)` và layout dùng chung.
- Extract dashboard shell thành shared components: `app-sidebar` + `topbar`.
- Tạo placeholder pages tối giản cho: `/kiosks`, `/inventory`, `/transactions`, `/menu`, `/reports`, `/users`, `/maintenance`.
- Dựng nền tảng RBAC: role canonical `ADMIN | MANAGER | LOCATION_OWNER`, permission map, route access check, visible route filtering.
- Thêm mock current user đơn giản (persist role bằng localStorage) để test sidebar visibility và direct URL guard.
- Reconcile lại `globals.css` để giữ semantic tokens IceBot, Light Theme only, loại bỏ dark-mode artifacts do CLI thêm.
- Merge lại `Button` để giữ behavior `isLoading` và thêm alias variant `primary` tương thích.

2. Files created/modified
- Created: `components.json`, `src/lib/utils.ts`
- Created: `src/lib/rbac.ts`, `src/lib/mock-current-user.ts`
- Created: `src/components/shared/app-sidebar.tsx`, `src/components/shared/topbar.tsx`, `src/components/shared/module-placeholder.tsx`
- Created: `src/app/(dashboard)/layout.tsx`
- Created: `src/app/(dashboard)/kiosks/page.tsx`, `src/app/(dashboard)/inventory/page.tsx`, `src/app/(dashboard)/transactions/page.tsx`, `src/app/(dashboard)/menu/page.tsx`, `src/app/(dashboard)/reports/page.tsx`, `src/app/(dashboard)/users/page.tsx`, `src/app/(dashboard)/maintenance/page.tsx`
- Updated: `package.json`, `package-lock.json`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/types/index.ts`
- Updated: `src/components/ui/button.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/input.tsx`, `src/components/ui/select.tsx`, `src/components/ui/dialog.tsx`

3. Important design/architecture decisions
- Chuẩn hóa role dashboard duy nhất: `ADMIN | MANAGER | LOCATION_OWNER`.
- Áp dụng guard tạm thời ở client-side trong `(dashboard)/layout.tsx` để chặn truy cập route không có quyền và redirect về `/kiosks`.
- Sidebar render theo route thật + filter bằng RBAC (`getVisibleRoutes`) thay vì tab state nội bộ.
- Chưa cài thêm thư viện state/data-fetching ngoài dependencies do `shadcn/ui` kéo vào.
- Giữ `src/features/` nguyên trạng trong phase này, chưa mở rộng business module.

4. How to test it
- Chạy `npm run dev`, mở `http://localhost:3000` và xác nhận redirect sang `/kiosks`.
- Dùng dropdown role trên topbar để đổi `ADMIN` / `MANAGER` / `LOCATION_OWNER` và kiểm tra sidebar ẩn/hiện route đúng RBAC.
- Truy cập trực tiếp route không có quyền (ví dụ `/users` khi role `MANAGER`) và xác nhận bị điều hướng về `/kiosks`.
- Kiểm tra UI dùng Light Theme + semantic tokens, không có dark mode.
- Quality gates: `npm run lint` pass, `npm run build` pass.

5. Known issues or assumptions
- RBAC hiện là mock/client-side guard để phục vụ foundation; chưa có auth thật và chưa có middleware server-side.
- Topbar role switch chỉ phục vụ test foundation, sẽ thay bằng auth state thật ở phase auth/RBAC tiếp theo.
- Placeholder pages chưa có business logic, chưa có hook/service/mock data domain.
- `/kiosks/[id]` và `/settings` chưa nằm trong scope phase này.

6. Recommended next task
- Implement `/kiosks` module theo mock-first architecture (`Page -> Hook -> Service -> Mock Data`) gồm Kiosk list + status cards + RBAC filtered data cho `LOCATION_OWNER`, sau đó mới mở rộng sang `/kiosks/[id]`.

### Task: UI Foundation refactor — Light Theme + IceBot Design System tokens
Time: 2026-05-25 15:38
Status: done

1. What was implemented
- Refactor toàn bộ UI foundation từ dark theme (slate-900/950) sang Light Theme theo `01_DESIGN_SYSTEM.md`.
- `globals.css`: Xây dựng full semantic token layer (primary #007FFF, secondary #AEE2FF, background #F9FBF2, card #FFFFFF, destructive #EF4444, warning #F59E0B, muted #64748B, border, ring, accent). Xoá dark mode media query. Thêm tabular-nums utility, scrollbar styling, focus-visible ring.
- `layout.tsx`: Chuyển font từ Geist Sans sang Plus Jakarta Sans (với Vietnamese subset). Set `lang="vi"`. Dùng `bg-background text-foreground font-sans`.
- `page.tsx`: Viết lại dashboard shell: sidebar collapsible (IceBot logo, 7 nav items tiếng Việt matching ADMIN_DASHBOARD_PLAN.md routes), topbar (search, notifications, user avatar), placeholder main content. Toàn bộ dùng semantic tokens, không hardcode hex.
- `button.tsx`: Refactor variants sang semantic tokens (bg-primary, bg-secondary, bg-destructive, border-border, bg-accent). Thêm variant `ghost` và `destructive`, xoá `danger`. Xoá `dark:` prefixes. Heights chuẩn desktop (h-8/h-10/h-11).
- `REPORT.md`: Tạo mới tại root theo exact template yêu cầu (mục đích, quy ước, mẫu entry 6 mục, task log trống).

2. Files created/modified
- Rewritten: `src/app/globals.css`
- Rewritten: `src/app/layout.tsx`
- Rewritten: `src/app/page.tsx`
- Rewritten: `src/components/ui/button.tsx`
- Rewritten: `REPORT.md` (root)

3. Important design/architecture decisions
- Tailwind v4 CSS-based config: không cần file `tailwind.config.ts` riêng. Toàn bộ design tokens define trong `globals.css` qua `:root` CSS variables + `@theme inline`.
- Dùng `oklch()` cho CSS variables để tương thích tốt hơn với Tailwind v4 opacity modifiers (e.g., `bg-primary/90`).
- Sidebar navigation items map 1:1 với route list trong `ADMIN_DASHBOARD_PLAN.md`.
- Button API giữ nguyên interface (variant, size, isLoading) để không break consumer.
- Không cài thêm bất kỳ thư viện nào. Plus Jakarta Sans load qua `next/font/google`.
- UI text tiếng Việt, code identifiers tiếng Anh.
- Không implement business logic hay mock data — chỉ UI shell.

4. How to test it
- Chạy `npm run dev`, mở browser tại `http://localhost:3000`.
- Kiểm tra:
  - Nền app màu trắng kem (#F9FBF2), không phải dark.
  - Sidebar trắng (#FFFFFF) với viền mỏng, logo IceBot xanh primary.
  - Navigation items hiển thị tiếng Việt, active state dùng primary/10.
  - Sidebar collapse/expand hoạt động.
  - Topbar: search bar, notification bell, user avatar với semantic colors.
  - Placeholder content "Module đang được phát triển" hiển thị đúng.
  - Font là Plus Jakarta Sans (không phải Geist hay Arial).
- Quality gates: `npm run lint` → pass, `npm run build` → pass.

5. Known issues or assumptions
- Dashboard shell hiện là single-page tab-based (useState) — sẽ chuyển sang App Router routes khi implement từng module.
- Plus Jakarta Sans được load qua `next/font/google` — cần internet access lần đầu.
- Chưa có `shadcn/ui` components — Button vẫn là custom component.
- `src/types/index.ts` và `src/lib/axios-client.ts` chưa refactor (không nằm trong scope UI foundation).
- Oklch color values là approximate mapping từ hex; sẽ fine-tune nếu cần khi so sánh trực tiếp trên browser.

6. Recommended next task
- Phase 1 tiếp theo: Hỏi user về việc cài `shadcn/ui` (init + cấu hình components cơ bản). Sau đó tách dashboard shell thành `(dashboard)/layout.tsx` với sidebar/topbar riêng, tạo route group `(dashboard)` và implement `/kiosks` page đầu tiên.
