# Supabase (this repo)

## Schema (source of truth)

Versioned SQL lives in [`migrations/`](./migrations/). Apply it using the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link   # once, to your project
supabase db push
```

For a **new empty project** without the CLI, open each file in `migrations/` in timestamp order in the SQL Editor and run them (or paste a single concatenated run—same end state as `db push`).

Do **not** duplicate schema in ad-hoc “full dump” scripts; that drifts from migrations.

## Dev / demo helpers (optional)

In [`scripts/`](./scripts/):

| File | Use |
|------|-----|
| [`01_reset_app_data.sql`](./scripts/01_reset_app_data.sql) | Truncate app tables; keeps auth users and lookup rows. **Dev/demo only.** |
| [`02_reset_auth_users.sql`](./scripts/02_reset_auth_users.sql) | Deletes **all** `auth.users`. Run only when you intend a completely empty Auth directory. |

See [`docs/supabase-and-local-development.md`](../docs/supabase-and-local-development.md) and the maintainer index [`docs/README.md`](../docs/README.md).
