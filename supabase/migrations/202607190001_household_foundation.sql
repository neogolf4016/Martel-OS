-- DESIGN MIGRATION: review and test in an isolated Supabase branch before production.
-- It is intentionally additive and does not modify or delete public.app_state.

create extension if not exists pgcrypto;

create type public.household_role as enum ('owner', 'admin', 'adult', 'child', 'service');

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  timezone text not null default 'America/Chicago',
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.household_role not null default 'adult',
  display_name text,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create or replace function public.is_household_member(target_household_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.household_members
  where household_id = target_household_id and user_id = auth.uid()
) $$;

create or replace function public.has_household_role(target_household_id uuid, allowed_roles public.household_role[])
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.household_members
  where household_id = target_household_id and user_id = auth.uid() and role = any(allowed_roles)
) $$;

revoke all on function public.is_household_member(uuid) from public;
revoke all on function public.has_household_role(uuid, public.household_role[]) from public;
grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.has_household_role(uuid, public.household_role[]) to authenticated;

create table public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 240),
  category text not null default 'Other',
  store text not null default 'Either',
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit text not null default 'item',
  checked boolean not null default false,
  staple boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 240),
  location text not null,
  quantity numeric(10,2) not null default 0 check (quantity >= 0),
  unit text not null default 'item',
  low_at numeric(10,2) not null default 0 check (low_at >= 0),
  expires_on date,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 240),
  protein text,
  sides text[] not null default '{}',
  notes text,
  active boolean not null default true,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meal_plan_entries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  meal_id uuid references public.meals(id) on delete set null,
  planned_for date not null,
  notes text,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, planned_for)
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  month date not null check (month = date_trunc('month', month)::date),
  category text not null,
  amount numeric(12,2) not null check (amount >= 0),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, month, category)
);

create table public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  source text not null default 'manual',
  source_transaction_id text,
  transaction_date date not null,
  merchant text not null,
  amount numeric(12,2) not null check (amount >= 0),
  category text not null,
  pending boolean not null default false,
  review_status text not null default 'confirmed' check (review_status in ('unreviewed', 'confirmed', 'excluded')),
  metadata jsonb not null default '{}',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index finance_transactions_source_key
on public.finance_transactions (household_id, source, source_transaction_id)
where source_transaction_id is not null;

create index grocery_items_household_checked on public.grocery_items (household_id, checked, sort_order);
create index inventory_items_household_location on public.inventory_items (household_id, location);
create index meal_plan_entries_household_date on public.meal_plan_entries (household_id, planned_for);
create index finance_transactions_household_date on public.finance_transactions (household_id, transaction_date desc);

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.grocery_items enable row level security;
alter table public.inventory_items enable row level security;
alter table public.meals enable row level security;
alter table public.meal_plan_entries enable row level security;
alter table public.budgets enable row level security;
alter table public.finance_transactions enable row level security;

create policy households_select_members on public.households for select to authenticated
using (public.is_household_member(id));
create policy members_select_same_household on public.household_members for select to authenticated
using (public.is_household_member(household_id));
create policy members_manage_admin on public.household_members for all to authenticated
using (public.has_household_role(household_id, array['owner','admin']::public.household_role[]))
with check (public.has_household_role(household_id, array['owner','admin']::public.household_role[]));

create policy grocery_household_access on public.grocery_items for all to authenticated
using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy inventory_household_access on public.inventory_items for all to authenticated
using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy meals_household_access on public.meals for all to authenticated
using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy meal_plan_household_access on public.meal_plan_entries for all to authenticated
using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy budgets_adult_access on public.budgets for all to authenticated
using (public.has_household_role(household_id, array['owner','admin','adult']::public.household_role[]))
with check (public.has_household_role(household_id, array['owner','admin','adult']::public.household_role[]));
create policy finance_adult_access on public.finance_transactions for all to authenticated
using (public.has_household_role(household_id, array['owner','admin','adult']::public.household_role[]))
with check (public.has_household_role(household_id, array['owner','admin','adult']::public.household_role[]));

-- Household creation and the first owner membership must be performed atomically by a
-- reviewed server-side function in the deployment migration. This design migration omits
-- that function intentionally so it cannot be applied casually to production.
