-- Storefront / cover image URL (Supabase Storage public URL)
alter table public.businesses
add column if not exists cover_image_url text;

comment on column public.businesses.cover_image_url is 'Public URL for cover image (Supabase Storage bucket business-photos)';

-- Public bucket for business photos (5MB max; jpeg/png/webp)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-photos',
  'business-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Business photos public read" on storage.objects;
drop policy if exists "Users insert business photos under own folder" on storage.objects;
drop policy if exists "Users update own business photos" on storage.objects;
drop policy if exists "Users delete own business photos" on storage.objects;

create policy "Business photos public read"
on storage.objects for select
to public
using (bucket_id = 'business-photos');

create policy "Users insert business photos under own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'business-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users update own business photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'business-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users delete own business photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'business-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
