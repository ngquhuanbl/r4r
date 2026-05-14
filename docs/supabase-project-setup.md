# Supabase Project Setup (New Environment)

Use this checklist when creating a brand-new Supabase project for local/staging/production.

## 1) Create project and collect keys

From Supabase Dashboard:

- `Settings -> API`
  - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public` key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role` key -> `SUPABASE_SERVICE_ROLE_KEY` (server-only; never expose in browser)

## 2) Apply schema (migrations)

**Preferred:** [Supabase CLI](https://supabase.com/docs/guides/cli) from the repo root:

```bash
supabase link    # once
supabase db push # applies supabase/migrations/*.sql to the linked project
```

**Without CLI:** in **SQL Editor**, run each file under `supabase/migrations/` **in filename (timestamp) order** so dependencies match.

Schema is defined only in `supabase/migrations/` — do not maintain a second “full schema” copy elsewhere.

## 3) Configure Auth URL settings

In `Authentication -> URL Configuration`:

- `Site URL`
  - local: `http://localhost:3000`
  - staging: `https://staging.yourdomain.com`
  - prod: `https://yourdomain.com`
- `Redirect URLs` should include:
  - `<site-url>/auth/callback`
  - local callback when needed: `http://localhost:3000/auth/callback`

Important: your app uses `/auth/callback` in auth actions.

## 4) Enable auth providers

### Email / Magic Link

In `Authentication -> Providers -> Email`:

- Enable Email provider.
- Enable magic link / OTP login flow.
- Keep or disable password signups based on product decision (app still supports password signin at `/sign-in/password` for legacy/demo users).

### Google OAuth

In `Authentication -> Providers -> Google`:

- Enable provider.
- Add Google OAuth Client ID + Secret from Google Cloud Console.
- In Google Cloud OAuth app, redirect URI must be:
  - `https://<your-project-ref>.supabase.co/auth/v1/callback`

### Microsoft OAuth (currently optional)

The app UI currently excludes Microsoft login. If you want it later:

- Configure `Authentication -> Providers -> Azure`
- Add Azure app credentials + callback URI:
  - `https://<your-project-ref>.supabase.co/auth/v1/callback`

## 5) Email templates (Auth emails)

In `Authentication -> Email Templates`:

- Update `Magic Link` template body.
- Update `Reset Password` template body.

Use your branded HTML templates. Keep links based on Supabase template variables (e.g. `{{ .ConfirmationURL }}`).

## 6) Optional custom SMTP + rate limits

For client-facing environments:

- Configure custom SMTP (`Settings -> Auth -> SMTP`) for reliable delivery.
- Review Auth rate limits if testing often triggers `over_email_send_rate_limit`.

## 7) Environment variables in app host (Vercel)

Set in Vercel project env:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (must match deployed origin)
- plus existing app vars (Stripe, Maps, etc.)

Redeploy after env changes.

## 8) Stripe setup (if billing enabled)

If using billing features:

- set Stripe env vars (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs)
- configure webhook endpoint in Stripe:
  - `https://<site-url>/api/stripe/webhook`
- copy signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`

## 9) Seed test data (optional but recommended for staging/demo)

1. Apply schema (section 2) if the project is new.
2. Optionally reset app data: `supabase/scripts/01_reset_app_data.sql`
3. (Optional) wipe all auth users: `supabase/scripts/02_reset_auth_users.sql`
4. Create demo email/password users: `npm run seed:test-users`
5. Add demo businesses via the app (**Dashboard**) or with your own SQL snippet.

For details, see `docs/testing-demo-data.md`.

## 10) Quick verification checklist

- Can sign in via magic link locally and on deployed URL.
- Google sign-in returns to `/auth/callback` on the correct domain.
- `/dashboard` loads with no DB errors.
- Storage uploads work:
  - `business-photos`
  - `user-avatars`
- Account delete flow works (requires `SUPABASE_SERVICE_ROLE_KEY`).

