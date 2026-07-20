-- Read-only post-migration checks for the normalized Martel household shadow.
-- The final query should return zero rows. Any returned row is a failed check.

with martel_household as (
  select id from public.households where id = '6d4b902d-b5d1-4ddd-a61f-5c47ca32ac53'
),
legacy as (
  select data from public.app_state order by updated_at desc limit 1
),
checks as (
  select 'one Martel household' as check_name,
    (select count(*) from martel_household) = 1 as passed
  union all
  select 'Allan and Stefanie memberships',
    (select count(*) from public.household_members
      where household_id = '6d4b902d-b5d1-4ddd-a61f-5c47ca32ac53') = 2
  union all
  select 'grocery backfill count',
    (select count(*) from public.grocery_items
      where household_id = '6d4b902d-b5d1-4ddd-a61f-5c47ca32ac53') =
    (select jsonb_array_length(coalesce(data -> 'groceries', '[]'::jsonb)) from legacy)
  union all
  select 'inventory backfill count',
    (select count(*) from public.inventory_items
      where household_id = '6d4b902d-b5d1-4ddd-a61f-5c47ca32ac53') =
    (select jsonb_array_length(coalesce(data -> 'inventory', '[]'::jsonb)) from legacy)
  union all
  select 'meal backfill count',
    (select count(*) from public.meals
      where household_id = '6d4b902d-b5d1-4ddd-a61f-5c47ca32ac53') =
    (select jsonb_array_length(coalesce(data -> 'meals', '[]'::jsonb)) from legacy)
  union all
  select 'seven current-week meal slots',
    (select count(*) from public.meal_plan_entries
      where household_id = '6d4b902d-b5d1-4ddd-a61f-5c47ca32ac53'
        and planned_for between date_trunc('week', current_date)::date
          and date_trunc('week', current_date)::date + 6) = 7
  union all
  select 'normalized tables have RLS enabled',
    (select count(*) from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = any(array[
          'households', 'household_members', 'household_settings', 'grocery_items',
          'inventory_items', 'meals', 'meal_plan_entries', 'budgets',
          'finance_transactions', 'finance_connections', 'finance_accounts',
          'finance_sync_runs'
        ])
        and c.relrowsecurity) = 12
  union all
  select 'finance metadata exposes no secret columns',
    not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name in ('finance_connections', 'finance_accounts')
        and column_name in ('access_token', 'secret', 'password', 'credential')
    )
)
select check_name from checks where not passed;

