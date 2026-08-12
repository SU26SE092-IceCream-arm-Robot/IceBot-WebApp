# IceBot Admin Web

Internal operations dashboard for the IceBot automated ice cream kiosk system.

This repository is the Admin Web only. It is separate from:

- customer kiosk application: `Projects_Kiosk/IceBot-Kiosk`;
- staff mobile application: `Projects_Mobile/IceBot-Mobile`;
- backend and IoT/robot services: `Projects_Backend/IceBot-Backend` and their owning repositories.

## Current Scope

The MVP includes:

- authentication and invitation acceptance;
- operational dashboard backed by management GraphQL read models;
- kiosk metadata, real heartbeat/event evidence, and kiosk-scoped device viewing;
- inventory dispenser monitoring, refill, and estimate adjustment;
- maintenance ticket lifecycle management;
- organization and store management;
- product, variant, menu, and menu-item management;
- order, status-history, and refund workflows;
- account, role, permission-matrix, and effective-scope views;
- payment-method status management;
- operational reports using existing management APIs.

## Technology

- Next.js 16 App Router
- React 19 and TypeScript
- Tailwind CSS 4
- local shadcn/Base UI primitives
- Axios service layer
- Sonner notifications
- Lucide icons

The frontend architecture is:

```text
Page -> Hook/State -> Service -> Axios client -> Backend
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for feature ownership, source-folder
rules, permission scope evidence, and verification expectations.

See [docs/README.md](docs/README.md) for the frontend documentation index and
[docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) for visual and interaction rules.

## API Boundary

Admin Web may use:

- `/api/v1/management/*`;
- management GraphQL read models through `/graphql`;
- authentication endpoints and `/api/v1/me` for session/account flows.

Admin Web must not call customer runtime/order APIs, `/api/v1/iot/*`, payment-provider webhooks, internal dispatch handlers, or robot execution endpoints. It must not invent telemetry, revenue, alerts, recipes, payment outcomes, or robot state.

## Local Setup

Requirements:

- Node.js compatible with Next.js 16;
- npm;
- IceBot Backend running locally when testing real integrations.

Install dependencies:

```powershell
cd D:\SE\Projects\IceCream_arm_Robot\IceBot-WebApp
npm ci
```

Use `npm install` instead when intentionally updating dependencies.

Create `.env.local` without committing it:

```env
NEXT_PUBLIC_API_URL=/api/backend
ICEBOT_BACKEND_URL=http://localhost:5000
# Firebase Web configuration. Google login is shown only when all values exist.
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Start development:

```powershell
npm run dev
```

Open `http://localhost:3000`. The Next.js proxy forwards REST and GraphQL requests to `ICEBOT_BACKEND_URL`.

## Verification

Quick check while developing:

```powershell
npm run test
npm run check:architecture
```

Run the full repository check from
[`LOCAL_RUN_COMMANDS.md`](LOCAL_RUN_COMMANDS.md) before handoff. The test-layer
selection and completion standard are defined in
[`docs/TESTING_STRATEGY.md`](docs/TESTING_STRATEGY.md). There is no separate
`typecheck` script; `npm run build` performs TypeScript validation.

- Verify important API contracts against current backend source or Swagger before implementation.
