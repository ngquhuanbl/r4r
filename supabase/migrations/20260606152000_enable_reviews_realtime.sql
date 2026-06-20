-- Ensure Realtime receives INSERT/UPDATE/DELETE events from public.reviews.
-- This makes fresh environments deterministic instead of relying on dashboard toggles.
do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'reviews'
    ) then
      alter publication supabase_realtime add table public.reviews;
    end if;
  end if;
end $$;
