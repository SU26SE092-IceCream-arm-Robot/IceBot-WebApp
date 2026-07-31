# Local Run Commands

## 1. Frontend Environment

Create or update the local-only file:

```text
D:\SE\Projects\IceCream_arm_Robot\IceBot-WebApp\.env.local
```

Use these local values:

```env
NEXT_PUBLIC_API_URL=/api/backend
ICEBOT_BACKEND_URL=http://localhost:51967
```

- `NEXT_PUBLIC_API_URL` is browser-visible and uses the same-origin Next.js proxy.
- `ICEBOT_BACKEND_URL` is read by `next.config.ts` on the Next.js server.
- Restart `npm run dev` after changing environment variables.
- Never commit `.env.local` or production credentials.

## 2. Install Frontend Dependencies

```powershell
cd D:\SE\Projects\IceCream_arm_Robot\IceBot-WebApp
npm ci
```

Use `npm install` only when intentionally changing dependencies or when no
lockfile is available.

## 3. Run Backend

In the first PowerShell terminal:

```powershell
cd D:\SE\Projects\IceCream_arm_Robot\IceBot-Backend

$env:ASPNETCORE_ENVIRONMENT="Development"
dotnet run --project src\WebAPI\WebAPI.csproj --launch-profile WebAPI
```

The current local launch profile serves HTTP at `http://localhost:51967` and
HTTPS at `https://localhost:51966`. Backend local configuration owns the
PostgreSQL connection at `localhost:5432` and MinIO at `localhost:9000`.
Do not place database, payment, or provider secrets in frontend environment
files.

## 4. Run Admin Web

In a second PowerShell terminal:

```powershell
cd D:\SE\Projects\IceCream_arm_Robot\IceBot-WebApp
npm run dev -- --hostname localhost --port 3000
```

URLs:

```text
Admin Web: http://localhost:3000
Backend:   http://localhost:51967
Swagger:   http://localhost:51967/swagger
Health:    http://localhost:51967/health/ready
```

## 5. Verification

```powershell
npm run lint
npm run build
git diff --check
```

Production preview after a successful build:

```powershell
npm run start
```

## 6. Local Bootstrap Account

The local SystemAdmin account is defined by Backend user secrets, not this
repository. Inspect it only on the local development machine:

```powershell
cd D:\SE\Projects\IceCream_arm_Robot\IceBot-Backend
dotnet user-secrets list --project src\WebAPI\WebAPI.csproj
```

Use the `BootstrapAdmin:Email` (or `BootstrapAdmin:UserName`) and
`BootstrapAdmin:Password` values shown there. Do not copy those values into
source, frontend environment files, screenshots, or shared documentation.
