# R4R technical documentation

These documents are for **maintainers and operators**: architecture, data, and domain rules. Product marketing copy lives elsewhere.

| Document | Purpose |
|----------|---------|
| [architecture-and-codebase.md](./architecture-and-codebase.md) | How the Next.js app is structured: auth, middleware, layouts, Redux bootstrap, server actions, components, billing hooks, tests. |
| [supabase-and-local-development.md](./supabase-and-local-development.md) | New Supabase projects, Auth URLs, env vars, Stripe webhook URL, destructive SQL scripts, demo users, safety checklist. |
| [connections.md](./connections.md) | Connection matching, slots, lifecycle, and where the logic lives in code; backlog ideas merged from former follow-up notes. |

Schema **source of truth** is always `supabase/migrations/`. Operational SQL helpers are `supabase/scripts/` — see [`../supabase/README.md`](../supabase/README.md).
