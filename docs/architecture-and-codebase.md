# Architecture and codebase

This document explains how the R4R web app is wired so a new maintainer can navigate the repository confidently.

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, shadcn-style primitives under `components/ui/` |
| Auth & database | Supabase Auth + PostgreSQL (`@supabase/ssr`, `@supabase/supabase-js`) |
| Client state | Redux Toolkit (`lib/redux/`), hydrated in layouts (see below) |
| Server mutations | Next.js **Server Actions** (`"use server"`) in `app/(protected)/actions/` and co-located route modules |
| Payments | Stripe (optional; gated by env — see Billing) |
| Unit tests | Vitest (`tests/`, `npm test`) |

## Top-level layout

```
app/                      # Routes, layouts, route handlers
  (protected)/            # Authenticated shell
    (workspace)/          # Route group: /dashboard and /business/* only
  api/webhooks/stripe/    # Stripe webhook POST handler
  auth/callback/          # OAuth / magic-link exchange
  login/, sign-in/, …     # Auth entry surfaces
components/             # UI: ui/, shared/, and domain folders (kebab-case files)
constants/                # Paths, nav, review UI constants, shared enums
lib/                      # Supabase clients, middleware helper, billing, connections, Redux store
types/                    # `database.ts` (generated shape) and app-level TS types
supabase/migrations/      # Authoritative Postgres schema
supabase/scripts/         # Optional dev-only resets (not migrations)
scripts/                  # Node utilities (e.g. demo auth users)
tests/                    # Vitest specs
```

Canonical path helpers live in `constants/paths.ts` (`Paths`, `businessPath`).

## Request flow: middleware → layout → page

1. **`middleware.ts`** (root) runs on matched paths. It redirects `/` → `/dashboard` and legacy `/businesses/*` → `/dashboard`, then delegates session handling to `lib/supabase/middleware.ts`.

2. **`lib/supabase/middleware.ts`** creates a Supabase server client bound to request cookies, calls `getUser()` to refresh the session, and enforces:
   - Logged-in users hitting auth entry routes (`/login`, `/sign-in/password`, `/forgot-password`, `/new-password`) → redirect to `/dashboard`.
   - Anonymous users on protected routes → redirect to `/login`.
   - Public routes: auth callback, terms, privacy (no session required).

3. **`app/(protected)/layout.tsx`** (outer shell) loads the user and **catalog data** only: `review_statuses` and `platforms`. It wraps the app in **`StoreProvider`** (user + catalogs + empty workspace slices).

4. **`app/(protected)/(workspace)/layout.tsx`** runs only for `/dashboard` and `/business/[id]`. It fetches businesses, metrics, and incoming/outgoing reviews (first page), then **`WorkspaceHydrator`** dispatches them into the existing Redux store.

5. **`/account` and `/billing`** use the outer layout only — they never run the workspace layout, so they do not pay for review list or business list queries at layout time.

## Redux bootstrap

| File | Role |
|------|------|
| `app/(protected)/StoreProvider.tsx` | Creates the store once per client mount; seeds user, platforms, review statuses; initializes empty workspace slices. |
| `app/(protected)/workspace-hydrator.tsx` | Client component; on workspace routes, dispatches businesses, metrics, and reviews into the store. |
| `app/(protected)/(workspace)/layout.tsx` | Server layout that fetches workspace data and renders `WorkspaceHydrator`. |

Review list pagination constants live in `constants/reviews.ts`.

## Server actions and data loading

| Area | Location | Notes |
|------|----------|--------|
| Review workflows | `app/(protected)/actions/` | `incoming-reviews.ts`, `outgoing-reviews.ts`, `catalog.ts`; `review-actions.ts` is a **barrel** (`export *`) without `"use server"`. |
| Businesses (CRUD, fetches) | `app/(protected)/actions/business-actions.ts` | Used by workspace layout and business UI. |
| Metrics (header / hamburger) | `app/(protected)/metrics/actions.ts` | Fetched in workspace layout. |
| Per-business page data | `app/(protected)/(workspace)/business/[id]/actions.ts` | Ownership checks and business-scoped reads. |
| Connection matching | `app/(protected)/(workspace)/business/[id]/connection-actions.ts` | `startConnectionMatch` and related server-only logic. |
| Auth (magic link, OAuth helpers) | `app/actions/auth.ts`, `app/actions/auth-entry.ts` | Used from login / sign-in routes. |

After mutations, actions typically call `revalidatePath` for affected routes (dashboard, business page, etc.). Business workspace review lists additionally use client-side merge/reload behavior with Realtime-assisted updates for new outgoing tasks.

## Components organization

- **`components/ui/`** — Low-level primitives (Radix + Tailwind).
- **`components/shared/`** — Header, footer, logo, cross-route pieces.
- **Domain folders** — `dashboard/`, `business/` (workspace UI + create/manage dialogs), `billing/`, `reviews/`, `account/`, etc. Files use **kebab-case**; exported React components remain **PascalCase**.
- **`components/reviews/`** — Incoming/outgoing review panels and dialogs shared with the business workspace.

## Notable routes (App Router)

| Path | Role |
|------|------|
| `/dashboard` | Business locations grid; `?show=1` opens create-business UX. |
| `/business/[id]` | Single-business workspace (reviews, connection CTA, profile editing). |
| `/account`, `/billing` | Profile/settings and subscription (no workspace layout fetch). |
| `/login`, `/sign-in/password` | Auth entry. |
| `/auth/callback` | Supabase session exchange. |

## Billing (Stripe)

- **Feature flag:** `NEXT_PUBLIC_BILLING_ENABLED` controls UI entry points.
- **Webhook:** `POST /api/webhooks/stripe` — handler: `app/api/webhooks/stripe/route.ts`.

## Connections (domain summary)

See [connections.md](./connections.md). Implementation: `connection-actions.ts`, `lib/connections/complete-connection.ts`, `lib/billing/check-slots.ts`.

## Testing and quality gates

```bash
npm run typecheck
npm run lint
npm test
```

## Types and database shape

- **`types/database.ts`** — Table row types; keep in sync with `supabase/migrations/`.
- **`types/dashboard.ts`**, **`types/shared.ts`** — UI DTOs and API shapes.
