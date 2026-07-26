# AGENTS.md

## Purpose

This file defines the engineering rules Codex must follow when working in this repository.

The project architecture is based on:

`https://github.com/fsdteam8/website_template.git`

The local repository is the primary source of truth. Always inspect the existing code before making changes.

The goal is to preserve a consistent, scalable, and maintainable Next.js architecture.

---

## 1. Before Writing Code

Before implementing any feature, bug fix, or refactor:

1. Read this file.
2. Inspect `package.json` and the existing project configuration.
3. Review the relevant files and folders.
4. Search for similar implementations already present.
5. Reuse existing patterns, components, hooks, utilities, and types.
6. Provide a brief implementation plan for any substantial change.

Do not start by creating new abstractions before understanding the current architecture.

When available, use the following as the primary reference:

```text
src/features/sample-feature
```

Follow its structure and conventions, but adapt them to the current requirements instead of copying them mechanically.

---

## 2. General Engineering Rules

- Preserve the existing architecture.
- Make the smallest coherent change required.
- Do not refactor unrelated code.
- Do not rename or move unrelated files.
- Do not replace established patterns with personal preferences.
- Do not add dependencies unless the existing stack cannot reasonably solve the problem.
- Do not duplicate functionality already available in the repository.
- Do not overwrite existing user changes.
- Do not use temporary placeholder logic while claiming the feature is complete.
- Do not claim a command or test passed unless it was actually executed.

If requirements conflict with the current architecture, explain the conflict and choose the least disruptive solution.

---

## 3. Technology Stack

Use the libraries and versions already defined in `package.json`.

The expected stack includes:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Shadcn UI
- Radix UI
- Axios
- TanStack Query
- React Hook Form
- Zod
- Zustand
- NextAuth or Auth.js
- Jest
- React Testing Library
- ESLint
- Prettier

Do not introduce alternative libraries when the current stack already supports the requirement.

Examples:

- Do not add Redux when Zustand is already used.
- Do not add Formik when React Hook Form is already used.
- Do not add Yup when Zod is already used.
- Do not add another HTTP client when Axios is configured.
- Do not add another server-state library when TanStack Query is available.
- Do not add another styling system when Tailwind CSS is established.

Use the package manager indicated by the existing lockfile.

Do not create a second lockfile.

---

## 4. Project Structure

Follow the existing project structure.

Expected structure:

```text
src/
├── app/
├── Providers/
├── components/
│   ├── ui/
│   └── shared/
├── features/
├── hooks/
├── lib/
├── store/
├── types/
├── tests/
└── proxy.ts
```

### `src/app`

Use for:

- Pages
- Layouts
- Route groups
- Loading states
- Error boundaries
- Route handlers
- Metadata
- Route composition

Keep route files thin.

Do not place complex business logic directly inside `page.tsx`, `layout.tsx`, or route handlers.

### `src/features`

Use for business-domain features.

Each feature should own its:

- API functions
- Components
- Hooks
- Schemas
- Types
- Constants
- Utilities
- Feature-specific client state

### `src/components/ui`

Use for generic UI primitives such as:

- Buttons
- Inputs
- Dialogs
- Tables
- Selects
- Tabs
- Tooltips
- Skeletons

Do not place business logic in generic UI components.

### `src/components/shared`

Use for reusable application-level components shared across multiple features.

Do not place feature-specific components here.

### `src/hooks`

Use for generic hooks shared across multiple features.

Feature-specific hooks must remain inside their feature folder.

### `src/lib`

Use for shared infrastructure such as:

- Axios client
- Query client
- Authentication configuration
- Environment helpers
- Shared utilities
- Logging
- Permission helpers

### `src/store`

Use only for shared client-side Zustand stores.

Do not use Zustand for server state.

### `src/types`

Use only for genuinely global types.

Feature-specific types should remain inside the feature directory.

---

## 5. Feature Architecture

Business features should normally follow this structure:

```text
src/features/<feature-name>/
├── api/
├── components/
├── hooks/
├── schemas/
├── utils/
├── constants/
├── types.ts
└── index.ts
```

Only create folders that are actually needed.

Example:

```text
src/features/customer/
├── api/
│   └── customer.api.ts
├── components/
│   ├── customer-form.tsx
│   └── customer-list.tsx
├── hooks/
│   ├── use-customers.ts
│   └── use-customer-mutations.ts
├── schemas/
│   └── customer.schema.ts
├── types.ts
└── index.ts
```

### Feature rules

- Keep feature-specific logic inside the feature directory.
- Do not place feature-specific components in `components/shared`.
- Do not place generic UI components inside a feature.
- Avoid deep imports into another feature’s internal files.
- Expose stable feature functionality through `index.ts` when appropriate.
- Avoid circular dependencies.
- Extract shared logic only when it is genuinely reusable across features.

---

## 6. Next.js and React Rules

### Server Components

Use Server Components by default.

Add `"use client"` only when the component requires:

- React state
- React effects
- Event handlers
- Browser APIs
- Client-side context
- TanStack Query hooks
- Interactive form behavior

Keep client boundaries as small as possible.

Do not convert an entire page or layout into a client component when only one section requires client-side behavior.

### Pages and layouts

Page files should mainly handle:

- Route composition
- Parameters
- Search parameters
- Authorization checks
- Metadata
- Server-side data loading
- Rendering feature components

Layouts should mainly handle shared structure, navigation, providers, and route-level authorization.

### Navigation

Use Next.js navigation APIs:

- `Link`
- `redirect`
- `notFound`
- `useRouter`
- `usePathname`
- `useSearchParams`

Avoid `window.location` unless a full browser navigation is intentionally required.

### Images

Use `next/image` where appropriate.

Always provide correct dimensions, responsive sizing, and meaningful alt text.

---

## 7. Components

Components should be:

- Focused
- Typed
- Accessible
- Reusable where appropriate
- Easy to understand
- Free from unnecessary side effects

Before creating a new component:

1. Search `src/components/ui`.
2. Search `src/components/shared`.
3. Search similar features.
4. Reuse or extend an existing component when practical.

Keep page components focused on composition.

Move business logic into feature hooks, API modules, schemas, or utilities.

Avoid overly large components that handle data fetching, validation, transformation, state, and rendering all in one file.

Do not split simple components into unnecessary abstractions.

---

## 8. TypeScript Rules

TypeScript must remain strict.

- Avoid `any`.
- Prefer `unknown` with proper narrowing.
- Define explicit API request and response types.
- Avoid unsafe type assertions.
- Avoid unnecessary non-null assertions.
- Reuse shared domain types.
- Infer form types from Zod schemas when practical.
- Use configured path aliases.
- Handle nullable and optional values explicitly.

Avoid:

```ts
const response: any = await api.get("/customers");
```

Prefer:

```ts
const response = await api.get<CustomerListResponse>("/customers");
```

Do not silence TypeScript errors by broadly adding `any` or disabling checks.

---

## 9. API Layer

Use the shared API client, commonly located at:

```text
src/lib/api.ts
```

Do not create Axios instances inside components or feature hooks unless the project requires a separate backend or authentication strategy.

Feature API functions belong in:

```text
src/features/<feature-name>/api/
```

API functions must:

- Accept typed parameters
- Return typed responses
- Use the shared API client
- Remain independent of React
- Contain no component state
- Contain no toast or UI logic
- Follow the existing error-handling pattern

Example:

```ts
import { api } from "@/lib/api";
import type { CustomerListParams, CustomerListResponse } from "../types";

export async function getCustomers(
  params: CustomerListParams,
): Promise<CustomerListResponse> {
  const response = await api.get<CustomerListResponse>("/customers", {
    params,
  });

  return response.data;
}
```

Do not catch an error only to throw it again.

Only catch errors when adding useful context, normalizing provider errors, or handling a known recoverable condition.

---

## 10. TanStack Query

Use TanStack Query for server state.

Server state includes:

- Remote API data
- Pagination results
- Search results
- Cached backend responses
- Mutations

Do not duplicate server data in Zustand.

Feature query and mutation hooks belong in:

```text
src/features/<feature-name>/hooks/
```

### Query keys

Use consistent query-key factories.

Example:

```ts
export const customerQueryKeys = {
  all: ["customers"] as const,
  lists: () => [...customerQueryKeys.all, "list"] as const,
  list: (params: CustomerListParams) =>
    [...customerQueryKeys.lists(), params] as const,
  details: () => [...customerQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...customerQueryKeys.details(), id] as const,
};
```

Do not scatter raw query-key arrays across the codebase.

### Query rules

- Query hooks should call feature API functions.
- Do not call Axios directly inside components.
- Do not use `useEffect` for normal API fetching when TanStack Query is appropriate.
- Handle loading, empty, error, and success states.
- Distinguish initial loading from background fetching.

### Mutation rules

- Use feature API functions.
- Invalidate only relevant queries.
- Update cache directly when appropriate.
- Avoid invalidating the entire application cache.
- Prevent duplicate submissions while mutations are pending.
- Keep toast logic at the UI or feature-hook level, not inside API modules.

---

## 11. State Management

Use the correct state owner:

- Server state: TanStack Query
- Form state: React Hook Form
- Shareable state: URL search parameters
- Shared client-only state: Zustand
- Local component state: React state
- Server-derived state: Server Components where appropriate

Use Zustand only for shared client-side state such as:

- UI preferences
- Temporary multi-step flows
- Shared modal state
- Client-only selections

Do not use Zustand for:

- API response caching
- Form fields
- Simple local toggles
- Values that should exist in the URL
- Data already managed by TanStack Query

---

## 12. Forms and Validation

Use React Hook Form with Zod.

Feature schemas belong in:

```text
src/features/<feature-name>/schemas/
```

Infer form types from Zod schemas when practical.

Example:

```ts
export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
```

Forms must handle:

- Default values
- Field errors
- Server errors
- Pending submission
- Disabled state
- Successful submission
- Reset behavior when appropriate
- Accessible labels

Do not duplicate validation rules across JSX, submit handlers, and schemas.

Zod should be the primary client-side validation source.

Backend validation remains authoritative.

---

## 13. Styling

Use Tailwind CSS and the existing design system.

- Reuse existing design tokens.
- Reuse the project’s `cn` utility.
- Reuse existing Shadcn components.
- Preserve responsive behavior.
- Support hover, focus, active, disabled, loading, and error states.
- Avoid unnecessary inline styles.
- Avoid arbitrary values when an existing token is suitable.
- Do not introduce CSS-in-JS or another styling framework.

Do not heavily modify generic Shadcn primitives for feature-specific requirements.

Prefer feature-level wrappers or composition.

Every user-facing layout should be reviewed for mobile, tablet, desktop, overflow, long text, loading, empty, and error states.

---

## 14. Accessibility

Use semantic HTML and accessible interaction patterns.

Required practices:

- Use `<button>` for actions.
- Use `<Link>` or `<a>` for navigation.
- Add labels to form controls.
- Add accessible names to icon-only buttons.
- Preserve visible keyboard focus.
- Use a logical heading hierarchy.
- Ensure dialogs and menus manage focus correctly.
- Provide meaningful image alt text.
- Do not communicate status through color alone.

Avoid clickable `<div>` elements when a native interactive element is appropriate.

---

## 15. Authentication and Security

Follow the existing authentication and authorization patterns.

Do not replace the authentication system unless explicitly requested.

- Protect sensitive routes on the server when possible.
- Do not rely on hidden buttons as the only authorization check.
- Verify permissions before protected actions.
- Do not expose restricted data before client-side checks complete.
- Do not log tokens, credentials, or secrets.
- Do not expose server secrets through `NEXT_PUBLIC_`.
- Treat form data, URL parameters, API payloads, and uploads as untrusted input.
- Avoid `dangerouslySetInnerHTML` unless the content is trusted or sanitized.

Never commit:

- API keys
- Access tokens
- Database credentials
- Private keys
- Session secrets
- OAuth secrets
- SMTP credentials

---

## 16. Loading, Empty, and Error States

Every data-driven view must consider:

- Initial loading
- Background fetching
- Empty results
- Error state
- Success state

Use existing skeleton, empty-state, and error-state components where available.

Do not leave users with blank screens.

Error messages must be understandable and must not expose stack traces, database errors, internal paths, or provider internals.

Provide retry actions when recovery is possible.

---

## 17. URL State

Use URL search parameters for state that should be:

- Shareable
- Bookmarkable
- Preserved after refresh
- Restored during navigation

Examples:

- Search
- Pagination
- Sorting
- Filters
- Date ranges
- Meaningful active tabs

Validate and normalize search parameters before using them.

Reset pagination when search or filters change.

---

## 18. Imports and Naming

Use configured path aliases.

Prefer:

```ts
import { Button } from "@/components/ui/button";
```

Avoid long relative paths.

Naming conventions:

- Files and folders: kebab-case
- React components: PascalCase
- Hooks: camelCase beginning with `use`
- Types and interfaces: PascalCase
- Variables and functions: camelCase
- True constants: UPPER_SNAKE_CASE

Use descriptive domain-specific names.

Avoid vague names such as `thing`, `temp`, `value`, or `data` when a clearer name is available.

---

## 19. Testing

Add or update tests when changing important behavior.

Prioritize tests for:

- Business logic
- Validation
- Data transformation
- Query-key factories
- Hooks
- Forms
- Permissions
- Error handling
- Regression-prone behavior

Use React Testing Library for user-facing behavior.

Test what the user sees and does rather than internal implementation details.

Do not remove or weaken tests just to make them pass.

---

## 20. Performance

Avoid obvious performance problems without adding unnecessary complexity.

- Avoid unnecessary client components.
- Avoid duplicate API requests.
- Use TanStack Query caching correctly.
- Avoid large dependencies for small tasks.
- Optimize images.
- Lazy-load heavy client components when appropriate.
- Avoid expensive calculations directly inside render.
- Do not add `useMemo`, `useCallback`, or `React.memo` automatically.

Use memoization only when there is a clear benefit.

---

## 21. Code Quality

Before considering the task complete:

- Remove unused imports.
- Remove unused variables.
- Remove dead code.
- Remove temporary comments.
- Remove debugging logs.
- Review the final diff.
- Confirm that only relevant files changed.
- Keep functions and components focused.
- Document non-obvious decisions only where necessary.

Do not leave `console.log`, `console.debug`, or `debugger` statements in production code.

---

## 22. Validation Commands

Inspect `package.json` before running commands.

Use the project’s existing scripts and package manager.

Relevant checks may include:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Or:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Run the production build when changes affect:

- Routing
- Authentication
- Middleware
- Providers
- Server and client component boundaries
- Environment variables
- Next.js configuration
- Build-time rendering
- Integration across multiple modules

If a check fails:

1. Investigate the failure.
2. Fix failures caused by the current implementation.
3. Report unrelated pre-existing failures separately.
4. Do not hide or suppress the failure.
5. Do not claim validation succeeded.

---

## 23. Final Response Format

At the end of an implementation task, provide:

### Changed

Describe what was implemented or fixed.

### Files

List the important files created or modified.

### Architecture

Explain any important architectural decision.

### Validation

Report the exact commands executed and their results.

Example:

```text
- pnpm lint: passed
- pnpm typecheck: passed
- pnpm test: passed
- pnpm build: passed
```

### Remaining Items

Mention any:

- Required environment variables
- Backend dependencies
- Manual verification steps
- Known limitations
- Unresolved risks
- Migration requirements

Do not state that the task is fully complete when unresolved issues remain.

---

## 24. Definition of Done

A task is complete only when:

1. The requested behavior is implemented.
2. The existing architecture is preserved.
3. Type safety is maintained.
4. Relevant loading, empty, and error states are handled.
5. Security and authorization requirements are respected.
6. The UI is responsive and accessible where applicable.
7. Relevant tests are added or updated.
8. Available validation checks are run.
9. Failures are resolved or accurately reported.
10. The final diff is limited to the requested work.
11. Any remaining risks or configuration requirements are clearly disclosed.
