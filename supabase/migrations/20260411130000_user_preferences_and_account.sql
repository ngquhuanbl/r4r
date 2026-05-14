-- Notification / account preferences (RLS: own row only)
create table if not exists public.user_preferences (
  user_id uuid not null primary key references auth.users (id) on delete cascade,
  notify_new_connection boolean not null default true,
  notify_weekly_summary boolean not null default false,
  updated_at timestamptz not null default now()
);

comment on table public.user_preferences is 'Per-user product preferences (email toggles, etc.)';

alter table public.user_preferences enable row level security;

create policy "Users select own preferences"
  on public.user_preferences for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own preferences"
  on public.user_preferences for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own preferences"
  on public.user_preferences for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Avatar uploads (same pattern as business-photos)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-avatars',
  'user-avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "User avatars public read" on storage.objects;
drop policy if exists "Users insert own avatar folder" on storage.objects;
drop policy if exists "Users update own avatar folder" on storage.objects;
drop policy if exists "Users delete own avatar folder" on storage.objects;

create policy "User avatars public read"
on storage.objects for select
to public
using (bucket_id = 'user-avatars');

create policy "Users insert own avatar folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'user-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users update own avatar folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'user-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users delete own avatar folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'user-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Ordered cleanup before auth.admin.deleteUser (service role bypasses RLS)
create or replace function public.delete_user_account_data(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.reviews
  where invitation_id in (
    select id from public.review_invitations
    where inviter_id = target_user_id
       or invitee_id = target_user_id
       or business_id in (select id from public.businesses where user_id = target_user_id)
  );

  delete from public.review_invitations
  where inviter_id = target_user_id
     or invitee_id = target_user_id
     or business_id in (select id from public.businesses where user_id = target_user_id);

  delete from public.business_platforms
  where business_id in (select id from public.businesses where user_id = target_user_id);

  delete from public.businesses where user_id = target_user_id;

  delete from public.user_preferences where user_id = target_user_id;
end;
$$;

revoke all on function public.delete_user_account_data(uuid) from public;
grant execute on function public.delete_user_account_data(uuid) to service_role;
