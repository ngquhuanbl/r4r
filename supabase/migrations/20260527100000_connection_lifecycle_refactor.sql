-- Connection lifecycle refactor:
-- - enforce lifetime pair uniqueness
-- - move lifecycle markers to closed_at/resolved_at
-- - remove connection status + per-side slot release columns
-- - add business_billing.slots_used with backfill from DRAFT reviews
-- - add reviews index for slot fallback/reconcile queries

-- 1) Deduplicate historical connection pairs while preserving reviews.
with ranked as (
  select
    id,
    business_a_id,
    business_b_id,
    row_number() over (
      partition by business_a_id, business_b_id
      order by created_at asc, id asc
    ) as rn,
    first_value(id) over (
      partition by business_a_id, business_b_id
      order by created_at asc, id asc
    ) as keep_id
  from public.connections
),
dupes as (
  select id, keep_id from ranked where rn > 1
)
update public.reviews r
set connection_id = d.keep_id
from dupes d
where r.connection_id = d.id;

with ranked as (
  select
    id,
    row_number() over (
      partition by business_a_id, business_b_id
      order by created_at asc, id asc
    ) as rn
  from public.connections
)
delete from public.connections c
using ranked r
where c.id = r.id
  and r.rn > 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'connections_business_pair_unique'
      and conrelid = 'public.connections'::regclass
  ) then
    alter table public.connections
      add constraint connections_business_pair_unique
      unique (business_a_id, business_b_id);
  end if;
end $$;

-- 2) Add lifecycle timestamps.
alter table public.connections
  add column if not exists closed_at timestamptz,
  add column if not exists resolved_at timestamptz;

-- Backfill closed_at:
-- - old completed_at rows are closed
-- - or both connection reviews are no longer DRAFT
with draft_status as (
  select id as draft_id
  from public.review_statuses
  where name = 'DRAFT'
  limit 1
),
closed_candidates as (
  select c.id
  from public.connections c
  where c.completed_at is not null
  union
  select r.connection_id
  from public.reviews r
  cross join draft_status ds
  where r.connection_id is not null
  group by r.connection_id
  having count(*) = 2
     and bool_and(r.status_id <> ds.draft_id)
)
update public.connections c
set closed_at = coalesce(c.closed_at, c.completed_at, now())
from closed_candidates cc
where c.id = cc.id
  and c.closed_at is null;

-- Backfill resolved_at when both reviews are terminal.
with terminal_statuses as (
  select id
  from public.review_statuses
  where name in ('VERIFIED', 'REJECTED')
),
resolved_candidates as (
  select r.connection_id
  from public.reviews r
  where r.connection_id is not null
  group by r.connection_id
  having count(*) = 2
     and bool_and(r.status_id in (select id from terminal_statuses))
)
update public.connections c
set resolved_at = coalesce(c.resolved_at, c.completed_at, now())
from resolved_candidates rc
where c.id = rc.connection_id
  and c.resolved_at is null;

-- 3) Add slots_used denormalized counter.
alter table public.business_billing
  add column if not exists slots_used int not null default 0
  check (slots_used >= 0);

with draft_status as (
  select id as draft_id
  from public.review_statuses
  where name = 'DRAFT'
  limit 1
)
update public.business_billing bb
set slots_used = coalesce(src.used_count, 0)
from (
  select
    r.reviewer_business_id as business_id,
    count(*)::int as used_count
  from public.reviews r
  cross join draft_status ds
  where r.reviewer_business_id is not null
    and r.status_id = ds.draft_id
  group by r.reviewer_business_id
) src
where bb.business_id = src.business_id;

update public.business_billing
set slots_used = 0
where slots_used is null;

-- 4) Indexes for fast slot fallback/reconcile and partner ack reads.
create index if not exists reviews_reviewer_business_status_idx
  on public.reviews (reviewer_business_id, status_id)
  where reviewer_business_id is not null;

create index if not exists connections_partner_ack_open_idx
  on public.connections (business_a_id, business_b_id, initiator_business_id)
  where closed_at is null and partner_acknowledged_at is null;

-- 5) Drop legacy lifecycle columns after backfill.
alter table public.connections
  drop column if exists status,
  drop column if exists completed_at,
  drop column if exists business_a_slot_released_at,
  drop column if exists business_b_slot_released_at;
