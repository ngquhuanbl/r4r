# Supabase (this repo)

## Schema (source of truth)

**Canonical bootstrap:** [`../schema.sql`](../schema.sql) is the full up-to-date schema snapshot for fresh environments (tables, indexes, constraints, functions/triggers, and security model expected by the app).

`migrations/` is kept for **history/audit** and rollout traceability.

With the [Supabase CLI](https://supabase.com/docs/guides/cli), you can still apply migrations in tracked environments:

```bash
supabase link   # once, to your project
supabase db push
```

For a **new empty project**, run `schema.sql` first (SQL Editor or scripted apply). Migrations are optional for bootstrap but should remain in sync with snapshot changes for history.

Schema update rule for PRs:

- if a migration changes schema/security, update `schema.sql` in the same PR
- update `types/database.ts` to match the snapshot

## Pre-launch full reset / rebuild

Use this when you intentionally want a clean slate before launch:

1. Run [`scripts/02_reset_auth_users.sql`](./scripts/02_reset_auth_users.sql) (optional; removes all auth users).
2. Run [`scripts/01_reset_app_data.sql`](./scripts/01_reset_app_data.sql) (clears public app data).
3. Re-apply baseline + migrations:

```bash
supabase db push
```

4. Re-seed demo users if needed (`npm run seed:test-users`).
5. Recreate any demo businesses/platform links via app flows or SQL.

## Dev / demo helpers (optional)

In [`scripts/`](./scripts/):

| File | Use |
|------|-----|
| [`01_reset_app_data.sql`](./scripts/01_reset_app_data.sql) | Truncate app tables; keeps auth users and lookup rows. **Dev/demo only.** |
| [`02_reset_auth_users.sql`](./scripts/02_reset_auth_users.sql) | Deletes **all** `auth.users`. Run only when you intend a completely empty Auth directory. |

See [`docs/supabase-and-local-development.md`](../docs/supabase-and-local-development.md) and the maintainer index [`docs/README.md`](../docs/README.md).
