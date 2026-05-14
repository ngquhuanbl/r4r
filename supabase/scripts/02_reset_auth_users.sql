-- =============================================================================
-- OPTIONAL: Remove ALL Supabase Auth users (logins, sessions, identities)
-- =============================================================================
-- Run ONLY after 01_reset_app_data.sql (or ensure no orphan FKs to auth.users).
-- This deletes every account. You will need to sign up / invite users again.
-- =============================================================================
-- Supabase: SQL Editor often runs with sufficient privilege. If this fails,
-- use Dashboard → Authentication → Users → delete users, or Auth Admin API.
-- =============================================================================

BEGIN;

DELETE FROM auth.users;

COMMIT;
