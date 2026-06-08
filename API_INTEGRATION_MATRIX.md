# API Integration Matrix - IceBot Admin Dashboard

Audit date: 2026-05-27

## Verified Backend Conventions

- Source inspected: backend WebAPI controllers, Application request/result types and services, authorization handler, `Program.cs`, wrapper types and backend API documentation.
- API versioning: URL segment versioning with current version `v1`, for example `/api/v1/...`.
- Authentication: JWT Bearer. Current browser-direct frontend auth already attaches the access token and refreshes once on `401`.
- Normal response envelope: `ApiResult<T>` with camel-case JSON fields `succeeded`, `statusCode`, `message`, `data`, `details`, `validationErrors`, `businessError`, `systemError`.
- List response envelope where used: `PagedResult<T>` extends `ApiResult<T[]>` and adds `pagination: { page, pageSize, totalCount, totalPages, hasNext, hasPrevious }`.
- Enum JSON: serialized as string enum values by the configured `JsonStringEnumConverter`.
- Current authorization enforcement: management policies validate role presence only; resource scope matching by `organizationId`, `storeId` or `kioskId` is not yet enforced in the backend handler.
- Frontend relevance: this repository is the Admin Dashboard. Customer/tablet and provider webhook APIs are catalogued below but are not targets for current dashboard integration.

## Integration Status Legend

| Status | Meaning |
| --- | --- |
| `integrated` | Frontend already calls this backend endpoint in the current codebase. |
| `ready-to-integrate` | Backend controller and request/response contract are clear; frontend implementation is still required. |
| `backend-missing` | Frontend module exists or is planned, but no matching backend controller contract was found. |
| `blocked/unclear` | An endpoint exists, but it is not suitable for the dashboard module or requires a product/security decision first. |

## Authentication And Current Account

| API group | Endpoint | Method | Auth required? | Allowed roles / policy | Request shape | Response shape | Frontend route/module | Integration status | Note / risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Authentication | `/api/v1/authentication/login` | `POST` | No | Anonymous | `{ emailOrUsername: string, password: string }` | `ApiResult<AuthenticatedAccountResult>` | `/login`, auth provider | `integrated` | Direct browser token storage is demo/dev only; production should move refresh token to HttpOnly cookie/BFF. |
| Authentication | `/api/v1/authentication/google` | `POST` | No | Anonymous | `{ idToken: string }` | `ApiResult<AuthenticatedAccountResult>` | `/login` future provider option | `ready-to-integrate` | Explicitly deferred; requires Google/Firebase frontend flow and configured provider. |
| Authentication | `/api/v1/authentication/refresh` | `POST` | No | Anonymous | `{ refreshToken: string }` | `ApiResult<AuthenticatedAccountResult>` | axios/session refresh | `integrated` | Frontend retries protected requests once after `401`. |
| Authentication | `/api/v1/authentication/revoke` | `POST` | No | Anonymous | `{ refreshToken: string, reason?: string }` | `ApiResult<{ revoked: boolean }>` | logout | `integrated` | Current logout revokes the stored refresh token, then clears local session. |
| Authentication | `/api/v1/authentication/revoke-all` | `POST` | Yes | Any authenticated internal account | `{ reason?: string }` | `ApiResult<{ revoked: number }>` | session security future UI | `integrated` | Service exists in frontend, but no current UI invokes revoke-all. |
| Authentication | `/api/v1/authentication/forgot-password` | `POST` | No | Anonymous | `{ emailOrUserName: string }` | `ApiResult<boolean>` | auth recovery future route | `ready-to-integrate` | Not part of completed local-password login phase. |
| Authentication | `/api/v1/authentication/reset-password` | `POST` | No | Anonymous | `{ token: string, newPassword: string }` | `ApiResult<boolean>` | auth recovery future route | `ready-to-integrate` | Requires reset UX and token entry/link strategy. |
| Current account | `/api/v1/me` | `GET` | Yes | Any authenticated internal account | None | `ApiResult<CurrentAccountResult>` | session restore/current user | `integrated` | Used to restore and validate browser session. |
| Current account | `/api/v1/me/profile` | `PUT` | Yes | Any authenticated internal account | `{ fullName?, phoneNumber?, address?, gender?, imageUrl? }` | `ApiResult<CurrentAccountResult>` | profile/settings future UI | `ready-to-integrate` | No current profile route; `/settings` remains later phase. |
| Current account | `/api/v1/me/password` | `PUT` | Yes | Any authenticated internal account | `{ currentPassword: string, newPassword: string }` | `ApiResult<boolean>` | profile/security future UI | `ready-to-integrate` | No current profile/security route. |

`AuthenticatedAccountResult` includes `accessToken`, `refreshToken`, `id`, `userName`, `fullName`, `email`, `imageUrl`, `address`, `roles[]`, `status`, `localLoginEnabled`, `googleLoginEnabled`, and `gender`.

`CurrentAccountResult` includes identity/profile fields plus `emailConfirmed`, `phoneNumber`, `phoneNumberConfirmed`, `googleEmail`, `lastLoginAt`, and `roles[]`.

`roles[]` contains `{ roleCode, organizationId?, storeId?, kioskId? }`. Current dashboard role mapping is `SystemAdmin -> ADMIN`, `Manager -> MANAGER`, `LocationOwner -> LOCATION_OWNER`; `Staff` and `Technician` do not enter the main dashboard.

## Internal Account Management

All endpoints below use policy `accounts.manage`, registered for backend role `SystemAdmin` only. This matches frontend route `/users` being Admin-only.

| API group | Endpoint | Method | Auth required? | Allowed roles / policy | Request shape | Response shape | Frontend route/module | Integration status | Note / risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Management accounts | `/api/v1/management/accounts?search&status&pageNumber&pageSize` | `GET` | Yes | `accounts.manage`: `SystemAdmin` | Query filters and pagination | `PagedResult<InternalAccountResult>` | `/users` list | `integrated` | Read-only list uses real API with search, status filter and pagination. |
| Management accounts | `/api/v1/management/accounts/{accountId}` | `GET` | Yes | `accounts.manage`: `SystemAdmin` | Path `accountId: guid` | `ApiResult<InternalAccountResult>` | `/users` detail/dialog | `ready-to-integrate` | No detail/action UI in current task. |
| Management accounts | `/api/v1/management/accounts` | `POST` | Yes | `accounts.manage`: `SystemAdmin` | `CreateInternalAccountRequest` | `ApiResult<InternalAccountResult>` | `/users` create | `ready-to-integrate` | Request may assign role scopes on creation. |
| Management accounts | `/api/v1/management/accounts/{accountId}` | `PUT` | Yes | `accounts.manage`: `SystemAdmin` | `UpdateInternalAccountRequest` | `ApiResult<InternalAccountResult>` | `/users` edit | `ready-to-integrate` | Must preserve backend role codes in request data. |
| Management accounts | `/api/v1/management/accounts/{accountId}/disable` | `PATCH` | Yes | `accounts.manage`: `SystemAdmin` | None | `ApiResult<InternalAccountResult>` | `/users` disable | `ready-to-integrate` | Disable is not delete. |
| Management accounts | `/api/v1/management/accounts/{accountId}/password` | `PUT` | Yes | `accounts.manage`: `SystemAdmin` | `{ newPassword: string, enableLocalLogin: boolean }` | `ApiResult<InternalAccountResult>` | `/users` security action | `ready-to-integrate` | Sensitive action requires deliberate UI confirmation. |
| Management accounts | `/api/v1/management/accounts/{accountId}/roles` | `POST` | Yes | `accounts.manage`: `SystemAdmin` | `{ roleCode: string, organizationId?, storeId?, kioskId? }` | `ApiResult<InternalAccountResult>` | `/users` role scope | `ready-to-integrate` | Backend scope fields exist, but backend policy handler does not yet enforce resource scope on other management modules. |

`InternalAccountResult` fields: `id`, `userName`, `email`, `fullName`, `status`, `localLoginEnabled`, `googleLoginEnabled`, `roles[]`.

## Product Catalog And Menu Management

Products and menus are separate backend resources. The frontend `/menu` screen now composes both as two read-only panels: sellable menus remain separate from the product catalog source.

| API group | Endpoint | Method | Auth required? | Allowed roles / policy | Request shape | Response shape | Frontend route/module | Integration status | Note / risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Products | `/api/v1/management/products?search&organizationId&storeId&kioskId&pageNumber&pageSize` | `GET` | Yes | `products.manage`: `SystemAdmin`, `Manager` | Query filters and pagination | `PagedResult<ProductResult>` | `/menu` catalog section | `integrated` | Read-only panel shows products and nested variants; `LocationOwner` cannot call this policy. |
| Products | `/api/v1/management/products/{productId}` | `GET` | Yes | `products.manage`: `SystemAdmin`, `Manager` | Path `productId: guid` | `ApiResult<ProductResult>` | `/menu` product detail/edit | `ready-to-integrate` | Product includes variants. |
| Products | `/api/v1/management/products` | `POST` | Yes | `products.manage`: `SystemAdmin`, `Manager` | `CreateProductRequest` with optional `variants[]` | `ApiResult<ProductResult>` | `/menu` product create | `ready-to-integrate` | Supports tenant scope fields; scope enforcement caveat applies. |
| Products | `/api/v1/management/products/{productId}` | `PUT` | Yes | `products.manage`: `SystemAdmin`, `Manager` | `UpdateProductRequest` | `ApiResult<ProductResult>` | `/menu` product edit | `ready-to-integrate` | No current UI. |
| Products | `/api/v1/management/products/{productId}/availability` | `PATCH` | Yes | `products.manage`: `SystemAdmin`, `Manager` | `{ isAvailable: boolean }` | `ApiResult<ProductResult>` | `/menu` product availability | `ready-to-integrate` | Suitable for toggle action. |
| Products | `/api/v1/management/products/{productId}` | `DELETE` | Yes | `products.manage`: `SystemAdmin`, `Manager` | None | `ApiResult<boolean>` | `/menu` product remove | `ready-to-integrate` | Product deletion semantics should be surfaced carefully in UI. |
| Product variants | `/api/v1/management/products/{productId}/variants` | `POST` | Yes | `products.manage`: `SystemAdmin`, `Manager` | `UpsertProductVariantRequest` | `ApiResult<ProductVariantResult>` | `/menu` variant create | `ready-to-integrate` | Nested resource. |
| Product variants | `/api/v1/management/products/{productId}/variants/{variantId}` | `PUT` | Yes | `products.manage`: `SystemAdmin`, `Manager` | `UpdateProductVariantRequest` | `ApiResult<ProductVariantResult>` | `/menu` variant edit | `ready-to-integrate` | Nested resource. |
| Product variants | `/api/v1/management/products/{productId}/variants/{variantId}/availability` | `PATCH` | Yes | `products.manage`: `SystemAdmin`, `Manager` | `{ isAvailable: boolean }` | `ApiResult<ProductVariantResult>` | `/menu` variant availability | `ready-to-integrate` | Suitable for toggle action. |
| Product variants | `/api/v1/management/products/{productId}/variants/{variantId}` | `DELETE` | Yes | `products.manage`: `SystemAdmin`, `Manager` | None | `ApiResult<boolean>` | `/menu` variant remove | `ready-to-integrate` | No current UI. |
| Menus | `/api/v1/management/menus?search&organizationId&storeId&kioskId&pageNumber&pageSize` | `GET` | Yes | `menus.manage`: `SystemAdmin`, `Manager` | Query filters and pagination | `PagedResult<MenuResult>` | `/menu` sellable menu list | `integrated` | Read-only panel shows menus and nested items; menu remains separate from product entity. |
| Menus | `/api/v1/management/menus/{menuId}` | `GET` | Yes | `menus.manage`: `SystemAdmin`, `Manager` | Path `menuId: guid` | `ApiResult<MenuResult>` | `/menu` menu detail/edit | `ready-to-integrate` | Menu includes items. |
| Menus | `/api/v1/management/menus` | `POST` | Yes | `menus.manage`: `SystemAdmin`, `Manager` | `CreateMenuRequest` | `ApiResult<MenuResult>` | `/menu` menu create | `ready-to-integrate` | Tenant scope fields are part of contract. |
| Menus | `/api/v1/management/menus/{menuId}` | `PUT` | Yes | `menus.manage`: `SystemAdmin`, `Manager` | `UpdateMenuRequest` | `ApiResult<MenuResult>` | `/menu` menu edit | `ready-to-integrate` | No current UI. |
| Menus | `/api/v1/management/menus/{menuId}/status` | `PATCH` | Yes | `menus.manage`: `SystemAdmin`, `Manager` | `{ status: MenuStatus }` | `ApiResult<MenuResult>` | `/menu` publish/pause/archive | `ready-to-integrate` | Enum serialized as string. |
| Menus | `/api/v1/management/menus/{menuId}` | `DELETE` | Yes | `menus.manage`: `SystemAdmin`, `Manager` | None | `ApiResult<boolean>` | `/menu` remove | `ready-to-integrate` | No current UI. |
| Menu items | `/api/v1/management/menus/{menuId}/items` | `POST` | Yes | `menus.manage`: `SystemAdmin`, `Manager` | `CreateMenuItemRequest` | `ApiResult<MenuItemResult>` | `/menu` item create | `ready-to-integrate` | Uses product/variant IDs. |
| Menu items | `/api/v1/management/menus/{menuId}/items/{menuItemId}` | `PUT` | Yes | `menus.manage`: `SystemAdmin`, `Manager` | `UpdateMenuItemRequest` | `ApiResult<MenuItemResult>` | `/menu` item edit | `ready-to-integrate` | No current UI. |
| Menu items | `/api/v1/management/menus/{menuId}/items/{menuItemId}/status` | `PATCH` | Yes | `menus.manage`: `SystemAdmin`, `Manager` | `{ status: MenuItemStatus }` | `ApiResult<MenuItemResult>` | `/menu` availability/state | `ready-to-integrate` | Enum serialized as string. |
| Menu items | `/api/v1/management/menus/{menuId}/items/{menuItemId}` | `DELETE` | Yes | `menus.manage`: `SystemAdmin`, `Manager` | None | `ApiResult<boolean>` | `/menu` item remove | `ready-to-integrate` | No current UI. |

## Payments And Customer Order Surface

| API group | Endpoint | Method | Auth required? | Allowed roles / policy | Request shape | Response shape | Frontend route/module | Integration status | Note / risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Payment method management | `/api/v1/management/payment-methods` | `GET` | Yes | `payments.manage`: `SystemAdmin`, `Manager` | None | `ApiResult<PaymentMethodResult[]>` | No current dedicated dashboard route | `ready-to-integrate` | Contract is clear, but route placement needs product confirmation; not equivalent to transaction history. |
| Payment method management | `/api/v1/management/payment-methods/{id}/status` | `PATCH` | Yes | `payments.manage`: `SystemAdmin`, `Manager` | `{ isActive: boolean }` | `ApiResult<boolean>` | No current dedicated dashboard route | `ready-to-integrate` | Payment configuration action, not transaction/refund action. |
| Customer runtime menu | `/api/v1/kiosks/{kioskId}/runtime-menu` | `GET` | No | Anonymous | Path `kioskId: guid` | `ApiResult<RuntimeMenuResult>` | Customer kiosk/tablet, not Admin Dashboard | `blocked/unclear` | Must not replace `/kiosks` Fleet Monitor or management `/menu`; it exposes sellable runtime projection only. |
| Customer orders | `/api/v1/orders` | `POST` | No | Anonymous | `PlaceOrderRequest`, supports `Idempotency-Key` header | `ApiResult<OrderResult>` | Customer kiosk/tablet, not Admin Dashboard | `blocked/unclear` | Not a dashboard transaction-list API. |
| Customer orders | `/api/v1/orders/{orderId}` | `GET` | No | Anonymous | Path `orderId: guid` | `ApiResult<OrderResult>` | Customer order tracking | `blocked/unclear` | Single order lookup is not `/transactions` management support. |
| Customer payment session | `/api/v1/orders/{orderId}/payment-sessions` | `POST` | No | Anonymous | `{ idempotencyKey?, description? }`, supports `Idempotency-Key` header | `ApiResult<PaymentSessionResult>` | Customer payment flow | `blocked/unclear` | Outside Admin Dashboard scope. |
| Customer payment status | `/api/v1/orders/{orderId}/payment-status` | `GET` | No | Anonymous | Path `orderId: guid` | `ApiResult<PaymentStatusResult>` | Customer payment flow | `blocked/unclear` | Does not provide admin reconciliation/list/search contract. |
| Customer order cancellation | `/api/v1/orders/{orderId}/cancel` | `POST` | No | Anonymous | `{ reason?: string }` | `ApiResult<OrderResult>` | Customer payment flow | `blocked/unclear` | Only cancels pending/unpaid orders; not manual refund. |
| Provider webhook | `/api/v1/payments/payos/webhook` | `POST` | No JWT | Provider signature header `x-payos-signature` | Raw body payload | `ApiResult<PaymentNotificationResult>` | Payment provider callback only | `blocked/unclear` | Never call from frontend; provider integration endpoint. |

## Dashboard Modules Without Verified Management API

| API group | Endpoint | Method | Auth required? | Allowed roles / policy | Request shape | Response shape | Frontend route/module | Integration status | Note / risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fleet kiosk management / telemetry | Not found | N/A | N/A | Backend docs mention future `kiosks.manage`; no controller/policy registration found | N/A | N/A | `/kiosks`, `/kiosks/[id]` | `backend-missing` | Keep mock-first; runtime-menu API is not fleet telemetry. |
| Inventory management | Not found | N/A | N/A | Backend docs mention future `inventory.operate`; no controller/policy registration found | N/A | N/A | `/inventory` | `backend-missing` | Domain entities exist, but no API contract. |
| Maintenance management | Not found | N/A | N/A | Backend docs mention future `maintenance.manage`; no controller/policy registration found | N/A | N/A | `/maintenance` | `backend-missing` | Domain entity exists, but no API contract. |
| Reports / analytics | Not found | N/A | N/A | Backend docs mention future `reports.view`; no controller/policy registration found | N/A | N/A | `/reports` | `backend-missing` | Do not infer reports from customer order status calls. |
| Dashboard transaction history / reconciliation / refund | Not found | N/A | N/A | No management orders/refunds policy/controller found | N/A | N/A | `/transactions` | `backend-missing` | Public checkout APIs cannot support admin transaction management safely. |

## Frontend Integration Decision Map

| Frontend module | Current frontend status | Verified backend support | Proposed next integration |
| --- | --- | --- | --- |
| Auth/session | Login, logout, restore and refresh already wired | Authentication and `/me` contracts verified | Keep existing foundation; later add recovery/profile only if requested. |
| `/users` | Read-only API-backed account list implemented | Full `/management/accounts` CRUD/role endpoints verified | Detail and account management actions remain deferred until requested. |
| `/menu` | Read-only composed view with separate Menu and Product panels implemented | Full products and menus management endpoints verified | Detail and write actions remain deferred until requested. |
| Payment configuration | No dedicated route | `/management/payment-methods` verified | Defer until product decides where configuration belongs; do not force into `/transactions`. |
| `/kiosks`, `/kiosks/[id]` | Mock-first UI already exists | No management kiosk/telemetry API | Keep mock-first. |
| `/inventory` | Placeholder page | No API controller verified | Keep placeholder/mock-first. |
| `/maintenance` | Placeholder page | No API controller verified | Keep placeholder/mock-first. |
| `/reports` | Placeholder page | No API controller verified | Keep placeholder/mock-first. |
| `/transactions` | Placeholder page | Only customer checkout/status/payment APIs verified | Keep placeholder/mock-first until management transaction/refund contract exists. |

## Verified Risks And Open Decisions

- `API_SURFACE_RULES.md` examples for authentication are stale against code: docs mention paths such as `external-login`, `refresh-token` and `revoke-refresh-token`, while current controller exposes `google`, `refresh` and `revoke`. Frontend must follow controller code unless backend deliberately changes its public contract.
- `ScopedRoleAuthorizationHandler` authorizes management calls based on role presence only. Although DTOs and tokens carry tenant scope IDs, backend management resource scope enforcement is not yet implemented.
- Frontend `LOCATION_OWNER` kiosk filtering is UI-only against mock location IDs; it is not a substitute for backend resource authorization.
- Backend includes customer/tablet API contracts, but this frontend repository is an Admin Dashboard. Integrating customer APIs into admin routes would mix surfaces and should not be done.
- Payment-method management contract is available, but the current Admin Dashboard route plan has no payment-settings module. A product decision is needed before binding it to a route.

## Proposed Approval-Gated Implementation Order

1. Extend `/users` with deliberate management actions only when approved; the read-only account list is already integrated with Admin-only access.
2. Extend `/menu` with detail or deliberate write actions only when requested; the two read-only list panels are already integrated without merging domain models.
3. Defer payment-method management until a route placement is approved.
4. Retain mock-first kiosk pages and placeholders for inventory, maintenance, reports and transactions until matching management APIs exist.
