-- Stripe billing cache (webhooks + server actions use service role to write)
create table if not exists public.user_billing (
  user_id uuid not null primary key references auth.users (id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text,
  subscription_current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

comment on table public.user_billing is 'Stripe customer id and parent subscription (multi-item) per user';

create table if not exists public.business_billing (
  business_id bigint not null primary key references public.businesses (id) on delete cascade,
  tier smallint not null default 0 check (tier >= 0 and tier <= 2),
  slot_limit int not null default 1 check (slot_limit > 0),
  stripe_subscription_item_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

comment on table public.business_billing is 'Per-business plan tier; missing row implies Starter (free)';

create index if not exists business_billing_tier_idx on public.business_billing (tier);

alter table public.user_billing enable row level security;
alter table public.business_billing enable row level security;

create policy "Users select own user_billing"
  on public.user_billing for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users select own business_billing"
  on public.business_billing for select
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_billing.business_id
        and b.user_id = auth.uid()
    )
  );
