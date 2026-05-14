# Redux SSR bootstrap

The protected app shell ([`app/(protected)/layout.tsx`](../app/(protected)/layout.tsx)) hydrates the client Redux store with server-fetched data so the header, onboarding tour, and dashboard widgets share one source of truth.

## What is always loaded

For every authenticated route under `(protected)`:

- `myBusinesses`, `reviewStatuses`, `platforms`, and `metrics` (header switcher, filters, hamburger stats).

## What is skipped on account-style routes

For `/account` and `/billing` (and their subpaths), the layout **does not** fetch incoming reviews, outgoing reviews, or pending review requests. The store is seeded with empty lists so components that read those slices still mount safely. Navigating back to the dashboard triggers a full layout run on the next request, which repopulates those slices.

The current pathname is supplied by middleware via the `x-next-pathname` request header (see [`lib/supabase/middleware.ts`](../lib/supabase/middleware.ts)).

## Future improvements

- Use React `cache()` around individual fetch helpers if the same query runs from both layout and a page in one request.
- Consider route-group–scoped layouts if some subtrees should avoid loading businesses or metrics.
