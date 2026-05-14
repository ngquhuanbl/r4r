# Reset database data and load demo fixtures

Use this for **client demos** or **QA on a dev Supabase project**. Do not run destructive scripts against production unless you intend to wipe it.

For full new-project setup (auth providers, callback URLs, SMTP, env mapping), see:
- `docs/supabase-project-setup.md`

## Bootstrap schema (new project)

Apply **`supabase/migrations/`** using the Supabase CLI (`supabase db push`) or run each migration file in timestamp order in the SQL Editor. See [`supabase/README.md`](../supabase/README.md).

Then proceed with reset/seed steps below.

## What gets wiped

| Script | Effect |
|--------|--------|
| [`supabase/scripts/01_reset_app_data.sql`](../supabase/scripts/01_reset_app_data.sql) | Deletes all rows in `reviews`, `review_invitations`, `connections`, `business_platforms`, `business_billing`, `businesses`, `user_preferences`, `user_billing`. **Does not** delete Storage files (hosted Supabase blocks SQL `DELETE` on `storage.objects`); empty buckets via **Dashboard → Storage** or the Storage API if you need a full wipe. **Keeps** `auth.users`, `platforms`, `invitation_statuses`, `review_statuses`. |
| [`supabase/scripts/02_reset_auth_users.sql`](../supabase/scripts/02_reset_auth_users.sql) | Deletes **all** rows in `auth.users` (every login). Run only if you want a completely empty Auth directory. |

## Test accounts (email + password)

Use the Admin API script so passwords are stored correctly (not possible with plain SQL).

1. In Supabase **Settings → API**, copy **Project URL** and the **service_role** key (keep it secret; never ship it to the browser).
2. From the repo root, set env vars and run:

```bash
export NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ...service_role..."
export R4R_DEMO_PASSWORD="YourSharedDemoPassword"
npm run seed:test-users
```

Or with Node 20+: `node --env-file=.env.local scripts/create-test-auth-users.mjs` (put the same variables in `.env.local`).

This creates two confirmed users (see [`scripts/create-test-auth-users.mjs`](../scripts/create-test-auth-users.mjs)):

| Email | Purpose |
|--------|--------|
| `demo-client@r4r-demo.test` | Primary demo account |
| `demo-partner@r4r-demo.test` | Second account (e.g. two-user flows) |

**Sign in:** open **`/sign-in/password`** (linked from `/login` as “Sign in with password”) and use the email + `R4R_DEMO_PASSWORD`.

If a user already exists, the script skips creation and prints “Skipped (exists)”.

**Insecure local only:** `npm run seed:test-users -- --insecure` uses a fixed weak password when `R4R_DEMO_PASSWORD` is unset.

## How to run SQL reset (Supabase hosted)

1. Ensure **migrations** are applied (`supabase db push` or SQL Editor in timestamp order). See [`supabase/README.md`](../supabase/README.md).
2. Open **Project → SQL Editor**.
3. Paste **`01_reset_app_data.sql`** → **Run** (optional on a brand-new DB).
4. Optionally paste **`02_reset_auth_users.sql`** → **Run** (only if you need zero users). If you wipe auth, run **`npm run seed:test-users`** again (or create users in the Dashboard).
5. Create demo businesses in the app (e.g. **Dashboard** → add business), or insert rows manually in the SQL Editor if you maintain a private seed snippet.

## How your client can test (happy path)

1. **Log in** with **`/sign-in/password`** using `demo-client@r4r-demo.test` (or `demo-partner@r4r-demo.test`) and the shared demo password from `R4R_DEMO_PASSWORD`.
2. Open **Dashboard** (`/dashboard`): add businesses or use data from your own seed process.
3. Open **Business** page for a location (`/business/<id>`): check **connection capacity** / slots as applicable.
4. **Connections**: exercise your connection flows against real data created in dev.
5. **Finish profile** / **OAuth**: sign in with a **new** magic-link user to exercise onboarding; use **Google** if enabled in Supabase.

## Local alternative (`supabase` CLI)

If you use the Supabase CLI locally:

```bash
supabase db reset
```

This reapplies **migrations** from scratch (and runs `supabase/seed.sql` if you add one). It does **not** use the manual scripts above unless you wire them into `seed.sql`.

## Safety checklist

- Confirm **project** (dev vs prod) in the Supabase URL before running deletes.
- Export anything important before **`02_reset_auth_users.sql`**.
- After reset, old **Storage** files may still exist in buckets; remove them in **Dashboard → Storage** if you need a clean slate (SQL cannot delete `storage.objects` on hosted Supabase).
