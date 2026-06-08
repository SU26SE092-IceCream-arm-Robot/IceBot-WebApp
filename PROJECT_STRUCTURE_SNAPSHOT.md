# PROJECT_STRUCTURE_SNAPSHOT.md — IceBot WebApp

> **Snapshot taken:** 2026-05-25 15:51 (Asia/Saigon)
> **Purpose:** Cho người/AI khác nắm chính xác tình hình cấu trúc dự án trước khi prompt code tiếp.

---

## 1. Project Identity

| Thông tin | Giá trị |
|:---|:---|
| **Tên project** | `icebot-webapp` |
| **Framework** | Next.js 16.2.6 (App Router, Turbopack) |
| **React** | 19.2.4 |
| **TypeScript** | ^5 |
| **Tailwind CSS** | v4 (CSS-based config, không có `tailwind.config.*`) |
| **Loại project** | **Project mới** — chỉ có UI foundation shell, chưa có module nghiệp vụ nào hoàn chỉnh |
| **Phạm vi repo** | Admin Dashboard Web only. Kiosk/Flutter nằm ở repo khác |
| **Build status** | ✅ `npm run lint` pass, ✅ `npm run build` pass |

---

## 2. Installed Dependencies

### Production (`dependencies`)

| Package | Version | Vai trò |
|:---|:---|:---|
| `next` | 16.2.6 | Framework chính |
| `react` | 19.2.4 | UI library |
| `react-dom` | 19.2.4 | React DOM |
| `axios` | ^1.16.1 | HTTP client (đã có `src/lib/axios-client.ts`) |
| `lucide-react` | ^1.16.0 | Icon library |

### Dev (`devDependencies`)

| Package | Version | Vai trò |
|:---|:---|:---|
| `tailwindcss` | ^4 | CSS framework |
| `@tailwindcss/postcss` | ^4 | PostCSS plugin cho Tailwind v4 |
| `typescript` | ^5 | Compiler |
| `@types/node` | ^20 | Node.js types |
| `@types/react` | ^19 | React types |
| `@types/react-dom` | ^19 | React DOM types |
| `eslint` | ^9 | Linter |
| `eslint-config-next` | 16.2.6 | Next.js ESLint rules |

### ⚠️ Chưa có — KHÔNG được tự cài

| Package | Được đề cập trong docs | Thực tế trong package.json |
|:---|:---|:---|
| `shadcn/ui` (+ Radix primitives) | Có trong `AGENTS.md`, `01_DESIGN_SYSTEM.md` | ❌ Chưa init, không có `components.json` |
| `zustand` | Có trong `04_COMPONENT_ARCHITECTURE_WEB.md` | ❌ Chưa cài |
| `swr` hoặc `@tanstack/react-query` | Có trong docs | ❌ Chưa cài |
| `socket.io-client` (WebSocket) | Có trong docs | ❌ Chưa cài |
| `recharts` | Có trong `REPORT_OLD_REFERENCE.md` | ❌ Chưa cài |
| `class-variance-authority` (cva) | Thường đi kèm shadcn | ❌ Chưa cài |
| `clsx` / `tailwind-merge` | Thường đi kèm shadcn | ❌ Chưa cài |

### shadcn/ui status

- `components.json`: **Không tồn tại**
- `npx shadcn init`: **Chưa chạy**
- `src/components/ui/`: Chỉ có 1 file `button.tsx` — custom component viết tay, không phải shadcn generated
- **Kết luận:** shadcn/ui hoàn toàn chưa được setup

---

## 3. Current Folder Tree

```text
IceBot-WebApp/
├── .git/
├── .gitignore                          (521 B)
├── .next/                              (build output)
│
├── 01_DESIGN_SYSTEM.md                 (7.6 KB) — UI Source of Truth
├── ADMIN_DASHBOARD_PLAN.md             (7.3 KB) — Implementation plan
├── AGENTS.md                           (10.9 KB) — Agent instructions
├── CLAUDE.md                           (12 B) — Pointer → @AGENTS.md
├── README.md                           (1.5 KB)
├── REPORT.md                           (4.6 KB) — Task log project mới
│
├── Frontend_docs/
│   ├── 02_PROJECT_CONTEXT.md           (5.6 KB)
│   ├── 03_BUSINESS_ANALYST.md          (9.2 KB)
│   ├── 04_COMPONENT_ARCHITECTURE_WEB.md (6.8 KB)
│   ├── 05_TASK_BREAKDOWN_TP1.md        (7.4 KB)
│   └── REPORT_OLD_REFERENCE.md         (46 KB) — Log từ project cũ (CHỈ ĐỌC)
│
├── eslint.config.mjs                   (483 B)
├── next-env.d.ts                       (253 B)
├── next.config.ts                      (140 B) — Empty config
├── package.json                        (618 B)
├── package-lock.json                   (242 KB)
├── postcss.config.mjs                  (101 B) — @tailwindcss/postcss
├── tsconfig.json                       (704 B) — strict, path alias @/*
│
├── public/
│   ├── favicon.ico                     (26 KB)
│   ├── file.svg, globe.svg, next.svg, vercel.svg, window.svg
│
└── src/
    ├── app/
    │   ├── favicon.ico                 (26 KB)
    │   ├── globals.css                 (4.0 KB) — IceBot semantic tokens
    │   ├── layout.tsx                  (791 B) — Root layout
    │   └── page.tsx                    (8.5 KB) — Dashboard shell
    │
    ├── components/
    │   └── ui/
    │       └── button.tsx              (2.4 KB) — Custom button
    │   (⚠️ Không có shared/)
    │   (⚠️ Không có features/)
    │
    ├── features/
    │   └── .gitkeep                    (25 B) — Empty placeholder
    │
    ├── lib/
    │   └── axios-client.ts             (1.6 KB) — API client
    │   (⚠️ Không có services/)
    │   (⚠️ Không có mocks/)
    │
    ├── types/
    │   └── index.ts                    (785 B) — 4 basic interfaces
    │
    (⚠️ Không có hooks/)
    (⚠️ Không có store/)
```

---

## 4. Current App Routes

| Route Path | File | Status | Ghi chú |
|:---|:---|:---|:---|
| `/` | `src/app/page.tsx` | **Placeholder shell** | Dashboard shell với sidebar + topbar + "module đang phát triển" placeholder |
| `/_not-found` | (Next.js built-in) | Auto-generated | — |

**Route group `(dashboard)`:** ❌ Chưa tồn tại.
**Route group `(auth)`:** ❌ Chưa tồn tại.
**Các route nghiệp vụ (`/kiosks`, `/inventory`, `/transactions`, `/menu`, `/reports`, `/users`, `/maintenance`):** ❌ Chưa có folder/file nào.

**Kết luận:** Chỉ có 1 page duy nhất tại `/`. Toàn bộ navigation hiện tại là tab-based (`useState`) trong `page.tsx`, chưa phải file-system routing.

---

## 5. Current Layout Status

### `src/app/layout.tsx`
- **Font:** Plus Jakarta Sans (Google Fonts, Vietnamese subset, weights 400–700)
- **Language:** `lang="vi"`
- **Theme classes:** `bg-background text-foreground font-sans antialiased`
- **Metadata:** Title "IceBot Admin Dashboard", description tiếng Việt
- **Không có:** dashboard layout riêng, auth provider, theme provider

### `src/app/page.tsx`
- **Type:** `'use client'` — client component
- **Structure:** Monolith single-page dashboard shell gồm:
  - **Sidebar** (tự viết, collapsible, 7 nav items tiếng Việt)
  - **Topbar** (search, notification bell, user avatar)
  - **Main content** (placeholder "Module đang được phát triển")
- **Navigation:** Tab-based via `useState('kiosks')`, không dùng Next.js routing
- **7 nav items:** Quản lý Kiosk, Tồn kho, Giao dịch, Thực đơn, Báo cáo, Tài khoản, Bảo trì

### Sidebar/Topbar components
- ❌ **Chưa tách thành component riêng** — tất cả inline trong `page.tsx`
- Cần extract ra `src/components/shared/sidebar.tsx` và `src/components/shared/topbar.tsx` khi chuyển sang route-based layout

### Kết luận
App hiện tại là **single-page tab-based dashboard shell**. Chưa phải route-based. Cần tạo `(dashboard)/layout.tsx` để wrap sidebar/topbar cho các route con.

---

## 6. Current Styling / Theme Status

### `globals.css` — IceBot Design System Tokens

| Token | CSS Variable | Mapped Color | Status |
|:---|:---|:---|:---|
| `--background` | `oklch(0.98 0.01 110)` | #F9FBF2 | ✅ Đúng spec |
| `--foreground` | `oklch(0.15 0.02 260)` | ~#1a1a2e | ✅ |
| `--card` | `oklch(1 0 0)` | #FFFFFF | ✅ Đúng spec |
| `--primary` | `oklch(0.58 0.21 255)` | #007FFF | ✅ Đúng spec |
| `--secondary` | `oklch(0.89 0.06 220)` | #AEE2FF | ✅ Đúng spec |
| `--destructive` | `oklch(0.58 0.22 25)` | #EF4444 | ✅ Đúng spec |
| `--warning` | `oklch(0.72 0.17 75)` | #F59E0B | ✅ Defined |
| `--muted` | `oklch(0.55 0.02 250)` | #64748B | ✅ Đúng spec |
| `--border` | `oklch(0.90 0.01 250)` | Subtle border | ✅ |
| `--accent` | `oklch(0.95 0.02 220)` | Hover state | ✅ |
| `--ring` | `oklch(0.58 0.21 255)` | = primary | ✅ |

### Theme mode
- ✅ **Light Theme only** — không có `@media (prefers-color-scheme: dark)` hay `.dark` class
- ✅ Không có `dark:` prefix trong bất kỳ component nào

### Hardcoded hex check
- ✅ **Không có hardcoded hex** trong `className` của TSX/TS files (đã grep verify)
- ✅ Không có `bg-slate-*`, `bg-indigo-*`, `text-emerald-*` legacy colors

### Tailwind config
- Không có file `tailwind.config.*` riêng — Tailwind v4 dùng CSS-based config qua `@theme inline` trong `globals.css`
- `warning` token: ✅ **Đã define** (`--color-warning`)

### Font
- ✅ Plus Jakarta Sans (đúng `01_DESIGN_SYSTEM.md`)
- Font variable: `--font-sans`

### Conformity với `01_DESIGN_SYSTEM.md`
- ✅ Semantic tokens đã cover toàn bộ palette
- ✅ `.tabular-nums` utility đã define
- ✅ No dark mode
- ⚠️ Oklch values là approximate mapping — cần visual verify trên browser khi so sánh side-by-side với Figma/hex gốc

---

## 7. Current UI Components

### `src/components/ui/` (1 file)

| Component | File | Dùng semantic tokens | Reusable |
|:---|:---|:---|:---|
| `Button` | `button.tsx` | ✅ `bg-primary`, `bg-secondary`, `bg-destructive`, `border-border`, `bg-accent` | ✅ Có |

- Variants: `primary`, `secondary`, `outline`, `destructive`, `ghost`
- Sizes: `sm` (h-8), `md` (h-10), `lg` (h-11)
- Props: `variant`, `size`, `isLoading`, `disabled`, + native button attrs
- Custom `forwardRef` component, không phải shadcn generated

### `src/components/shared/` — ❌ KHÔNG TỒN TẠI
- Sidebar, Topbar, UserNav chưa được extract thành component riêng
- Tất cả inline trong `page.tsx`

### `src/components/features/` — ❌ KHÔNG TỒN TẠI
- Chưa có bất kỳ feature component nào (KioskCard, MenuItemForm, etc.)

### `src/features/` — Empty (chỉ có `.gitkeep`)
- Thư mục này có thể trùng mục đích với `src/components/features/`
- Cần quyết định: dùng `src/features/` hay `src/components/features/` theo plan

### Component có thể reuse cho dashboard foundation
- `Button` — ✅ sẵn sàng
- Sidebar logic trong `page.tsx` — cần extract
- Topbar logic trong `page.tsx` — cần extract

---

## 8. Current Data / State Architecture

| Layer | Status | Chi tiết |
|:---|:---|:---|
| `src/hooks/` | ❌ Không tồn tại | Chưa có custom hooks |
| `src/lib/services/` | ❌ Không tồn tại | Chưa có service layer |
| `src/lib/mocks/` | ❌ Không tồn tại | Chưa có mock data |
| `src/lib/axios-client.ts` | ✅ Có | API client với interceptors (auth token, 401 redirect) |
| `src/types/index.ts` | ⚠️ Có nhưng cũ | 4 interface cơ bản — chưa align với plan |
| `src/store/` | ❌ Không tồn tại | Zustand chưa cài |
| Auth/RBAC mock | ❌ Không có | Chưa có auth context, RBAC middleware |
| Zustand | ❌ Chưa cài package | — |
| SWR/React Query | ❌ Chưa cài package | — |
| WebSocket | ❌ Chưa cài package | — |

### `src/types/index.ts` — cần refactor

Hiện có 4 interface nhưng lệch so với `04_COMPONENT_ARCHITECTURE_WEB.md`:

| Interface hiện tại | Vấn đề |
|:---|:---|
| `AdminUser` | Role dùng `'superadmin' \| 'admin' \| 'manager'` — thiếu `'LOCATION_OWNER'`, casing không match plan (`ADMIN`, `MANAGER`) |
| `KioskMachine` | Thiếu `hardwareState`, `robotArmStatus`, `freezerTemperature`, `inventory`, `locationId`, `errorHistory` |
| `Order` | Thiếu nhiều status (`AWAITING_PAYMENT`, `SERVING`, `COMPLETED`, `REFUNDED`, `EXPIRED`), thiếu `locationId` |
| `IceCreamProduct` | Quá đơn giản — thiếu `sizes`, `toppings`, `category`, `ingredientDependency` |

---

## 9. Gap Analysis Against ADMIN_DASHBOARD_PLAN

### Route implementation status

| Route | Plan Phase | Codebase Status | Gap |
|:---|:---:|:---|:---|
| UI Foundation / Layout | **1** | ⚠️ **Partial** — globals.css + layout.tsx + page.tsx shell done, nhưng chưa tách route group `(dashboard)` | Cần tách layout + extract sidebar/topbar |
| `/kiosks` | **2** | ❌ Chưa có | Cần route + page + hook + service + mock |
| `/kiosks/[id]` | **3** | ❌ Chưa có | Depends on Phase 2 |
| `/inventory` | **4** | ❌ Chưa có | — |
| `/transactions` | **5** | ❌ Chưa có | — |
| `/menu` | **6** | ❌ Chưa có | — |
| `/reports` | **7** | ❌ Chưa có | — |
| `/users` | **8** | ❌ Chưa có | — |
| `/maintenance` | **9** | ❌ Chưa có | — |
| `/settings` | Later | ❌ (đúng plan) | Optional — không cần implement |

### Đã có gì

- ✅ IceBot semantic token layer (`globals.css`)
- ✅ Plus Jakarta Sans font, `lang="vi"`, Light Theme
- ✅ Dashboard shell UI (sidebar + topbar + placeholder)
- ✅ Button component với semantic tokens
- ✅ Axios client (cơ bản)
- ✅ TypeScript types (cơ bản, cần refactor)
- ✅ Tài liệu đầy đủ (design system, plan, RBAC matrix, business analyst, task breakdown)

### Thiếu gì

- ❌ Route group `(dashboard)/layout.tsx` — sidebar/topbar chưa là shared layout
- ❌ Route group `(auth)` — chưa có login page
- ❌ Extracted components: `Sidebar`, `Topbar`, `UserNav`
- ❌ RBAC foundation (`src/lib/rbac.ts`, `useRBAC` hook)
- ❌ Auth mock (`useAuthStore` hoặc context)
- ❌ Domain TypeScript types align với business docs
- ❌ Mock-first architecture layers (`hooks/`, `services/`, `mocks/`)
- ❌ `shadcn/ui` components (Table, Card, Badge, Dialog, etc.)
- ❌ State management (Zustand — chưa cài)
- ❌ Data fetching (SWR — chưa cài)
- ❌ Tất cả 9 route pages nghiệp vụ

### Cái gì lệch plan

| Lệch | Chi tiết |
|:---|:---|
| `src/features/` vs `src/components/features/` | Plan nói `src/components/features/`, nhưng có folder `src/features/` (empty). Nên xoá `src/features/` hoặc merge |
| `src/types/index.ts` roles | Dùng `'superadmin' \| 'admin' \| 'manager'` thay vì `'ADMIN' \| 'MANAGER' \| 'LOCATION_OWNER'` |
| Navigation = tab-based | Plan nói file-system routing với `(dashboard)` group |

### Cái gì nên làm trước

1. Init `shadcn/ui` (nhiều component cần: Table, Card, Badge, Dialog, Input, etc.)
2. Tách `(dashboard)/layout.tsx` + extract Sidebar/Topbar
3. Setup RBAC + Auth mock foundation
4. Refactor `src/types/index.ts` theo business docs
5. Implement `/kiosks` (Phase 2)

### Cái gì không nên làm vội

- Không cài Zustand/SWR cho đến khi có page thật sự cần (dùng `useState`/`useEffect` placeholder trước)
- Không setup WebSocket — chưa có backend, mock bằng interval/timeout đủ
- Không implement `/settings` — later phase
- Không tạo hệ thống i18n

---

## 10. Risk Notes For Next AI Prompt

### ⚠️ Cần xác nhận trước khi prompt code tiếp

| Câu hỏi | Lý do |
|:---|:---|
| **Init `shadcn/ui` không?** | Button hiện là custom, nhưng plan và docs yêu cầu shadcn. Nếu init, cần chạy `npx shadcn@latest init` — sẽ cài thêm Radix, cva, clsx, tailwind-merge. Đây là thay đổi `package.json` lớn |
| **Tách `(dashboard)` route group không?** | Cần thiết trước khi implement `/kiosks`. Sẽ move sidebar/topbar vào `(dashboard)/layout.tsx` |
| **Refactor `src/types/` không?** | Types hiện tại lệch plan. Nên refactor trước khi tạo mock data |
| **Xoá `src/features/` không?** | Folder trống, trùng mục đích với `src/components/features/` |

### ⚠️ Rủi ro kỹ thuật

| Rủi ro | Mức | Giải pháp |
|:---|:---|:---|
| shadcn init có thể conflict Tailwind v4 config | Trung bình | shadcn v2+ hỗ trợ Tailwind v4, nhưng cần verify sau init |
| Oklch color values có thể render khác hex gốc | Thấp | Visual compare trên browser, fine-tune nếu cần |
| `page.tsx` hiện là `'use client'` monolith | Thấp | Sẽ tự giải quyết khi tách layout — layout có thể là server component |
| Button custom vs shadcn Button | Thấp | Nếu init shadcn, component `ui/button.tsx` sẽ bị overwrite — cần merge logic |
| `axios-client.ts` hardcode fallback URL | Rất thấp | Chỉ dùng khi có backend thật, hiện mock-first không gọi API |

### 🛑 Packages không được tự cài (phải hỏi user)

- `shadcn/ui` và tất cả sub-dependencies
- `zustand`
- `swr` / `@tanstack/react-query`
- `socket.io-client`
- `recharts`
- Bất kỳ package mới nào khác

---

## 11. Recommended Next Step

> **Bước tiếp theo được khuyến nghị:**
>
> **"Init shadcn/ui + tách (dashboard) route group + extract Sidebar/Topbar + setup RBAC foundation"**

Lý do:
1. **shadcn/ui** cần init trước vì hầu hết mọi page nghiệp vụ đều cần Table, Card, Badge, Dialog — và việc init sẽ thay đổi `globals.css` + tạo `components.json` + cài packages mới.
2. **Route group `(dashboard)`** cần tạo trước khi implement bất kỳ page nào, vì sidebar/topbar phải là shared layout.
3. **RBAC foundation** (`src/lib/rbac.ts` + `useAuth` hook mock) cần có trước vì mọi page đều check quyền.
4. Sau bước này, codebase sẽ sẵn sàng implement `/kiosks` (Phase 2 theo plan).

**⚠️ Cần user xác nhận: "Có cho phép init shadcn/ui không?" — vì sẽ thay đổi `package.json`.**
