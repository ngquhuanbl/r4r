# Supabase and local development

Checklist for **new Supabase projects**, **local/staging env**, **Auth configuration**, and **demo data** (destructive SQL and test users).

For **application architecture** (layouts, middleware, Redux), see [architecture-and-codebase.md](./architecture-and-codebase.md).

---

## 1. Create project and collect keys

In Supabase Dashboard → **Settings → API**:

| Dashboard field | App env var |
|-----------------|-------------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` key | `SUPABASE_SERVICE_ROLE_KEY` (server-only; never expose to the browser) |

The service role is required for privileged flows (e.g. account deletion, admin-style scripts). Never ship it in client bundles.

---

## 2. Schema (canonical snapshot)

**Source of truth for fresh setup:** [`../schema.sql`](../schema.sql) (full up-to-date snapshot).

**With Supabase CLI** (from repo root), use this only to apply migrations to an existing environment where you explicitly want that history replay:

```bash
supabase link    # once, to the target project
supabase db push # applies migrations in order
```

`schema.sql` is the canonical bootstrap for an empty database. `supabase/migrations/*.sql` is retained for history/audit.

**Without CLI:** run `schema.sql` in SQL Editor for fresh setup.

More context: [`supabase/README.md`](../supabase/README.md).

---

## 3. Auth URL configuration

**Authentication → URL Configuration**

- **Site URL:** e.g. `http://localhost:3000` (local), your staging URL, or production origin.
- **Redirect URLs** must include the app callback:
  - `{site-url}/auth/callback`  
  Example: `http://localhost:3000/auth/callback`

The app exchanges OAuth and magic-link redirects at **`app/auth/callback`**.

---

## 4. Auth providers

### Email / magic link

**Authentication → Providers → Email** — enable as needed. The app supports magic-link flows from `/login` and related entry routes.

### Password sign-in

`/sign-in/password` exists for demos or legacy-style accounts. Enable or disable password signups in Supabase according to product policy.

### Google OAuth

**Authentication → Providers → Google** — enable and add OAuth client ID/secret. In Google Cloud Console, the authorized redirect URI must include:

`https://<project-ref>.supabase.co/auth/v1/callback`

### Microsoft / Azure

Not exposed in the current UI; add later via Supabase Azure provider if required.

---

## 5. Email templates

**Authentication → Email Templates** — customize Magic link and Reset password bodies. Use Supabase template variables (e.g. `{{ .ConfirmationURL }}`) so links stay correct.

For production-like environments, configure **custom SMTP** under **Settings → Auth → SMTP** and review rate limits if you hit `over_email_send_rate_limit` during testing.

---

## 6. Environment variables (hosting)

Typical Vercel (or other) deployment expects at least:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (must match the deployed origin for absolute links and OAuth)

Plus optional: Stripe, Google Maps, billing flags — see [architecture-and-codebase.md](./architecture-and-codebase.md) billing section.

Redeploy after changing secrets.

---

## 7. Stripe (if billing is used)

- Env: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, and any price IDs your checkout code expects.
- **Webhook endpoint in Stripe dashboard:**  
  `https://<your-deployed-origin>/api/webhooks/stripe`  
  Handler implementation: `app/api/webhooks/stripe/route.ts`.

---

## 8. Storage buckets

After schema is applied, confirm buckets used by the app exist and policies allow authenticated uploads (e.g. business photos, user avatars). If migrations create buckets, verify in Dashboard.

---

## 9. Destructive reset scripts (dev / demo only)

Located in `supabase/scripts/`. **Never run against production** unless you intend to wipe data.

| Script | Effect |
|--------|--------|
| `01_reset_app_data.sql` | Deletes app rows (reviews, connections, businesses, billing prefs, etc.). Keeps `auth.users` and lookup tables like `platforms`, `review_statuses`. **Does not** delete hosted `storage.objects` via SQL in many Supabase plans — clean buckets in Dashboard if needed. |
| `02_reset_auth_users.sql` | Deletes **all** `auth.users`. Use only when you want an empty Auth directory. |

**Typical hosted workflow:** SQL Editor → paste script → Run. Re-seed auth users afterward if needed.

---

## 10. Demo / test Auth users (email + password)

Password hashes cannot be set safely with hand-written SQL; use the Admin API script.

1. Copy **Project URL** and **service_role** key from Supabase (Settings → API).
2. From repo root:

```bash
export NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ...service_role..."
export R4R_DEMO_PASSWORD="YourSharedDemoPassword"
npm run seed:test-users
```

Or with Node 20+: `node --env-file=.env.local scripts/create-test-auth-users.mjs` with the same variables in `.env.local`.

Default emails are defined in `scripts/create-test-auth-users.mjs` (e.g. `demo-client@r4r-demo.test`, `demo-partner@r4r-demo.test`). Existing users are skipped.

**Sign in:** `/sign-in/password` (linked from `/login`).

**Insecure local shortcut:** `npm run seed:test-users -- --insecure` uses a fixed weak password when `R4R_DEMO_PASSWORD` is unset.

---

## 11. Supabase CLI local reset

```bash
supabase db reset
```

Reapplies migrations from scratch and runs `supabase/seed.sql` **if present**. It does **not** automatically run `supabase/scripts/*.sql` unless you wire them into seed.

## 12. Pre-launch full reset (clean slate)

Since this product has not launched yet, use this when you intentionally want to rebuild the environment:

1. Optional: wipe auth users with `supabase/scripts/02_reset_auth_users.sql`.
2. Wipe app data with `supabase/scripts/01_reset_app_data.sql`.
3. Re-apply canonical schema snapshot by running [`../schema.sql`](../schema.sql) in SQL Editor.

4. Seed demo users via `npm run seed:test-users` if needed.
5. Recreate test businesses and platform links.

---

## 13. Verification checklist (new environment)

- Magic link and/or Google sign-in completes and lands on `/dashboard` (or intended post-auth route).
- `/auth/callback` is on Supabase redirect allowlist.
- `/dashboard` loads without Postgres/RLS errors for a test user.
- Storage uploads succeed for configured buckets.
- Account deletion (if used) works with `SUPABASE_SERVICE_ROLE_KEY` on the server.

---

## Safety reminders

- Double-check the Supabase **project ref** in the URL before running destructive SQL.
- Export anything important before `02_reset_auth_users.sql`.
- After app-data reset, orphaned **Storage** objects may remain until removed in Dashboard.
