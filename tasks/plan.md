# Dashboard role access plan

## Scope and assumptions

- The backend commit `f7822d4` is the intended contract. This dashboard is the staff application for `admin`, `operations_manager`, and `story_manager`. `customer` and `businessowner` do not enter staff routes.
- Preserve the current order, payment, and customer workflows and the existing uncommitted dashboard API change. The existing Customers page shows order-derived customer summaries; a new Users section would manage login accounts.
- Backend authorization remains authoritative. Dashboard route and navigation checks improve user experience and limit accidental access, but must not replace API guards.
- Story CRUD belongs in this dashboard because the sibling website redirects `/dashboard/stories` here. The website remains the public story reader.

## Verified backend contract

| Capability                                                              | Admin | Operations manager | Story manager | Evidence                                                  |
| ----------------------------------------------------------------------- | ----- | ------------------ | ------------- | --------------------------------------------------------- |
| Dashboard summary, orders, payments, order actions, customer aggregates | Yes   | Yes                | No            | `src/modules/admin/admin.controller.ts`, `assertAdmin`    |
| Draft story reads; story upload, create, edit, publish, delete          | Yes   | No                 | Yes           | `src/modules/content/content.controller.ts`, story guards |
| User list, create, role/status edit, password set, delete               | Yes   | No                 | No            | `src/modules/user/user.controller.ts`                     |
| Pricing presets, carriers, contact inquiries, projects, QuickBooks      | Yes   | No                 | No            | Their respective controllers retain admin checks          |
| Own profile                                                             | Yes   | Yes                | Yes           | `GET/PATCH /user/me`                                      |

Roles are lower case: `admin`, `operations_manager`, `story_manager`, `customer`, `businessowner`. Login returns `data.user.role` with access and refresh tokens. The refresh response returns tokens and expiry, but no role. Normal API responses use `{statusCode,message,data}`. Story responses use a separate `{success,data,pagination?}` shape.

## Implementation order

### 0. Close authorization gaps before enabling user administration

1. Backend: when admin password reset, soft delete, role change, or status change affects access, invalidate the cached `token_version:<userId>` and revoke or rotate outstanding credentials as appropriate. The newly added password reset and soft delete methods increment the database version but do not clear the one-hour Redis cache read by `AuthGuard`; generic role edits also leave the token role stale. Verify demotion and deactivation with an already issued token.
2. Backend: apply the existing `AuthUtilsService.validatePassword` policy to admin-created and admin-reset passwords. Their new DTOs enforce only eight characters, while public registration and recovery enforce the stronger service policy.
3. Dashboard: remove the `jwt` callback's client-provided `session.user` spread into the trusted token. Define one validated role type and role-to-capability mapping, shared by proxy and navigation. Unknown or missing roles fail closed.
4. Decide and test session behavior after staff role changes. Recommended: invalidate current backend tokens and require sign-in again; after a refresh, obtain the current role from the existing `/user/me` endpoint before updating dashboard session state. A manager must not keep a stale admin navigation state.
5. Verify the deployed story URL before wiring requests. `main.ts` sets a global `api/v1` prefix while `StoriesController` includes `api/v1` in its controller path; controller tests do not bootstrap with the global prefix. Confirm the actual HTTP route and fix the backend path if needed.

### 1. Make staff entry and navigation role aware

1. Update `src/proxy.ts` so admin and operations manager can open operations routes, admin and story manager can open story routes, and only admin can open user administration. Redirect each staff role to an allowed landing page. Denied deep links should show a clear access-denied state or redirect to that role's landing page without a loop.
2. Filter the `DashboardShell` navigation using the same capability map. Keep direct route protection independent of the menu. Make logout call `signOut`; the current link to `/` leaves the session active.
3. Adjust the login success destination by role. The current public signup creates a `customer` account that is rejected by the staff proxy; remove signup from the staff entry or route those users to the existing customer experience after confirming the intended product flow.
4. Keep the mobile navigation keyboard reachable and functional when adding Stories and Users; the current menu button has no action.

### 2. Complete the operations manager path

1. Allow operations manager access to the existing overview, orders, order details, payments, customers, and customer details pages. Keep all current order actions available because the backend `admin` controller authorizes that role for each of them.
2. Keep admin-only features (pricing, carriers, contacts, projects, QuickBooks, user administration) out of operations navigation and route access. The current Settings page is a placeholder and can remain an own-account destination until a concrete settings feature exists.
3. Present distinct loading, empty, retryable error, 401, and 403 states. Preserve the user's pending dashboard API edit for the balance-due endpoint.

### 3. Add story manager workflow

1. Add `/dashboard/stories` as the story manager landing page with a list of all stories, draft/published state, search/filter, pagination, and create/edit entry points. This route is currently absent, although the sibling site redirects to it.
2. Add typed story API functions and TanStack Query hooks using the verified story response shape. Use the existing shared Axios client and bearer token. Do not use the admin envelope unwrapping helper for story endpoints.
3. Build a form around the backend's required title, slug, meta description, content, locations, shipment type, and service line. Support optional status, image, alt text, FAQs, and publish status. Respect the 10 MiB image limit and accepted MIME types. Confirm before delete; expose publish/unpublish state and server validation errors.
4. Verify a story manager can view drafts and mutate stories, while operations managers cannot; admin can do both story and operations work.

### 4. Add admin user administration

1. Add `/dashboard/users` with an account list and detail/edit flow. Label it Users or Staff Accounts so it is not confused with the existing order-derived Customers section. The current backend `GET /user` returns all users without pagination; use a simple list initially or add server pagination before large-scale use.
2. Add admin create/edit forms using the existing backend DTO values and roles. Keep account status explicit; show a warning before role demotion or deactivation. Handle 409 duplicate email, validation errors, and forbidden responses.
3. Add separate set-password and soft-delete actions with explicit confirmation. Do not expose permanent delete until a product need and retention policy are agreed; the endpoint supports it, but a reversible default is safer. Never echo or log a password in the client.
4. Refresh list and detail query data after mutations. After changing the current account's role/status, end or refresh its session according to phase 0.

## Verification and checkpoints

- Contract tests for every role against direct API calls and dashboard deep links: admin, operations manager, story manager, customer, business owner, guest, and unknown role. Confirm 401 and 403 are handled differently.
- Security regression: active tokens after role demotion, password reset, soft delete, and status change; client-triggered session update cannot grant a role; denied roles cannot fetch protected data by bypassing navigation.
- Feature checks: operations order action, draft story read and publish, admin user create/edit/reset/soft-delete, validation and error states, mobile menu, keyboard focus, and screen-reader announcement of errors.
- Run dashboard `npm run type-check`, `npm run lint`, focused Jest tests, and `npm run build`. Run backend focused guard/user/content tests and build for any backend fix. Test with a live backend using disposable accounts before claiming runtime completion.

## Open decisions

1. Should the staff login offer public customer signup, or send customer registration to the customer site? Recommendation: remove it from the staff login.
2. Should user administration initially manage all account types or only staff roles? The backend list currently returns all account types.
3. Does story editing need rich text or the existing plain `content` field? Confirm against the current content expectations before choosing an editor.

Implementation status is tracked in [todo.md](todo.md). Live disposable-account verification remains open.
