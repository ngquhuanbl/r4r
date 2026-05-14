-- =============================================================================
-- Reset all APPLICATION data (public schema)
-- Keeps: auth.users (logins), platforms, invitation_statuses, review_statuses
-- =============================================================================
-- Run in Supabase: SQL Editor (Dashboard) or psql.
-- Use a DEVELOPMENT project only unless you intend to wipe production.
--
-- Storage: direct DELETE FROM storage.objects is blocked on hosted Supabase
-- (storage.protect_delete). To remove uploaded files, use either:
--   • Dashboard → Storage → open bucket → select all → Delete, or
--   • Storage API / supabase-js .storage.from(...).remove(...) with service role.
-- DB rows in public.* that pointed at public URLs will be gone after TRUNCATE;
-- orphaned files in buckets can be cleaned up manually as above.
-- =============================================================================

BEGIN;

TRUNCATE TABLE
  public.reviews,
  public.review_invitations,
  public.connections,
  public.business_platforms,
  public.business_billing,
  public.businesses,
  public.user_preferences,
  public.user_billing
RESTART IDENTITY CASCADE;

COMMIT;

-- Verify (optional):
-- SELECT 'businesses' AS t, count(*) FROM public.businesses
-- UNION ALL SELECT 'reviews', count(*) FROM public.reviews;
