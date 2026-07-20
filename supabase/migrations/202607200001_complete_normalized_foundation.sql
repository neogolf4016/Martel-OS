-- Completes the additive normalized-data foundation introduced in
-- 202607190001_household_foundation.sql. This migration does not remove or
-- modify public.app_state, so the production dashboard can continue using the
-- proven compatibility path until each normalized module is separately tested.

alter table public.grocery_items add column if not exists legacy_id text;
alter table public.inventory_items add column if not exists legacy_id text;
alter table public.meals add column if not exists legacy_id text;

create unique index if not exists grocery_items_household_legacy_id
  on public.grocery_items (household_id, legacy_id) where legacy_id is not null;
create unique index if not exists inventory_items_household_legacy_id
  on public.inventory_items (household_id, legacy_id) where legacy_id is not null;
create unique index if not exists meals_household_legacy_id
  on public.meals (household_id, legacy_id) where legacy_id is not null;

create table if not exists public.household_settings (
  household_id uuid primary key references public.households(id) on delete cascade,
  monthly_food_household_budget numeric(12,2) not null default 0
    check (monthly_food_household_budget >= 0),
  week_starts_on smallint not null default 1 check (week_starts_on between 0 and 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_connections (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  provider text not null,
  provider_item_id text not null,
  institution_name text not null,
  status text not null default 'active'
    check (status in ('active', 'attention', 'disconnected')),
  last_successful_sync_at timestamptz,
  next_scheduled_sync_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, provider, provider_item_id)
);

comment on table public.finance_connections is
  'Non-secret metadata only. Provider access tokens belong in a server-only secret store.';

create table if not exists public.finance_accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  connection_id uuid not null references public.finance_connections(id) on delete cascade,
  provider_account_id text not null,
  name text not null,
  official_name text,
  mask text,
  account_type text,
  account_subtype text,
  current_balance numeric(14,2),
  available_balance numeric(14,2),
  iso_currency_code text not null default 'USD',
  include_in_household_spending boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, provider_account_id)
);

create table if not exists public.finance_sync_runs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  connection_id uuid not null references public.finance_connections(id) on delete cascade,
  trigger_source text not null
    check (trigger_source in ('initial', 'manual', 'scheduled', 'webhook')),
  status text not null default 'running'
    check (status in ('running', 'succeeded', 'failed')),
  added_count integer not null default 0 check (added_count >= 0),
  modified_count integer not null default 0 check (modified_count >= 0),
  removed_count integer not null default 0 check (removed_count >= 0),
  error_code text,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.finance_transactions
  add column if not exists account_id uuid references public.finance_accounts(id) on delete set null;
alter table public.finance_transactions add column if not exists authorized_date date;
alter table public.finance_transactions add column if not exists original_description text;
alter table public.finance_transactions add column if not exists merchant_normalized text;
alter table public.finance_transactions
  add column if not exists iso_currency_code text not null default 'USD';
alter table public.finance_transactions
  add column if not exists is_food_or_household boolean not null default false;
alter table public.finance_transactions
  drop constraint if exists finance_transactions_amount_check;
alter table public.finance_transactions
  add constraint finance_transactions_nonzero_amount check (amount <> 0);

create index if not exists finance_accounts_household
  on public.finance_accounts (household_id, include_in_household_spending);
create index if not exists finance_sync_runs_connection_started
  on public.finance_sync_runs (connection_id, started_at desc);
create index if not exists finance_transactions_weekly_spend
  on public.finance_transactions (household_id, transaction_date desc)
  where is_food_or_household and review_status <> 'excluded';

alter table public.household_settings enable row level security;
alter table public.finance_connections enable row level security;
alter table public.finance_accounts enable row level security;
alter table public.finance_sync_runs enable row level security;

create policy household_settings_adult_access
on public.household_settings for all to authenticated
using (public.has_household_role(household_id, array['owner','admin','adult']::public.household_role[]))
with check (public.has_household_role(household_id, array['owner','admin','adult']::public.household_role[]));

create policy finance_connections_adult_read
on public.finance_connections for select to authenticated
using (public.has_household_role(household_id, array['owner','admin','adult']::public.household_role[]));

create policy finance_accounts_adult_read
on public.finance_accounts for select to authenticated
using (public.has_household_role(household_id, array['owner','admin','adult']::public.household_role[]));

create policy finance_sync_runs_adult_read
on public.finance_sync_runs for select to authenticated
using (public.has_household_role(household_id, array['owner','admin','adult']::public.household_role[]));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'households', 'household_settings', 'grocery_items', 'inventory_items',
    'meals', 'meal_plan_entries', 'budgets', 'finance_transactions',
    'finance_connections', 'finance_accounts'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name
    );
  end loop;
end;
$$;

-- Imported finance records are written by a reviewed server function. Browser
-- clients intentionally have read-only access to connection and sync metadata.

do $$
declare
  martel_household_id constant uuid := '6d4b902d-b5d1-4ddd-a61f-5c47ca32ac53';
  allan_user_id uuid;
  stefanie_user_id uuid;
  legacy_snapshot jsonb;
begin
  select id into allan_user_id from auth.users
  where lower(email) = 'allanmartel@hotmail.com' limit 1;
  select id into stefanie_user_id from auth.users
  where lower(email) = 'stefaniemartel@hotmail.com' limit 1;

  if allan_user_id is null or stefanie_user_id is null then
    raise exception 'Both established Martel accounts must exist before household bootstrap';
  end if;

  insert into public.households (id, name, timezone, created_by)
  values (martel_household_id, 'Martel Family', 'America/Chicago', allan_user_id)
  on conflict (id) do update set
    name = excluded.name, timezone = excluded.timezone, updated_at = now();

  insert into public.household_members (household_id, user_id, role, display_name)
  values
    (martel_household_id, allan_user_id, 'owner', 'Allan'),
    (martel_household_id, stefanie_user_id, 'admin', 'Stefanie')
  on conflict (household_id, user_id) do update set
    role = excluded.role, display_name = excluded.display_name;

  select data into legacy_snapshot from public.app_state order by updated_at desc limit 1;
  if legacy_snapshot is null then
    raise exception 'Legacy dashboard snapshot is required for the normalized backfill';
  end if;

  insert into public.household_settings (household_id, monthly_food_household_budget)
  values (martel_household_id, coalesce((legacy_snapshot ->> 'monthlyBudget')::numeric, 0))
  on conflict (household_id) do update set
    monthly_food_household_budget = excluded.monthly_food_household_budget,
    updated_at = now();

  insert into public.grocery_items (
    household_id, legacy_id, name, category, store, quantity, checked, staple, created_by
  )
  select martel_household_id, item ->> 'id', item ->> 'name',
    coalesce(item ->> 'category', 'Other'), coalesce(item ->> 'store', 'Either'),
    greatest(coalesce((item ->> 'quantity')::numeric, 1), 0.01),
    coalesce((item ->> 'checked')::boolean, false),
    coalesce((item ->> 'staple')::boolean, false), allan_user_id
  from jsonb_array_elements(coalesce(legacy_snapshot -> 'groceries', '[]'::jsonb)) item
  on conflict (household_id, legacy_id) where legacy_id is not null do update set
    name = excluded.name, category = excluded.category, store = excluded.store,
    quantity = excluded.quantity, checked = excluded.checked, staple = excluded.staple,
    updated_at = now();

  insert into public.inventory_items (
    household_id, legacy_id, name, location, quantity, unit, low_at, created_by
  )
  select martel_household_id, item ->> 'id', item ->> 'name',
    coalesce(item ->> 'category', 'Pantry'),
    greatest(coalesce((item ->> 'quantity')::numeric, 0), 0),
    coalesce(item ->> 'unit', 'item'),
    greatest(coalesce((item ->> 'lowAt')::numeric, 0), 0), allan_user_id
  from jsonb_array_elements(coalesce(legacy_snapshot -> 'inventory', '[]'::jsonb)) item
  on conflict (household_id, legacy_id) where legacy_id is not null do update set
    name = excluded.name, location = excluded.location, quantity = excluded.quantity,
    unit = excluded.unit, low_at = excluded.low_at, updated_at = now();

  insert into public.meals (
    household_id, legacy_id, name, protein, sides, notes, active, created_by
  )
  select martel_household_id, item ->> 'id', item ->> 'name', item ->> 'protein',
    coalesce(array(select jsonb_array_elements_text(coalesce(item -> 'sides', '[]'::jsonb))), '{}'),
    item ->> 'notes', coalesce((item ->> 'active')::boolean, true), allan_user_id
  from jsonb_array_elements(coalesce(legacy_snapshot -> 'meals', '[]'::jsonb)) item
  on conflict (household_id, legacy_id) where legacy_id is not null do update set
    name = excluded.name, protein = excluded.protein, sides = excluded.sides,
    notes = excluded.notes, active = excluded.active, updated_at = now();

  insert into public.meal_plan_entries (household_id, meal_id, planned_for, created_by)
  select martel_household_id, meal.id,
    date_trunc('week', current_date)::date + plan.day_offset, allan_user_id
  from (values
    ('Monday', 0), ('Tuesday', 1), ('Wednesday', 2), ('Thursday', 3),
    ('Friday', 4), ('Saturday', 5), ('Sunday', 6)
  ) as plan(day_name, day_offset)
  left join public.meals meal on meal.household_id = martel_household_id
    and meal.legacy_id = legacy_snapshot -> 'weeklyPlan' ->> plan.day_name
  on conflict (household_id, planned_for) do update set
    meal_id = excluded.meal_id, updated_at = now();

  insert into public.budgets (household_id, month, category, amount, created_by)
  values (martel_household_id, date_trunc('month', current_date)::date,
    'Food & Household', coalesce((legacy_snapshot ->> 'monthlyBudget')::numeric, 0),
    allan_user_id)
  on conflict (household_id, month, category) do update set
    amount = excluded.amount, updated_at = now();

  insert into public.finance_transactions (
    household_id, source, source_transaction_id, transaction_date, merchant,
    amount, category, review_status, is_food_or_household, created_by
  )
  select martel_household_id, 'legacy-manual', item ->> 'id',
    (item ->> 'date')::date, coalesce(item ->> 'store', 'Unknown'),
    coalesce((item ->> 'amount')::numeric, 0),
    coalesce(item ->> 'category', 'Other'), 'confirmed',
    coalesce(item ->> 'category', '') in ('Groceries', 'Household'), allan_user_id
  from jsonb_array_elements(coalesce(legacy_snapshot -> 'budgetEntries', '[]'::jsonb)) item
  where coalesce((item ->> 'amount')::numeric, 0) <> 0
  on conflict (household_id, source, source_transaction_id)
    where source_transaction_id is not null do update set
    transaction_date = excluded.transaction_date, merchant = excluded.merchant,
    amount = excluded.amount, category = excluded.category,
    is_food_or_household = excluded.is_food_or_household, updated_at = now();
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'grocery_items', 'inventory_items', 'meals', 'meal_plan_entries', 'budgets',
    'finance_transactions', 'finance_connections', 'finance_accounts', 'finance_sync_runs'
  ] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    exception when duplicate_object then null;
    end;
  end loop;
end;
$$;
