# API Integration Matrix - IceBot Admin Dashboard

Audit date: 2026-06-09

## Verified Backend Conventions

- Source inspected: backend WebAPI controllers, Application request/result types and services, authorization policies, `Program.cs`, wrappers, and the latest backend post-pull audit.
- API versioning: URL segment versioning with current version `v1`, for example `/api/v1/...`.
- Authentication: JWT Bearer. The browser-direct frontend attaches the access token and retries once with the refresh token after `401`.
- Normal response envelope: `ApiResult<T>` with camel-case JSON fields `succeeded`, `statusCode`, `message`, `data`, `details`, `validationErrors`, `businessError`, and `systemError`.
- List response envelope where used: `PagedResult<T>` extends `ApiResult<T[]>` and adds `pagination: { page, pageSize, totalCount, totalPages, hasNext, hasPrevious }`.
- Enum JSON: enum values are serialized as strings by `JsonStringEnumConverter`.
- Authorization enforcement: legacy account/product/menu/payment policies mostly rely on role/policy checks. New tenant APIs additionally enforce organization/store/kiosk scope in the service layer.
- Frontend relevance: this repository is the Admin Dashboard. Customer/tablet runtime APIs and provider webhooks are documented for boundary clarity but must not be integrated into dashboard modules.

### CORS Blocker

Backend CORS remains a browser E2E blocker because `AddCors` exists but `UseCors` is not active in the HTTP pipeline. Frontend must not workaround this for production behavior. The backend team must activate the intended policy before direct browser API integration can be considered operational end to end.

## Integration Status Legend

| Status | Meaning |
| --- | --- |
| `integrated` | Frontend currently calls this backend endpoint. |
| `ready-to-integrate` | Backend controller and request/response contract are clear; frontend implementation is still required. |
| `partial-integration` | Endpoint can back part of a page, but cannot replace the full current UI/data model. |
| `backend-missing` | Frontend module exists or is planned, but no matching management API contract was found. |
| `blocked/unclear` | Endpoint exists, but is unsuitable for the dashboard module or requires a product/security decision first. |

## Authentication And Current Account

| API group | Endpoint | Method | Auth required? | Allowed roles / policy | Request shape | Response shape | Frontend route/module | Integration status | Note / risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Authentication | `/api/v1/authentication/login` | `POST` | No | Anonymous | `{ emailOrUsername: string, password: string }` | `ApiResult<AuthenticatedAccountResult>` | `/login`, auth provider | `integrated` | Browser token storage is demo/dev only; production should use an HttpOnly cookie/BFF boundary. |
| Authentication | `/api/v1/authentication/google` | `POST` | No | Anonymous | `{ idToken: string }` | `ApiResult<AuthenticatedAccountResult>` | Future login provider | `ready-to-integrate` | Google/Firebase login is intentionally deferred. |
| Authentication | `/api/v1/authentication/refresh` | `POST` | No | Anonymous | `{ refreshToken: string }` | `ApiResult<AuthenticatedAccountResult>` | Axios/session refresh | `integrated` | Protected requests retry once after `401`. |
| Authentication | `/api/v1/authentication/revoke` | `POST` | No | Anonymous | `{ refreshToken: string, reason?: string }` | `ApiResult<{ revoked: boolean }>` | Logout | `integrated` | Logout attempts token revocation before clearing local session. |
| Authentication | `/api/v1/authentication/revoke-all` | `POST` | Yes | Authenticated internal account | `{ reason?: string }` | `ApiResult<{ revoked: number }>` | Future session-security UI | `integrated` | Frontend service exists; no current UI invokes it. |
| Authentication | `/api/v1/authentication/forgot-password` | `POST` | No | Anonymous | `{ emailOrUserName: string }` | `ApiResult<boolean>` | Future auth recovery | `ready-to-integrate` | Recovery UI is not implemented. |
| Authentication | `/api/v1/authentication/reset-password` | `POST` | No | Anonymous | `{ token: string, newPassword: string }` | `ApiResult<boolean>` | Future auth recovery | `ready-to-integrate` | Reset-password UI is not implemented. |
| Authentication | `/api/v1/authentication/accept-invitation` | `POST` | No | Anonymous | `{ token: string, newPassword: string }` | `ApiResult<AcceptInvitationResult>` | `/accept-invitation` | `integrated` | User sets a password, account becomes active, then returns to login; no automatic login. |
| Current account | `/api/v1/me` | `GET` | Yes | Authenticated internal account | None | `ApiResult<CurrentAccountResult>` | Session restore/current user | `integrated` | Validates and restores authenticated identity. |
| Current account | `/api/v1/me/profile` | `PUT` | Yes | Authenticated internal account | `{ fullName?, phoneNumber?, address?, gender?, imageUrl? }` | `ApiResult<CurrentAccountResult>` | Future profile/settings | `ready-to-integrate` | `/settings` remains a later phase. |
| Current account | `/api/v1/me/password` | `PUT` | Yes | Authenticated internal account | `{ currentPassword: string, newPassword: string }` | `ApiResult<boolean>` | Future profile/security | `ready-to-integrate` | No current profile/security route. |

`AuthenticatedAccountResult` includes tokens, account identity, login-provider flags, status, and scoped roles.

`roles[]` contains `{ roleCode, organizationId?, storeId?, kioskId? }`. Current dashboard mapping is:

```text
SystemAdmin   -> ADMIN
Manager       -> MANAGER
OrgAdmin      -> LOCATION_OWNER
LocationOwner -> LOCATION_OWNER
Staff         -> forbidden
Technician    -> forbidden
```

`LocationOwner` is retained for backward compatibility. `OrgAdmin.organizationId` is not treated as a location ID; tenant-resource authorization remains backend-enforced.

## Internal Account Management

All endpoints use policy `accounts.manage`, currently granted to backend role `SystemAdmin`.

| API group | Endpoint | Method | Request shape | Response shape | Frontend module | Integration status | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Accounts | `/api/v1/management/accounts?search&status&pageNumber&pageSize` | `GET` | Query filters and pagination | `PagedResult<InternalAccountResult>` | `/users` list | `integrated` | Search, status filtering, loading/error/empty states, and pagination are implemented. |
| Accounts | `/api/v1/management/accounts/{accountId}` | `GET` | Path GUID | `ApiResult<InternalAccountResult>` | `/users` detail | `integrated` | Detail dialog displays identity, login methods, status, and roles. |
| Accounts | `/api/v1/management/accounts` | `POST` | `CreateInternalAccountRequest` | `ApiResult<InternalAccountResult>` | `/users` invitation create | `integrated` | Invitation-first onboarding is implemented; no temporary-password default flow. |
| Accounts | `/api/v1/management/accounts/{accountId}` | `PUT` | `UpdateInternalAccountRequest` | `ApiResult<InternalAccountResult>` | Future account edit | `ready-to-integrate` | Edit UI is not implemented. |
| Accounts | `/api/v1/management/accounts/{accountId}/disable` | `PATCH` | None | `ApiResult<InternalAccountResult>` | `/users` disable action | `integrated` | Confirmation and self-disable protection are implemented. |
| Accounts | `/api/v1/management/accounts/{accountId}/password` | `PUT` | `{ newPassword: string, enableLocalLogin: boolean }` | `ApiResult<InternalAccountResult>` | Future security action | `ready-to-integrate` | Sensitive admin password action is intentionally not exposed. |
| Accounts | `/api/v1/management/accounts/{accountId}/roles` | `POST` | `{ roleCode, organizationId?, storeId?, kioskId? }` | `ApiResult<InternalAccountResult>` | Future role assignment | `ready-to-integrate` | Role assignment UI is not implemented. |
| Invitations | `/api/v1/management/accounts/{accountId}/invitation` | `POST` | `{ sendEmail: boolean }` | `ApiResult<AccountInvitationResult>` | `/users` regenerate invitation | `integrated` | Available for invited accounts; new invitation revokes the previous active invitation. |

Implemented invitation presentation includes:

- Account status `Invited`.
- Invitation URL and token display.
- Copy invitation URL/token.
- Email-sent result.
- Regenerate invitation warning and confirmation.

## Product Catalog Management

Policy `products.manage` is granted to `SystemAdmin` and `Manager`.

| API group | Endpoint | Method | Request shape | Response shape | Frontend module | Integration status | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Products | `/api/v1/management/products?search&organizationId&storeId&kioskId&pageNumber&pageSize` | `GET` | Query filters and pagination | `PagedResult<ProductResult>` | `/menu` product catalog | `integrated` | Product and variant summaries remain separate from Menu domain data. |
| Products | `/api/v1/management/products/{productId}` | `GET` | Path GUID | `ApiResult<ProductResult>` | Product detail dialog | `integrated` | Displays product scope, availability, and variants. |
| Products | `/api/v1/management/products` | `POST` | `CreateProductRequest` | `ApiResult<ProductResult>` | Future product create | `ready-to-integrate` | No create UI. |
| Products | `/api/v1/management/products/{productId}` | `PUT` | `UpdateProductRequest` | `ApiResult<ProductResult>` | Future product edit | `ready-to-integrate` | No edit UI. |
| Products | `/api/v1/management/products/{productId}/availability` | `PATCH` | `{ isAvailable: boolean }` | `ApiResult<ProductResult>` | Product availability action | `integrated` | Uses confirmation and response/refetch state rather than optimistic success. |
| Products | `/api/v1/management/products/{productId}` | `DELETE` | None | `ApiResult<boolean>` | Future product removal | `ready-to-integrate` | Delete UI is intentionally absent. |
| Product variants | `/api/v1/management/products/{productId}/variants` | `POST` | `UpsertProductVariantRequest` | `ApiResult<ProductVariantResult>` | Future variant create | `ready-to-integrate` | No create UI. |
| Product variants | `/api/v1/management/products/{productId}/variants/{variantId}` | `PUT` | `UpdateProductVariantRequest` | `ApiResult<ProductVariantResult>` | Future variant edit | `ready-to-integrate` | No edit UI. |
| Product variants | `/api/v1/management/products/{productId}/variants/{variantId}/availability` | `PATCH` | `{ isAvailable: boolean }` | `ApiResult<ProductVariantResult>` | Product detail dialog | `integrated` | Variant availability toggle is implemented. |
| Product variants | `/api/v1/management/products/{productId}/variants/{variantId}` | `DELETE` | None | `ApiResult<boolean>` | Future variant removal | `ready-to-integrate` | Delete UI is intentionally absent. |

## Menu Management

Policy `menus.manage` is granted to `SystemAdmin` and `Manager`.

| API group | Endpoint | Method | Request shape | Response shape | Frontend module | Integration status | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Menus | `/api/v1/management/menus?search&organizationId&storeId&kioskId&pageNumber&pageSize` | `GET` | Query filters and pagination | `PagedResult<MenuResult>` | `/menu` menu list | `integrated` | Menus remain a separate domain from Products. |
| Menus | `/api/v1/management/menus/{menuId}` | `GET` | Path GUID | `ApiResult<MenuResult>` | Menu detail dialog | `integrated` | Displays scope, status, and menu items. |
| Menus | `/api/v1/management/menus` | `POST` | `CreateMenuRequest` | `ApiResult<MenuResult>` | Future menu create | `ready-to-integrate` | No create UI. |
| Menus | `/api/v1/management/menus/{menuId}` | `PUT` | `UpdateMenuRequest` | `ApiResult<MenuResult>` | Future menu edit | `ready-to-integrate` | No edit UI. |
| Menus | `/api/v1/management/menus/{menuId}/status` | `PATCH` | `{ status: MenuStatus }` | `ApiResult<MenuResult>` | Menu status action | `integrated` | UI exposes only deliberate safe transitions. |
| Menus | `/api/v1/management/menus/{menuId}` | `DELETE` | None | `ApiResult<boolean>` | Future menu removal | `ready-to-integrate` | Delete UI is intentionally absent. |
| Menu items | `/api/v1/management/menus/{menuId}/items` | `POST` | `CreateMenuItemRequest` | `ApiResult<MenuItemResult>` | Future item create | `ready-to-integrate` | No create UI. |
| Menu items | `/api/v1/management/menus/{menuId}/items/{menuItemId}` | `PUT` | `UpdateMenuItemRequest` | `ApiResult<MenuItemResult>` | Future item edit | `ready-to-integrate` | No edit UI. |
| Menu items | `/api/v1/management/menus/{menuId}/items/{menuItemId}/status` | `PATCH` | `{ status: MenuItemStatus }` | `ApiResult<MenuItemResult>` | Menu detail dialog | `integrated` | Menu-item status toggle is implemented. |
| Menu items | `/api/v1/management/menus/{menuId}/items/{menuItemId}` | `DELETE` | None | `ApiResult<boolean>` | Future item removal | `ready-to-integrate` | Delete UI is intentionally absent. |

## Organization Management

| Endpoint | Method | Policy | Request shape | Response shape | Integration status | Note |
| --- | --- | --- | --- | --- | --- | --- |
| `/api/v1/management/organizations?search&status&pageNumber&pageSize` | `GET` | `organizations.view`: `SystemAdmin`, `OrgAdmin` | Query filters and pagination | `PagedResult<OrganizationResult>` | `blocked/unclear` | Contract is clear, but the current dashboard route plan has no Organization route. |
| `/api/v1/management/organizations/{organizationId}` | `GET` | `organizations.view` | Path GUID | `ApiResult<OrganizationResult>` | `ready-to-integrate` | Can support tenant context/lookup without creating a new route. |
| `/api/v1/management/organizations` | `POST` | `organizations.manage`: `SystemAdmin` | `CreateOrganizationRequest` | `ApiResult<OrganizationResult>` | `blocked/unclear` | Requires product approval and route/UX placement. |
| `/api/v1/management/organizations/{organizationId}` | `PUT` | `organizations.update`: `SystemAdmin`, `OrgAdmin` | `UpdateOrganizationRequest` | `ApiResult<OrganizationResult>` | `blocked/unclear` | Requires product approval. |
| `/api/v1/management/organizations/{organizationId}/disable` | `PATCH` | `organizations.manage` | None | `ApiResult<OrganizationResult>` | `blocked/unclear` | Lifecycle action requires dedicated management UX. |
| `/api/v1/management/organizations/{organizationId}/activate` | `PATCH` | `organizations.manage` | None | `ApiResult<OrganizationResult>` | `blocked/unclear` | Lifecycle action requires dedicated management UX. |

## Store Management

| Endpoint | Method | Policy | Request shape | Response shape | Integration status | Note |
| --- | --- | --- | --- | --- | --- | --- |
| `/api/v1/management/stores?organizationId&status&search` | `GET` | `stores.view`: `SystemAdmin`, `OrgAdmin`, `Manager` | Optional query filters | `ApiResult<StoreResult[]>` | `integrated` | Supplies kiosk location labels and filters. Not paginated. |
| `/api/v1/management/stores/{storeId}` | `GET` | `stores.view` | Path GUID | `ApiResult<StoreResult>` | `integrated` | Supplies kiosk detail location metadata. |
| `/api/v1/management/organizations/{organizationId}/stores` | `POST` | `stores.manage`: `SystemAdmin`, `OrgAdmin` | `CreateStoreRequest` | `ApiResult<StoreResult>` | `blocked/unclear` | Write UI and route placement require product approval. |
| `/api/v1/management/stores/{storeId}` | `PUT` | `stores.update`: `SystemAdmin`, `OrgAdmin`, `Manager` | `UpdateStoreRequest` | `ApiResult<StoreResult>` | `blocked/unclear` | Write UI is outside the current route plan. |
| `/api/v1/management/stores/{storeId}/disable` | `PATCH` | `stores.manage` | None | `ApiResult<bool>` | `blocked/unclear` | Lifecycle action requires product approval. |
| `/api/v1/management/stores/{storeId}/activate` | `PATCH` | `stores.manage` | None | `ApiResult<bool>` | `blocked/unclear` | Lifecycle action requires product approval. |

## Kiosk Metadata And Configuration Management

The management Kiosk contract supplies identity, tenant scope, configuration, lifecycle status, installation, and `lastOnlineAt`. It does not supply Fleet Monitor hardware telemetry.

Backend `KioskStatus` values:

```text
Provisioning
Active
Offline
Maintenance
Disabled
Retired
```

These values must not be cast directly to the current Fleet status model `ONLINE | OFFLINE | MAINTENANCE | ERROR`.

| Endpoint | Method | Policy | Request shape | Response shape | Integration status | Note |
| --- | --- | --- | --- | --- | --- | --- |
| `/api/v1/management/kiosks?organizationId&storeId&status&search` | `GET` | `kiosks.view`: `SystemAdmin`, `OrgAdmin`, `Manager`, `Technician` | Optional query filters | `ApiResult<KioskResult[]>` | `partial-integration` | Integrated for list identity/configuration metadata; Fleet telemetry remains mock-first. Not paginated. |
| `/api/v1/management/kiosks/{kioskId}` | `GET` | `kiosks.view` | Path GUID | `ApiResult<KioskResult>` | `partial-integration` | Integrated for detail metadata; hardware state, history, current order, and errors remain mock-only. |
| `/api/v1/management/stores/{storeId}/kiosks` | `POST` | `kiosks.manage`: `SystemAdmin`, `OrgAdmin`, `Manager`, `Technician` | `CreateKioskRequest` | `ApiResult<KioskResult>` | `ready-to-integrate` | Contract is clear; create UI requires product approval. |
| `/api/v1/management/kiosks/{kioskId}` | `PUT` | `kiosks.update`: same allowed roles | `UpdateKioskRequest` | `ApiResult<KioskResult>` | `ready-to-integrate` | Contract is clear; edit UI requires product approval. |
| `/api/v1/management/kiosks/{kioskId}/status` | `PATCH` | `kiosks.manage` | `{ status: KioskStatus }` | `ApiResult<KioskResult>` | `ready-to-integrate` | Lifecycle action is not a realtime lock/unlock or robot-control command. |

Although backend Kiosk policies include `Technician`, frontend `Technician` remains forbidden from the main Admin Dashboard by product decision.

## Payment Methods And Customer Runtime Surface

| API group | Endpoint | Method | Auth/policy | Response | Integration status | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Payment methods | `/api/v1/management/payment-methods` | `GET` | `payments.manage`: `SystemAdmin`, `Manager` | `ApiResult<PaymentMethodResult[]>` | `ready-to-integrate` | Route placement is undecided; this is configuration, not transaction history. |
| Payment methods | `/api/v1/management/payment-methods/{id}/status` | `PATCH` | `payments.manage` | `ApiResult<bool>` | `ready-to-integrate` | Requires an approved payment-configuration UI. |
| Customer runtime menu | `/api/v1/kiosks/{kioskId}/runtime-menu` | `GET` | Anonymous | `ApiResult<RuntimeMenuResult>` | `blocked/unclear` | Customer/kiosk projection only; never use as Admin Menu or Fleet API. |
| Customer orders | `/api/v1/orders` | `POST` | Anonymous | `ApiResult<OrderResult>` | `blocked/unclear` | Customer checkout only; not a dashboard transaction-list API. |
| Customer order | `/api/v1/orders/{orderId}` | `GET` | Anonymous | `ApiResult<OrderResult>` | `blocked/unclear` | Single customer-order lookup does not support transaction management. |
| Payment session | `/api/v1/orders/{orderId}/payment-sessions` | `POST` | Anonymous | `ApiResult<PaymentSessionResult>` | `blocked/unclear` | Customer payment flow only. |
| Payment status | `/api/v1/orders/{orderId}/payment-status` | `GET` | Anonymous | `ApiResult<PaymentStatusResult>` | `blocked/unclear` | Does not provide reconciliation/search/reporting. |
| Order cancellation | `/api/v1/orders/{orderId}/cancel` | `POST` | Anonymous | `ApiResult<OrderResult>` | `blocked/unclear` | Customer pending-order cancellation, not an admin refund action. |
| PayOS webhook | `/api/v1/payments/payos/webhook` | `POST` | Provider signature | `ApiResult<PaymentNotificationResult>` | `blocked/unclear` | Provider callback; frontend must never invoke it. |

## Dashboard Module Coverage

| Frontend route | Current frontend state | Verified backend support | Integration status | Decision |
| --- | --- | --- | --- | --- |
| `/users` | List, detail, disable, invitation create/regenerate, invitation result UI | Matching Accounts and Invitation APIs | `integrated` | Keep unimplemented edit/password/role actions deferred. |
| `/menu` | Product/Menu lists and details; product/variant availability; menu/item status | Matching Product and Menu APIs | `integrated` | Keep create/edit/delete deferred. |
| `/kiosks` | Real metadata with explicit mock telemetry fallback/adapter | Real Kiosk and Store metadata list; no telemetry | `partial-integration` | Metadata is integrated; preserve mock telemetry until a backend contract exists. |
| `/kiosks/[id]` | Real metadata with mock hardware/history/control presentation | Real Kiosk and Store detail metadata; no hardware/history/control API | `partial-integration` | Metadata is integrated; UI does not claim backend control support. |
| `/inventory` | Placeholder/mock-first | No management API | `backend-missing` | Wait for backend contract. |
| `/maintenance` | Placeholder/mock-first | No management API | `backend-missing` | Wait for backend contract. |
| `/reports` | Placeholder/mock-first | No management API | `backend-missing` | Wait for backend contract. |
| `/transactions` | Placeholder/mock-first | No management transaction/reconciliation/refund API | `backend-missing` | Customer order APIs are not substitutes. |

## Verified Risks And Open Decisions

- CORS is still inactive in the backend middleware pipeline, blocking normal direct-browser E2E calls.
- Kiosk management metadata is not Fleet telemetry. Robot state, temperature, ingredient levels, heartbeat history, current order, and error telemetry remain unavailable.
- Backend Kiosk lifecycle status and frontend Fleet operational status are separate models and require an explicit adapter.
- Organization management has no approved frontend route in the current TP1 plan.
- Store/Kiosk write actions need product approval before UI implementation.
- Payment Methods have a valid backend contract but no approved dashboard route placement.
- Authentication examples in some backend documentation may use historical paths; frontend must follow current controller routes.
- Customer/runtime/order/webhook APIs must remain outside Admin Dashboard management modules.

## FRONTEND_NEXT_ACTIONS

### P0

- **Backend-owned:** activate the intended CORS policy in the HTTP pipeline.
- **Completed frontend:** map `OrgAdmin -> LOCATION_OWNER` while retaining `LocationOwner -> LOCATION_OWNER`.
- Keep `Staff`, `Technician`, and unknown roles forbidden from the main dashboard.

### P1

- **Completed frontend:** integrate read-only Store and Kiosk metadata into `/kiosks` and `/kiosks/[id]`.
- Preserve the current mock telemetry adapter until a real telemetry API exists.
- Keep backend lifecycle status separate from frontend Fleet operational status.

### P2

- Implement Organization/Store/Kiosk write UIs only after product approval.
- Decide where Payment Methods configuration belongs.
- Wait for management APIs for Inventory, Maintenance, Reports, and Transactions.
