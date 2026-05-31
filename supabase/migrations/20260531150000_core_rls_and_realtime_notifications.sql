-- Core-table RLS hardening and Realtime notification schema cleanup.

-- ---------------------------------------------------------------------------
-- 1) Enable RLS on core tables
-- ---------------------------------------------------------------------------
alter table public.businesses enable row level security;
alter table public.business_platforms enable row level security;
alter table public.connections enable row level security;
alter table public.reviews enable row level security;

-- ---------------------------------------------------------------------------
-- 2) businesses: owner-scoped CRUD
-- ---------------------------------------------------------------------------
drop policy if exists "Businesses select own rows" on public.businesses;
drop policy if exists "Businesses select related rows by connection or review" on public.businesses;
drop policy if exists "Businesses insert own rows" on public.businesses;
drop policy if exists "Businesses update own rows" on public.businesses;
drop policy if exists "Businesses delete own rows" on public.businesses;

create policy "Businesses select own rows"
  on public.businesses for select
  to authenticated
  using (user_id = auth.uid());

create policy "Businesses select related rows by connection or review"
  on public.businesses for select
  to authenticated
  using (
    exists (
      select 1
      from public.connections c
      join public.businesses me on me.user_id = auth.uid()
      where me.id in (c.business_a_id, c.business_b_id)
        and businesses.id in (c.business_a_id, c.business_b_id)
    )
    or exists (
      select 1
      from public.reviews r
      where (r.reviewer_user_id = auth.uid() or r.reviewed_owner_user_id = auth.uid())
        and businesses.id in (r.reviewed_business_id, coalesce(r.reviewer_business_id, -1))
    )
  );

create policy "Businesses insert own rows"
  on public.businesses for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Businesses update own rows"
  on public.businesses for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Businesses delete own rows"
  on public.businesses for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3) business_platforms: only through owned businesses
-- ---------------------------------------------------------------------------
drop policy if exists "Business platforms select own business rows" on public.business_platforms;
drop policy if exists "Business platforms insert own business rows" on public.business_platforms;
drop policy if exists "Business platforms update own business rows" on public.business_platforms;
drop policy if exists "Business platforms delete own business rows" on public.business_platforms;

create policy "Business platforms select own business rows"
  on public.business_platforms for select
  to authenticated
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = business_platforms.business_id
        and b.user_id = auth.uid()
    )
  );

create policy "Business platforms insert own business rows"
  on public.business_platforms for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.businesses b
      where b.id = business_platforms.business_id
        and b.user_id = auth.uid()
    )
  );

create policy "Business platforms update own business rows"
  on public.business_platforms for update
  to authenticated
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = business_platforms.business_id
        and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.businesses b
      where b.id = business_platforms.business_id
        and b.user_id = auth.uid()
    )
  );

create policy "Business platforms delete own business rows"
  on public.business_platforms for delete
  to authenticated
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = business_platforms.business_id
        and b.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 4) connections: only where user owns a participant business
-- ---------------------------------------------------------------------------
drop policy if exists "Connections select own participation rows" on public.connections;
drop policy if exists "Connections insert from own initiator business" on public.connections;
drop policy if exists "Connections update own participation rows" on public.connections;
drop policy if exists "Connections delete own participation rows" on public.connections;

create policy "Connections select own participation rows"
  on public.connections for select
  to authenticated
  using (
    exists (
      select 1
      from public.businesses b
      where b.user_id = auth.uid()
        and b.id in (connections.business_a_id, connections.business_b_id)
    )
  );

create policy "Connections insert from own initiator business"
  on public.connections for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.businesses b
      where b.id = connections.initiator_business_id
        and b.user_id = auth.uid()
    )
  );

create policy "Connections update own participation rows"
  on public.connections for update
  to authenticated
  using (
    exists (
      select 1
      from public.businesses b
      where b.user_id = auth.uid()
        and b.id in (connections.business_a_id, connections.business_b_id)
    )
  )
  with check (
    exists (
      select 1
      from public.businesses b
      where b.user_id = auth.uid()
        and b.id in (connections.business_a_id, connections.business_b_id)
    )
  );

create policy "Connections delete own participation rows"
  on public.connections for delete
  to authenticated
  using (
    exists (
      select 1
      from public.businesses b
      where b.user_id = auth.uid()
        and b.id in (connections.business_a_id, connections.business_b_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 5) reviews:
--    read when user is reviewer/reviewed-owner/owner of either business side;
--    writes constrained to role-specific ownership.
-- ---------------------------------------------------------------------------
drop policy if exists "Reviews select own related rows" on public.reviews;
drop policy if exists "Reviews insert own initiated connection rows" on public.reviews;
drop policy if exists "Reviews update reviewer or reviewed owner rows" on public.reviews;
drop policy if exists "Reviews delete own initiated connection rows" on public.reviews;

create policy "Reviews select own related rows"
  on public.reviews for select
  to authenticated
  using (
    reviewer_user_id = auth.uid()
    or reviewed_owner_user_id = auth.uid()
    or exists (
      select 1
      from public.businesses b
      where b.user_id = auth.uid()
        and b.id in (reviews.reviewed_business_id, coalesce(reviews.reviewer_business_id, -1))
    )
  );

create policy "Reviews insert own initiated connection rows"
  on public.reviews for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.connections c
      join public.businesses b on b.id = c.initiator_business_id
      where c.id = reviews.connection_id
        and b.user_id = auth.uid()
    )
  );

create policy "Reviews update reviewer or reviewed owner rows"
  on public.reviews for update
  to authenticated
  using (
    reviewer_user_id = auth.uid()
    or reviewed_owner_user_id = auth.uid()
  )
  with check (
    reviewer_user_id = auth.uid()
    or reviewed_owner_user_id = auth.uid()
  );

create policy "Reviews delete own initiated connection rows"
  on public.reviews for delete
  to authenticated
  using (
    exists (
      select 1
      from public.connections c
      join public.businesses b on b.id = c.initiator_business_id
      where c.id = reviews.connection_id
        and b.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 6) Remove DB-ack field; notifications are local cursor-based.
-- ---------------------------------------------------------------------------
drop index if exists public.connections_partner_ack_open_idx;

alter table public.connections
  drop column if exists partner_acknowledged_at;
