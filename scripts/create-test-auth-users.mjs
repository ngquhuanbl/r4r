/**
 * Create email/password test users via Supabase Admin API (auth.admin.createUser).
 *
 * Passwords cannot be set safely with raw SQL; use this script or Dashboard → Auth → Users.
 *
 * Usage (from repo root):
 *   export NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
 *   export SUPABASE_SERVICE_ROLE_KEY="eyJ..."   # Settings → API → service_role (secret)
 *   export R4R_DEMO_PASSWORD="Choose-a-strong-password"
 *   node scripts/create-test-auth-users.mjs
 *
 * Or with Node 20+:
 *   node --env-file=.env.local scripts/create-test-auth-users.mjs
 *
 * Dev only: if R4R_DEMO_PASSWORD is unset, pass --insecure to use a known weak password (printed to console).
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let password = process.env.R4R_DEMO_PASSWORD;
if (!password && process.argv.includes("--insecure")) {
  password = "R4R-Demo-Local-Only!";
  console.warn(
    "\n⚠️  Using --insecure default password. Set R4R_DEMO_PASSWORD for anything shared.\n",
  );
}

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

if (!password) {
  console.error(
    "Set R4R_DEMO_PASSWORD, or run with --insecure for local dev only.",
  );
  process.exit(1);
}

/** Shared password for all demo accounts (rotate via env). */
const TEST_ACCOUNTS = [
  {
    email: "demo-client@r4r-demo.test",
    display_name: "Demo Client",
  },
  {
    email: "demo-partner@r4r-demo.test",
    display_name: "Demo Partner",
  },
];

const supabase = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log("Creating test users (email confirmed, password sign-in enabled)…\n");

  for (const { email, display_name } of TEST_ACCOUNTS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name,
        profile_completed: true,
      },
    });

    if (error) {
      if (
        String(error.message).toLowerCase().includes("already") ||
        String(error.message).toLowerCase().includes("registered")
      ) {
        console.log(`• Skipped (exists): ${email}`);
        continue;
      }
      console.error(`• Failed: ${email}`, error.message);
      continue;
    }

    console.log(`• Created: ${email}`);
    console.log(`  User id: ${data.user.id}`);
  }

  console.log(`
Done. Sign in at: /sign-in/password
  Emails: ${TEST_ACCOUNTS.map((a) => a.email).join(", ")}
  Password: (value of R4R_DEMO_PASSWORD${process.argv.includes("--insecure") ? " or --insecure default" : ""})

Add demo businesses from the app (Dashboard) or your own SQL seed.
`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
